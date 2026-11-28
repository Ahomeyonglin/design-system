import manifestFile from '../../../../packages/tokens/src/brands/manifest.json';
import { components, registry } from '../lib/registry';
import {
  getCombination,
  tokenCounts,
  tokens,
} from '../lib/tokens';
import {
  manifestBrands,
  supportedThemes,
  type BrandManifest,
  type Theme,
} from '../lib/support';
import { hrefFor } from '../lib/url-state';
import './overview.css';

interface OverviewPageProps {
  theme: Theme;
  brand: string;
}

const manifest = manifestFile as BrandManifest;

const ENTRIES = [
  { path: '/color', title: '颜色', description: '语义色的用途分组与原始色阶。' },
  { path: '/components', title: '组件地图', description: '由 registry 渲染的真实组件与状态。' },
  { path: '/themes', title: '主题与品牌', description: '支持矩阵与浅深色差异清单。' },
];

export default function OverviewPage({ theme, brand }: OverviewPageProps) {
  const combination = getCombination(theme, brand);
  const counts = tokenCounts(combination);
  const brands = manifestBrands(manifest);

  return (
    <div className="overview">
      <header className="docs-page-header">
        <div>
          <h1>总览</h1>
          <p className="docs-page-lead">
            可被 AI 消费的设计系统：token 定义视觉值，组件按规范消费 token，本站在此处验收与查询。
          </p>
        </div>
      </header>

      <section className="docs-section" aria-labelledby="versions">
        <h2 id="versions">版本</h2>
        <div className="overview__stats">
          <div className="docs-panel overview__stat">
            <span className="overview__label">Token 格式版本</span>
            <span className="overview__value">{tokens.version}</span>
          </div>
          <div className="docs-panel overview__stat">
            <span className="overview__label">Registry schema</span>
            <span className="overview__value">{registry.schemaVersion}</span>
          </div>
          <div className="docs-panel overview__stat">
            <span className="overview__label">发布状态</span>
            <span className="overview__value">未发布</span>
          </div>
        </div>
      </section>

      <section className="docs-section" aria-labelledby="counts">
        <h2 id="counts">数量</h2>
        <div className="overview__stats">
          <div className="docs-panel overview__stat">
            <span className="overview__label">语义 token</span>
            <span className="overview__value">{counts.semantic}</span>
          </div>
          <div className="docs-panel overview__stat">
            <span className="overview__label">原始 token</span>
            <span className="overview__value">{counts.raw}</span>
          </div>
          <div className="docs-panel overview__stat">
            <span className="overview__label">组件</span>
            <span className="overview__value">{components.length}</span>
          </div>
          <div className="docs-panel overview__stat">
            <span className="overview__label">主题 / 品牌</span>
            <span className="overview__value">
              {tokens.themes.length} / {brands.length}
            </span>
          </div>
        </div>
      </section>

      <section className="docs-section" aria-labelledby="support">
        <h2 id="support">支持矩阵</h2>
        <div className="docs-panel">
          <table className="overview__matrix">
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
                    const supported = supportedThemes(manifest, item).includes(
                      themeName as Theme,
                    );
                    return (
                      <td key={themeName}>
                        <span
                          className={`overview__pill${
                            supported ? ' overview__pill--on' : ' overview__pill--off'
                          }`}
                        >
                          {supported ? '支持' : '不支持'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="docs-section" aria-labelledby="entries">
        <h2 id="entries">入口</h2>
        <div className="overview__entries">
          {ENTRIES.map((entry) => (
            <a
              key={entry.path}
              className="docs-panel overview__entry"
              href={hrefFor(entry.path, { theme, brand })}
            >
              <span className="overview__entry-title">{entry.title}</span>
              <span className="overview__entry-desc">{entry.description}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
