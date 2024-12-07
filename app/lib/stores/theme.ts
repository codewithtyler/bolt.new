import { atom } from 'nanostores';

const THEME_KEY = 'bolt_theme';

function getInitialTheme(): 'light' | 'dark' {
  // only run in browser
  if (typeof window !== 'undefined') {
    // check localStorage first
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    // fallback to system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }

  return 'light';
}

export const themeStore = atom<'light' | 'dark'>(getInitialTheme());

// subscribe to changes and persist them
if (typeof window !== 'undefined') {
  themeStore.subscribe((theme) => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  });
}
