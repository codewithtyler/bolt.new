interface TabButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function TabButton({ icon, label, isActive, onClick }: TabButtonProps) {
  const baseClasses = 'flex items-center w-full px-3 py-2 text-sm rounded-md text-white';
  const bgClasses = isActive ? 'bg-[#2B2B2B]' : 'bg-transparent hover:bg-[#2B2B2B]';

  return (
    <button className={`${baseClasses} ${bgClasses}`} onClick={onClick}>
      <span className={`${icon} mr-2 text-lg`} />
      {label}
    </button>
  );
}
