# Validation — Governance：CI 门禁与变更日志

> 包名说明：文中 `@ds/*` 为当时的包名，已于 2026-11-22 改为 `@ahomeyonglin/*`（见 [ADR-0015](../adr/0015-public-npm-distribution.md)）。照抄命令时请替换包名。

> 对应规格：`requirements.md` · 状态：已验证（v0.3）· 创建 2026-11-20 · 更新 2026-11-20
> 规则：每一项必须有可复现的证据（命令输出、CI 运行链接、diff），不接受「看起来没问题」。

## 1. 自动化检查

| # | 检查 | 命令 | 期望 |
| --- | --- | --- | --- |
| V1 | 提交标题正例 | `node --test scripts/tests/` | 规范标题全部通过，含中文、带 scope、带 `!` |
| V2 | 提交标题反例 | `node --test scripts/tests/` | 缺 type、非法 type、非法 scope、缺空格、超长、空 subject 分别失败并指到 SHA；`Merge` / `Revert` / `fixup!` 豁免通过 |
| V3 | CHANGELOG 分组 | `node --test scripts/tests/` | `feat` → Added，`fix` → Fixed，`perf` / `refactor` → Changed；`docs` / `style` / `chore` 不出现；破坏性变更进入独立小节 |
| V4 | 生成幂等 | `pnpm changelog:write && git diff --exit-code CHANGELOG.md` | 连续两次写入无 diff |
| V5 | 过期拦截 | 手工篡改 `[Unreleased]` 后执行 `pnpm changelog:check` | 退出非 0，打印期望区块前 20 行与差异提示 |
| V6 | 历史区块冻结 | 篡改 `[Unreleased]` 后执行 `pnpm changelog:write` 再 diff | 0.0.0 及更早区块字节不变 |
| V7 | token 引用方向 | `pnpm --filter @ds/tokens test` | 现有 token 通过；`raw→semantic`、`semantic→comp`、`comp→raw` 三类 fixture 失败并指出 token 路径 |
| V8 | 全链路回归 | `pnpm --filter @ds/tokens test && pnpm --filter @ds/ui lint && pnpm --filter @ds/ui test && pnpm --filter @ds/docs lint && pnpm --filter @ds/docs test` | 全部退出 0 |
| V9 | CI 接入 | 检查 `.github/workflows/ci.yml` | `checkout` 含 `fetch-depth: 0`；G1–G5 五步存在；原步骤未删减 |
| V10 | 带 base 构建 | `VITE_BASE=/design-system/ pnpm --filter @ds/docs build` | `tsc --noEmit` 与 Vite 构建通过 |
| V11 | 无新增依赖 | `git diff main -- package.json pnpm-lock.yaml` | 仅根 `scripts` 字段变化；`packageManager` 与依赖树不变 |
| V12 | 本地默认范围 | 在干净 HEAD 执行 `pnpm commit:check` | 只校验最近一条提交，不因历史提交失败 |

## 2. 人工验收

| # | 检查 | 操作 | 期望 |
| --- | --- | --- | --- |
| V13 | 基线 tag | `git tag -l` 与 `git rev-parse v0.0.0` | 存在 `v0.0.0`，指向历史迁移提交 |
| V14 | 迁移一致性 | 对比迁移前后 `CHANGELOG.md` | 原 `[Unreleased]` 条目逐条出现在 `## [0.0.0] - 2026-11-20`，文案未改 |
| V15 | 文档站渲染 | 打开 `/changelog`（dev 与线上） | 显示 0.0.0 历史区块与新的 Unreleased；无 `##`、`-`、反引号泄漏 |
| V16 | 反例演练 | 临时分支提交一条 `update something`（或 PR 中构造同类提交） | `pnpm commit:check <range>` 非 0 并指出该提交；修正后通过 |
| V17 | 规则可执行 | 按 `AGENTS.md` 命令表逐条执行 | 三条脚本命令可直接运行，输出与文档描述一致 |
| V18 | 文档站与治理解耦 | `git diff --stat` 检查本阶段改动 | 不含 `apps/docs/src/**`、`packages/ui/src/**`、token 值变化 |

## 3. 证据记录

| 项 | 证据 | 执行日期 | 结果 |
| --- | --- | --- | --- |
| V1 | `node --test scripts/tests/`：11 个用例通过，含中文、scope、`!` 正例 | 2026-11-20 | 通过 |
| V2 | 同一命令：缺 type、非法 type、非法 scope、缺空格、超长、空 subject 均返回原因；`Merge` / `Revert` / `fixup!` / `squash!` 豁免通过 | 2026-11-20 | 通过 |
| V3 | 同一命令：`feat` → Added、`fix` → Fixed、`perf` / `refactor` → Changed；`docs` / `chore` 被跳过；破坏性统一进入 Changed 并带「破坏性：」前缀 | 2026-11-20 | 通过 |
| V4 | 连续执行两次 `pnpm changelog:write`，第二次输出「CHANGELOG.md 已是最新」，`diff` 为空 | 2026-11-20 | 通过 |
| V5 | feat 提交后执行 `pnpm changelog:check`：退出 1，输出期望区块前 20 行并提示运行 `changelog:write`；写入后校验通过 | 2026-11-20 | 通过 |
| V6 | `git diff 0f3a8a7 -- CHANGELOG.md` 仅 Unreleased 区块变化，`## [0.0.0]` 及更早内容无 diff；单测覆盖「写入两次字节一致」 | 2026-11-20 | 通过 |
| V7 | `pnpm --filter @ds/tokens test`：11 个用例通过；三类越层引用 fixture 分别失败并指出 token 路径 | 2026-11-20 | 通过 |
| V8 | tokens test、ui lint/test、docs lint/test 全部退出 0 | 2026-11-20 | 通过 |
| V9 | CI 运行 <https://github.com/Ahomeyonglin/design-system/actions/runs/44762869445>：`Check commit messages`、`Check changelog freshness`、`Check generated files are not tracked`、`Build docs with pages base` 与 `Test tokens` 全部 success | 2026-11-20 | 通过 |
| V10 | `pnpm --filter @ds/docs build` 与 `VITE_BASE=/design-system/ pnpm --filter @ds/docs build` 均成功 | 2026-11-20 | 通过 |
| V11 | `git diff 0f3a8a7..HEAD -- package.json` 仅新增 `scripts` 三条；`pnpm-lock.yaml` 无变化 | 2026-11-20 | 通过 |
| V12 | `pnpm commit:check` 默认范围输出「提交信息校验通过（1 条）」 | 2026-11-20 | 通过 |
| V13 | 本地 `git tag -l` 与远端 `git ls-remote --tags` 均含 `v0.0.0`，指向迁移提交 `0f3a8a7` | 2026-11-20 | 通过 |
| V14 | 迁移为纯移动：原 Unreleased 条目全部出现在 `## [0.0.0] - 2026-11-20`，文案未改 | 2026-11-20 | 通过 |
| V15 | `docs build` 通过；生成结构仅用 `##` / `###` / 列表 / 段落，落在 `parseChangelog` 已支持语法内；线上 <https://ahomeyonglin.github.io/design-system/changelog> 产物包含「引入提交规范与变更日志生成」与 `0.0.0` 区块 | 2026-11-20 | 通过 |
| V16 | 临时分支提交 `update something` 后执行 `pnpm commit:check v0.0.0..HEAD`：退出 1 并指出该提交；分支已删除。CI 端同一命令在 run 44762869445 中通过，红例由本地演练覆盖 | 2026-11-20 | 通过 |
| V17 | `pnpm commit:check`、`pnpm changelog:write`、`pnpm changelog:check` 三条命令实测输出与 AGENTS.md 描述一致 | 2026-11-20 | 通过 |
| V18 | `git diff --name-only 0f3a8a7..HEAD -- apps/docs/src packages/ui/src packages/tokens/src` 为 0 个文件 | 2026-11-20 | 通过 |
