import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variants = {
  primary: 'bg-sw-gold text-sw-black hover:bg-sw-gold-glow font-semibold',
  secondary: 'bg-sw-border text-sw-text hover:bg-sw-text-dim/30 border border-sw-border',
  ghost: 'text-sw-text-dim hover:text-sw-text hover:bg-sw-border/50',
  danger: 'bg-sw-red/20 text-sw-red hover:bg-sw-red/30 border border-sw-red/30',
};

const sizes = {
  sm: 'px-2.5 py-1 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
