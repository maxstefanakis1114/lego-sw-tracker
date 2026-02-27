import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-sw-text-dim">{label}</label>}
      <input
        className={`bg-sw-dark border border-sw-border rounded-lg px-3 py-2 text-sm text-sw-text placeholder:text-sw-text-dim/50 focus:outline-none focus:border-sw-gold/50 transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
