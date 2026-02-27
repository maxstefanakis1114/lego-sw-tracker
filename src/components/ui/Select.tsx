import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-sw-text-dim">{label}</label>}
      <select
        className={`bg-sw-dark border border-sw-border rounded-lg px-3 py-2 text-sm text-sw-text focus:outline-none focus:border-sw-gold/50 transition-colors cursor-pointer ${className}`}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
