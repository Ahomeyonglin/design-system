# Tech Stack — 技术与规范约束

> 状态：草案 v0.2 · 最后更新 2026-11-16
> 本文件定义「用什么做、怎么做才合规」。标 **待确认** 的条目是建议值，确认前不据此写实现代码。

## 1. 总览

| 层 | 选型 | 状态 |
| --- | --- | --- |
| 仓库形态 | 单仓多包（pnpm workspace） | 已定 |
| 运行时 | Node ≥ 26 | 已定 |
| 包管理 | pnpm | 已定 |
| 语言 | TypeScript（strict） | 已定 |
| Token 格式 | DTCG 2025.10 三件套 | 已定 |
| Token 源色彩 | `oklch`，禁止 hex | 已定 |
| 主题模型 | `theme` + `brand` 双 modifier | 已定 |
| 组件元数据 | 每组件 `component.meta.json` → 聚合 `registry.json` | 已定 |
| 文档站框架 | Vite + React + TS | 已定（2026-11-16） |
| 样式方案 | Tailwind v4（`@theme` 消费 CSS 变量） | **待确认** |

## 2. 仓库与包管理

```
default/
├── packages/tokens/     @ds/tokens   唯一事实源，产 CSS/JSON
├── packages/ui/         @ds/ui       组件 + registry.json
├── apps/docs/           @ds/docs     验收台 + 查询台
├── specs/               宪法与功能规格
├── .trae/skills/        AI 可执行规则
└── .github/workflows/   CI 强制约束
```

- 内部依赖用 `workspace:*` 引用，不走文件路径。
- `packages/tokens/dist` 不入库；`packages/ui/registry.json` **生成后提交**（它是 AI 的输入，必须与代码同版本可追溯，CI 用 `git diff --exit-code` 防漂移）。

## 3. Token 层

### 3.1 格式

采用 DTCG 2025.10 的 Format / Color / Resolver 三件套，并在 `package.json` 中锁定该版本语义。

解析器采用 `@terrazzo/parser@2.10.0`，配合 `@terrazzo/cli@2.10.0` 与 `@terrazzo/plugin-css@2.10.0`。P0 已验证其原生支持 resolver 与 modifier（见 [ADR-0011](./adr/0011-parser.md)）。CSS 的 hex 回退与数值保真由输出层自定义 transform / plugin 实现。

需要注意的定性：DTCG 2025.10 是 Community Group Final Report，**不是 W3C Standard**。这意味着格式可能继续演进，因此：

- 转换库版本必须精确锁定（不接受 `^`）。
- 必须有基于真实解析结果的快照测试，格式升级时以快照差异为判断依据。

### 3.2 颜色

| 位置 | 规则 |
| --- | --- |
| `src/**` | 只允许 `oklch()`；出现 hex 视为构建失败 |
| `dist/**` | 生成 hex（alpha < 1 用 8 位）+ 原始 oklch（JSON）；CSS 中 semantic 通过 `var(--raw-*)` 引用 |
| 超 sRGB 色域 | CI 报错，不允许静默裁剪 |

理由：oklch 的 L/C/H 可独立调节，能保证色阶在感知上等距；同时 hex 回退覆盖不支持 oklch 的环境。

### 3.3 分层与命名

- 三层：`raw`（原始值） → `semantic`（用途） → `comp`（组件局部），路径首段即层前缀。
- 通用结构：`<层>.<类别>.<分组>.<角色>`；状态是角色段后缀（`bg`、`bg-hover`），默认态不写 `rest`。
- `raw` 只放色阶与尺度，不出现 UI 用途词：`raw.color.brand.500`、`raw.color.neutral.500`、`raw.space.4`、`raw.text.size.300`、`raw.radius.2`。
- `semantic` 只表达用途，不出现色相名：`semantic.color.bg.surface`、`semantic.color.action.primary.bg-hover`、`semantic.space.inline.md`、`semantic.text.body.md`、`semantic.radius.none`。
- `comp`（S2 引入）：`comp.button.bg`。
- 数字是序号，不是像素值：`raw.space.4` 的 4 不代表 4px。
- 状态后缀只在确有视觉差异时创建，不要求每个 token 配齐所有状态。
- CSS 变量名由 token 路径转换：`.` 换 `-`，前缀保留（`--semantic-color-bg-surface`）。
- 产物同时输出 `--raw-*` 与 `--semantic-*`（S2 起增加 `--comp-*`）；`--raw-*` 只供品牌文件覆盖，组件与页面禁止消费。
- 品牌名不进入 token 路径；跨品牌可变的色阶用 `raw.color.brand.*`，色相名只留给不随品牌变化的调色板。
- 色阶为 `50–950`，这是本项目的约定，不是规范强制。
- `$description` 项目内必填，作为 AI 理解用途的唯一线索。
- token 名 = 公共 API：改名属于破坏性变更，需走 semver 并保留 `$deprecated` 别名过渡。

### 3.4 主题与品牌

- 两个 modifier：`theme`（light / dark）、`brand`（每品牌一套完整色阶）。
- `brand` 用相同路径覆盖 `raw.*`；`theme` 用相同路径覆盖 `semantic.*`；两者都不改名。
- `theme` 只写 alias 重映射，不写字面量颜色；字面量只在 `brand` 层出现。
- CSS 输出 `2 + N` 份（N = 品牌数）。
- 品牌必须提供完整色阶，不允许只覆盖部分级别。
- 品牌基色为 `#CE1B6C` → `oklch(0.5592 0.2131 1.33)`，锚定 `raw.color.brand.500`（见 [ADR-0012](./adr/0012-brand-color-change.md)）。
- 由 manifest 声明支持矩阵；品牌不支持暗色时强制 light 并禁用切换 UI。

## 4. 组件层（packages/ui）

```
src/components/<PascalCase>/
├── <PascalCase>.tsx
├── <PascalCase>.css        # 只用语义 token 变量
└── component.meta.json     # 名称、props、可用变体、依赖的 token
```

- 组件只消费 `semantic` / `comp` token，禁止直接引用 `raw`（原始值）层。
- `registry.json` 由脚本聚合生成：固定字段、固定排序，保证 diff 稳定。
- `packages/ui/AGENTS.md` 写明「怎么用这套组件」，与 registry 互为索引。

## 5. 文档站（apps/docs）

定位：**验收台 + 查询台**，不是营销站。

构建：Vite + React + TS 的单页应用，产出静态文件；路由与状态不依赖服务端。

页面：

| 路径 | 内容 | 阶段 |
| --- | --- | --- |
| `/` | 总览：版本、token 与组件数量、支持矩阵摘要、最近变更 | S3 |
| `/color` | 颜色 | S1 |
| `/type` | 字号与文本样式 | S3 |
| `/space` | 间距与尺寸 | S3 |
| `/themes` | 主题 × 品牌矩阵 | S3 |
| `/components` | 组件地图，由 registry 渲染 | S3 |
| `/components/<name>` | 组件详情 | S3 |
| `/changelog` | 变更记录 | S3 |

### 5.1 三层 token 的呈现

| 层 | 呈现位置 | 要点 |
| --- | --- | --- |
| raw | `/color` 底部折叠区，默认收起 | 无复制按钮，视觉上不作入口 |
| semantic | `/color` 主视图 | 按用途分组：Background / Text / Border / Action / Status，不按色相 |
| component | 组件详情页内，不单独成页 | 标注 light / dark 的覆盖关系 |

- 页面只能消费 semantic 层；component 层属于组件内部实现，不给独立入口。
- 组件层只在该组件确有独立调整需求时才创建，仅为转手一次的中间层不建。

### 5.2 组件地图

- 整页由 `registry.json` + `component.meta.json` 渲染，禁止手写组件清单。
- 卡片内容：真实组件实例 + 名称 + 用途一句话 + 变体/尺寸数量。
- 详情页：可切换 variant / size / state 的预览、props 表、依赖 token（可跳 `/color`）、导入语句复制。

### 5.3 通用规则

- 所有展示值从 token 解析结果读取，页面内不出现手写色值。
- 品牌、模式、搜索词、锚点全部进 URL，保证链接可分享可复现。
- 支持一键复制变量名（不是复制色值）。
- 文档站自身使用这套 token 构建。

## 6. 验收与 CI

| 检查 | 手段 |
| --- | --- |
| hex 快照 | 解析产物固定后做快照，任何颜色变化必须显式更新快照 |
| 色域 | 超 sRGB 直接失败 |
| 源码禁 hex | lint 规则扫 `src/**` |
| registry 漂移 | 重新生成后 `git diff --exit-code` |
| token 引用完整性 | 构建期校验 alias 目标存在 |

## 7. 明确禁止

1. 在 `src/**` 写 hex / rgb。
2. 为「以后可能要用」预留抽象层或未实现的扩展点。
3. 手改 `registry.json` 或 `dist/**`。
4. 在组件里写死间距、圆角、字号（必须走变量）。
5. 用缩写造 token 名（除固定的 `bg` 外，`clr`、`sp`、`fs` 之类一律禁止）。

## 8. 待确认

文档站样式方案已确认（2026-11-19）：原生 CSS + `--semantic-*` 变量，不引入 Tailwind。

| 问题 | 建议 | 影响面 |
| --- | --- | --- |
| 分发方式 | 先本地 workspace，暂不发布 npm | 影响是否需要 exports / files / 版本策略 |
