import type { ReactNode } from 'react';
import './Text.css';

export type TextVariant =
  | 'display.lg'
  | 'heading.md'
  | 'body.md'
  | 'body.sm'
  | 'label.md'
  | 'code.md';

export type TextTone = 'primary' | 'secondary' | 'tertiary' | 'disabled';

export type TextProps = {
  variant?: TextVariant;
  tone?: TextTone;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3';
  children: ReactNode;
};

export function Text({
  variant = 'body.md',
  tone = 'primary',
  as: Element = 'span',
  children,
}: TextProps) {
  return (
    <Element className="ds-text" data-variant={variant} data-tone={tone}>
      {children}
    </Element>
  );
}
