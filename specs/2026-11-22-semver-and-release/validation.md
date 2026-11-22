# Validation — Semver 与发版流程

> 对应规格：`requirements.md` · 状态：已验证（v0.1）· 创建 2026-11-22
> 规则：每项必须有可复现证据；发版演练在临时副本中进行，不污染工作区。

## 1. 自动化检查

| # | 检查 | 命令 | 期望 |
| --- | --- | --- | --- |
| V1 | 版本状态正例 | `pnpm release:check` | 输出「版本与发版状态校验通过」 |
| V2 | 版本不一致 | `node --test scripts/tests/release.test.mjs` | 指出不一致文件与实际版本 |
| V3 | 依赖写死版本 | 同上 | 指出应使用 `workspace:*` |
| V4 | tag 缺失 / 不匹配 | 同上 | 分别提示「没有 v* 标签」「最新标签与版本不一致」 |
| V5 | 版本区块缺失 / 错位 / 缺日期 | 同上 | 分别给出对应原因 |
| V6 | 版本计算 | 同上 | `patch` / `minor` / `major` 与 `0.0.0` 边界正确 |
| V7 | 归档动作 | 同上 | Unreleased 条目进入新版本区块，历史区块不变 |
| V8 | 重复归档 | 同上 | 已存在同版本区块时报错 |
| V9 | 空 Unreleased | 同上 | 没有条目时拒绝发版 |
| V10 | 端到端演练 | 临时副本：`git tag v0.0.0` 后执行 `node scripts/release.mjs minor` | 四个 `version` 变为 `0.1.0`；`## [0.1.0] - 当天` 归档；打 `v0.1.0` 后 `release:check` 通过 |
| V11 | 脏工作区拦截 | 临时副本修改文件后执行 `release:prepare` | 退出 1，不写入任何版本 |
| V12 | 全量回归 | tokens test、ui lint/test、docs lint/test/build | 全部退出 0 |
| V13 | 本阶段不改版本与产物 | `git diff --stat` 与四个 `version` 检查 | `version` 仍为 `0.0.0`；无 token / 组件 / 文档站代码变化 |

## 2. 人工验收

| # | 检查 | 操作 | 期望 |
| --- | --- | --- | --- |
| V14 | CI 接入 | 推送后查看 CI 步骤 | `Check release state` 存在且 success |
| V15 | 规则可执行 | 按 `AGENTS.md` 命令表执行 | 两条命令可直接运行 |
| V16 | 破坏性定义可查 | 阅读 `requirements.md` R-D5/R-D6 | token 改名、props 删除、默认行为变化均有明确归类 |

## 3. 证据记录

| 项 | 证据 | 执行日期 | 结果 |
| --- | --- | --- | --- |
| V1 | `pnpm release:check` 输出「版本与发版状态校验通过」 | 2026-11-22 | 通过 |
| V2 | `node --test scripts/tests/release.test.mjs`：22 个用例通过，含版本不一致反例 | 2026-11-22 | 通过 |
| V3 | 同上，`^0.1.0` 依赖 fixture 失败 | 2026-11-22 | 通过 |
| V4 | 同上，`tag: null` 与 `v0.1.0` 两类 fixture 分别失败 | 2026-11-22 | 通过 |
| V5 | 同上，`0.1.0` 区块、倒序、缺日期三类 fixture 分别失败 | 2026-11-22 | 通过 |
| V6 | 同上，`1.2.3` 三种 bump 与 `0.0.0` minor 结果正确 | 2026-11-22 | 通过 |
| V7 | 同上，归档后历史区块与文案保持不变 | 2026-11-22 | 通过 |
| V8 | 同上，重复归档抛「已存在」 | 2026-11-22 | 通过 |
| V9 | 同上，空 Unreleased 抛「没有可归档的条目」 | 2026-11-22 | 通过 |
| V10 | 临时副本演练：四个 `version` 全部变为 `0.1.0`；生成 `## [0.1.0] - 2026-11-22`；打 tag 前 check 退出 1，打 tag 后通过 | 2026-11-22 | 通过 |
| V11 | 临时副本修改 CHANGELOG 后执行 prepare：退出 1，输出「工作区有未提交改动」 | 2026-11-22 | 通过 |
| V12 | tokens / ui / docs 全链路退出 0 | 2026-11-22 | 通过 |
| V13 | 四个 `version` 仍为 `0.0.0`；diff 不含 token、组件与文档站源码 | 2026-11-22 | 通过 |
| V14 | CI 运行 <https://github.com/Ahomeyonglin/design-system/actions/runs/44976395529>：`Check release state` success，同批 `Check changelog freshness` 与 `Check commit messages` 也通过 | 2026-11-22 | 通过 |
| V15 | 两条命令实测输出与 AGENTS.md 描述一致 | 2026-11-22 | 通过 |
| V16 | R-D5 覆盖 token 改名、props 删除、默认行为变化；R-D6 定义 `$deprecated` 过渡 | 2026-11-22 | 通过 |
