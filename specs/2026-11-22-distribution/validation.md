# Validation — 公共 npm 分发

> 对应规格：`requirements.md` · 状态：V1–V9、V11 通过，V12 文档通过，V10/V13 待首次发布 · 创建 2026-11-22
> 规则：每项必须有可复现命令与输出；真实安装验证在临时目录进行，不污染工作区。

## 1. 自动化检查

| # | 检查 | 命令 | 期望 |
| --- | --- | --- | --- |
| V1 | scope 残留 | `grep -rn '@ds/' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=specs .` | 无输出（`specs/` 下历史记录保持原样） |
| V2 | lockfile 一致 | `pnpm install --frozen-lockfile` | 退出 0 |
| V3 | ui 构建产物 | `pnpm --filter @ahomeyonglin/ui build` | `dist/components/<Name>/` 含 JS、`.d.ts`、`.css` |
| V4 | 发布文件清单 | `npm pack --dry-run`（tokens、ui 各一次） | 只含 `dist`、`registry.json`、`AGENTS.md` 等预期项，无 `src/*.tsx` |
| V5 | 版本与 tag 一致 | 发布脚本的版本校验用例 | tag 与版本不符时失败 |
| V6 | 发布幂等 | 用 stub `npm` 模拟「版本已存在 / 不存在」两个分支 | 已存在时跳过，不存在时调用 `npm publish` |
| V7 | tokens 引用面 | 文档站引用 `@ahomeyonglin/tokens/dist/*` | 构建通过 |
| V8 | 文档站回归 | `lint` / `test` / `build` | 全部退出 0 |
| V9 | 全量回归 | tokens test、ui lint/test/typecheck/build:registry | 全部退出 0，registry 无漂移 |

## 2. 人工验收

| # | 检查 | 操作 | 期望 |
| --- | --- | --- | --- |
| V10 | 公共可读 | 未登录 npm 的机器执行 `npm view @ahomeyonglin/tokens version` | 返回已发布版本 |
| V11 | 临时项目安装 | `pnpm init` 后安装两个包，Vite 渲染 `Button` | 构建通过，按钮颜色来自 token |
| V12 | 使用契约 | 只引入 `ui` 不引入 `tokens` CSS | 文档已明确说明会缺色，按文档补齐后正常 |
| V13 | 下游可回滚 | 临时项目锁回上一版本 | `pnpm install` 成功，无需改代码 |

## 3. 证据记录

| 项 | 证据 | 执行日期 | 结果 |
| --- | --- | --- | --- |
| V1 | 排除 `specs/` 后 `grep '@ds/'` 无输出；`scripts/lib/release.mjs` 的前缀校验同步改为 `@ahomeyonglin/` | 2026-11-22 | 通过 |
| V2 | `pnpm install --frozen-lockfile` 输出 Lockfile is up to date | 2026-11-22 | 通过 |
| V3 | `dist/components/` 下 5 个组件各有 `.js`、`.d.ts`、`.css`，共 15 个文件 | 2026-11-22 | 通过 |
| V4 | tokens 含 4 个 `dist` 文件 + `package.json`；ui 含 `dist/**`、`registry.json`、`AGENTS.md`，无 `src` | 2026-11-22 | 通过 |
| V5 | `node --test scripts/tests/release.test.mjs` 11 项通过，含 tag 不匹配 fixture | 2026-11-22 | 通过 |
| V6 | stub `npm` 模拟：版本存在时输出「已存在，跳过发布」，不存在时输出 `PUBLISH publish --access public` | 2026-11-22 | 通过 |
| V7 | 文档站构建通过，产物 CSS 含主题变量 | 2026-11-22 | 通过 |
| V8 | docs lint / test（16 项）/ build 全部通过 | 2026-11-22 | 通过 |
| V9 | tokens test（16 项）、ui lint（5 个组件）、ui test（14 项）、typecheck 通过；registry 重新生成后仅 `importPath` 变化 | 2026-11-22 | 通过 |
| V10 | 依赖首次真实发布，待 tag 推送后执行 | — | 待执行 |
| V11 | `npm pack` 两个 tarball → `/tmp/ds-l2` 安装 → Vite 构建成功（29 个模块，CSS 28.15 kB）→ 浏览器走完表单校验与提交 | 2026-11-22 | 通过（tarball 替代 registry） |
| V12 | `packages/ui/AGENTS.md §8` 已写明 CSS 引入顺序与缺色行为；未做缺色实测 | 2026-11-22 | 文档通过 |
| V13 | 需要两个已发布版本才能锁回，待首次发布后执行 | — | 待执行 |
