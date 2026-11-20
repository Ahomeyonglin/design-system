import { Text, type TextVariant } from '@ds/ui/Text';
import type { Theme } from '../lib/support';
import {
  anchorOf,
  cssVar,
  formatDimension,
  getCombination,
  typographyTokens,
} from '../lib/tokens';
import { hrefFor } from '../lib/url-state';
import { TokenRow } from '../ui/TokenRow';
import './type.css';

interface TypePageProps {
  theme: Theme;
  brand: string;
}

export default function TypePage({ theme, brand }: TypePageProps) {
  const combination = getCombination(theme, brand);
  const items = typographyTokens(combination);

  return (
    <div className="type-page">
      <header className="docs-page-header">
        <div>
          <h1>排版</h1>
          <p className="docs-page-lead">
            六个 semantic.text.* 组合按固定顺序展示。实例由 Text 组件渲染，数值来自 token 解析结果。
          </p>
        </div>
      </header>

      <section className="docs-section" aria-labelledby="type-combos">
        <h2 id="type-combos">组合</h2>
        <div className="docs-panel">
          <ul className="token-list">
            {items.map((token) => {
              const variant = token.id.replace('semantic.text.', '') as TextVariant;
              const value = token.value;
              return (
                <TokenRow
                  key={token.id}
                  id={token.id}
                  description={token.description}
                  detail={`${formatDimension(value.fontSize)} / ${formatDimension(
                    value.lineHeight,
                  )} · 字重 ${value.fontWeight} · 字距 ${formatDimension(
                    value.letterSpacing,
                  )} · ${value.fontFamily.join(', ')}`}
                  demo={
                    <div className="type-instance">
                      <Text as="p" variant={variant}>
                        设计系统 Design System 0123
                      </Text>
                    </div>
                  }
                  link={`${window.location.origin}${hrefFor('/type', {
                    theme,
                    brand,
                  })}#${anchorOf(token.id)}`}
                />
              );
            })}
          </ul>
        </div>
      </section>

      <section className="docs-section" aria-labelledby="type-vars">
        <h2 id="type-vars">变量</h2>
        <div className="docs-panel">
          <p className="docs-muted">
            每个组合同时输出字号、行高、字重、字距与字体族变量，命名规则为
            {' '}
            <code>--semantic-text-&lt;组合&gt;-&lt;属性&gt;</code>。
          </p>
          <ul className="token-list type-page__vars">
            {items.map((token) => (
              <li key={token.id} className="type-page__var">
                <code>{cssVar(token.id)}</code>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
