# Requirements — Token Foundation

> 包名说明：文中 `@ds/*` 为当时的包名，已于 2026-11-22 改为 `@ahomeyonglin/*`（见 [ADR-0015](../adr/0015-public-npm-distribution.md)）。照抄命令时请替换包名。

> 阶段：S1 · 状态：已完成 · 创建 2026-11-14 · 更新 2026-11-24
> 上游约束：`specs/mission.md`、`specs/tech-stack.md`、`specs/roadmap.md`

## 1. 问题

token 目前只存在于文档描述里，没有源文件、没有产物、没有可验收的展示。下游任何人都无法消费，也无法验证「改一处是否全局生效」。颜色与基础维度（space / typography / radius）都处于同一状态。

## 2. 目标

跑通 **源文件 → 解析 → CSS/JSON 产物 → Color 页展示** 的最小闭环，且闭环内不存在手写视觉值。非颜色 token 与颜色共用同一条解析链路，但 S1 不为其单独建页面。

## 3. 已定决策

2026-11-16 评审确认，后续实现以此为准：

| # | 决策 | 结论 |
| --- | --- | --- |
| D1 | S1 token 范围 | 颜色 + 非颜色基线。非颜色只进源文件与产物，不做文档页 |
| D2 | 文档站技术栈 | Vite + React + TS |
| D3 | 品牌数量 | 只交付 1 个品牌，同时支持 light / dark；「不支持暗色」的矩阵逻辑用测试 fixture 验证，fixture 不进品牌清单 |
| D4 | 色阶生成 | 关键级（如 500 / 600）手定，其余级别按 L/C/H 规则补全 |
| D5 | component 层 token | S1 不建。没有组件就没有 component 层，S2 引入 |
| D6 | 命名规则 | 三层用 `raw` / `semantic` / `comp` 前缀；语义层级用描述词；状态作角色后缀，默认态省略；品牌不进 token 路径（见 [ADR-0009](../adr/0009-token-naming.md)） |
| D7 | 品牌基色 | `#CE1B6C`，对应 `oklch(0.5592 0.2131 1.33)`，作为 `raw.color.brand.500` 锚点；源文件只写 oklch（见 [ADR-0012](../adr/0012-brand-color-change.md)） |
| D8 | 状态色色阶 | 每套只建 5 级：`50 / 100 / 200 / 700 / 950`，共 20 个 raw 颜色；后续按需增补 |
| D9 | 排版组合 | 只建 6 个：`display.lg`、`heading.md`、`body.md`、`body.sm`、`label.md`、`code.md`；其余组合按真实需求增补 |
| D10 | Action 状态 | S1 不建 hover / pressed / disabled，命名规则保留；待 S2 有 Button 时创建 |
| D11 | 字重 | 只保留 `raw.text.weight.*`，不建独立的 semantic 字重 token；字重通过排版 token 组合使用 |
| D12 | 间距 | raw 7 档，按 100 步进命名：`raw.space.100`–`700`，值 2 / 4 / 8 / 12 / 16 / 24 / 32px，源值单位 px；semantic 为 `inline` / `stack` / `inset` × `sm` / `md` / `lg` / `xl` 共 12 个，映射见下文 |
| D13 | 圆角 | raw 4 档，按 100 步进命名：`raw.radius.100`–`400`，值 0 / 8 / 12 / 9999px；semantic 为 `none` / `control` / `surface` / `pill`，当前全站直角，后三者均映射 0，映射见下文 |
| D14 | 排版取值 | 6 个组合的字号 / 行高 / 字重见下文；单位 px；raw 只建被使用的档位 |
| D15 | 品牌色阶 | 11 级，色相固定 1.33°，500 为 `#CE1B6C` → `oklch(0.5592 0.2131 1.33)`；取值见下文；hex 仅用于预览与产物回退 |
| D16 | 解析器 | Terrazzo 2.10.0（parser / cli / plugin-css 同版本），原生支持 DTCG 2025.10 resolver 与 modifier（见 [ADR-0011](../adr/0011-parser.md)） |
| D17 | Neutral 色阶 | 11 级纯灰，50 为 `#FFFFFF`、950 为 `#0C0C0C`；取值见下文；承载背景、文字、边框 |
| D18 | 状态色 | success / warning / danger / info 四套，每套 `50 / 100 / 200 / 700 / 950` 五级；色相分别为 150 / 75 / 27 / 255；取值见下文 |
| D19 | 语义颜色角色 | Background / Text / Border / Action / Status 五组共 32 个，亮色默认映射见下文；暗色映射在 P3 由 theme 覆盖 |
| D20 | 透明 token | 新增 `raw.color.transparent`（alpha 0），供 `action.ghost.bg` 与 `action.ghost.border` 使用，避免在语义层写字面量 |
| D21 | 主题文件结构 | `semantic.tokens.json` 的默认值即亮色；`themes/light.tokens.json` 只声明 light context、不重复 alias；`themes/dark.tokens.json` 只覆盖与亮色不同的 26 个颜色角色 |
| D22 | 页面范围调整 | `/color` 同一页增加 space / radius / typography 区块；语义项展示并可复制变量名，raw 色阶仍默认折叠 |
| D23 | 控件高度 | 不建 size token；高度由排版行高与内边距推导，边框用内描边、不参与高度（当前 24 + 12×2 = 48px） |

间距映射（D12）：

| 轴 | sm | md | lg | xl |
| --- | --- | --- | --- | --- |
| `inline` | 2px | 8px | 12px | 16px |
| `stack` | 4px | 16px | 24px | 32px |
| `inset` | 8px | 12px | 16px | 24px |

圆角映射（D13）：

| 角色 | 值 |
| --- | --- |
| `none` | 0 |
| `control` | 0 |
| `surface` | 0 |
| `pill` | 0 |

2026-11-20 调整：设计方向改为全站直角，`control` / `surface` / `pill` 都映射到 `raw.radius.100`；raw 的 8 / 12 / 9999px 尺度保留，供后续需要时重新映射。

排版取值（D14）：

| semantic | 字号 | 行高 | 字重 | 字体 |
| --- | --- | --- | --- | --- |
| `text.display.lg` | 32px | 40px | semibold (600) | sans |
| `text.heading.md` | 20px | 28px | semibold (600) | sans |
| `text.body.md` | 16px | 24px | regular (400) | sans |
| `text.body.sm` | 14px | 20px | regular (400) | sans |
| `text.label.md` | 14px | 20px | medium (500) | sans |
| `text.code.md` | 14px | 20px | regular (400) | mono |

对应的 raw 档位：

```text
raw.text.size.200 = 14   raw.text.size.300 = 16
raw.text.size.400 = 20   raw.text.size.600 = 32

raw.text.line-height.100 = 20   raw.text.line-height.200 = 24
raw.text.line-height.300 = 28   raw.text.line-height.400 = 40

raw.text.weight.regular = 400   raw.text.weight.medium = 500
raw.text.weight.semibold = 600

raw.text.family.sans   raw.text.family.mono
```

品牌色阶（D15）：

| 级 | oklch | hex（仅预览） |
| --- | --- | --- |
| 50 | `0.9750 0.0130 1.33` | #FFF3F6 |
| 100 | `0.9400 0.0322 1.33` | #FFE3EA |
| 200 | `0.8850 0.0648 1.33` | #FFC8D6 |
| 300 | `0.8000 0.1229 1.33` | #FF9BB8 |
| 400 | `0.6800 0.1900 1.33` | #F15B91 |
| **500** | **`0.5592 0.2131 1.33`** | **#CE1B6C** |
| 600 | `0.5000 0.2019 1.33` | #B5015C |
| 700 | `0.4350 0.1750 1.33` | #96014B |
| 800 | `0.3600 0.1400 1.33` | #720638 |
| 900 | `0.2900 0.1050 1.33` | #510928 |
| 950 | `0.2250 0.0750 1.33` | #350719 |

50 与 300 的彩度受 sRGB 色域限制，已按该亮度下的最大可用值收窄。源文件只写 oklch。

Neutral 色阶（D17）：

| 级 | oklch | hex（仅预览） |
| --- | --- | --- |
| 50 | `1.0000 0 0` | #FFFFFF |
| 100 | `0.9850 0 0` | #FAFAFA |
| 200 | `0.9650 0 0` | #F3F3F3 |
| 300 | `0.9250 0 0` | #E6E6E6 |
| 400 | `0.8200 0 0` | #C4C4C4 |
| 500 | `0.6800 0 0` | #989898 |
| 600 | `0.5600 0 0` | #747474 |
| 700 | `0.4450 0 0` | #545454 |
| 800 | `0.3100 0 0` | #303030 |
| 900 | `0.2250 0 0` | #1C1C1C |
| 950 | `0.1550 0 0` | #0C0C0C |

状态色（D18）：

| 调色板 | 级 | oklch | hex（仅预览） |
| --- | --- | --- | --- |
| success | 50 | `0.9700 0.0200 150` | #ECF9EE |
| success | 100 | `0.9400 0.0500 150` | #D5F5DA |
| success | 200 | `0.8800 0.0900 150` | #ADE9B8 |
| success | 700 | `0.4300 0.1184 150` | #006129 |
| success | 950 | `0.2200 0.0605 150` | #00220A |
| warning | 50 | `0.9800 0.0159 75` | #FFF7ED |
| warning | 100 | `0.9500 0.0404 75` | #FFEBD1 |
| warning | 200 | `0.9000 0.0832 75` | #FFD7A0 |
| warning | 700 | `0.5000 0.1054 75` | #865900 |
| warning | 950 | `0.2500 0.0527 75` | #301D00 |
| danger | 50 | `0.9700 0.0147 27` | #FFF2F0 |
| danger | 100 | `0.9400 0.0301 27` | #FFE4E0 |
| danger | 200 | `0.8800 0.0634 27` | #FFC8C1 |
| danger | 700 | `0.4200 0.1711 27` | #94000C |
| danger | 950 | `0.2200 0.0800 27` | #370404 |
| info | 50 | `0.9700 0.0144 255` | #EFF6FF |
| info | 100 | `0.9400 0.0291 255` | #DFEDFF |
| info | 200 | `0.8800 0.0594 255` | #BEDAFF |
| info | 700 | `0.4500 0.1481 255` | #0053A4 |
| info | 950 | `0.2300 0.0757 255` | #001C3F |

状态色的用途约定：`50 / 100` 作浅色背景，`200` 作边框，`700` 作浅色模式文字，`950` 作暗色模式背景或深色文字。danger 与 brand（H 1.33）色相已区分，状态色只用于 `semantic.color.status.*`，不新增 action 变体。状态色的彩度已按该亮度下的 sRGB 色域上限收窄（与品牌色 50 / 300 同一规则），保证 R3 不触发超色域报错。

语义颜色映射（D19）：

路径省略 `semantic.color.` 前缀。亮色映射写入 `semantic.tokens.json` 作为默认值，暗色映射在 P3 写入 `themes/dark.tokens.json`，只做 alias 覆盖。

**Background**

| 角色 | light | dark |
| --- | --- | --- |
| `bg.page` | neutral.100 | neutral.950 |
| `bg.surface` | neutral.50 | neutral.900 |
| `bg.surface-raised` | neutral.50 | neutral.800 |
| `bg.subtle` | neutral.200 | neutral.800 |

**Text**

| 角色 | light | dark |
| --- | --- | --- |
| `text.primary` | neutral.900 | neutral.50 |
| `text.secondary` | neutral.700 | neutral.300 |
| `text.tertiary` | neutral.500 | neutral.400 |
| `text.disabled` | neutral.400 | neutral.600 |

**Border**

| 角色 | light | dark |
| --- | --- | --- |
| `border.subtle` | neutral.200 | neutral.800 |
| `border.default` | neutral.300 | neutral.700 |
| `border.strong` | neutral.400 | neutral.600 |

**Action**

| 角色 | light | dark |
| --- | --- | --- |
| `action.primary.bg` | brand.500 | brand.500 |
| `action.primary.text` | neutral.50 | neutral.50 |
| `action.primary.border` | brand.500 | brand.500 |
| `action.secondary.bg` | neutral.50 | neutral.900 |
| `action.secondary.text` | brand.700 | brand.300 |
| `action.secondary.border` | brand.500 | brand.500 |
| `action.ghost.bg` | transparent | transparent |
| `action.ghost.text` | brand.700 | brand.300 |
| `action.ghost.border` | transparent | transparent |

**Status**

四套结构一致，`<type>` = success / warning / danger / info：

| 角色 | light | dark |
| --- | --- | --- |
| `status.<type>.bg` | `<type>.50` | `<type>.950` |
| `status.<type>.text` | `<type>.700` | `<type>.200` |
| `status.<type>.border` | `<type>.200` | `<type>.700` |

S1 不建 `border.focus`，待 S2 出现 Button / Input 时按真实焦点场景补充。

## 4. 范围

**做**

- 颜色 token 链路：`raw` → `semantic`，`theme` × `brand` 双 modifier
- 非颜色基线：间距 / 排版 / 圆角（类别清单见 §7，命名规则见 `tech-stack.md` §3.3 与 ADR-0009）走同一链路
- 构建产出 CSS 变量（`2 + N`，当前 `2 + 1 = 3` 份）与 JSON
- 自动化校验：源码禁 hex、超 sRGB 色域报错、产物快照
- 文档站可运行 + Color 页

**不做**

- Type / Space / Themes / Changelog 页
- 任何组件，以及 component 层 token
- 第二个真实品牌
- 非颜色 token 的单独展示页或预览区
- AI skill
- npm 发布

## 5. 功能需求

### R1 源文件结构

raw / semantic / brand / theme / resolver 五部分齐备，职责不重叠。源文件名与 token 路径首段一致（`raw` / `semantic`）。非颜色 token 的源值归属同一套结构，与颜色共用 semantic 层做别名。

**验收**：所有 token 路径以 `raw` 或 `semantic` 开头，`src/**` 中不出现 `comp`；`theme` 文件中不出现字面量颜色，只有 alias 重映射；`semantic` 不直接定义色值。

### R2 构建产物

一条命令（`pnpm --filter @ds/tokens build`）产出：`theme-light.css`、`theme-dark.css`、`brand-<id>.css`（S1 共 3 份）与 `tokens.json`。

- 主题 CSS：raw 输出字面值，颜色为 hex（alpha < 1 时用 8 位 hex）；semantic 颜色 / 间距 / 圆角输出 `var(--raw-*)` 引用，保证品牌覆盖 raw 后 semantic 自动跟随，不需要按品牌重生成主题 CSS。
- 排版组合在 CSS 中拆为 `-font-family` / `-font-size` / `-font-weight` / `-line-height` / `-letter-spacing` 五个变量。
- 颜色先输出 hex，再在 `@supports (color: oklch(0 0 0))` 内用 oklch 覆盖（见 ADR-0003）。
- 品牌 CSS 只输出 `--raw-color-brand-*`，使用同一套 hex + @supports 结构。
- 加载顺序固定：`theme-light.css` → `theme-dark.css` → `brand-*.css`。
- JSON 按 `theme/brand` 保存每个组合的解析结果，颜色同时保留 oklch 与 hex，非颜色保留原始单位。

**验收**：产物为 3 份 CSS + 1 份 JSON；主题 CSS 同时包含 `--raw-*` 与 `--semantic-*`；semantic 颜色值均为 `var(--raw-*)`，切换品牌时无需重新生成主题 CSS；CSS 中 hex 仅出现 6 位或 8 位；非颜色值保持原始单位与精度；JSON 保留 oklch 与非颜色源值；连续构建两次字节一致。

### R3 色彩合规

- `src/**` 出现 hex / rgb 时构建失败
- 任一颜色超出 sRGB 色域时报错，不静默裁剪
- 校验只作用于颜色项，非颜色 token 不参与色域判定

**验收**：手工写入一个 hex → 构建失败；写入一个超色域 oklch → 构建失败。

### R4 快照

产物固定后生成快照：颜色为 hex 快照，非颜色为值快照。任何取值变化必须显式更新快照才能通过。

**验收**：改一个 raw 色值或一个间距值但不更新快照 → 测试失败，且 diff 精确指出变化项。

### R5 Color 页

展示全部语义色，以及 space / radius / typography 区块；值从解析结果读取；支持切换 light / dark；可一键复制变量名。单品牌下不渲染品牌切换器，但品牌状态仍参与解析。

**验收**：页面源码中 `grep` 不到 hex；切换 theme 后色块与变量名同步变化；复制得到的是变量名而非色值（如 `--semantic-color-bg-surface`）；页面无品牌切换入口。

### R6 支持矩阵

resolver 声明哪些品牌支持哪些 theme。单品牌（light + dark）是 S1 的真实交付；「品牌不支持暗色 → 不产出对应 CSS 且禁用切换」随第二个品牌引入时验收，S1 不为此提前实现品牌切换器。

**验收**：真实品牌产出 3 份 CSS；fixture 场景在引入第二品牌时补充。

### R7 状态进 URL

当前 theme、brand 写入 URL，刷新与分享后可复现同一视图。

**验收**：复制 URL 到新标签页打开，状态一致。

### R8 Color 页信息架构

页面自上而下：语义色（按用途分组）→ 语义组合预览 → 间距 → 圆角 → 排版 → 原始色阶（折叠）。

- 语义色分组固定为 Background / Text / Border / Action / Status，不按色相分组
- 有状态变体的 token 按状态并列展示（如 `bg` / `bg-hover` / `bg-pressed`），无变体的只显示默认态
- 组合预览用 token 驱动的静态预览块实现；S1 没有组件，不使用组件实例
- 间距 / 圆角 / 排版只展示语义项，按用途分组；语义项可复制变量名
- 原始色阶默认收起，不提供复制按钮

**验收**：分组与固定清单一致；状态行与产物中的 token 一一对应，不多不少；组合预览随 theme 切换重绘且无组件依赖；space / radius / typography 区块存在且值来自产物；原始色阶默认不可见且无复制入口。

### R9 非颜色基线

间距 / 排版 / 圆角进入同一套源文件与构建链路，消费方式与颜色一致（CSS 变量 + JSON）。

- 源值只定义一次，semantic 层只做别名
- 间距与圆角的角色、尺度与映射见 D12、D13
- 排版的组合与取值见 D9、D14
- 圆角基线包含 `none`（值为 0），用于直角场景；不在组件里写死 `border-radius: 0`
- token 名遵循 `tech-stack.md` §3.3 与 ADR-0009，不自行发明缩写
- 本期不建页面、不做组件消费

**验收**：非颜色 token 出现在 CSS 与 JSON 产物中；`semantic` 层无字面量；引用不存在的 token 时构建失败。

## 6. 非功能需求

- 构建可重复：同一输入两次构建产物完全一致
- 产物可读：CSS 变量按层分组，命名与 token 名一致
- 依赖锁定：解析相关依赖使用精确版本，不使用 `^`
- 单品牌：产物固定为 3 份，不预留多品牌配置项

## 7. 待输入

无。非颜色基线与品牌基色已全部确定（D12–D20、[ADR-0012](../adr/0012-brand-color-change.md)）。

另有一项未决，不阻塞 R1–R4：文档站样式方案（Tailwind v4 或原生 CSS），影响 R5 写法。

## 8. 完成的定义

R1–R9 全部通过 `validation.md` 的检查项，且 `tech-stack.md` 中与 token 相关的约束均有对应自动化检查。`validation.md` 需补上 R9 与状态展示对应的检查项。
