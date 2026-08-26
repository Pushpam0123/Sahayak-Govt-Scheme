'use client';

// Reusable, theme-aware UI primitives built on the design-system tokens.
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';

// ---------- Card ----------
export function Card({
  children,
  className = '',
  as: Tag = 'div',
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'aside';
}) {
  return (
    <Tag
      className={`bg-surface border border-border-subtle rounded-2xl shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  icon,
  title,
  right,
}: {
  icon?: ReactNode;
  title: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border-subtle">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-content">
        {icon ? <span className="text-primary">{icon}</span> : null}
        {title}
      </h3>
      {right}
    </div>
  );
}

// ---------- Button ----------
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-hover shadow-sm disabled:opacity-50',
  secondary:
    'bg-surface-2 text-content hover:bg-surface-3 border border-border-strong disabled:opacity-50',
  ghost:
    'bg-transparent text-muted hover:text-content hover:bg-surface-2 border border-transparent',
  subtle:
    'bg-surface-2 text-content hover:bg-surface-3 border border-border-subtle',
  danger: 'bg-danger text-white hover:opacity-90',
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed ${buttonVariants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconButton({
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg p-2 text-muted hover:text-content hover:bg-surface-2 border border-border-subtle transition-colors cursor-pointer disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---------- Badge ----------
export type BadgeTone = 'success' | 'danger' | 'neutral' | 'primary' | 'warn';

const badgeTones: Record<BadgeTone, string> = {
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warn: 'bg-warn-soft text-warn',
  neutral: 'bg-surface-2 text-muted border border-border-subtle',
  primary: 'bg-primary-soft text-primary',
};

export function Badge({
  tone,
  variant,
  children,
  className = '',
  title,
}: {
  tone?: BadgeTone;
  variant?: BadgeTone;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const activeTone = variant || tone || 'neutral';
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeTones[activeTone]} ${className}`}
    >
      {children}
    </span>
  );
}

// ---------- Form fields ----------
export function Field({
  label,
  children,
  htmlFor,
}: {
  label: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 block text-xs font-medium text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-content placeholder:text-faint focus:outline-none focus:border-primary transition-colors';

export function TextInput({
  className = '',
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${className}`} {...rest} />;
}

export function Select({
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputClass} cursor-pointer ${className}`} {...rest}>
      {children}
    </select>
  );
}

// ---------- Spinner ----------
export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin text-primary ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
      />
    </svg>
  );
}

// ---------- Segmented control ----------
export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  ariaLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex gap-1 rounded-xl border border-border-subtle bg-surface-2 p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`whitespace-nowrap rounded-lg font-semibold transition-colors cursor-pointer ${pad} ${
              active
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-muted hover:text-content'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
