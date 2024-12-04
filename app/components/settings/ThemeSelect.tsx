import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';
import { useEffect, useState } from 'react';

export function ThemeSelect() {
  const theme = useStore(themeStore);
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');

      if (localStorage.getItem('bolt_theme') === 'system') {
        themeStore.set(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleThemeChange = (value: string) => {
    if (value === 'system') {
      localStorage.setItem('bolt_theme', 'system');
      themeStore.set(systemTheme);
    } else {
      localStorage.setItem('bolt_theme', value);
      themeStore.set(value as 'dark' | 'light');
    }
  };

  return (
    <select
      value={localStorage.getItem('bolt_theme') || theme}
      onChange={(e) => handleThemeChange(e.target.value)}
      className="bg-[#2B2B2B] text-white rounded px-3 py-1.5 text-sm"
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
