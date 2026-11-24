---
name: component-sync
description: 在 @ahomeyonglin/ui 中新增或修改组件时使用。规定检索顺序、三件套与 meta 写法、registry 重新生成、lint 与破坏性变更判断，避免组件与 registry 脱节。
---

# component-sync

适用范围：`packages/ui` 下的组件新增、修改、删除。token 变更不属于本 skill，走 tokens 包的构建与快照流程。

## 1. 写代码之前

按顺序读取，不允许跳过：

1. `packages/ui/registry.json` —— 是否已有能覆盖需求的能力；缺的是组件还是某个变体。
2. 目标组件或最接近组件的 `component.meta.json` —— 精确 props、默认值、依赖 token。
3. `packages/ui/AGENTS.md` 与 `specs/tech-stack.md §4` —— 目录与命名约定。

结论只有三种：复用现有组件、给现有组件扩变体、新增组件。前两种不需要新建目录。

## 2. 新增组件

1. 建目录 `src/components/<PascalCase>/`，只放三件套：
   - `<PascalCase>.tsx`：实现，顶部 `import './<PascalCase>.css'`。
   - `<PascalCase>.css`：只引用 `--semantic-*` / `--comp-*`；边框与焦点轮廓的 1px / 2px 是唯一允许的字面量尺寸。
   - `component.meta.json`：`name`、`category`、`$description`、`props`、`tokens`。
2. 实现规则：
   - 不对外暴露 `className` / `style` / `size`；变体用语义化枚举 prop，样式用 `data-*` 属性选择器。
   - 组件之间不互相 import；需要相同排版时直接消费同一批变量。
   - 不加载业务逻辑、不发请求、不内置文案。
3. 在 `packages/ui/package.json` 的 `exports` 增加 `"./<PascalCase>"`：`types` 指向 `./dist/components/<PascalCase>/<PascalCase>.d.ts`，`default` 指向 `./dist/components/<PascalCase>/<PascalCase>.js`。
4. 写 `component.meta.json`：
   - `props` 保持 API 表的声明顺序，每项含 `name`、`type`、`required`、`description`，有默认值才写 `defaultValue`。
   - `tokens` 列出实现真正消费的 token，前缀必须是 `semantic.` 或 `comp.`。
5. 重新生成 registry：
   ```bash
   pnpm --filter @ahomeyonglin/ui build:registry
   ```
   检查 diff：只应出现新组件，`components` 保持 id 升序，既有组件无变化。
6. 严格类型检查与 lint：
   ```bash
   pnpm --filter @ahomeyonglin/ui typecheck
   pnpm --filter @ahomeyonglin/ui lint
   ```
7. 自检 diff：`registry.json` 与三件套必须同一次提交；不夹带无关改动。

## 3. 修改组件

1. 改实现与样式。
2. 同步 `component.meta.json` 的 props、默认值、token 列表。
3. 重新生成 registry 并检查 diff 只包含目标组件。
4. 跑 `typecheck` 与 `lint`。

## 4. 变更影响面

| 改动 | 必须同步 | 破坏性判断 |
| --- | --- | --- |
| 新增可选 prop / 变体取值 | meta → registry | 非破坏性 |
| 删除或重命名 prop / 变体取值 | meta → registry | 破坏性，需先确认并在提交说明中标注 |
| 默认值变化 | meta → registry | 视为行为变更，需在提交说明中写明 |
| 依赖 token 增删 | meta 的 `tokens` | 非破坏性，但需确认 token 真实存在 |
| 仅样式内部调整 | 无 | 非破坏性 |

破坏性变更不自行决定：先与使用者确认，再按 `specs/2026-11-22-semver-and-release/requirements.md` 判定并在提交说明中标出。两个包已公开发布，新增或修改组件必须发版，下游才能拿到。

## 5. 禁止

- 手改 `registry.json`，或提交与源码不一致的 registry。
- 跳过 `lint` / `typecheck` 就宣称完成。
- 为一个页面单独定制组件；那属于变体或新组件的决策，需要先确认。
- 在组件里写死颜色、间距、字号、圆角，或引用 `--raw-*` / `raw.*`。
- 建桶文件、集中存放 meta、自动更新视觉基线。

## 6. 完成判定

三件套齐全、meta 与实现一致、registry 已重新生成且 diff 可读、`typecheck` 与 `lint` 均通过。缺一项都算未完成。
