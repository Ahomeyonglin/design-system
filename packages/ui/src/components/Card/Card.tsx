import type { ReactNode } from 'react';
import './Card.css';

export type CardProps = {
  children: ReactNode;
};

export function Card({ children }: CardProps) {
  return <div className="ds-card">{children}</div>;
}
