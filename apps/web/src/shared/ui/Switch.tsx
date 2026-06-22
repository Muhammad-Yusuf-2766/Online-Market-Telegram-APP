import './switch.css';

type SwitchProps = {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-labelledby'?: string;
};

export function Switch({
  id,
  checked,
  onCheckedChange,
  disabled,
  'aria-labelledby': ariaLabelledBy,
}: SwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      className="pb-switch"
      onClick={() => {
        if (!disabled) onCheckedChange(!checked);
      }}
    >
      <span className="pb-switch__thumb" aria-hidden />
    </button>
  );
}
