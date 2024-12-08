import { useStore } from '@nanostores/react';
import type { LinksFunction } from '@remix-run/cloudflare';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { stripIndents } from './utils/stripIndent';
import { createHead } from 'remix-island';
import { useEffect } from 'react';

import reactToastifyStyles from 'react-toastify/dist/ReactToastify.css?url';
import globalStyles from './styles/index.scss?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';

import 'virtual:uno.css';

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.svg',
    type: 'image/svg+xml',
  },
  { rel: 'stylesheet', href: reactToastifyStyles },
  { rel: 'stylesheet', href: tailwindReset },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'stylesheet', href: xtermStyles },
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
];

const inlineThemeCode = stripIndents`
  setTutorialKitTheme();

  function setTutorialKitTheme() {
    let theme = localStorage.getItem('bolt_theme');

    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.querySelector('html')?.setAttribute('data-theme', theme);
  }
`;

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <Meta />
    <Links />
    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
  </>
));

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useStore(themeStore);

  useEffect(() => {
    document.querySelector('html')?.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      {children}
      <ScrollRestoration />
      <Scripts />
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#000000' }}>
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          '--gradient-opacity': '0.85'
        }}
      >
        <div 
          className="absolute w-[480px] h-[680px] -top-[540px] left-[250px]"
          style={{
            background: 'radial-gradient(rgba(83, 196, 255, var(--gradient-opacity)) 0%, rgba(43, 166, 255, 0) 100%)',
            transform: 'rotate(80deg)',
            filter: 'blur(110px)',
            mixBlendMode: 'overlay'
          }}
        />
        <div 
          className="absolute w-[110px] h-[400px] -top-[280px] left-[350px] opacity-60"
          style={{
            background: 'radial-gradient(rgba(83, 196, 255, var(--gradient-opacity)) 0%, rgba(43, 166, 255, 0) 100%)',
            transform: 'rotate(-20deg)',
            filter: 'blur(60px)',
            mixBlendMode: 'overlay'
          }}
        />
        <div 
          className="absolute w-[400px] h-[370px] -top-[350px] left-[200px] opacity-60"
          style={{
            background: 'radial-gradient(rgba(83, 196, 255, var(--gradient-opacity)) 0%, rgba(43, 166, 255, 0) 100%)',
            filter: 'blur(21px)',
            mixBlendMode: 'overlay'
          }}
        />
        <div 
          className="absolute w-[330px] h-[370px] -top-[330px] left-[50px] opacity-50"
          style={{
            background: 'radial-gradient(rgba(83, 196, 255, var(--gradient-opacity)) 0%, rgba(43, 166, 255, 0) 100%)',
            filter: 'blur(21px)',
            mixBlendMode: 'overlay'
          }}
        />
        <div 
          className="absolute w-[110px] h-[400px] -top-[280px] left-[-10px] opacity-80"
          style={{
            background: 'radial-gradient(rgba(83, 196, 255, var(--gradient-opacity)) 0%, rgba(43, 166, 255, 0) 100%)',
            transform: 'rotate(-40deg)',
            filter: 'blur(60px)',
            mixBlendMode: 'overlay'
          }}
        />
      </div>
      <div className="relative z-[2] flex-1">
        <Outlet />
      </div>
    </div>
  );
}
