"use client";

type AddButtonProps = {
  onClick: () => void;
  ariaLabel?: string;
};

export function AddButton({ onClick, ariaLabel = "Add" }: AddButtonProps) {
  return (
    <button
      type="button"
      className="addButton"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      +
    </button>
  );
}
