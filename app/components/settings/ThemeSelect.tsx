import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';

export function ThemeSelect() {
  const theme = useStore(themeStore);

  const handleThemeChange = (value: string) => {
    themeStore.set(value as 'light' | 'dark');
  };

  return (
    <select
      value={theme}
      onChange={(e) => handleThemeChange(e.target.value)}
      className="px-3 py-1.5 rounded text-sm bg-[#ffffff] dark:bg-[#0A0A0A] text-[#000000] dark:text-white border border-bolt-elements-borderColor"
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
