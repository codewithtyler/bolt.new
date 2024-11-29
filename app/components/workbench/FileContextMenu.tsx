import * as ContextMenu from '@radix-ui/react-context-menu';

interface FileContextMenuProps {
  children: React.ReactNode;
  onNewFile: () => void;
  onNewFolder: () => void;
  onCopyPath: () => void;
  onCopyRelativePath: () => void;
}

export function FileContextMenu({
  children,
  onNewFile,
  onNewFolder,
  onCopyPath,
  onCopyRelativePath,
}: FileContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="context-menu-content">
          <ContextMenu.Item className="context-menu-item" onSelect={onNewFile}>
            New file...
          </ContextMenu.Item>
          <ContextMenu.Item className="context-menu-item" onSelect={onNewFolder}>
            New folder...
          </ContextMenu.Item>
          <ContextMenu.Separator className="context-menu-separator" />
          <ContextMenu.Item className="context-menu-item" onSelect={onCopyPath}>
            Copy path
          </ContextMenu.Item>
          <ContextMenu.Item className="context-menu-item" onSelect={onCopyRelativePath}>
            Copy relative path
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
