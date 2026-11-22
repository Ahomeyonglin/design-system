# Requirements — Component Foundation

> 包名说明：文中 `@ds/*` 为当时的包名，已于 2026-11-22 改为 `@ahomeyonglin/*`（见 [ADR-0015](../adr/0015-public-npm-distribution.md)）。照抄命令时请替换包名。

> 阶段：S2 · 状态：待评审（v0.1）· 创建 2026-11-19
> 上游约束：`specs/mission.md`、`specs/tech-stack.md`、`specs/roadmap.md`

## 1. 问题

S1 交付了 token 的单一事实源，但下游仍然无法使用：

| 现状 | 后果 |
| --- | --- |
| `packages/ui` 只有 `AGENTS.md`，组件为空 | AI 无组件可用，只能内联实现，产出不可控 |
| 没有 `registry.json` | AI 无法检索现有能力，每次重新发明按钮与输入框 |
| action 只有默认态，无 `border.focus` | Button 无 hover / disabled / 焦点反馈，不能进真实页面 |
| `@ds/ui` 无 `exports`、无 peer 依赖 | 组件即使写出来也无法被 import |
| `/color` 组合预览是手写假按钮 | 语义色放进真实组件后的观感从未被验收 |

## 2. 目标

让组件成为 **AI 能检索、人能验收、CI 能校验** 的单元：

1. 五个原子组件可被 workspace 内消费，且只消费 `semantic` token。
2. `registry.json` 成为组件的唯一检索入口，固定字段与排序，生成后提交。
3. 组件的授权与新增流程固化到 `component-sync` skill。
4. `/color` 的组合预览改为真实组件，作为 S2 的视觉验收入口。

## 3. 已定决策

2026-11-19 讨论确认，后续实现以此为准：

| # | 决策 | 结论 |
| --- | --- | --- |
| D1 | 组件集 | 五个：`Text` / `Button` / `TextField` / `Card` / `Badge`，类别依次为 `text` / `action` / `form` / `container` / `marker` |
| D2 | Button 能力 | 只做 `primary` / `secondary` / `ghost` 三变体 + `disabled`；不做 `loading`、`iconOnly`、`size` |
| D3 | TextField 形态 | 含 `label` / `description` / `error` 的完整表单域；单行、受控、`type` 透传；不做 textarea、前后缀图标、size |
| D4 | Text 职责 | 只承载排版组合与文字颜色，不承担布局；`as` 限定为 `span` / `p` / `h1` / `h2` / `h3`，标签语义由 TextField 自己处理 |
| D5 | Card 职责 | 只做描边容器，不引入 elevation；除 `children` 外不提供其他 prop |
| D6 | Badge 职责 | 五档 `tone`：`neutral` / `info` / `success` / `warning` / `danger`；只做静态标记，不可点击、不可关闭 |
| D7 | 交互状态 token | 补 hover 与 disabled 的 action token、`border.focus`、`border.invalid`；**pressed 不做** |
| D8 | disabled 文字 | 不建 action 级 disabled 文字 token，统一复用 `semantic.color.text.disabled` |
| D9 | comp 层 | 本阶段不创建任何 `comp` token；组件直接消费 `semantic`，`comp` 只在确有独立调整需求时再引入 |
| D10 | 组件目录 | 固定三件套：`<Name>.tsx`、`<Name>.css`、`component.meta.json`；目录 PascalCase，不建桶文件 |
| D11 | 组件 API | 不提供 `className` / `style`；能力和外观只用语义化枚举 prop 表达；不预埋无人使用的取值 |
| D12 | 消费方式 | `@ds/ui` 暴露子路径导出（`@ds/ui/Button` 等），每个组件自行 import 自己的 CSS；React 作为 peer 依赖（`^19`） |
| D13 | lint 实现 | 无依赖 Node 脚本 + `node --test` fixture，与 tokens 包一致；不引入 stylelint / eslint |
| D14 | CI 时机 | S2 就建最小 workflow：tokens test、ui lint、registry 漂移、docs 构建 |
| D15 | 视觉验收 | `/color` 的组合预览换成真实组件，并新增表单面板；不新增组件地图或详情页 |
| D16 | 演进原则 | 新增可选 prop 属于非破坏性变更，可在后续组件需求出现时再补；S2 只做当前真实需要 |

## 4. 范围

**做**

- `semantic` 层补 9 个颜色 token（见 R1），并调整浅色 `text.disabled` 一档，重建产物并更新快照
- 五个组件 + `component.meta.json`
- `packages/ui` 工程化：`exports`、peer 依赖、`build:registry`、`lint`、`typecheck`
- `registry.json` 生成并提交
- `component-sync` skill 的可执行规则
- `apps/docs` 接入真实组件，替换组合预览中的手写块
- 最小 CI workflow

**不做**

- `/components` 组件地图与组件详情页
- page-assembly skill 与真实页面样板
- npm 发布
- changelog 自动生成、semver 流程
- 视觉回归基线
- 第二个品牌、Input 之外的其它表单控件
- 对 S1 既有 token 值做任何改动

## 5. 功能需求

### R1 交互状态 token

在 `packages/tokens/src/semantic.tokens.json` 增加以下 9 个 token，并在 `themes/dark.tokens.json` 写同名覆盖。所有值必须是 alias，不得写字面量。

| token | light | dark | 用途 |
| --- | --- | --- | --- |
| `semantic.color.action.primary.bg-hover` | `raw.color.brand.600` | `raw.color.brand.600` | 主操作悬停背景 |
| `semantic.color.action.primary.border-hover` | `raw.color.brand.600` | `raw.color.brand.600` | 主操作悬停边框，与背景同步 |
| `semantic.color.action.secondary.bg-hover` | `raw.color.neutral.300` | `raw.color.neutral.800` | 次操作悬停背景 |
| `semantic.color.action.ghost.bg-hover` | `raw.color.neutral.300` | `raw.color.neutral.900` | 弱操作悬停背景 |
| `semantic.color.action.primary.bg-disabled` | `raw.color.neutral.300` | `raw.color.neutral.800` | 主操作禁用背景 |
| `semantic.color.action.primary.border-disabled` | `raw.color.neutral.300` | `raw.color.neutral.800` | 主操作禁用边框 |
| `semantic.color.action.secondary.border-disabled` | `raw.color.neutral.300` | `raw.color.neutral.700` | 次操作禁用边框 |
| `semantic.color.border.focus` | `raw.color.brand.500` | `raw.color.brand.300` | 焦点指示 |
| `semantic.color.border.invalid` | `raw.color.danger.700` | `raw.color.danger.200` | 校验失败边框 |

补充约定：

- 次操作禁用态背景与默认态一致，不新增 `secondary.bg-disabled`。
- 弱操作禁用态只改文字颜色，不加背景与边框 token。
- 焦点指示用 `outline` 表达，颜色取 `border.focus`；`primary` / `secondary` / `ghost` 与 TextField 共用同一颜色。
- hover 档位按实测确定：深色 primary 用 `brand.600` 保证白字对比 6.73（`brand.400` 仅 3.17，不合格）；浅色 secondary / ghost 用 `neutral.300`，与默认背景的色差分别为 5.2 / 4.2；深色 ghost 用 `neutral.900`，与浅色 4.2 的强度对齐。

**既有值调整（唯一一处）**：浅色 `semantic.color.text.disabled` 从 `raw.color.neutral.400` 调整为 `raw.color.neutral.500`。原值在白底对比 1.75、在禁用按钮底 `#e6e6e6` 上仅 1.40，文字几乎不可读；调整后分别为 2.88 / 2.31。深色保持 `neutral.600` 不变。该改动需要更新 hex 快照。

**验收**：9 个新 token 在 light / dark 两个组合中均可解析；`text.disabled` 浅色值为 `neutral.500`、深色不变；未更新快照时测试失败；`themes/dark.tokens.json` 中无字面量颜色。

### R2 组件结构

```
packages/ui/src/components/<PascalCase>/
├── <PascalCase>.tsx        # 实现，import 同目录 CSS
├── <PascalCase>.css        # 只引用 --semantic-* 变量
└── component.meta.json     # 名称、类别、$description、props、依赖 token
```

**验收**：五个目录齐全；每个目录恰好三个文件；不存在 `index.ts` / `index.tsx`。

### R3 组件 API

以下为接口层契约，TypeScript 类型写法与内部结构由实现决定。

**Text**

| prop | 取值 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `variant` | `display.lg` \| `heading.md` \| `body.md` \| `body.sm` \| `label.md` \| `code.md` | 否 | `body.md` | 对应 `semantic.text.*` 组合 |
| `tone` | `primary` \| `secondary` \| `tertiary` \| `disabled` | 否 | `primary` | 对应 `semantic.color.text.*` |
| `as` | `span` \| `p` \| `h1` \| `h2` \| `h3` | 否 | `span` | 语义标签 |
| `children` | `ReactNode` | 是 | — | 文本内容 |

**Button**

| prop | 取值 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `variant` | `primary` \| `secondary` \| `ghost` | 否 | `primary` | 操作优先级 |
| `type` | `button` \| `submit` \| `reset` | 否 | `button` | 原生按钮类型 |
| `disabled` | `boolean` | 否 | `false` | 禁用态 |
| `onClick` | `() => void` | 否 | — | 点击回调 |
| `children` | `ReactNode` | 是 | — | 按钮文字 |

**TextField**

| prop | 取值 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `label` | `string` | 是 | — | 标签文字，渲染为 `label[for]` |
| `description` | `string` | 否 | — | 帮助文本，`error` 存在时不显示 |
| `error` | `string` | 否 | — | 错误文案，存在时进入 invalid 状态 |
| `type` | `text` \| `password` \| `email` \| `number` \| `search` \| `tel` \| `url` | 否 | `text` | 输入类型 |
| `value` | `string` | 是 | — | 受控值 |
| `onChange` | `(value: string) => void` | 是 | — | 值变化回调 |
| `placeholder` | `string` | 否 | — | 占位提示，不能替代标签 |
| `disabled` | `boolean` | 否 | `false` | 禁用态 |
| `required` | `boolean` | 否 | `false` | 只透传原生 `required`，不渲染星号 |
| `name` | `string` | 否 | — | 表单字段名 |
| `id` | `string` | 否 | 自动生成 | 外部不传时用 `useId` 生成 |

无障碍接线由组件负责：`label` 的 `for` 指向输入框，`description` / `error` 通过 `aria-describedby` 关联，invalid 时设置 `aria-invalid="true"`。

**Card**

| prop | 取值 | 必填 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | 是 | 卡片内容 |

**Badge**

| prop | 取值 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `tone` | `neutral` \| `info` \| `success` \| `warning` \| `danger` | 否 | `neutral` | 状态语义 |
| `children` | `ReactNode` | 是 | — | 标记文字 |

所有组件均不提供 `className`、`style`、`size`。

**验收**：registry 中 props 与本表一致，不多不少；组件 TSX 中不存在 `className` / `style` 作为对外 prop。

### R4 registry.json

`packages/ui/scripts/build-registry.mjs` 扫描 `src/components/*/component.meta.json`，聚合为 `packages/ui/registry.json`。

固定结构：

```json
{
  "schemaVersion": 1,
  "generatedFrom": "src/components/*/component.meta.json",
  "components": [
    {
      "id": "Badge",
      "name": "Badge",
      "category": "marker",
      "importPath": "@ds/ui/Badge",
      "$description": "用于表达状态或分类的静态标记。",
      "props": [
        {
          "name": "tone",
          "type": "\"neutral\" | \"info\" | \"success\" | \"warning\" | \"danger\"",
          "required": false,
          "defaultValue": "\"neutral\"",
          "description": "状态语义。"
        }
      ],
      "tokens": ["semantic.color.status.info.bg"]
    }
  ]
}
```

- `components` 按 `id` 升序；`props` 按声明顺序；`tokens` 按字母升序。
- 输出 2 空格缩进、UTF-8、末尾换行；连续生成两次字节一致。
- meta 中 `id` / `importPath` 不重复填写：`id` 取目录名，`importPath` 由脚本拼为 `@ds/ui/<id>`。
- `registry.json` 生成后提交，CI 用 `git diff --exit-code` 拦截漂移。

**验收**：五个组件出现在 registry 中且排序正确；手改 registry 后 CI 失败；重复生成 diff 为空。

### R5 组件 lint

`packages/ui/scripts/lint-components.mjs` 扫描 `src/**`，逐条报出文件与行号：

| 规则 | 判定 |
| --- | --- |
| 禁颜色字面量 | CSS / TSX 中出现 hex、`rgb()`、`hsl()`、`oklch(` 即失败 |
| 禁 raw 消费 | 出现 `--raw-` 或 `raw.` 即失败 |
| 禁写死间距 | `padding` / `margin` / `gap` / `border-radius` / `font-size` / `line-height` / `font-weight` 中出现非 `var()` 的字面量即失败 |
| 尺寸例外 | 仅允许 `border-width`、`outline-width`、`outline-offset` 使用字面量 px |
| 禁内联样式 | TSX 中出现 `style=` 或 props 类型含 `className` / `style` 即失败 |
| meta 完整性 | 字段缺失、`props` 条目缺项、`tokens` 前缀不是 `semantic.` / `comp.` 即失败 |
| 目录完整性 | 组件目录缺三件套之一即失败 |

**验收**：在 fixture 中分别注入写死色值、`--raw-*` 引用、写死 padding，lint 均以非 0 退出并指出问题行；正常组件通过。

### R6 component-sync skill

`.trae/skills/component-sync/SKILL.md` 至少包含：

1. 写组件前的检索顺序（registry → meta → AGENTS）
2. 新增 / 修改组件的步骤：三件套 → meta → 重新生成 registry → lint → 自检 diff
3. 变更影响面：props / 变体变化必须同步 meta 与 registry，并判断是否破坏性
4. 禁止事项：手改 registry、跳过 lint、为单页定制组件、自动更新视觉基线

**验收**：按 SKILL.md 从零走一遍新增流程，产出符合本规格。

### R7 文档站接入

`apps/docs` 增加 `@ds/ui` 依赖，组合预览改为真实组件：

| 原面板 | 改为 |
| --- | --- |
| Action（`demo-button`） | `Button` 的 primary / secondary / ghost + disabled |
| Status（`demo-status`） | `Badge` 的五个 tone |
| Text（`demo-text`） | `Text` 的主要排版组合 |
| 新增 | `TextField` 的默认 / 错误 / 禁用三个示例 |
| Border | 保持色块展示，不引入组件 |

- 删除 `demo-button` / `demo-status` / `demo-text` 等手写样式，避免出现两套真相。
- 切换 theme / brand 时组件跟随变化，因此组件样式必须只引用变量。
- 页面源码仍不得出现 hex。

**验收**：`/color` 中组合预览全部为真实组件；切换主题后组件颜色与边框同步变化；`grep` 不到 hex；页面无第二套手写按钮样式。

### R8 最小 CI

`.github/workflows/ci.yml` 在 push 与 PR 时执行：

1. `pnpm install --frozen-lockfile`
2. `pnpm --filter @ds/tokens build`
3. `pnpm --filter @ds/tokens test`
4. `pnpm --filter @ds/ui lint`
5. `pnpm --filter @ds/ui typecheck`
6. `pnpm --filter @ds/ui build:registry` 后 `git diff --exit-code packages/ui/registry.json`
7. `pnpm --filter @ds/docs build`

**验收**：故意手改 `registry.json` 或写死一个色值，PR 检查失败；正常提交通过。

### R9 不变量

- 组件源码不出现 `--raw-*` / `raw.*`。
- 组件样式全部来自 `--semantic-*`。
- `registry.json` 只能由脚本产出。
- 组件不 import 其它组件的实现；需要复用排版时直接消费变量。
- 不修改 S1 既有 token 值，只新增；唯一例外是 R1 中浅色 `text.disabled` 的调整。

## 6. 待输入

| 问题 | 处理 |
| --- | --- |
| hover / disabled 的具体档位是否观感合适 | 本规格给出初值，P1 产出后由用户看 `/color` 确认，必要时只调 alias 不改变量名 |
| TextField 输入框宽度 | 组件不设固定宽度，由使用方容器决定；S2 不引入宽度 token |
