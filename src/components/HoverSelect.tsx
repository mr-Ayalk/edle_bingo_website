'use client';

import { useState } from 'react';

export type HoverSelectOption = {
  value: string;
  label: string;
};

type HoverSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: HoverSelectOption[];
  placeholder: string;
};

export default function HoverSelect({ value, onChange, options, placeholder }: HoverSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div
      className="hover-select"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="form-control hover-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? '' : 'hover-select-placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="hover-select-chevron" aria-hidden>▾</span>
      </button>
      {open && (
        <ul className="hover-select-menu" role="listbox">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={opt.value === value ? 'is-selected' : undefined}
                onClick={() => onChange(opt.value)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
