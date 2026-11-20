import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { Badge } from '@ds/ui/Badge';
import { Button } from '@ds/ui/Button';
import { Text } from '@ds/ui/Text';
import { TextField } from '@ds/ui/TextField';
import {
  anchorOf,
  cssVar,
  formatDimension,
  getCombination,
  radiusTokens,
  rawColorScales,
  semanticGroups,
  spaceGroups,
  typographyTokens,
} from '../lib/tokens';
import type { Theme } from '../lib/support';
import { TokenRow } from '../ui/TokenRow';
import './color.css';

interface ColorPageProps {
  theme: Theme;
  brand: string;
}

function swatchStyle(id: string): CSSProperties {
  return { '--swatch': `var(${cssVar(id)})` } as CSSProperties;
}

export default function ColorPage({ theme, brand }: ColorPageProps) {
  const [form, setForm] = useState({ name: '', branch: '' });

  const combination = useMemo(() => getCombination(theme, brand), [theme, brand]);
  const groups = useMemo(() => semanticGroups(combination), [combination]);
  const scales = useMemo(() => rawColorScales(combination), [combination]);
  const spacing = useMemo(() => spaceGroups(combination), [combination]);
  const radii = useMemo(() => radiusTokens(combination), [combination]);
  const typography = useMemo(() => typographyTokens(combination), [combination]);

  return (
    <div className="color-page">
      <header className="docs-page-header">
        <div>
          <h1>颜色</h1>
          <p className="docs-page-lead">
            语义色、间距、圆角与排版，原始色阶折叠在页尾。点击“复制变量名”只会复制 CSS 变量名。
          </p>
        </div>
      </header>

      <section className="docs-section" aria-labelledby="semantic-colors">
        <h2 id="semantic-colors">语义色</h2>
        <div className="groups">
          {groups.map((group) => (
            <div key={group.key} className="docs-panel">
              <h3>{group.label}</h3>
              <ul className="token-list">
                {group.tokens.map((token) => (
                  <TokenRow
                    key={token.id}
                    id={token.id}
                    description={token.description}
                    demo={
                      <span className="swatch">
                        <span className="swatch__fill" style={swatchStyle(token.id)} />
                      </span>
                    }
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="docs-section" aria-labelledby="composition">
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

      <section className="docs-section" aria-labelledby="spacing">
        <h2 id="spacing">间距</h2>
        <div className="groups">
          {spacing.map((group) => (
            <div key={group.key} className="docs-panel">
              <h3>{group.label}</h3>
              <ul className="token-list">
                {group.tokens.map((token) => (
                  <TokenRow
                    key={token.id}
                    id={token.id}
                    description={`${formatDimension(token.value)} · ${token.description}`}
                    demo={
                      <span
                        className={`space-demo${group.key === 'inset' ? ' space-demo--inset' : ''}`}
                        style={{ '--space': `var(${cssVar(token.id)})` } as CSSProperties}
                      >
                        <i className="space-demo__block" />
                        <i className="space-demo__block" />
                      </span>
                    }
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
                description={`${formatDimension(token.value)} · ${token.description}`}
                demo={
                  <span
                    className="radius-demo"
                    style={{ '--radius': `var(${cssVar(token.id)})` } as CSSProperties}
                  />
                }
              />
            ))}
          </ul>
        </div>
      </section>

      <section className="docs-section" aria-labelledby="typography">
        <h2 id="typography">排版</h2>
        <div className="docs-panel">
          <ul className="token-list">
            {typography.map((token) => (
              <TokenRow
                key={token.id}
                id={token.id}
                description={token.description}
                detail={`${formatDimension(token.value.fontSize)} / ${formatDimension(
                  token.value.lineHeight,
                )}`}
                demo={
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
                }
              />
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
                  <div key={step.id} className="raw__step" id={anchorOf(step.id)}>
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
    </div>
  );
}
