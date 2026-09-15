import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div
      className={`
        bg-surface-900 border border-surface-800 rounded-xl
        ${padding ? 'p-4 md:p-6' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
