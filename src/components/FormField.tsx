'use client';

type FormFieldProps = {
  label: string;
  children: React.ReactNode;
  hint?: string;
};

export default function FormField({ label, children, hint }: FormFieldProps) {
  return (
    <label className="form-field">
      <span className="form-field-label">{label}</span>
      {children}
      {hint && <span className="form-field-hint">{hint}</span>}
    </label>
  );
}
