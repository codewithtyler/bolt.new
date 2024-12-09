declare module '@remix-run/react' {
  import type { ReactNode } from 'react';
  
  export { RemixBrowser } from '@remix-run/react';
  export function Links(): JSX.Element;
  export function Meta(): JSX.Element;
  export function Outlet(): JSX.Element;
  export function Scripts(): JSX.Element;
  export function ScrollRestoration(): JSX.Element;
}

declare module '@remix-run/cloudflare' {
  export type LinksFunction = () => Array<{ rel: string; href: string; type?: string; crossOrigin?: string }>;
  export function json(data: any): Response;
  export type MetaFunction = () => Array<{ title?: string }>;
}

declare module '@remix-run/dev' {
  export const cloudflareDevProxyVitePlugin: any;
  export const vitePlugin: any;
} 