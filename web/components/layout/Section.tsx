'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  bleed?: boolean;
  bg?: string;
  containerClassName?: string;
  animate?: boolean;
  children: React.ReactNode;
}

export function Section({
  bleed = false,
  bg = 'bg-page',
  className = '',
  containerClassName = '',
  animate = true,
  children,
  ...props
}: SectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!animate) {
      setIsVisible(true);
      return;
    }
    const element = sectionRef.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Runs once into view, never on repeat
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [animate]);

  const animationClass = isVisible ? 'animate-fade-rise' : 'opacity-0';

  if (bleed) {
    return (
      <section
        ref={sectionRef}
        className={`w-full ${bg} ${animationClass} ${className}`}
        {...props}
      >
        {children}
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={`w-full ${bg} ${animationClass} ${className}`}
      {...props}
    >
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${containerClassName}`}>
        {children}
      </div>
    </section>
  );
}
