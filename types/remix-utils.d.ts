declare module 'remix-utils/client-only' {
  import type { ReactNode } from 'react';
  
  export function ClientOnly({ children, fallback }: { 
    children: () => ReactNode;
    fallback?: ReactNode;
  }): JSX.Element;
} 