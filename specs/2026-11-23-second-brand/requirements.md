# Requirements — 第二个品牌 zhixing 与品牌级主题覆盖

> 阶段：S4（治理）· 状态：已确认（2026-11-23）· 创建 2026-11-23
> 上游约束：`specs/mission.md`、`specs/tech-stack.md`、`specs/roadmap.md`
> 前置：`specs/2026-11-19-component-foundation/` 与 `specs/2026-11-20-docs-site-and-page-assembly/` 已提供多品牌矩阵、品牌切换与验收台。
> 范围声明：本规格只覆盖第二个品牌的色阶、品牌级主题覆盖机制、产物与测试；不包含组件改造、视觉回归基线与跨仓升级。

## 1. 问题

| 现状 | 后果 |
| --- | --- |
| 只有 `base` 一个品牌，色相单一 | 多品牌矩阵与品牌切换能力没有被真实数据验证 |
| 品牌层只能覆盖 `raw.color.brand.*` | 品牌基色在暗底对比不足时，主操作文字不可读，且无法只针对该品牌修正 |
| 主题文件对所有品牌统一生效 | 直接改 `themes/dark.tokens.json` 会连带改变 `base`，无法按品牌分别处理 |

## 2. 已定决策

| # | 决策 | 结论 |
| --- | --- | --- |
| B-D1 | 品牌定位 | `zhixing` 是独立品牌，色相与 `base` 不同，支持 `light` + `dark` |
| B-D2 | 基色 | `zhixing` 的 `raw.color.brand.500` = `oklch(0.3734 0.1126 259.5882)`（#183E7B） |
| B-D3 | 色阶 | 提供 50–950 全部级别，色相固定 259.59°，采用蓝调平滑方案 |
| B-D4 | 暗色策略 | 允许品牌按主题覆盖 `semantic` token，而不是全局修改主题 |
| B-D5 | 覆盖范围 | 只允许 `semantic.*` 已有 token、只允许 alias、必须带非空 `$description`；支持 color / dimension / fontWeight / fontFamily，复合 typography 改为调整其组成 token |
| B-D6 | 产物结构 | CSS 仍为 `2 + N` 份；生成物置于 `@layer tokens.theme` / `tokens.brand`，品牌层固定高于主题层；品牌覆盖只进 `brand-*.css`，主题 CSS 以 manifest 首个品牌为基准 |
| B-D7 | 暗色取值 | `action.primary` 的 `bg`/`border` → 品牌 400，`bg-hover`/`border-hover` → 品牌 500 |
| B-D8 | 文档站 | 品牌下拉、支持矩阵与差异列表由 manifest 与产物自动驱动，不改页面代码 |
| B-D9 | 测试 | CSS 数量断言改为「主题数 + 品牌数」；新增覆盖机制正例与六类反例 |

## 3. 范围

**做**

- `zhixing` 完整色阶与暗色覆盖文件
- manifest 的 `overrides` 声明与 resolver 的 `zhixing` 上下文
- 构建脚本的覆盖解析、校验、合并与品牌 CSS 输出
- token 测试与文档站引入
- 规格、ADR、`tech-stack`、根 `AGENTS.md`、`README` 同步

**不做**

- 改 token 路径、改 `base` 色阶、改组件
- 按品牌拆分主题文件或新增第三层
- 品牌切换的视觉回归基线
- npm 发布与跨仓升级 PR

## 4. 功能需求

### R1 品牌色阶

- `packages/tokens/src/brands/zhixing.tokens.json` 覆盖 `raw.color.brand.50–950` 全部 11 级。
- 全部使用 oklch，50–950 在 sRGB 内；500 使用 B-D2 的精确值。
- 每个 token 带中文 `$description`。

**验收**：构建后 `brand-zhixing.css` 输出 11 个 `--raw-color-brand-*`，500 为 `#183E7B`；色域测试通过。

### R2 暗色覆盖文件

- `packages/tokens/src/brands/zhixing.dark.tokens.json` 只含 4 个 token：`semantic.color.action.primary` 的 `bg`、`bg-hover`、`border`、`border-hover`。
- 全部为 alias，指向该组合内的 `raw.color.brand.*`，每条带非空 `$description`。

**验收**：`dark/zhixing` 的 `action.primary.bg` 解析为品牌 400 的颜色对象，亮色仍为品牌 500。

### R3 manifest 与 resolver

- manifest 的 `zhixing` 声明 `themes: ["light","dark"]` 与 `overrides.dark`。
- resolver 的 `brand.contexts` 增加 `zhixing`。
- `base` 保持在 manifest 首位，作为主题 CSS 的基准品牌。

**验收**：构建产出 `light/zhixing` 与 `dark/zhixing` 两个组合，数量为 4。

### R4 构建校验与合并

- 覆盖文件必须存在，声明的主题必须在该品牌 `themes` 内，组合必须存在。
- 只允许 `semantic.*` 且已在组合中存在的 token；`$type` 必填并与目标一致；`$description` 非空。
- 值只允许 alias，覆盖只做重映射，不写新值；alias 目标必须在该组合中存在且类型一致。
- 复合 `typography` 不允许整体覆盖，需改为调整组成 token。
- 校验通过后把覆盖值合并进对应组合，token 数量不变。

**验收**：非法层级、缺说明、目标不存在、覆盖不存在 token、类型不一致、非 alias 均构建失败并指出文件与 token；合法覆盖构建成功。

### R5 CSS 输出

- `brand-<brand>.css` 保留品牌色阶块，并追加 `[data-theme="<theme>"][data-brand="<brand>"]` 块输出覆盖变量。
- 覆盖变量值为 `var(--raw-color-brand-*)` 等 alias 引用。
- 生成 CSS 统一放入 `@layer tokens.theme` 与 `@layer tokens.brand`，每个文件声明层级顺序；品牌层固定高于主题层，不依赖选择器特异性或文件加载顺序。
- 主题 CSS 不包含品牌覆盖。

**验收**：`brand-zhixing.css` 含层级声明、暗色选择器与品牌 400/500 引用；`theme-*.css` 位于 `tokens.theme` 层且不含 zhixing 语义覆盖。

### R6 测试

- `build.test.mjs` 的 CSS 数量断言改为 `themes.length + brands.length`，并新增 `brand-zhixing.css` 与层级断言。
- `references.test.mjs` 把 `*.dark.tokens.json` 判定为 semantic 层。
- 新增 `overrides.test.mjs`：临时副本中跑 1 个正例（含颜色与间距）+ 6 个反例。

**验收**：`tokens test` 23 项全部通过，快照包含两组 zhixing 组合。

### R7 文档站

- `apps/docs/src/main.tsx` 引入 `brand-zhixing.css`。
- 不改页面代码，品牌切换器与矩阵自动出现 `zhixing`。

**验收**：`docs lint`、`docs test`、`docs build` 全部通过；`/themes` 矩阵含 zhixing 行。

### R8 文档同步

- 新增本规格三件套与 ADR-0016、ADR-0017，并在 `specs/adr/README.md` 登记。
- `tech-stack.md` §3.4、根 `AGENTS.md`、`README.md` 同步品牌与覆盖规则。

**验收**：三处描述与实现一致，命令可直接执行。

## 5. 不变量

- 不新增依赖。
- 不改 token 路径与 `base` 色阶。
- 不手改 `dist/**`、`registry.json`、`CHANGELOG.md`。
- 品牌覆盖不进入主题 CSS，不改变其他品牌解析值。

## 6. 待输入

| 问题 | 处理 |
| --- | --- |
| 是否再增加第三个品牌 | 等有真实业务需求再评估，本规格不预留 |
| 复合 typography 是否整体覆盖 | 当前不支持，出现真实需求再开规格 |
