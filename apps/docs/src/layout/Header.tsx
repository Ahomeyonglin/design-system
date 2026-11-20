import { THEMES, type Theme } from '../lib/support';

interface HeaderProps {
  title: string;
  theme: Theme;
  brand: string;
  brands: string[];
  supportedThemes: Theme[];
  onSelect(theme: Theme, brand: string): void;
  onOpenSearch(): void;
}

export function Header({
  title,
  theme,
  brand,
  brands,
  supportedThemes,
  onSelect,
  onOpenSearch,
}: HeaderProps) {
  return (
    <header className="docs-header">
      <span className="docs-header__title">{title}</span>

      <button type="button" className="docs-control docs-search-trigger" onClick={onOpenSearch}>
        <span>搜索</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="docs-header__brand">
        <span className="docs-header__label">品牌</span>
        {brands.length > 1 ? (
          <select
            className="docs-control docs-brand-select"
            value={brand}
            aria-label="品牌"
            onChange={(event) => onSelect(theme, event.target.value)}
          >
            {brands.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ) : (
          <span>{brand}</span>
        )}
      </div>

      <div className="docs-segment" role="group" aria-label="主题">
        {THEMES.map((item) => {
          const supported = supportedThemes.includes(item);
          return (
            <button
              key={item}
              type="button"
              className="docs-control"
              aria-pressed={theme === item}
              disabled={!supported}
              title={supported ? undefined : `${brand} 不支持 ${item} 主题`}
              onClick={() => onSelect(item, brand)}
            >
              {item === 'light' ? 'Light' : 'Dark'}
            </button>
          );
        })}
      </div>
    </header>
  );
}
