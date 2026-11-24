# Plan — Docs Site & Page Assembly

> 包名说明：文中 `@ds/*` 为当时的包名，已于 2026-11-22 改为 `@ahomeyonglin/*`（见 [ADR-0015](../adr/0015-public-npm-distribution.md)）。照抄命令时请替换包名。

> 对应规格：`requirements.md` · 状态：已完成 · 创建 2026-11-20
> 前置：S2 已合并（五个组件、`registry.json`、组件 lint、`/color` 接入真实组件）；本计划不修改 token 与组件。

## 1. 实施顺序

按依赖排列，每步单独可验证。

| 步 | 内容 | 产出 | 验证 |
| --- | --- | --- | --- |
| P0 | 规格评审 | 本目录三件套定稿 | 决策无冲突，路由与范围无遗漏 |
| P1 | 路由与 URL 层 | `router.ts`、`url-state.ts`、`AppShell`、侧栏、页头、404 视图 | 九条路由可直达；非法 theme / brand 回退并重写 URL |
| P2 | 文档站 lint | `scripts/lint-docs.mjs`、fixture、`layout.css`、CI 接入 | 注入 hex / `--raw-` / 写死 padding / 视觉内联样式均失败 |
| P3 | 既有页迁移与新页 | `/color` 接入外壳；总览、排版、间距与圆角、主题与品牌 | 各页数据来自解析结果，锚点与复制可用 |
| P4 | 全局搜索 | `search.ts`、`SearchDialog`、快捷键与 `q` 同步 | 三组结果可命中、键盘可操作、跳转保留状态 |
| P5 | 组件地图与详情 | `ComponentsPage`、`ComponentDetailPage`、`previews.tsx` | 新增临时组件后地图自动多一项；props 表与 registry 一致 |
| P6 | 变更记录 | `changelog.ts`、`ChangelogPage` | 根 `CHANGELOG.md` 正确渲染，无语法泄漏 |
| P7 | page-assembly skill | `.trae/skills/page-assembly/SKILL.md` | 按 skill 能产出样板页，输出位置与验证命令明确 |
| P8 | 样板页 | `/examples/project-settings` | 由 skill 产出；只用 5 个既有组件；lint / build / grep 通过 |
| P9 | 部署 | `.github/workflows/deploy-docs.yml`、`404.html`、`.nojekyll` | 固定 URL 首页与深链可访问 |
| P10 | 收尾 | `validation.md` 证据、`CHANGELOG.md`、根 `AGENTS.md`、`tech-stack.md` | 全部验收通过并记录 |

## 2. 文件清单

**新增**

```
apps/docs/
├── src/router.ts
├── src/lib/url-state.ts
├── src/lib/support.ts
├── src/lib/search.ts
├── src/lib/changelog.ts
├── src/lib/previews.tsx
├── src/layout/{AppShell.tsx,AppShell.css}
├── src/layout/{Sidebar.tsx,Header.tsx}
├── src/search/{SearchDialog.tsx,search.css}
├── src/ui/{TokenRow.tsx,CopyButton.tsx,token-row.css}
├── src/sections/OverviewPage.tsx
├── src/sections/TypePage.tsx
├── src/sections/SpacePage.tsx
├── src/sections/ThemesPage.tsx
├── src/sections/{ComponentsPage.tsx,components.css}
├── src/sections/{ComponentDetailPage.tsx,component-detail.css}
├── src/sections/{ChangelogPage.tsx,changelog.css}
├── src/examples/{ProjectSettingsPage.tsx,project-settings.css}
├── src/styles/layout.css
├── scripts/lint-docs.mjs
├── tests/lint.test.mjs
├── tests/route.test.ts
├── tests/support.test.ts
└── tests/fixtures/（违规样例）

.github/workflows/deploy-docs.yml
.trae/skills/page-assembly/SKILL.md
```

**修改**

- `apps/docs/src/App.tsx`：改为路由分发与 `AppShell` 挂载，删除手写路径判断。
- `apps/docs/src/sections/ColorPage.tsx` / `color.css`：接入外壳；视觉与验收行为不变，原始色阶区仍为唯一 raw 展示入口。
- `apps/docs/src/styles/globals.css`：只保留全局重置与基础排版，布局常量移入 `layout.css`。
- `apps/docs/package.json`：新增 `lint`、`test` 脚本。
- `apps/docs/vite.config.ts`：`base` 支持 `VITE_BASE`；`server.fs.allow` 允许读取根 `CHANGELOG.md`。
- `apps/docs/tsconfig.json`：仅在纯函数测试需要时开启 `allowJs`，不扩大类型检查范围。
- `.github/workflows/ci.yml`：追加 `@ds/docs` 的 `lint` 与 `test`。
- `AGENTS.md`：更新当前阶段与命令表（docs lint / test）。
- `specs/tech-stack.md §5`：补充样板页路由与部署说明。
- `CHANGELOG.md`：追加 S3 条目。

## 3. 关键决策

1. **不引路由库（D5/D6）**：九条路由是静态表，手写解析器约几十行；引入 `react-router` 只增加了依赖与心智负担。纯函数可被 `node --test` 直接测试。
2. **干净路径 + `404.html`（D5）**：hash 路由虽然部署简单，但链接形态差且与「锚点进 URL」混在一起。GitHub Pages 的 404 回退能保持干净路径，代价是深链首次返回 404 状态码，可接受。
3. **预览夹具与清单解耦（D8/D9）**：组件清单必须自动跟随 registry，但真实预览需要为每个组件写渲染代码。缺失夹具时降级为「暂无预览」，保证新增组件不会让地图或详情页崩溃。
4. **文档站 lint 单独实现（D14）**：组件 lint 的目录完整性、meta 校验不适用于文档站；直接复用会把两套规则绑死。只复用规则语义，不抽公共库。
5. **raw 例外按文件收口（R11）**：`/color` 必须展示原始色阶，无法全站禁 raw；例外限定在 `ColorPage` 与 `lib/tokens`，其余文件出现 `raw.` 即失败。
6. **布局与可视化尺寸集中（R11）**：容器宽度、侧栏、断点、色块与示意条尺寸不属于设计 token 类别，散落在各文件会形成隐性硬编码；统一收进 `layout.css` 的 `--docs-*`。
7. **变更记录轻量渲染（D12）**：CHANGELOG 语法固定且简单，引入 markdown 库为一次性需求增加依赖；渲染器只覆盖当前出现的语法。
8. **运行时搜索索引（R9）**：上百个 token 与 5 个组件的数据量很小，构建期索引没有收益；运行时 `useMemo` 即可，避免多一份生成物与漂移检查。
9. **外壳豁免与布局例外（D19/D22）**：验收台 chrome 不是产品组件，允许自建；布局尺寸不做 token，集中 `--docs-*`，验收 grep 排除 `layout.css`。两条都要在 `validation.md` 中显式记录，避免被当成遗漏。
10. **preview-only state（D21）**：TextField 的 error 态无法由枚举 prop 表达，由夹具提供 state 控件；不写入 registry，避免把预览需求污染成组件 API。
11. **raw 搜索范围（R9）**：只索引 `semantic.*` 与 `raw.color.*`；raw 非颜色 token 没有展示页，索引了也无处跳转。
12. **skill 先行（R13）**：先写 `page-assembly` 再产出样板页；否则样板页会反向定义 skill，验收变成自证。

## 4. 风险

| 风险 | 应对 |
| --- | --- |
| GitHub Pages 深链返回 404 状态码 | 使用官方 `404.html` 回退；验收只要求页面可渲染，不要求状态码 200 |
| `base` 配置导致资源路径错误 | P9 用 `VITE_BASE=/design-system/` 构建后本地以同路径 preview，再部署 |
| Node 26 类型擦除跑 `.ts` 测试不可用 | P1 先跑一个最小 `route.test.ts` 验证；不可用则测试改为 `.mjs`，实现随之调整 |
| 文档站 lint 误伤动态变量注入 | fixture 同时覆盖正例（`--swatch` 注入）与反例（`style={{ color }}`） |
| ColorPage 重构引入 S1/S2 回归 | 保留原有区块、复制行为与 raw 折叠区；P3 逐项对照 S1/S2 validation |
| 搜索弹层焦点与键盘行为不完整 | 验收覆盖打开、关闭、上下键、回车、Esc 与焦点回归 |
| 样板页诱发新增组件 | 规格明确只组合既有组件；缺能力时停下走 `component-sync` |
| preview-only state 被误当成组件 prop | 只存在于 `previews.tsx`；验收检查 `registry.json` 无新增字段、组件 props 无变化 |
| 外壳豁免被扩大成「什么都能自建」 | 外壳代码只放 `src/layout` / `src/search` / `src/ui`；不复刻已有组件变体；被第二个产品页面复用时走 `component-sync` |
| 布局字面量回流到普通样式文件 | lint 只允许 `layout.css` 声明 `--docs-*`；fixture 覆盖「普通文件写 240px」的反例 |
| `?raw` 读取根 CHANGELOG 被 dev server 拦截 | `vite.config.ts` 配置 `server.fs.allow`；P6 同时验证 dev 与 build |

## 5. 回滚

- 文档站改动集中在 `apps/docs`，回退到 S2 的 `App.tsx` / `ColorPage` 即可恢复两页站点。
- 部署：删除 `deploy-docs.yml` 并在仓库设置中关闭 Pages 发布；不影响代码与产物。
- 本阶段不修改 token 与组件，无数据回滚需求。
- `page-assembly` skill 为新增目录，删除即回退，不影响 `component-sync`。

## 6. 不在本计划内

视觉回归基线、第二个品牌、新 token、新组件、npm 发布、semver、changelog 自动生成、组件 playground、文档站 i18n、自定义域名。
