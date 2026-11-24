# Plan — Component Foundation

> 包名说明：文中 `@ds/*` 为当时的包名，已于 2026-11-22 改为 `@ahomeyonglin/*`（见 [ADR-0015](../adr/0015-public-npm-distribution.md)）。照抄命令时请替换包名。

> 对应规格：`requirements.md` · 状态：已完成 · 创建 2026-11-19
> 前置：S1 已合并（token 单一事实源、Color 页可用）；本计划不修改既有 token 值。

## 1. 实施顺序

按依赖排列，每步单独可验证。

| 步 | 内容 | 产出 | 验证 |
| --- | --- | --- | --- |
| P0 | 规格评审 | 本目录三件套定稿 | 决策无冲突，范围无遗漏 |
| P1 | 状态 token | `semantic.tokens.json` + `themes/dark.tokens.json` 新增 9 项，并调整浅色 `text.disabled` 一档 | 构建通过、快照更新、无字面量 |
| P2 | 包工程化 | `@ds/ui` 的 `exports`、peer 依赖、`typecheck`、`lint`、`test`、`build:registry` 脚本 | `pnpm --filter @ds/ui typecheck` 可运行 |
| P3 | 组件实现 | 五个组件三件套 | typecheck 通过，无 raw / hex |
| P4 | registry | `scripts/build-registry.mjs` + 提交 `registry.json` | 重复生成 diff 为空，排序稳定 |
| P5 | lint | `scripts/lint-components.mjs` + fixture | 故意违规返回非 0 |
| P6 | skill | `.trae/skills/component-sync/SKILL.md` | 按流程新增一个样例组件可走通 |
| P7 | 文档站接入 | `/color` 组合预览换真实组件，新增表单面板 | 主题切换组件跟随，无 hex |
| P8 | CI | `.github/workflows/ci.yml` | 手改 registry / 写死色值均失败 |
| P9 | 验收 | `validation.md` 证据齐全 | 全部通过并记录 |

## 2. 文件清单

**新增**

```
packages/ui/
├── src/components/Text/{Text.tsx,Text.css,component.meta.json}
├── src/components/Button/{Button.tsx,Button.css,component.meta.json}
├── src/components/TextField/{TextField.tsx,TextField.css,component.meta.json}
├── src/components/Card/{Card.tsx,Card.css,component.meta.json}
├── src/components/Badge/{Badge.tsx,Badge.css,component.meta.json}
├── src/types/css.d.ts
├── scripts/build-registry.mjs
├── scripts/lint-components.mjs
├── tests/lint.test.mjs
├── tests/fixtures/（违规样例）
├── tsconfig.json
└── registry.json（生成后提交）

.trae/skills/component-sync/SKILL.md
.github/workflows/ci.yml
```

**修改**

- `packages/tokens/src/semantic.tokens.json`：新增 9 个状态 token；浅色 `text.disabled` 改为 `neutral.500`
- `packages/tokens/src/themes/dark.tokens.json`：新增同名覆盖
- `packages/tokens/tests/snapshots/tokens.snapshot.json`：更新快照
- `packages/ui/package.json`：`exports`、`peerDependencies`、`devDependencies`、`scripts`
- `packages/ui/AGENTS.md`：按最终 API 与命令修订
- `apps/docs/package.json`：增加 `@ds/ui`
- `apps/docs/src/sections/ColorPage.tsx` / `color.css`：替换组合预览
- `specs/roadmap.md`：S2 组件数量与验收范围

## 3. 关键决策

1. **不建 comp token（D9）**：五个组件的所有取值都能被 `semantic` 表达，现在引入 `comp` 只是为了转手一次，违反「中间层不建」。
2. **disabled 文字复用全局（D8）**：三个变体的禁用文字一致，建 action 级 token 会得到三个同值 token。
3. **无依赖 lint（D13）**：与 tokens 包的 `node --test` 一致；stylelint 需要额外配置与插件才能表达「禁止 raw 变量」。
4. **子路径导出（D12）**：不建桶文件（`AGENTS.md` 已禁止），每个组件一个导出路径；CSS 由组件自身 import，Vite 与 tsc 分别用 `vite/client` 与 `src/types/css.d.ts` 兜底。
5. **尺寸例外（R5）**：边框与焦点轮廓的 1px / 2px 暂无 token 类别，lint 白名单只放行 `border-width`、`outline-width`、`outline-offset`，不做通用豁免。

## 4. 风险

| 风险 | 应对 |
| --- | --- |
| hover / disabled 档位观感不合适 | 已在规格阶段用 hex、对比度与 ΔE 实测过一轮；P1 产出后在 `/color` 再确认，只调 alias，不改 token 名 |
| 浅色 `text.disabled` 调整影响既有页面 | 只影响 Color 页的禁用文字示例与后续 Text 的 disabled tone；P7 一并检查 |
| `exports` 子路径在 tsc 与 Vite 下解析不一致 | P2 同时跑 `typecheck` 与 `docs build`，以两者都通过为准 |
| TextField 的 `useId` 与外部传入 `id` 冲突 | 以传入 `id` 优先；只在未传时生成 |
| lint 误伤合法写法 | fixture 覆盖正例与反例；白名单只按声明属性判断，不做文件级豁免 |
| registry 排序不稳定导致 diff 噪音 | 固定按 `id` 升序与固定字段顺序；P4 连续生成两次比对字节 |
| `/color` 换组件后与 S1 验收项冲突 | 组合预览仍是「token 驱动」，只是改为真实组件；V15 的联动要求不变 |

## 5. 回滚

- token：删除新增项并重跑 `UPDATE_SNAPSHOT=1 pnpm --filter @ds/tokens test`，回到 S1 产物。
- 组件：删除 `src/components/<Name>` 并重新生成 registry；`registry.json` 随脚本回退。
- 文档站：`ColorPage` 的组合预览可单独还原，不影响 token 页其它区块。

## 6. 不在本计划内

`/components` 页面、page-assembly、npm 发布、changelog、视觉回归、第二个品牌、Input 之外的控件、elevation / border-width token 化。
