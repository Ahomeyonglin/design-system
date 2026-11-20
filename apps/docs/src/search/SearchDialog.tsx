import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { components } from '../lib/registry';
import { buildSearchIndex, flattenResults, searchEntries, type SearchEntry } from '../lib/search';
import { getCombination } from '../lib/tokens';
import type { Theme } from '../lib/support';
import './search.css';

interface SearchDialogProps {
  query: string;
  theme: Theme;
  brand: string;
  onQueryChange(value: string): void;
  onClose(): void;
  onNavigate(href: string): void;
}

interface SearchGroupProps {
  label: string;
  entries: SearchEntry[];
  total: number;
  activeIndex: number;
  offset: number;
  onHover(index: number): void;
  onClose(): void;
}

function SearchGroup({
  label,
  entries,
  total,
  activeIndex,
  offset,
  onHover,
  onClose,
}: SearchGroupProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="search-group" aria-label={label}>
      <div className="search-group__head">
        <span>{label}</span>
        <span className="search-group__total">共 {total} 条</span>
      </div>
      <ul>
        {entries.map((entry, index) => {
          const globalIndex = offset + index;
          const active = globalIndex === activeIndex;
          return (
            <li key={`${entry.group}-${entry.id}`}>
              <a
                className={`search-result${active ? ' search-result--active' : ''}`}
                href={entry.href}
                data-active={active ? 'true' : undefined}
                onMouseEnter={() => onHover(globalIndex)}
                onClick={onClose}
              >
                <span className="search-result__title">{entry.title}</span>
                <span className="search-result__desc">{entry.description}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function SearchDialog({
  query,
  theme,
  brand,
  onQueryChange,
  onClose,
  onNavigate,
}: SearchDialogProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const combos = useMemo(() => getCombination(theme, brand), [theme, brand]);
  const results = useMemo(() => {
    const entries = buildSearchIndex(combos, components, { theme, brand });
    return searchEntries(entries, query);
  }, [combos, query, theme, brand]);

  const flat = flattenResults(results);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const active = panelRef.current?.querySelector('.search-result--active');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (flat.length ? Math.min(index + 1, flat.length - 1) : 0));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      const target = flat[activeIndex];
      if (target) {
        event.preventDefault();
        onNavigate(target.href);
      }
      return;
    }

    if (event.key === 'Tab') {
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) {
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  return (
    <div
      className="search-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="全局搜索"
        ref={panelRef}
        onKeyDown={handleKeyDown}
      >
        <div className="search-field">
          <input
            ref={inputRef}
            className="search-field__input"
            type="search"
            value={query}
            placeholder="搜索页面、组件与 token"
            aria-label="搜索"
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <button type="button" className="docs-control" onClick={onClose}>
            Esc
          </button>
        </div>

        <div className="search-body">
          {!query.trim() ? (
            <p className="search-hint">输入页面名称、组件名或 token id 开始搜索。</p>
          ) : flat.length === 0 ? (
            <p className="search-hint">没有匹配的结果。</p>
          ) : (
            <>
              <SearchGroup
                label="页面"
                entries={results.pages}
                total={results.totals.page}
                activeIndex={activeIndex}
                offset={0}
                onHover={setActiveIndex}
                onClose={onClose}
              />
              <SearchGroup
                label="组件"
                entries={results.components}
                total={results.totals.component}
                activeIndex={activeIndex}
                offset={results.pages.length}
                onHover={setActiveIndex}
                onClose={onClose}
              />
              <SearchGroup
                label="Token"
                entries={results.tokens}
                total={results.totals.token}
                activeIndex={activeIndex}
                offset={results.pages.length + results.components.length}
                onHover={setActiveIndex}
                onClose={onClose}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
