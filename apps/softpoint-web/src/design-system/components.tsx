import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button type="button" className={`sp-btn sp-btn--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = '', elevated }: { children: ReactNode; className?: string; elevated?: boolean }) {
  return (
    <div className={`sp-card${elevated ? ' sp-card--elevated' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function CardLabel({ children }: { children: ReactNode }) {
  return <p className="sp-card-label">{children}</p>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="sp-input" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="sp-input sp-select" {...props} />;
}

export function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="sp-field">
      <label className="sp-field-label">{label}</label>
      {children}
      {hint && <p className="sp-field-hint">{hint}</p>}
    </div>
  );
}

export function Alert({ variant, children }: { variant: 'success' | 'error' | 'info'; children: ReactNode }) {
  return <div className={`sp-alert sp-alert--${variant}`}>{children}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="sp-empty">{children}</p>;
}

export function Badge({ variant, children }: { variant: string; children: ReactNode }) {
  return <span className={`sp-badge sp-badge--${variant}`}>{children}</span>;
}
