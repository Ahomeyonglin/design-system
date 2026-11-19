import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { Badge } from '@ds/ui/Badge';
import { Button } from '@ds/ui/Button';
import { Text } from '@ds/ui/Text';
import { TextField } from '@ds/ui/TextField';
import {
  cssVar,
  formatDimension,
  getCombination,
  radiusTokens,
  rawColorScales,
  semanticGroups,
  spaceGroups,
  tokens,
  typographyTokens,
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
  const [form, setForm] = useState({ name: '', branch: '' });

  const combination = useMemo(() => getCombination(theme, brand), [theme, brand]);
  const groups = useMemo(() => semanticGroups(combination), [combination]);
  const scales = useMemo(() => rawColorScales(combination), [combination]);
  const spacing = useMemo(() => spaceGroups(combination), [combination]);
  const radii = useMemo(() => radiusTokens(combination), [combination]);
  const typography = useMemo(() => typographyTokens(combination), [combination]);

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
            语义色、间距、圆角与排版，原始色阶折叠在页尾。点击“复制变量名”只会复制 CSS 变量名。
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
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>

          <div className="preview__panel">
            <span className="preview__label">Status</span>
            <div className="preview__badges">
              <Badge>Neutral</Badge>
              <Badge tone="info">Info</Badge>
              <Badge tone="success">Success</Badge>
              <Badge tone="warning">Warning</Badge>
              <Badge tone="danger">Danger</Badge>
            </div>
          </div>

          <div className="preview__panel">
            <span className="preview__label">Text</span>
            <div className="preview__text">
              <Text as="p" variant="display.lg">
                Display LG
              </Text>
              <Text as="p" variant="heading.md">
                Heading MD
              </Text>
              <Text as="p">Body MD 正文</Text>
              <Text as="p" variant="body.sm" tone="secondary">
                Body SM 次要文字
              </Text>
              <Text as="p" variant="label.md" tone="tertiary">
                Label MD
              </Text>
              <Text as="p" variant="code.md">
                semantic.color.bg.surface
              </Text>
              <Text as="p" tone="disabled">
                Disabled 文字
              </Text>
            </div>
          </div>

          <div className="preview__panel">
            <span className="preview__label">Form</span>
            <div className="preview__form">
              <TextField
                label="项目名称"
                description="用于列表与导出文件名。"
                placeholder="例如 design-system"
                value={form.name}
                onChange={(name) => setForm((current) => ({ ...current, name }))}
              />
              <TextField
                label="分支名"
                error="只能包含小写字母、数字与连字符。"
                value={form.branch}
                onChange={(branch) => setForm((current) => ({ ...current, branch }))}
              />
              <TextField
                label="组织 ID"
                description="由管理员分配，不可修改。"
                value="ds-core"
                onChange={() => {}}
                disabled
              />
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

      <section aria-labelledby="spacing">
        <h2 id="spacing">间距</h2>
        <div className="groups">
          {spacing.map((group) => (
            <div key={group.key} className="group">
              <h3>{group.label}</h3>
              <ul className="token-list">
                {group.tokens.map((token) => (
                  <li key={token.id} className="token-row">
                    <span
                      className={`space-demo${group.key === 'inset' ? ' space-demo--inset' : ''}`}
                      style={{ '--space': `var(${cssVar(token.id)})` } as CSSProperties}
                    >
                      <i className="space-demo__block" />
                      <i className="space-demo__block" />
                    </span>
                    <span className="token-row__meta">
                      <code>{token.id}</code>
                      <span className="token-row__desc">
                        {formatDimension(token.value)} · {token.description}
                      </span>
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

      <section aria-labelledby="radius">
        <h2 id="radius">圆角</h2>
        <div className="group">
          <ul className="token-list">
            {radii.map((token) => (
              <li key={token.id} className="token-row">
                <span
                  className="radius-demo"
                  style={{ '--radius': `var(${cssVar(token.id)})` } as CSSProperties}
                />
                <span className="token-row__meta">
                  <code>{token.id}</code>
                  <span className="token-row__desc">
                    {formatDimension(token.value)} · {token.description}
                  </span>
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
      </section>

      <section aria-labelledby="typography">
        <h2 id="typography">排版</h2>
        <div className="group">
          <ul className="token-list">
            {typography.map((token) => (
              <li key={token.id} className="token-row">
                <span
                  className="type-demo"
                  style={
                    {
                      '--type-family': `var(${cssVar(token.id)}-font-family)`,
                      '--type-size': `var(${cssVar(token.id)}-font-size)`,
                      '--type-weight': `var(${cssVar(token.id)}-font-weight)`,
                      '--type-line-height': `var(${cssVar(token.id)}-line-height)`,
                      '--type-letter-spacing': `var(${cssVar(token.id)}-letter-spacing)`,
                    } as CSSProperties
                  }
                >
                  Design System 设计系统 0123
                </span>
                <span className="token-row__meta">
                  <code>{token.id}</code>
                  <span className="token-row__desc">
                    {formatDimension(token.value.fontSize)} / {formatDimension(token.value.lineHeight)} ·{' '}
                    {token.description}
                  </span>
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
