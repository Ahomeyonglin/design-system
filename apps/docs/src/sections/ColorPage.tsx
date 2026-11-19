import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  cssVar,
  getCombination,
  rawColorScales,
  semanticGroups,
  tokens,
} from '../lib/tokens';
import './color.css';

type Theme = 'light' | 'dark';

const THEMES: Theme[] = ['light', 'dark'];

function initialState() {
  const params = new URLSearchParams(window.location.search);
  const theme: Theme = params.get('theme') === 'dark' ? 'dark' : 'light';
  const requestedBrand = params.get('brand');
  const brand =
    requestedBrand && tokens.brands.includes(requestedBrand)
      ? requestedBrand
      : tokens.brands[0];
  return { theme, brand };
}

function swatchStyle(id: string): CSSProperties {
  return { '--swatch': `var(${cssVar(id)})` } as CSSProperties;
}

export default function ColorPage() {
  const [{ theme, brand }, setState] = useState(initialState);
  const [copied, setCopied] = useState<string>();

  const combination = useMemo(() => getCombination(theme, brand), [theme, brand]);
  const groups = useMemo(() => semanticGroups(combination), [combination]);
  const scales = useMemo(() => rawColorScales(combination), [combination]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const url = new URL(window.location.href);
    url.searchParams.set('theme', theme);
    url.searchParams.set('brand', brand);
    window.history.replaceState(null, '', url);
  }, [theme, brand]);

  async function copyName(id: string) {
    await navigator.clipboard.writeText(cssVar(id));
    setCopied(id);
    window.setTimeout(() => setCopied(undefined), 1200);
  }

  return (
    <main className="color-page">
      <header className="page__header">
        <div>
          <h1>颜色</h1>
          <p className="page__lead">
            语义色与原始色阶。点击“复制变量名”只会复制 CSS 变量名。
          </p>
        </div>
        <div className="theme-switch" role="group" aria-label="主题">
          {THEMES.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={theme === item}
              onClick={() => setState({ theme: item, brand })}
            >
              {item === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </header>

      <section aria-labelledby="semantic-colors">
        <h2 id="semantic-colors">语义色</h2>
        <div className="groups">
          {groups.map((group) => (
            <div key={group.key} className="group">
              <h3>{group.label}</h3>
              <ul className="token-list">
                {group.tokens.map((token) => (
                  <li key={token.id} className="token-row">
                    <span className="swatch">
                      <span className="swatch__fill" style={swatchStyle(token.id)} />
                    </span>
                    <span className="token-row__meta">
                      <code>{token.id}</code>
                      <span className="token-row__desc">{token.description}</span>
                    </span>
                    <button
                      type="button"
                      className="copy-button"
                      onClick={() => copyName(token.id)}
                    >
                      {copied === token.id ? '已复制' : '复制变量名'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="composition">
        <h2 id="composition">组合预览</h2>
        <div className="preview">
          <div className="preview__panel">
            <span className="preview__label">Action</span>
            <div className="preview__actions">
              <span className="demo-button demo-button--primary">Primary</span>
              <span className="demo-button demo-button--secondary">Secondary</span>
              <span className="demo-button demo-button--ghost">Ghost</span>
            </div>
          </div>

          <div className="preview__panel">
            <span className="preview__label">Status</span>
            <div className="preview__statuses">
              <span className="demo-status demo-status--success">Success</span>
              <span className="demo-status demo-status--warning">Warning</span>
              <span className="demo-status demo-status--danger">Danger</span>
              <span className="demo-status demo-status--info">Info</span>
            </div>
          </div>

          <div className="preview__panel">
            <span className="preview__label">Text</span>
            <div className="preview__text">
              <span className="demo-text demo-text--primary">Primary</span>
              <span className="demo-text demo-text--secondary">Secondary</span>
              <span className="demo-text demo-text--tertiary">Tertiary</span>
              <span className="demo-text demo-text--disabled">Disabled</span>
            </div>
          </div>

          <div className="preview__panel">
            <span className="preview__label">Border</span>
            <div className="preview__borders">
              <span className="demo-border demo-border--subtle">Subtle</span>
              <span className="demo-border demo-border--default">Default</span>
              <span className="demo-border demo-border--strong">Strong</span>
            </div>
          </div>
        </div>
      </section>

      <details className="raw">
        <summary>原始色阶</summary>
        <div className="raw__scales">
          {scales.map((scale) => (
            <div key={scale.group} className="raw__scale">
              <h3>{scale.group}</h3>
              <div className="raw__steps">
                {scale.steps.map((step) => (
                  <div key={step.id} className="raw__step">
                    <span className="swatch swatch--small">
                      <span className="swatch__fill" style={swatchStyle(step.id)} />
                    </span>
                    <span className="raw__step-label">{step.step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </main>
  );
}
