declare module 'react-toastify' {
  import { ReactNode } from 'react';

  export const toast: {
    error: (message: string) => void;
  };

  export interface ToastContainerProps {
    closeButton?: (props: { closeToast: () => void }) => ReactNode;
    icon?: (props: { type: string }) => ReactNode;
    position?: 'bottom-right' | 'top-right' | 'top-left' | 'bottom-left';
    pauseOnFocusLoss?: boolean;
    transition?: object;
  }

  export interface CssTransitionProps {
    enter: string;
    exit: string;
  }

  export function ToastContainer(props: ToastContainerProps): JSX.Element;
  export function cssTransition(props: CssTransitionProps): object;
} 