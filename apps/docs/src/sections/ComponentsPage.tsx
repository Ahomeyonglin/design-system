import { Badge } from '@ahomeyonglin/ui/Badge';
import { Card } from '@ahomeyonglin/ui/Card';
import { Text } from '@ahomeyonglin/ui/Text';
import type { Theme } from '../lib/support';
import { ComponentPreview, hasPreview } from '../lib/previews';
import { components, enumValues, type RegistryComponent } from '../lib/registry';
import { hrefFor } from '../lib/url-state';
import './components.css';

interface ComponentsPageProps {
  theme: Theme;
  brand: string;
}

function variantSummary(component: RegistryComponent): string {
  const parts: string[] = [];
  const variants = enumValues(component, 'variant');
  const tones = enumValues(component, 'tone');
  if (variants.length) {
    parts.push(`variant ${variants.length}`);
  }
  if (tones.length) {
    parts.push(`tone ${tones.length}`);
  }
  return parts.length ? parts.join(' · ') : '单一样式';
}

export default function ComponentsPage({ theme, brand }: ComponentsPageProps) {
  return (
    <div className="components-page">
      <header className="docs-page-header">
        <div>
          <h1>组件地图</h1>
          <p className="docs-page-lead">
            全部卡片由 registry.json 渲染，顺序与 registry 一致。新增组件后本页无需改动。
          </p>
        </div>
      </header>

      <div className="component-grid">
        {components.map((component) => (
          <Card key={component.id}>
            <div className="component-card">
              <div className="component-card__preview">
                {hasPreview(component.id) ? (
                  <ComponentPreview id={component.id} />
                ) : (
                  <span className="docs-muted">暂无预览</span>
                )}
              </div>

              <div className="component-card__head">
                <a
                  className="component-card__name"
                  href={hrefFor(`/components/${component.id}`, { theme, brand })}
                >
                  <Text variant="label.md">{component.name}</Text>
                </a>
                <Badge>{component.category}</Badge>
              </div>

              <Text as="p" variant="body.sm" tone="secondary">
                {component.$description}
              </Text>

              <div className="component-card__meta">
                <span>{variantSummary(component)}</span>
                <span>{component.tokens.length} 个依赖 token</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
