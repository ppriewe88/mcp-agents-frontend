"use client";

type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
}: TextAreaProps) {
  return (
    <label className="formField">
      <div className="formLabel">{label}</div>
      <textarea
        className="textArea"
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
