# AGENTS.md — @ahomeyonglin/ui 组件使用与新增规则

本文件约束 `packages/ui` 内的所有工作。根目录 `AGENTS.md` 的规则同样有效，冲突时以本文件为准（更具体）。

## 1. 定位

组件库的核心产物不是代码，而是**可被 AI 检索的能力清单**。代码能用但 `registry.json` 里查不到，等于组件不存在。

## 2. 必读顺序

写任何组件代码之前，按顺序读：

1. `registry.json` —— 现有组件、props、可用变体
2. 目标组件的 `component.meta.json` —— 精确的 API 与依赖 token
3. 根 `specs/tech-stack.md §4` —— 目录与命名约定

**不要跳过第 1 步直接写代码。** 需要的能力可能已有组件，也可能只差一个变体。

## 3. 目录结构

```
src/components/<PascalCase>/
├── <PascalCase>.tsx
├── <PascalCase>.css        # 只引用语义 token 变量
└── component.meta.json     # 名称、props、变体、依赖的 token
```

- 目录与文件一律 PascalCase，一个组件一个目录，不建 `index.ts` 桶文件。
- `component.meta.json` 与实现同目录，不允许集中放在别处。
- 组件间不互相 import 实现细节；共享逻辑抽到 `src/lib`，不抽公共组件（除非已有 registry 条目）。

## 4. 硬规则

1. 只使用 `registry.json` 中存在的组件；缺能力时先补组件，不要在页面里内联实现。
2. 样式只引用语义 token 变量，禁止 hex、禁止写死 px 间距与圆角。
3. 禁止直接引用 core 层（`raw.color.red.500` 这类），只用 `semantic` / `comp`。
4. 禁止手改 `registry.json`；改动后运行 `pnpm --filter @ahomeyonglin/ui build:registry`。
5. 组件不承载业务逻辑，不发起请求，不含文案常量。
6. 变体只做真实存在的需求，不预埋 `size="xl"` 这类无人使用的取值。
7. 禁止消费带 `$deprecated` 的 token；lint 同时检查组件样式与 `component.meta.json`。

## 5. 新增组件的流程

按 `.trae/skills/component-sync/SKILL.md` 执行，不要凭经验自由发挥。最少包含：

1. 确认 registry 中确实没有可复用能力
2. 建目录与三个文件
3. 写实现与样式（只用 token 变量）
4. 写 `component.meta.json`，字段齐全，`$description` 写清「什么时候用」
5. 重新生成 `registry.json` 并检查 diff 是否只包含预期变更
6. 跑 lint，确认没有硬编码值与 `raw` token 引用

## 6. registry.json 规则

- 由脚本生成，**生成后提交入库**，与代码同版本可追溯。
- 字段与排序固定，保证 diff 稳定；排序变化视为脚本 bug，不是内容变更。
- CI 会用 `git diff --exit-code` 校验漂移，本地忘记重新生成会直接失败。
- 新增组件的描述文字写给 AI 看：说清使用场景，而不是外观。

## 7. 不要做

- 不要在组件里写死任何视觉值，哪怕只出现一次。
- 不要引入第三方 UI 库来「省事」。
- 不要新增文档说明组件怎么用——用法属于 `registry.json` 与 `component.meta.json`。
- 不要为了让某个页面好看而单独定制某个组件；那是变体或新组件的决策，需要先确认。

## 8. 发布产物与下游接入

- 发布内容来自 `pnpm --filter @ahomeyonglin/ui build` 生成的 `dist`；`dist` 不入库，不手改。
- 新增组件时同步 `package.json` 的 `exports`：`"./<PascalCase>"` 的 `types` 指向 `dist/components/<PascalCase>/<PascalCase>.d.ts`，`default` 指向同名 `.js`。
- 下游安装后必须自行引入 tokens 的 CSS，顺序为 `theme-light.css` → `theme-dark.css` → `brand-*.css`。
- `ui` 不声明对 `tokens` 的依赖；缺 CSS 时组件不报错但会失去颜色，这是预期行为。
