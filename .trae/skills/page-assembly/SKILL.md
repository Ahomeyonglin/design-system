---
name: page-assembly
description: 在文档站或产品应用中组装页面时使用。规定需求拆解、必读顺序、组件选择、布局与验证命令，避免页面内联实现、硬编码样式与臆造组件。
---

# page-assembly

适用范围：用 `@ahomeyonglin/ui` 的既有组件与 `@ahomeyonglin/tokens` 的语义 token 组装一个页面。新增组件不属于本 skill，走 `component-sync`。

## 1. 输入解析

先把需求拆成三类，再选组件：

1. **区块**：页头、表单区、操作区、危险操作区等。
2. **数据**：只读展示、受控输入、本地状态。明确哪些交互只改本地展示。
3. **交互**：保存 / 取消 / 归档等，逐个对应到组件能力。

结论先写成区块清单，不允许一边写 JSX 一边决定结构。

## 2. 必读顺序

按顺序读取，不允许跳过：

1. `packages/ui/registry.json` —— 是否存在能覆盖需求的组件与变体。
2. 目标组件的 `component.meta.json` —— 精确 props、默认值与依赖 token。
3. `packages/ui/AGENTS.md` —— 组件使用与新增规则。
4. `specs/tech-stack.md §5` —— 文档站定位、路由与呈现约定。
5. `packages/tokens/dist/tokens.json` —— 需要展示的 token id 与解析值。

## 3. 组装步骤

1. **定路由与状态**：页面路径、需要的查询参数与本地状态；状态不放进组件内部。
2. **选组件**：复用优先，按第 5 节映射；缺失能力先停下走 `component-sync`。
3. **搭骨架**：只用 CSS Grid / Flex 与 `semantic.space.*`，布局常量引用 `--docs-*`（文档站内）。
4. **接内容**：文案直接写在页面，不抽公共常量、不做 i18n。
5. **自检**：只出现 registry 组件；无 hex / `raw` / 写死间距；交互控件与组件语义一致。

## 4. 输出位置

- 目标应用的页面目录；页面文件与样式文件同目录，样式不复制组件内部规则。
- 本仓库样板：`apps/docs/src/examples/ProjectSettingsPage.tsx` 与 `apps/docs/src/examples/project-settings.css`。
- 新路由要同时登记两处：`apps/docs/src/router.ts` 的路由表与 `apps/docs/src/layout/Sidebar.tsx` 的导航入口。
- 样板页不在页面内重写按钮、输入框等组件样式。

## 5. 选择规则

| 需求 | 组件 |
| --- | --- |
| 标题 / 正文 / 标签 / 代码 | `Text` |
| 触发操作 | `Button` |
| 文本输入 | `TextField` |
| 内容分区 | `Card` |
| 状态 / 分类标记 | `Badge` |

- 组件未覆盖的形态（图标按钮、分段切换）只允许出现在文档站外壳 `src/layout` / `src/search` / `src/ui`；产品页面不得自建。
- 若某个零件被第二个产品页面复用，先走 `component-sync` 升级为正式组件。

## 6. 输出约束

- 页面只能组合 `registry.json` 中已有的组件，禁止内联实现。
- 颜色、间距、字号、行高、字重、字距、圆角只引用 `--semantic-*`。
- 禁止 hex、`rgb()`、`hsl()`、`oklch()`，禁止 `raw.*` 与 `--raw-*`。
- 内联样式只允许注入 CSS 自定义属性（`--*`），不得写视觉属性。
- 布局尺寸引用 `--docs-*`，不写 `px` / `vh` 字面量。
- 不复制组件样式；不为单页定制组件；不改 `registry.json`。

## 7. 验证命令

```bash
pnpm --filter @ahomeyonglin/docs lint
pnpm --filter @ahomeyonglin/docs test
pnpm --filter @ahomeyonglin/docs build
grep -rnE "#[0-9a-fA-F]{3,8}\b" apps/docs/src
grep -rnE "(^|[^a-zA-Z])raw\." apps/docs/src
grep -rnE "[0-9]+px" apps/docs/src --exclude=layout.css
```

浏览器验收：切主题整页跟随、保存 / 取消 / 归档行为符合需求、无组件样式重复。

## 8. 禁止事项

- 为单个页面定制或新建组件，或修改 registry 来「让页面能跑」。
- 跳过 lint / test / build 直接宣称完成。
- 自动更新视觉基线；文档站不做视觉回归自动化。
- 在页面里复刻 `Button`、`TextField` 等已有组件的样式。

## 9. 参考产物

`apps/docs/src/examples/ProjectSettingsPage.tsx` 是按本 skill 组装的样板：五类组件、本地状态、语义间距，无颜色与间距的手工修改。改动样板前先确认它仍满足 R12。
