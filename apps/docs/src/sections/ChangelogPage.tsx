import type { ReactNode } from 'react';
import { changelogMarkdown, parseChangelog } from '../lib/changelog';
import './changelog.css';

function renderInline(text: string): ReactNode[] {
  const pattern = /(`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern).filter((part) => part !== '');

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a key={index} href={link[2]}>
          {link[1]}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export default function ChangelogPage() {
  const blocks = parseChangelog(changelogMarkdown);

  return (
    <div className="changelog">
      <header className="docs-page-header">
        <div>
          <h1>变更记录</h1>
          <p className="docs-page-lead">
            直接读取仓库根 CHANGELOG.md。只覆盖当前使用的语法，未知语法按纯文本输出。
          </p>
        </div>
      </header>

      <div className="docs-panel changelog__body">
        {blocks.map((block, index) => {
          if (block.type === 'heading') {
            if (block.level === 1) {
              return <h2 key={index}>{block.text}</h2>;
            }
            if (block.level === 2) {
              return <h3 key={index}>{block.text}</h3>;
            }
            return <h4 key={index}>{block.text}</h4>;
          }

          if (block.type === 'list') {
            return (
              <ul key={index}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          }

          return <p key={index}>{renderInline(block.text)}</p>;
        })}
      </div>
    </div>
  );
}
