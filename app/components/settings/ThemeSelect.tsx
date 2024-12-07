import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';

export function ThemeSelect() {
  const theme = useStore(themeStore);

  return (
    <select
      value={theme}
      onChange={(e) => themeStore.set(e.target.value as 'light' | 'dark')}
      className="px-3 py-1.5 rounded text-sm bg-[#ffffff] dark:bg-[#0A0A0A] text-[#000000] dark:text-white border border-bolt-elements-borderColor"
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
