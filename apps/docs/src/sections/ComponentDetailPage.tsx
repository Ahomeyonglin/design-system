import { useState } from 'react';
import { Badge } from '@ahomeyonglin/ui/Badge';
import type { Theme } from '../lib/support';
import { ComponentPreview, hasPreview, previewStates, type PreviewState } from '../lib/previews';
import {
  enumValues,
  findComponent,
  hasProp,
  type RegistryComponent,
} from '../lib/registry';
import { tokenLink } from '../lib/tokens';
import { hrefFor } from '../lib/url-state';
import { CopyButton } from '../ui/CopyButton';
import './component-detail.css';

interface ComponentDetailPageProps {
  id: string;
  theme: Theme;
  brand: string;
}

function defaultValueFor(component: RegistryComponent, name: string): string | undefined {
  const prop = component.props.find((item) => item.name === name);
  if (!prop) {
    return undefined;
  }
  if (prop.defaultValue) {
    return prop.defaultValue.replaceAll('"', '');
  }
  return enumValues(component, name)[0];
}

function initialPreviewState(component: RegistryComponent): PreviewState {
  return {
    variant: defaultValueFor(component, 'variant'),
    tone: defaultValueFor(component, 'tone'),
    disabled: false,
    state: previewStates(component.id)[0],
  };
}

export default function ComponentDetailPage({ id, theme, brand }: ComponentDetailPageProps) {
  const component = findComponent(id);
  const [preview, setPreview] = useState<PreviewState>(() =>
    component ? initialPreviewState(component) : {},
  );

  if (!component) {
    return (
      <div className="not-found">
        <h1>组件不存在</h1>
        <p className="docs-page-lead">registry.json 中没有 id 为 {id} 的组件。</p>
        <a href={hrefFor('/components', { theme, brand })}>返回组件地图</a>
      </div>
    );
  }

  const variants = enumValues(component, 'variant');
  const tones = enumValues(component, 'tone');
  const states = previewStates(component.id);
  const disabledControl = hasProp(component, 'disabled') && states.length === 0;

  return (
    <div className="component-detail">
      <header className="docs-page-header">
        <div>
          <div className="component-detail__title">
            <h1>{component.name}</h1>
            <Badge>{component.category}</Badge>
          </div>
          <p className="docs-page-lead">{component.$description}</p>
          <p className="component-detail__import">
            <code>{component.importPath}</code>
            <CopyButton
              text={`import { ${component.name} } from '${component.importPath}';`}
              label="复制导入语句"
            />
          </p>
        </div>
      </header>

      <section className="docs-section" aria-labelledby="preview">
        <h2 id="preview">预览</h2>
        <div className="docs-panel">
          <div className="component-detail__controls">
            {variants.length ? (
              <div className="component-detail__control">
                <span className="component-detail__label">variant</span>
                <div className="component-detail__options">
                  {variants.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="docs-control"
                      aria-pressed={preview.variant === value}
                      onClick={() =>
                        setPreview((current) => ({ ...current, variant: value }))
                      }
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {tones.length ? (
              <div className="component-detail__control">
                <span className="component-detail__label">tone</span>
                <div className="component-detail__options">
                  {tones.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="docs-control"
                      aria-pressed={preview.tone === value}
                      onClick={() => setPreview((current) => ({ ...current, tone: value }))}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {states.length ? (
              <div className="component-detail__control">
                <span className="component-detail__label">state（预览专用）</span>
                <div className="component-detail__options">
                  {states.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="docs-control"
                      aria-pressed={preview.state === value}
                      onClick={() => setPreview((current) => ({ ...current, state: value }))}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {disabledControl ? (
              <div className="component-detail__control">
                <span className="component-detail__label">disabled</span>
                <div className="component-detail__options">
                  <button
                    type="button"
                    className="docs-control"
                    aria-pressed={Boolean(preview.disabled)}
                    onClick={() =>
                      setPreview((current) => ({ ...current, disabled: !current.disabled }))
                    }
                  >
                    {preview.disabled ? 'true' : 'false'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="component-detail__preview">
            {hasPreview(component.id) ? (
              <ComponentPreview id={component.id} state={preview} />
            ) : (
              <span className="docs-muted">暂无预览</span>
            )}
          </div>
        </div>
      </section>

      <section className="docs-section" aria-labelledby="props">
        <h2 id="props">Props</h2>
        <div className="docs-panel component-detail__table-wrap">
          <table className="component-detail__table">
            <thead>
              <tr>
                <th scope="col">名称</th>
                <th scope="col">类型</th>
                <th scope="col">必填</th>
                <th scope="col">默认值</th>
                <th scope="col">说明</th>
              </tr>
            </thead>
            <tbody>
              {component.props.map((prop) => (
                <tr key={prop.name}>
                  <td>
                    <code>{prop.name}</code>
                  </td>
                  <td>
                    <code>{prop.type}</code>
                  </td>
                  <td>{prop.required ? '是' : '否'}</td>
                  <td>{prop.defaultValue ?? '—'}</td>
                  <td>{prop.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="docs-section" aria-labelledby="tokens">
        <h2 id="tokens">依赖 token</h2>
        <div className="docs-panel">
          <ul className="component-detail__tokens">
            {component.tokens.map((tokenId) => {
              const link = tokenLink(tokenId);
              return (
                <li key={tokenId}>
                  {link ? (
                    <a href={`${hrefFor(link.path, { theme, brand })}#${link.anchor}`}>
                      {tokenId}
                    </a>
                  ) : (
                    <code>{tokenId}</code>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
