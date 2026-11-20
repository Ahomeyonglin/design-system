# Validation — Governance：CI 门禁与变更日志

> 对应规格：`requirements.md` · 状态：待验证（v0.1）· 创建 2026-11-20
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
| V16 | CI 红绿演练 | 分支提交一条 `update something` 再推送 | CI 在 G1 失败并指出该提交；改成 `docs(repo): ...` 后通过 |
| V17 | 规则可执行 | 按 `AGENTS.md` 命令表逐条执行 | 三条脚本命令可直接运行，输出与文档描述一致 |
| V18 | 文档站与治理解耦 | `git diff --stat` 检查本阶段改动 | 不含 `apps/docs/src/**`、`packages/ui/src/**`、token 值变化 |

## 3. 证据记录

| 项 | 证据 | 执行日期 | 结果 |
| --- | --- | --- | --- |
| V1 | 待执行 | — | — |
| V2 | 待执行 | — | — |
| V3 | 待执行 | — | — |
| V4 | 待执行 | — | — |
| V5 | 待执行 | — | — |
| V6 | 待执行 | — | — |
| V7 | 待执行 | — | — |
| V8 | 待执行 | — | — |
| V9 | 待执行 | — | — |
| V10 | 待执行 | — | — |
| V11 | 待执行 | — | — |
| V12 | 待执行 | — | — |
| V13 | 待执行 | — | — |
| V14 | 待执行 | — | — |
| V15 | 待执行 | — | — |
| V16 | 待执行 | — | — |
| V17 | 待执行 | — | — |
| V18 | 待执行 | — | — |
