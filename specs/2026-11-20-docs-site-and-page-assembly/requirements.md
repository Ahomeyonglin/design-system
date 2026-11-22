# Requirements — Docs Site & Page Assembly

> 包名说明：文中 `@ds/*` 为当时的包名，已于 2026-11-22 改为 `@ahomeyonglin/*`（见 [ADR-0015](../adr/0015-public-npm-distribution.md)）。照抄命令时请替换包名。

> 阶段：S3 · 状态：待评审（v0.1）· 创建 2026-11-20
> 上游约束：`specs/mission.md`、`specs/tech-stack.md`、`specs/roadmap.md`

## 1. 问题

S2 让组件成为可检索单元，但「AI 只读规范就能拼页」仍未被验证：

| 现状 | 后果 |
| --- | --- |
| `App.tsx` 只硬编码 `/` 与 `/color` 两条路由 | 每加一页都要改入口，且无法深链 |
| 没有组件地图与详情页 | AI 与人只能读 JSON，看不到真实渲染与状态 |
| 排版、间距、圆角混在 `/color` 一个长页 | 无法按类别查询，也没有主题 × 品牌矩阵 |
| `theme` / `brand` 只存在于 `/color` 的查询参数 | 换页即丢失状态，链接无法完整复现视图 |
| 没有搜索 | 上百个 token 与 5 个组件只能靠滚动查找 |
| 没有 page-assembly skill | S2 只规定了「组件怎么加」，没规定「页面怎么拼」 |
| 没有部署 | 静态产物只在本地，链接不可分享 |
| 没有样板页 | 核心假设「AI 零歧义产页」没有可验收的产物 |

## 2. 目标

1. 文档站补齐总览、排版、间距与圆角、主题与品牌、组件地图、组件详情、变更记录。
2. 组件地图与详情**全部由 `registry.json` 渲染**，新增组件不需要改页面代码。
3. 路由、主题、品牌、搜索词、锚点全部进入 URL，链接可分享可复现。
4. 文档站除 `/color` 原始色阶展示外只消费 `semantic` token，并由 lint 强制。
5. 静态构建部署到 GitHub Pages 固定 URL，支持深链。
6. 交付 `page-assembly` skill 与一个「项目设置页」样板，证明页面无需人工改颜色与间距。

## 3. 已定决策

2026-11-20 讨论确认，后续实现以此为准：

| # | 决策 | 结论 |
| --- | --- | --- |
| D1 | 部署目标 | GitHub Pages，复用现有仓库与 Actions；URL 为 `https://ahomeyonglin.github.io/design-system/` |
| D2 | 样板页 | 项目设置页，覆盖 `Card` + `Text` + `TextField` + `Button` + `Badge` 五类组件 |
| D3 | 搜索范围 | 全局搜索：页面、组件、token 一个入口，结果分组 |
| D4 | 交付文件 | 规格三件套：`requirements.md` + `plan.md` + `validation.md` |
| D5 | 路由形态 | 干净路径 + History API；GitHub Pages 用 `404.html` 回退，不用 hash 路由 |
| D6 | 路由实现 | 自写纯函数解析器，不引入 `react-router` 等运行时依赖 |
| D7 | 文档站定位 | 验收台 + 查询台；不写营销文案，不做代码编辑器 |
| D8 | 组件数据源 | 组件清单、props、依赖 token 只读 `registry.json`；禁止页面内手写清单 |
| D9 | 预览夹具 | 详情页的真实渲染由 `src/lib/previews.tsx` 按组件 id 提供；缺失时降级提示，不报错 |
| D10 | 变体控件 | 只提供组件真实存在的 `variant` / `tone` / `disabled`；无组件有 `size`，本阶段不做 size |
| D11 | URL 状态 | `theme` / `brand` / `q` 走查询参数，锚点走 hash；非法值回退并重写 URL |
| D12 | 变更记录来源 | 直接读取根 `CHANGELOG.md`（`?raw`），用轻量渲染器输出；不引入 markdown 依赖 |
| D13 | 文档站样式 | 原生 CSS + `semantic` 变量；不引入 Tailwind 或第三方 UI 库 |
| D14 | 文档站 lint | 新增 `@ds/docs` 的 lint 脚本，规则与 S2 组件 lint 同源但按文档站场景调整 |
| D15 | 模板页约束 | 样板页只能组合既有组件；缺能力时停下走 `component-sync`，不得内联实现 |
| D16 | 新增依赖 | 除现有 React / Vite 外不新增运行时依赖；测试用 Node 26 原生类型擦除 |
| D17 | token 与组件 | S3 不新增 token、不新增组件；实现中发现缺口先停下确认 |
| D18 | 文档站外壳 | 页面骨架用 CSS + token 实现；与组件语义一致且组件能力可表达的交互（如普通按钮）必须用 `@ds/ui`；图标按钮、分段切换等组件未覆盖的形态可在 chrome 内自建，但不得仿造已有变体样式 |
| D19 | 外壳豁免 | 文档站自身（外壳与 `/color`、`/type`、`/space`、`/themes`、`/changelog` 的 token 查询/展示页）不进入 registry，不受根 `AGENTS.md` 硬规则 5 约束；样板页与组件预览属于产品级页面，仍受约束。2026-11-20 已确认。外壳与展示零件只放在 `src/layout` / `src/search` / `src/ui`；若某个零件被第二个产品页面复用，必须走 `component-sync` 升级为正式组件，不得直接复制 |
| D20 | registry 渲染口径 | 「全部由 `registry.json` 渲染」指清单、props、依赖 token 与页面结构；真实实例由预览夹具按 id 提供，夹具不是事实源 |
| D21 | 预览状态 | 无法由枚举 prop 表达的预览状态（当前仅 TextField）由夹具提供 preview-only `state` 控件，不写入 registry、不视为组件 API |
| D22 | 布局例外 | 布局与文档可视化尺寸（容器、侧栏、断点、色块、示意条、图标、层级及必要偏移）不做 token，集中为 `layout.css` 的 `--docs-*`；这是「零硬编码」的唯一有界例外 |
| D23 | 响应式范围 | 本阶段只保证 ≥1024px；侧栏固定，不做移动端折叠 |

## 4. 范围

**做**

- 应用外壳：侧边导航、页头、主题 / 品牌切换、全局搜索入口
- 9 条路由：`/`、`/color`、`/type`、`/space`、`/themes`、`/components`、`/components/:id`、`/changelog`、`/examples/project-settings`
- 路由与 URL 状态层（含深链、回退、滚动与锚点）
- 总览、排版、间距与圆角、主题与品牌、变更记录页
- 组件地图与组件详情，数据只来自 `registry.json`
- 全局搜索（页面 / 组件 / token）
- 文档站 lint、lint fixture 与路由 / 支持矩阵纯函数测试
- `page-assembly` skill 与项目设置样板页
- GitHub Pages 部署 workflow 与 `404.html` 回退
- 根 `AGENTS.md`、`specs/tech-stack.md`、`CHANGELOG.md` 的同步更新

**不做**

- 视觉回归基线与自动截图比对
- 第二个品牌、新的主题、新的 token 或组件
- npm 发布、semver 流程、changelog 自动生成
- 组件 playground 的代码编辑、在线改 props 生成代码
- 文档站国际化、登录、后端接口
- 自定义域名与 CDN 配置

## 5. 功能需求

### R1 应用外壳与路由

| 路径 | 页面 | 主要数据源 |
| --- | --- | --- |
| `/` | 总览 | `tokens.json`、`registry.json`、`brands/manifest.json`、`CHANGELOG.md` |
| `/color` | 颜色（沿用 S1/S2，接入外壳） | `tokens.json` |
| `/type` | 排版 | `tokens.json` |
| `/space` | 间距与圆角 | `tokens.json` |
| `/themes` | 主题 × 品牌矩阵 | `tokens.json`、`brands/manifest.json` |
| `/components` | 组件地图 | `registry.json` |
| `/components/:id` | 组件详情 | `registry.json` |
| `/changelog` | 变更记录 | 根 `CHANGELOG.md` |
| `/examples/project-settings` | 项目设置样板页 | `@ds/ui` |

- 路由解析必须是纯函数：输入 `pathname` 与 `base`，输出 `{ name, params }`；未知路径返回 `not-found`，渲染 404 视图而不是重定向。
- 导航使用真实 `<a href>`，仅拦截无修饰键的左键同源链接后 `pushState`；带 `Cmd/Ctrl/Shift/Alt`、`target="_blank"` 与外链保持浏览器默认行为；`popstate` 恢复视图。
- `/components/<id>` 大小写不敏感匹配 registry 中的 id；命中后地址规范化为 registry 的 PascalCase id，避免同页多 URL。
- 路由变化后滚动到顶部；带 hash 时滚动到对应元素并高亮。
- 每页设置 `document.title = "<页面名> · Design System"`。
- 当前页在侧边导航中标记 `aria-current="page"`。
- 本阶段只保证 ≥1024px；侧栏固定，不做移动端折叠。

**验收**：九条路由在 dev 与静态构建下都可直接访问；未知路径显示 404 视图；`/components/button` 解析为 `Button` 并规范化地址；未知组件 id 显示 404 视图；修饰键点击与外链不被拦截。

### R2 URL 状态契约

| 键 | 位置 | 取值 | 非法时 |
| --- | --- | --- | --- |
| 路由 | pathname | 上表九条 | 404 视图 |
| `theme` | query | `light` / `dark` | 回退 `light`，并 `replaceState` 重写 |
| `brand` | query | `brands/manifest.json` 中的品牌 | 回退 manifest 的第一个品牌，并重写 |
| `q` | query | 任意字符串 | 空串等价于未搜索 |
| 锚点 | hash | token 或区块的稳定 id | 页面顶部，不报错 |

- 稳定锚点统一由 token id 生成：`.` 替换为 `-`（如 `semantic-color-bg-surface`），全站唯一，同时用于滚动定位与高亮。
- 主题与品牌切换使用 `replaceState`，不产生历史堆积；切换后保留当前 `q` 与锚点。
- 品牌不支持某主题时，该组合在 UI 中禁用并说明原因；URL 直接带入不支持组合时回退到该品牌支持的主题并重写。
- 页面导航保留 `theme` / `brand`，不保留上一页的 `q` 与 hash。
- 品牌与主题的合法性以 `brands/manifest.json` 为准；`tokens.json` 的品牌列表只用于一致性校验。

**验收**：带 `?theme=dark&brand=base` 的任意页面链接打开后状态一致；`?theme=foo&brand=bar` 被回退且地址栏被重写；导航后主题与品牌不丢失。

### R3 总览 `/`

必须展示，且全部由数据推导：

- 版本区：Token 格式版本（`tokens.json` 的 `version`）、`registry.json` 的 `schemaVersion`、发布状态（当前为「未发布」）；不显示无意义的 `0.0.0` 包版本。
- Token 数量：语义层与原始层各多少；组件数量；主题与品牌数量。
- 支持矩阵摘要：品牌 × 主题，标注不支持组合。
- 最近变更：`CHANGELOG.md` 中最新区块的前 3 条。
- 指向 `/color`、`/components`、`/themes`、`/changelog` 的入口。

**验收**：数量与 `tokens.json` / `registry.json` 实际值一致；新增一个组件后重载页面，组件数量与最近变更随之变化，无需改总览代码。

### R4 排版 `/type`

- 按固定顺序展示 6 个 `semantic.text.*` 组合：`display.lg`、`heading.md`、`body.md`、`body.sm`、`label.md`、`code.md`。
- 每个组合包含：真实 `Text` 实例、token id、解析后的字号 / 行高 / 字重 / 字距 / 字体族、`$description`、复制变量名、复制链接。
- 每个 token 有稳定锚点（id 由 token 路径转连字符，如 `semantic-text-body-md`）。
- 页面不得手写字号、行高与字重。

**验收**：6 个组合齐全且顺序固定；实例全部由 `Text` 渲染；复制链接包含当前 `theme` / `brand` 与锚点；锚点直达时对应行高亮。

### R5 间距与圆角 `/space`

- 间距按 `inline` / `stack` / `inset` 三组展示 12 个 `semantic.space.*`，每组包含可视化示意、数值、描述、复制变量名与锚点。
- 圆角展示 4 个 `semantic.radius.*`，同样包含示意与复制。
- 当前没有独立的宽高尺寸 token，页面不虚构「尺寸」区块，并明确说明窄宽度由使用方容器决定。

**验收**：12 + 4 个 token 全部出现；示意尺寸来自 CSS 变量而不是写死值；token 增删后页面自动跟随。

### R6 主题与品牌 `/themes`

- 从 `brands/manifest.json` 渲染矩阵：行是品牌，列是主题；支持组合可点击应用，不支持组合禁用并给出原因。
- 点击组合后在本页应用该组合并更新 URL，不跳转；需要继续查色时通过页面上的 `/color` 入口前往。
- 展示 light / dark 之间解析值不同的 `semantic.*` token 数量与分组清单，清单由 `tokens.json` 对比生成，禁止手写；分组按 `semantic.<category>`（color / text / space / radius）划分。
- 清单中的颜色项可跳到 `/color` 对应锚点。
- 不支持组合的判定逻辑由纯函数覆盖（用「仅 light」品牌 fixture）；当前 manifest 没有部分支持品牌，禁用态 UI 在本阶段不做人工验收，待第二个品牌出现时再补。

**验收**：矩阵内容与 manifest 完全一致；点击支持组合后整站颜色变化且 URL 同步；差异数量与实测一致；不支持组合的判定由纯函数 fixture 验证。

### R7 组件地图 `/components`

- 组件清单只来自 `registry.json`，顺序与 registry 一致。
- 每张卡片包含：真实组件实例（来自预览夹具）、名称、类别、`$description`、变体数量、依赖 token 数量；类别直接显示 registry 的 `category` 原值。
- 变体数量按 `variant` / `tone` 两个枚举 prop 分别显示（如「variant 6 · tone 4」）；两者都没有时显示「单一样式」。当前没有 size 维度，不显示尺寸数量。
- 预览夹具缺失时，卡片仍渲染名称与描述，并以文字说明「暂无预览」，不得空白或报错。
- 页面代码中不得出现组件名数组或手写卡片。

**验收**：新增一个临时组件并重新生成 registry 后，地图自动多一张卡片，页面代码零改动；删除后恢复；卡片数量等于 `registry.components.length`。

### R8 组件详情 `/components/:id`

- 头部：名称、类别、`$description`、`import` 路径与复制导入语句。
- 预览区：按组件真实能力提供控件：
  - `variant` 存在时提供变体切换；
  - `tone` 存在时提供语气切换；
  - `disabled` 存在时提供禁用开关；
  - 无法由枚举 prop 表达的预览状态（当前仅 TextField 的 default / error / disabled）由夹具提供 preview-only `state` 控件；它不是组件 API，不写入 registry；
  - 无 `size` 控件。
- props 表：名称、类型、必填、默认值、说明，直接来自 registry，不手写。
- 依赖 token 列表：每项可跳转到对应页面锚点（颜色 → `/color`，排版 → `/type`，间距 / 圆角 → `/space`）。
- 组件存在但缺少预览夹具时，仍展示头部、props 表与 token 列表，预览区显示「暂无预览」，不 404、不报错。
- 未知 id 显示 404 视图。

**验收**：5 个组件详情页全部可访问；props 表与 registry 完全一致；切换控件时真实实例随之变化；TextField 可切换 default / error / disabled；无夹具的已知组件降级为「暂无预览」；token 跳转命中锚点。

### R9 全局搜索

- 入口固定在外壳页头；`Cmd/Ctrl + K` 与 `/`（焦点不在输入框时）打开；`Esc` 关闭。
- 索引在运行时由 `semantic.*`、`raw.color.*`、`registry.json` 与固定路由表构建，不额外生成索引文件；`raw.space` / `raw.radius` / `raw.text` 不索引，因为它们没有展示页面。
- 结果分为「页面」「组件」「Token」三组；每组最多 5 条，显示总数。
- 匹配规则：大小写不敏感的子串匹配，范围包括页面标题、组件名称 / `$description`、token id / `$description`。
- 键盘操作：上下键移动、回车跳转、焦点限制在弹层内；关闭后焦点回到入口。
- 搜索词写入 `q`；清空输入后从 URL 移除 `q`。
- 跳转目标：
  - 页面 → 对应路径；
  - 组件 → `/components/<id>`；
  - 语义颜色 → `/color#<anchor>`；
  - 语义排版 → `/type#<anchor>`；
  - 语义间距 / 圆角 → `/space#<anchor>`；
  - 原始颜色 → `/color#<raw-anchor>`，原始色阶每一级必须有稳定锚点。
- 跳转保留当前 `theme` / `brand`。

**验收**：输入组件名、token id、中文描述均可命中；回车跳转后主题与品牌不变且锚点高亮；`q` 随输入更新；无结果时给出明确提示；`raw.space` / `raw.radius` / `raw.text` 不出现在结果中。

### R10 变更记录 `/changelog`

- 读取仓库根 `CHANGELOG.md`，渲染标题、段落、列表、行内代码与链接。
- 遇到未支持语法按纯文本输出，不得导致页面崩溃。
- 版本区块按文件顺序展示，当前最新区块在顶部。
- 不提供编辑入口，不做版本筛选。

**验收**：最新变更与 `CHANGELOG.md` 一致；新增一条变更后页面自动出现；无 markdown 符号泄漏。

### R11 文档站自身约束与 lint

文档站是 token 的第二个真实消费方，必须与组件库受同等约束。

**适用边界**

- 文档站自身——外壳（导航、侧栏、搜索弹层、主题切换器）与 token 查询/展示页（`/color`、`/type`、`/space`、`/themes`、`/changelog`）——允许用 CSS + token 自建，不进入 registry，不受根 `AGENTS.md` 硬规则 5 约束。
- 外壳与展示零件只放在 `src/layout` / `src/search` / `src/ui`，不得写进 `src/sections` 的页面里重复实现。
- 若某个零件被第二个产品页面复用，必须走 `component-sync` 升级为正式组件，不得直接复制到产品页面。
- 样板页与组件预览属于产品级页面，仍必须只使用 registry 中的组件。
- 与 `@ds/ui` 已有组件语义一致且组件能力可表达的交互（如普通按钮）必须复用组件；图标按钮、分段切换等组件未覆盖的形态可在 chrome 内自建，但不得仿造已有变体样式。

**约束**

- 颜色、间距、字号、行高、字重、字距、圆角只允许使用 `semantic` 变量。
- 不允许 hex、`rgb()`、`hsl()`、`oklch()` 字面量。
- 不允许直接消费 `--raw-*`；`raw.*` 仅允许出现在 `/color` 的原始色阶区块及其辅助函数中。
- 内联 `style` 只允许注入 CSS 自定义属性（`--*`），不允许写视觉属性。
- 布局与文档可视化尺寸（容器宽度、侧栏宽度、断点、色块、示意条、图标、层级及必要偏移）集中声明为 `src/styles/layout.css` 中的 `--docs-*` 变量；这是「零硬编码」的唯一有界例外，验收 grep 排除该文件；其它文件不得出现字面量布局尺寸。
- `display`、`grid-template-*`、`flex-*`、`align-*`、`justify-*` 等结构属性可直接使用，但其中的具体长度必须来自变量或 `fr` / `%`。
- `border-width`、`outline-width`、`outline-offset` 允许字面量，与组件 lint 一致。

**lint**

`apps/docs/scripts/lint-docs.mjs` 扫描 `src/**`，逐条报出文件与行号；只对上述视觉属性与布局长度判定，不做全属性字面量扫描。新增 `pnpm --filter @ds/docs lint` 并接入 CI。

**验收**：故意写入 hex、`--raw-`、写死 padding、视觉属性内联样式，lint 均以非 0 退出并指到行号；正常代码通过；`grep` 文档站源码无 hex；`layout.css` 之外无字面量布局尺寸。

### R12 项目设置样板页 `/examples/project-settings`

作为 `page-assembly` 的标准产物，验证「只读规范即可拼页」。

内容要求：

- 页头：`Text` 标题与说明、状态 `Badge`。
- 「基本信息」`Card`：项目名称、项目标识、负责人三个 `TextField`。
- 「操作」区：保存（`Button` primary）、取消（`Button` secondary）。
- 「危险操作」`Card`：说明文字、危险 `Badge`、归档 `Button`。
- 保存与归档只改本地展示状态（如把状态 `Badge` 从「未保存」切到「已保存」），不发起请求；文案直接写在页面内，不抽公共常量、不做 i18n。
- 「取消」把表单恢复到最近一次保存的值；「归档」把状态改为「已归档」。
- 页面布局只用 CSS Grid / Flex 与 `semantic` 间距；不得复制组件内部样式，不得新增组件。

**验收**：页面只出现 registry 中的 5 个组件；源码 `grep` 无 hex、无 `--raw-`、无写死间距；`lint` 与 `build` 通过；切换主题后整页跟随变化。

### R13 page-assembly skill

`.trae/skills/page-assembly/SKILL.md` 至少包含：

1. 输入解析：把页面需求拆成区块、数据与交互，先列区块再选组件。
2. 必读顺序：`registry.json` → 目标组件 `component.meta.json` → `packages/ui/AGENTS.md` → `specs/tech-stack.md §5` → token 产物。
3. 组装步骤：确定路由与状态 → 选组件（复用优先）→ 用布局 CSS 与语义间距搭建骨架 → 接入真实内容 → 自检。
4. 输出位置：目标应用的页面目录；本仓库样板放在 `apps/docs/src/examples/ProjectSettingsPage.tsx`，样式同目录，并在路由表与侧栏入口各登记一处。
5. 选择规则：「标题 / 正文 → Text」「操作 → Button」「输入 → TextField」「分区 → Card」「状态 → Badge」；缺失能力先走 `component-sync`，不在页面内联。
6. 输出约束：页面文件、样式文件、无硬编码、无 `raw`、无重复组件样式；交互控件与组件语义一致时不得另造样式。
7. 验证命令：`pnpm --filter @ds/docs lint`、`pnpm --filter @ds/docs build`、`grep` 检查与浏览器验收。
8. 禁止事项：为单页定制组件、改 registry、跳过 lint、自动更新视觉基线。

**产出顺序**：先写 skill，再按 skill 产出样板页；样板页作为 skill 的参考产物，在 skill 中直接引用其路径，不复述整页代码。

**验收**：用 R12 的固定 brief，在干净分支按 `SKILL.md` 从零组装；颜色与间距的人工修改次数为 0；lint 与 build 通过；记录组装步骤与产物路径。

### R14 部署

- 新增 `.github/workflows/deploy-docs.yml`：`main` 推送与手动触发时构建并发布到 GitHub Pages。
- 构建时 `base` 为 `/design-system/`；本地 dev 与 preview 使用 `/`。
- 验证带 base 的产物时使用 `VITE_BASE=/design-system/ pnpm --filter @ds/docs build && pnpm --filter @ds/docs preview`，不以 dev server 代验。
- 构建后生成 `404.html`（复制 `index.html`）与 `.nojekyll`，保证深链可用。
- workflow 使用 Pages 官方 action，权限最小化（`contents: read`、`pages: write`、`id-token: write`）。
- 固定 URL：`https://ahomeyonglin.github.io/design-system/`。
- 仓库 Pages 的 Source 需设为「GitHub Actions」，属于一次性人工前置。

**验收**：访问固定 URL 返回文档站首页；直接打开 `/design-system/components/button?theme=dark&brand=base` 与 `/design-system/changelog` 均可渲染；刷新不白屏；无自定义域名依赖。

### R15 不变量

- 组件清单只来自 `registry.json`，token 值只来自 `tokens.json`。
- 文档站源码不出现 hex；除 `/color` 原始色阶区外不出现 `raw.*`。
- S3 不修改任何 token 值、不新增 token、不新增组件。
- 不新增运行时依赖；不引入路由库或 markdown 库。
- 主题 / 品牌 / 搜索 / 锚点状态必须可被 URL 完整表达。
- 深链在静态部署下必须可用，不能只在 dev server 生效。

### 与上游约束的显式差异

以下三条不是遗漏，而是本阶段有意收敛的边界，需在评审与验收时按此判断：

1. **根 `AGENTS.md` 硬规则 5**：只约束产品级页面与组件；文档站自身（外壳与 token 查询/展示页）不进入 registry（D19），但通用零件限定目录，且被产品页复用时必须升级为正式组件。
2. **「grep 无硬编码样式值」**：布局尺寸不做 token，集中为 `layout.css` 的 `--docs-*`；验收 grep 排除该文件，其余源码仍须零硬编码（D22）。
3. **「详情页可切换 state」**：TextField 的 error 态由 preview-only `state` 提供，不新增组件 prop（D21）。

## 6. 待输入

| 问题 | 处理 |
| --- | --- |
| GitHub Pages 是否已启用 | 仓库设置中的一次性人工操作，未启用时部署验收挂起，不回退为「本地可预览即通过」 |
| 是否绑定自定义域名 | 本阶段不绑定，使用默认 `github.io` 域名 |
| 变更记录渲染范围 | 只保证 `CHANGELOG.md` 当前使用的语法子集；新增语法时再扩展，不提前实现完整 markdown |
| 搜索每组上限 | 固定 5 条并显示总数；如结果过密，只调上限，不改匹配规则 |
| 部分支持品牌的禁用 UI | 当前 manifest 无此类品牌，判定逻辑由 fixture 覆盖；禁用态 UI 待第二个品牌出现时验收 |
