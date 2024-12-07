import * as SwitchPrimitive from '@radix-ui/react-switch';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = ({ checked, onCheckedChange }: SwitchProps) => {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="relative h-6 w-11 cursor-pointer rounded-full transition-colors bg-[#d4d4d4] dark:bg-[#262626] data-[state=checked]:bg-[#2563eb] dark:data-[state=checked]:bg-[#2563eb]"
    >
      <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-lg transition-transform data-[state=checked]:translate-x-[1.375rem]" />
    </SwitchPrimitive.Root>
  );
};

export default Switch;
