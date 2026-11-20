import type { ReactNode } from 'react';
import { anchorOf, cssVar } from '../lib/tokens';
import { CopyButton } from './CopyButton';
import './token-row.css';

interface TokenRowProps {
  id: string;
  description?: string;
  detail?: ReactNode;
  demo?: ReactNode;
  link?: string;
}

export function TokenRow({ id, description, detail, demo, link }: TokenRowProps) {
  return (
    <li className="token-row" id={anchorOf(id)}>
      {demo ? <div className="token-row__demo">{demo}</div> : null}
      <span className="token-row__meta">
        <code>{id}</code>
        {description ? <span className="token-row__desc">{description}</span> : null}
        {detail ? <span className="token-row__detail">{detail}</span> : null}
      </span>
      <span className="token-row__actions">
        <CopyButton text={cssVar(id)} label="复制变量名" />
        {link ? <CopyButton text={link} label="复制链接" /> : null}
      </span>
    </li>
  );
}
