import React from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';

interface ContextMenuItem {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
  className?: string;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export function ContextMenu({ items, x, y, onClose }: ContextMenuProps) {
  React.useEffect(() => {
    const handleClick = () => {
      onClose();
    };
    window.addEventListener('click', handleClick);

    return () => window.removeEventListener('click', handleClick);
  }, [onClose]);

  return createPortal(
    <div
      className="context-menu"
      style={{
        position: 'fixed',
        top: y,
        left: x,
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          className={classNames('context-menu-item', item.className)}
          onClick={(e) => {
            e.stopPropagation();
            item.action();
            onClose();
          }}
        >
          {item.icon && <span className="context-menu-icon">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
