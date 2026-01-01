"use client";

type ButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export function Button({ label, onClick, disabled }: ButtonProps) {
  return (
    <button
      type="button"
      className="primaryButton"
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
