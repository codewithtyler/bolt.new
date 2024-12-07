interface TabButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function TabButton({ icon, label, isActive, onClick }: TabButtonProps) {
  const baseClasses = 'flex items-center w-full px-3 py-2 text-sm rounded-md text-[#000000] dark:text-white';
  const bgClasses = isActive
    ? 'bg-[#f3f3f3] dark:bg-[#171717]'
    : 'bg-transparent hover:bg-[#f3f3f3] dark:hover:bg-[#171717]';

  return (
    <button className={`${baseClasses} ${bgClasses}`} onClick={onClick}>
      <span className={`${icon} mr-2 text-lg`} />
      {label}
    </button>
  );
}
