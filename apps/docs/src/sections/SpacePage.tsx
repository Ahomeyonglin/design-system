import type { CSSProperties } from 'react';
import type { Theme } from '../lib/support';
import {
  anchorOf,
  cssVar,
  formatDimension,
  getCombination,
  radiusTokens,
  spaceGroups,
} from '../lib/tokens';
import { hrefFor } from '../lib/url-state';
import { TokenRow } from '../ui/TokenRow';
import './space.css';

interface SpacePageProps {
  theme: Theme;
  brand: string;
}

export default function SpacePage({ theme, brand }: SpacePageProps) {
  const combination = getCombination(theme, brand);
  const spacing = spaceGroups(combination);
  const radii = radiusTokens(combination);

  return (
    <div className="space-page">
      <header className="docs-page-header">
        <div>
          <h1>间距与圆角</h1>
          <p className="docs-page-lead">
            间距按 inline / stack / inset 三组展示，圆角单独成组。示意尺寸直接绑定 CSS 变量。
          </p>
        </div>
      </header>

      <section className="docs-section" aria-labelledby="space-groups">
        <h2 id="space-groups">间距</h2>
        <div className="space-page__groups">
          {spacing.map((group) => (
            <div key={group.key} className="docs-panel">
              <h3>{group.label}</h3>
              <ul className="token-list">
                {group.tokens.map((token) => (
                  <TokenRow
                    key={token.id}
                    id={token.id}
                    description={token.description}
                    detail={formatDimension(token.value)}
                    demo={
                      <span
                        className={`space-demo${group.key === 'inset' ? ' space-demo--inset' : ''}`}
                        style={{ '--space': `var(${cssVar(token.id)})` } as CSSProperties}
                      >
                        <i className="space-demo__block" />
                        <i className="space-demo__block" />
                      </span>
                    }
                    link={`${window.location.origin}${hrefFor('/space', {
                      theme,
                      brand,
                    })}#${anchorOf(token.id)}`}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="docs-section" aria-labelledby="radius">
        <h2 id="radius">圆角</h2>
        <div className="docs-panel">
          <ul className="token-list">
            {radii.map((token) => (
              <TokenRow
                key={token.id}
                id={token.id}
                description={token.description}
                detail={formatDimension(token.value)}
                demo={
                  <span
                    className="radius-demo"
                    style={{ '--radius': `var(${cssVar(token.id)})` } as CSSProperties}
                  />
                }
                link={`${window.location.origin}${hrefFor('/space', {
                  theme,
                  brand,
                })}#${anchorOf(token.id)}`}
              />
            ))}
          </ul>
        </div>
      </section>

      <section className="docs-section" aria-labelledby="size-note">
        <h2 id="size-note">尺寸</h2>
        <div className="docs-panel">
          <p className="docs-muted">
            当前没有独立的宽高尺寸 token。组件宽度由使用方容器决定，页面不虚构尺寸区块。
          </p>
        </div>
      </section>
    </div>
  );
}
