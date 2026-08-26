import React from 'react';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  bleed?: boolean;
  bg?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

export function Section({
  bleed = false,
  bg = 'bg-page',
  className = '',
  containerClassName = '',
  children,
  ...props
}: SectionProps) {
  if (bleed) {
    return (
      <section className={`w-full ${bg} ${className}`} {...props}>
        {children}
      </section>
    );
  }

  return (
    <section className={`w-full ${bg} ${className}`} {...props}>
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${containerClassName}`}>
        {children}
      </div>
    </section>
  );
}
