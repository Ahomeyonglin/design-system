import manifestFile from '../../../../packages/tokens/src/brands/manifest.json';
import type { BrandManifest, Theme } from '../lib/support';
import { isCombinationSupported, manifestBrands } from '../lib/support';
import {
  getCombination,
  themeDifferences,
  tokenLink,
  tokens,
} from '../lib/tokens';
import { hrefFor } from '../lib/url-state';
import './themes.css';

interface ThemesPageProps {
  theme: Theme;
  brand: string;
  onSelect(theme: Theme, brand: string): void;
}

const manifest = manifestFile as BrandManifest;

export default function ThemesPage({ theme, brand, onSelect }: ThemesPageProps) {
  const brands = manifestBrands(manifest);
  const diff = themeDifferences(getCombination('light', brand), getCombination('dark', brand));

  return (
    <div className="themes-page">
      <header className="docs-page-header">
        <div>
          <h1>主题与品牌</h1>
          <p className="docs-page-lead">
            矩阵来自 brands/manifest.json。点击可用组合会立即应用到整站，并同步到地址栏。
          </p>
        </div>
      </header>

      <section className="docs-section" aria-labelledby="matrix">
        <h2 id="matrix">支持矩阵</h2>
        <div className="docs-panel">
          <table className="themes__matrix">
            <thead>
              <tr>
                <th scope="col">品牌</th>
                {tokens.themes.map((item) => (
                  <th key={item} scope="col">
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brands.map((item) => (
                <tr key={item}>
                  <th scope="row">{item}</th>
                  {tokens.themes.map((themeName) => {
                    const supported = isCombinationSupported(manifest, item, themeName);
                    const active = theme === themeName && brand === item;
                    return (
                      <td key={themeName}>
                        <button
                          type="button"
                          className="themes__cell"
                          aria-pressed={active}
                          disabled={!supported}
                          title={supported ? undefined : `${item} 不支持 ${themeName} 主题`}
                          onClick={() => onSelect(themeName as Theme, item)}
                        >
                          {supported ? (active ? '当前组合' : '应用') : '不支持'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="themes__color-link">
            <a href={hrefFor('/color', { theme, brand })}>前往颜色页查看当前组合的解析值</a>
          </p>
        </div>
      </section>

      <section className="docs-section" aria-labelledby="diff">
        <h2 id="diff">浅深色差异</h2>
        <div className="docs-panel">
          <p className="themes__summary">
            light / dark 之间解析值不同的 semantic token 共 <strong>{diff.total}</strong> 个。
          </p>
          <div className="themes__diff">
            {diff.groups.map((group) => (
              <div key={group.key} className="themes__diff-group">
                <h3>
                  {group.label} · {group.tokens.length}
                </h3>
                <ul>
                  {group.tokens.map((id) => {
                    const link = tokenLink(id);
                    return (
                      <li key={id}>
                        {link ? (
                          <a href={`${hrefFor(link.path, { theme, brand })}#${link.anchor}`}>
                            {id}
                          </a>
                        ) : (
                          <code>{id}</code>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
