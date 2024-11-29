import { memo, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { FileMap } from '~/lib/stores/files';
import { classNames } from '~/utils/classNames';
import { createScopedLogger, renderLogger } from '~/utils/logger';
import { webcontainer } from '~/lib/webcontainer';
import { ContextMenu } from '~/components/ui/ContextMenu';
import path from 'path';

const logger = createScopedLogger('FileTree');

const NODE_PADDING_LEFT = 8;
const DEFAULT_HIDDEN_FILES = [/\/node_modules\//, /\/\.next/, /\/\.astro/];

interface Props {
  files?: FileMap;
  selectedFile?: string;
  onFileSelect?: (filePath: string) => void;
  rootFolder?: string;
  hideRoot?: boolean;
  collapsed?: boolean;
  allowFolderSelection?: boolean;
  hiddenFiles?: Array<string | RegExp>;
  unsavedFiles?: Set<string>;
  className?: string;
  refreshFiles?: () => void;
}

export const FileTree = memo(
  ({
    files = {},
    onFileSelect,
    selectedFile,
    rootFolder,
    hideRoot = false,
    collapsed = false,
    allowFolderSelection = false,
    hiddenFiles,
    className,
    unsavedFiles,
    refreshFiles = () => {},
  }: Props) => {
    renderLogger.trace('FileTree');

    const computedHiddenFiles = useMemo(() => [...DEFAULT_HIDDEN_FILES, ...(hiddenFiles ?? [])], [hiddenFiles]);

    const fileList = useMemo(() => {
      return buildFileList(files, rootFolder, hideRoot, computedHiddenFiles);
    }, [files, rootFolder, hideRoot, computedHiddenFiles]);

    const [collapsedFolders, setCollapsedFolders] = useState(() => {
      return collapsed
        ? new Set(fileList.filter((item) => item.kind === 'folder').map((item) => item.fullPath))
        : new Set<string>();
    });

    useEffect(() => {
      if (collapsed) {
        setCollapsedFolders(new Set(fileList.filter((item) => item.kind === 'folder').map((item) => item.fullPath)));
        return;
      }

      setCollapsedFolders((prevCollapsed) => {
        const newCollapsed = new Set<string>();

        for (const folder of fileList) {
          if (folder.kind === 'folder' && prevCollapsed.has(folder.fullPath)) {
            newCollapsed.add(folder.fullPath);
          }
        }

        return newCollapsed;
      });
    }, [fileList, collapsed]);

    const filteredFileList = useMemo(() => {
      const list = [];

      let lastDepth = Number.MAX_SAFE_INTEGER;

      for (const fileOrFolder of fileList) {
        const depth = fileOrFolder.depth;

        // if the depth is equal we reached the end of the collaped group
        if (lastDepth === depth) {
          lastDepth = Number.MAX_SAFE_INTEGER;
        }

        // ignore collapsed folders
        if (collapsedFolders.has(fileOrFolder.fullPath)) {
          lastDepth = Math.min(lastDepth, depth);
        }

        // ignore files and folders below the last collapsed folder
        if (lastDepth < depth) {
          continue;
        }

        list.push(fileOrFolder);
      }

      return list;
    }, [fileList, collapsedFolders]);

    const toggleCollapseState = (fullPath: string) => {
      setCollapsedFolders((prevSet) => {
        const newSet = new Set(prevSet);

        if (newSet.has(fullPath)) {
          newSet.delete(fullPath);
        } else {
          newSet.add(fullPath);
        }

        return newSet;
      });
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // add visual feedback for drag
      e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = async (e: React.DragEvent, folderPath: string) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove('drag-over');

      const files = Array.from(e.dataTransfer.files);
      const container = await webcontainer;

      for (const file of files) {
        try {
          const content = await file.arrayBuffer();
          const filePath = `${folderPath}/${file.name}`;
          await container.fs.writeFile(filePath, new Uint8Array(content));
          onFileSelect?.(filePath);
        } catch (error) {
          console.error('Failed to upload file:', error);
        }
      }
    };

    const [contextMenu, setContextMenu] = useState<{
      x: number;
      y: number;
      path: string;
    } | null>(null);

    const handleContextMenu = (e: React.MouseEvent, filePath: string) => {
      e.preventDefault();
      console.log('1. Right click received with path:', filePath);

      const cleanPath = filePath.replace(/^\/home\/project/, '');

      console.log('2. After cleaning path in handleContextMenu:', cleanPath);
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        path: cleanPath,
      });
    };

    const [renamingItem, setRenamingItem] = useState<{
      path: string;
      isNew: boolean;
      type: 'file' | 'folder';
    } | null>(null);

    const handleNewFile = async () => {
      const container = await webcontainer;
      const timestamp = Date.now();

      // get parent path from context menu and clean it
      const parentPath = (contextMenu?.path || '').replace(/^\/home\/project/, '') || '/';

      // build the full paths
      const fileName = `untitled-${timestamp}`;
      const fullPath = `/home/project${parentPath === '/' ? '' : parentPath}/${fileName}`;
      const cleanPath = fullPath.replace(/^\/home\/project/, '');

      try {
        await container.fs.writeFile(cleanPath, '');
        setRenamingItem({
          path: fullPath,
          isNew: true,
          type: 'file',
        });
        refreshFiles();
      } catch (error) {
        console.error('failed to create file:', error);
      }
    };

    const handleNewFolder = async (parentPath: string) => {
      const container = await webcontainer;
      const timestamp = Date.now();

      // clean the parent path and handle root case
      const cleanParentPath = parentPath.replace(/^\/home\/project/, '') || '/';

      // build the full paths
      const folderName = `untitled-${timestamp}`;
      const fullPath = `/home/project${cleanParentPath === '/' ? '' : cleanParentPath}/${folderName}`;
      const cleanPath = fullPath.replace(/^\/home\/project/, '');

      try {
        await container.fs.mkdir(cleanPath);
        setRenamingItem({
          path: fullPath,
          isNew: true,
          type: 'folder',
        });
        refreshFiles();
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    };

    const handleRenameComplete = async (oldPath: string, newName: string) => {
      if (!newName.trim()) {
        // if name is empty and this was a new item, delete it
        if (renamingItem?.isNew) {
          const container = await webcontainer;
          const cleanPath = oldPath.replace(/^\/home\/project/, '');
          await container.fs.rm(cleanPath, { recursive: true });
        }

        setRenamingItem(null);
        refreshFiles();

        return;
      }

      try {
        const container = await webcontainer;
        const cleanOldPath = oldPath.replace(/^\/home\/project/, '');
        const dirPath = path.dirname(cleanOldPath);
        const cleanNewPath = `${dirPath}/${newName}`;

        console.log('Renaming from:', cleanOldPath, 'to:', cleanNewPath);

        await container.fs.rename(cleanOldPath, cleanNewPath);
        setRenamingItem(null);
        refreshFiles();

        // select the newly created/renamed file
        if (renamingItem?.type === 'file') {
          onFileSelect?.(cleanNewPath);
        }
      } catch (error) {
        console.error('Failed to rename:', error);
        setRenamingItem(null);
      }
    };

    const contextMenuItems = [
      {
        label: 'New file...',
        action: () => {
          console.log('3. Context menu "New file" clicked');
          console.log('4. Context menu state path:', contextMenu?.path);
          handleNewFile();
        },
      },
      {
        label: 'New folder...',
        action: () => handleNewFolder(contextMenu?.path || ''),
      },
      {
        label: 'Target file',
        icon: <div className="i-ph-target" />,
        action: () => {
          /* don't implement target action as this is a future feature */
        },
        className: 'divider',
      },
      {
        label: 'Lock file',
        icon: <div className="i-ph-lock" />,
        action: () => {
          /* don't implement lock action as this is a future feature */
        },
      },
      {
        label: 'Cut',
        action: async () => {
          const container = await webcontainer;
          const content = await container.fs.readFile(contextMenu?.path || '', 'utf-8');
          await navigator.clipboard.writeText(content);
          await container.fs.rm(contextMenu?.path || '');
        },
        className: 'divider',
      },
      {
        label: 'Copy',
        action: async () => {
          const container = await webcontainer;
          const content = await container.fs.readFile(contextMenu?.path || '', 'utf-8');
          await navigator.clipboard.writeText(content);
        },
      },
      {
        label: 'Copy path',
        action: () => {
          navigator.clipboard.writeText(contextMenu?.path || '');
        },
      },
      {
        label: 'Copy relative path',
        action: () => {
          const relativePath = contextMenu?.path?.replace(rootFolder || '/', '') ?? '';
          navigator.clipboard.writeText(relativePath);
        },
      },
      {
        label: 'Rename...',
        action: () => {
          const path = contextMenu?.path?.replace(/^\/home\/project/, '') || '';
          setRenamingItem({
            path,
            isNew: false,
            type: 'file',
          });
        },
        className: 'divider',
      },
      {
        label: 'Delete',
        action: async () => {
          if (!contextMenu?.path) {
            console.error('no path to delete');
            return;
          }

          const container = await webcontainer;
          const cleanPath = contextMenu.path.replace(/^\/home\/project/, '');

          console.log('attempting to delete path:', cleanPath);

          try {
            await container.fs.rm(cleanPath, { recursive: true });
            refreshFiles();
          } catch (error) {
            console.error('failed to delete:', error);
          }
        },
      },
    ];

    return (
      <div
        className={classNames('file-tree', className)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, rootFolder ?? '/')}
        onContextMenu={(e) => {
          e.preventDefault();
          handleContextMenu(e, rootFolder ?? '/');
        }}
      >
        {filteredFileList.map((fileOrFolder) => {
          switch (fileOrFolder.kind) {
            case 'file': {
              return (
                <File
                  key={fileOrFolder.id}
                  selected={selectedFile === fileOrFolder.fullPath}
                  file={fileOrFolder}
                  unsavedChanges={unsavedFiles?.has(fileOrFolder.fullPath)}
                  onClick={() => {
                    onFileSelect?.(fileOrFolder.fullPath);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleContextMenu(e, fileOrFolder.fullPath);
                  }}
                  renamingItem={renamingItem}
                  handleRenameComplete={handleRenameComplete}
                />
              );
            }
            case 'folder': {
              return (
                <Folder
                  key={fileOrFolder.id}
                  folder={fileOrFolder}
                  selected={allowFolderSelection && selectedFile === fileOrFolder.fullPath}
                  collapsed={collapsedFolders.has(fileOrFolder.fullPath)}
                  onClick={() => {
                    toggleCollapseState(fileOrFolder.fullPath);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleContextMenu(e, fileOrFolder.fullPath);
                  }}
                  renamingItem={renamingItem}
                  handleRenameComplete={handleRenameComplete}
                />
              );
            }
            default: {
              return undefined;
            }
          }
        })}
        {contextMenu && (
          <ContextMenu
            items={contextMenuItems}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    );
  },
);

export default FileTree;

interface FolderProps {
  folder: FolderNode;
  collapsed: boolean;
  selected?: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  renamingItem: { path: string; isNew: boolean; type: 'file' | 'folder' } | null;
  handleRenameComplete: (oldPath: string, newName: string) => void;
}

function Folder({
  folder,
  collapsed,
  selected = false,
  onClick,
  onContextMenu,
  renamingItem,
  handleRenameComplete,
}: FolderProps) {
  const isRenaming = renamingItem?.path === folder.fullPath;

  if (isRenaming) {
    return (
      <div className="flex items-center" style={{ paddingLeft: `${6 + folder.depth * NODE_PADDING_LEFT}px` }}>
        <div
          className={classNames('scale-120 shrink-0', {
            'i-ph:caret-right scale-98': collapsed,
            'i-ph:caret-down scale-98': !collapsed,
          })}
        />
        <input
          className="flex-1 bg-transparent border border-bolt-elements-borderColorActive rounded px-1 mx-1 outline-none text-bolt-elements-textPrimary"
          defaultValue={renamingItem.isNew ? '' : folder.name}
          autoFocus
          onBlur={(e) => handleRenameComplete(folder.fullPath, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleRenameComplete(folder.fullPath, e.currentTarget.value);
            } else if (e.key === 'Escape') {
              handleRenameComplete(folder.fullPath, '');
            }
          }}
        />
      </div>
    );
  }

  return (
    <NodeButton
      className={classNames('group', {
        'bg-transparent text-bolt-elements-item-contentDefault hover:text-bolt-elements-item-contentActive hover:bg-bolt-elements-item-backgroundActive':
          !selected,
        'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent': selected,
      })}
      depth={folder.depth}
      iconClasses={classNames({
        'i-ph:caret-right scale-98': collapsed,
        'i-ph:caret-down scale-98': !collapsed,
      })}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {folder.name}
    </NodeButton>
  );
}

interface FileProps {
  file: FileNode;
  selected: boolean;
  unsavedChanges?: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  renamingItem: { path: string; isNew: boolean; type: 'file' | 'folder' } | null;
  handleRenameComplete: (oldPath: string, newName: string) => void;
}

function File({
  file,
  onClick,
  selected,
  unsavedChanges = false,
  onContextMenu,
  renamingItem,
  handleRenameComplete,
}: FileProps) {
  const isRenaming = renamingItem?.path === file.fullPath;

  if (isRenaming) {
    return (
      <div className="flex items-center" style={{ paddingLeft: `${6 + file.depth * NODE_PADDING_LEFT}px` }}>
        <div className={classNames('scale-120 shrink-0 i-ph:file-duotone scale-98')} />
        <input
          className="flex-1 bg-transparent border border-bolt-elements-borderColorActive rounded px-1 mx-1 outline-none text-bolt-elements-textPrimary"
          defaultValue={renamingItem.isNew ? '' : file.name}
          autoFocus
          onBlur={(e) => handleRenameComplete(file.fullPath, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleRenameComplete(file.fullPath, e.currentTarget.value);
            } else if (e.key === 'Escape') {
              handleRenameComplete(file.fullPath, '');
            }
          }}
        />
      </div>
    );
  }

  return (
    <NodeButton
      className={classNames('group', {
        'bg-transparent hover:bg-bolt-elements-item-backgroundActive text-bolt-elements-item-contentDefault': !selected,
        'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent': selected,
      })}
      depth={file.depth}
      iconClasses={classNames('i-ph:file-duotone scale-98', {
        'group-hover:text-bolt-elements-item-contentActive': !selected,
      })}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div
        className={classNames('flex items-center', {
          'group-hover:text-bolt-elements-item-contentActive': !selected,
        })}
      >
        <div className="flex-1 truncate pr-2">{file.name}</div>
        {unsavedChanges && <span className="i-ph:circle-fill scale-68 shrink-0 text-orange-500" />}
      </div>
    </NodeButton>
  );
}

interface ButtonProps {
  depth: number;
  iconClasses: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function NodeButton({ depth, iconClasses, onClick, className, children, onContextMenu }: ButtonProps) {
  return (
    <button
      className={classNames(
        'flex items-center gap-1.5 w-full pr-2 border-2 border-transparent text-faded py-0.5',
        className,
      )}
      style={{ paddingLeft: `${6 + depth * NODE_PADDING_LEFT}px` }}
      onClick={() => onClick?.()}
      onContextMenu={onContextMenu}
    >
      <div className={classNames('scale-120 shrink-0', iconClasses)}></div>
      <div className="truncate w-full text-left">{children}</div>
    </button>
  );
}

type Node = FileNode | FolderNode;

interface BaseNode {
  id: number;
  depth: number;
  name: string;
  fullPath: string;
}

interface FileNode extends BaseNode {
  kind: 'file';
}

interface FolderNode extends BaseNode {
  kind: 'folder';
}

function buildFileList(
  files: FileMap,
  rootFolder = '/',
  hideRoot: boolean,
  hiddenFiles: Array<string | RegExp>,
): Node[] {
  const folderPaths = new Set<string>();
  const fileList: Node[] = [];

  let defaultDepth = 0;

  if (rootFolder === '/' && !hideRoot) {
    defaultDepth = 1;
    fileList.push({ kind: 'folder', name: '/', depth: 0, id: 0, fullPath: '/' });
  }

  for (const [filePath, dirent] of Object.entries(files)) {
    const segments = filePath.split('/').filter((segment) => segment);
    const fileName = segments.at(-1);

    if (!fileName || isHiddenFile(filePath, fileName, hiddenFiles)) {
      continue;
    }

    let currentPath = '';

    let i = 0;
    let depth = 0;

    while (i < segments.length) {
      const name = segments[i];
      const fullPath = (currentPath += `/${name}`);

      if (!fullPath.startsWith(rootFolder) || (hideRoot && fullPath === rootFolder)) {
        i++;
        continue;
      }

      if (i === segments.length - 1 && dirent?.type === 'file') {
        fileList.push({
          kind: 'file',
          id: fileList.length,
          name,
          fullPath,
          depth: depth + defaultDepth,
        });
      } else if (!folderPaths.has(fullPath)) {
        folderPaths.add(fullPath);

        fileList.push({
          kind: 'folder',
          id: fileList.length,
          name,
          fullPath,
          depth: depth + defaultDepth,
        });
      }

      i++;
      depth++;
    }
  }

  return sortFileList(rootFolder, fileList, hideRoot);
}

function isHiddenFile(filePath: string, fileName: string, hiddenFiles: Array<string | RegExp>) {
  return hiddenFiles.some((pathOrRegex) => {
    if (typeof pathOrRegex === 'string') {
      return fileName === pathOrRegex;
    }

    return pathOrRegex.test(filePath);
  });
}

/**
 * Sorts the given list of nodes into a tree structure (still a flat list).
 *
 * This function organizes the nodes into a hierarchical structure based on their paths,
 * with folders appearing before files and all items sorted alphabetically within their level.
 *
 * @note This function mutates the given `nodeList` array for performance reasons.
 *
 * @param rootFolder - The path of the root folder to start the sorting from.
 * @param nodeList - The list of nodes to be sorted.
 *
 * @returns A new array of nodes sorted in depth-first order.
 */
function sortFileList(rootFolder: string, nodeList: Node[], hideRoot: boolean): Node[] {
  logger.trace('sortFileList');

  const nodeMap = new Map<string, Node>();
  const childrenMap = new Map<string, Node[]>();

  // pre-sort nodes by name and type
  nodeList.sort((a, b) => compareNodes(a, b));

  for (const node of nodeList) {
    nodeMap.set(node.fullPath, node);

    const parentPath = node.fullPath.slice(0, node.fullPath.lastIndexOf('/'));

    if (parentPath !== rootFolder.slice(0, rootFolder.lastIndexOf('/'))) {
      if (!childrenMap.has(parentPath)) {
        childrenMap.set(parentPath, []);
      }

      childrenMap.get(parentPath)?.push(node);
    }
  }

  const sortedList: Node[] = [];

  const depthFirstTraversal = (path: string): void => {
    const node = nodeMap.get(path);

    if (node) {
      sortedList.push(node);
    }

    const children = childrenMap.get(path);

    if (children) {
      for (const child of children) {
        if (child.kind === 'folder') {
          depthFirstTraversal(child.fullPath);
        } else {
          sortedList.push(child);
        }
      }
    }
  };

  if (hideRoot) {
    // if root is hidden, start traversal from its immediate children
    const rootChildren = childrenMap.get(rootFolder) || [];

    for (const child of rootChildren) {
      depthFirstTraversal(child.fullPath);
    }
  } else {
    depthFirstTraversal(rootFolder);
  }

  return sortedList;
}

function compareNodes(a: Node, b: Node): number {
  if (a.kind !== b.kind) {
    return a.kind === 'folder' ? -1 : 1;
  }

  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
}
