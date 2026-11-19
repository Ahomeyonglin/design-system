import type { ReactNode } from 'react';
import './Badge.css';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
};

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span className="ds-badge" data-tone={tone}>
      {children}
    </span>
  );
}
