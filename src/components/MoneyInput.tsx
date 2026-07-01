'use client';

import { formatAmountInputRaw } from '@/lib/format';

type MoneyInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  id?: string;
};

export default function MoneyInput({
  value,
  onChange,
  className = 'form-control',
  placeholder,
  required,
  readOnly,
  id,
}: MoneyInputProps) {
  return (
    <input
      id={id}
      className={className}
      type="text"
      inputMode="decimal"
      value={value}
      placeholder={placeholder}
      required={required}
      readOnly={readOnly}
      onChange={(e) => onChange(formatAmountInputRaw(e.target.value))}
    />
  );
}
