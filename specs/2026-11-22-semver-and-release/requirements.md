# Requirements — Semver 与发版流程

> 阶段：S4（第二部分）· 状态：已确认（2026-11-22）· 创建 2026-11-22
> 上游约束：`specs/mission.md`、`specs/tech-stack.md`、`specs/roadmap.md`
> 前置：`specs/2026-11-20-governance/` 已完成提交规范、`[Unreleased]` 生成与 CI 门禁。
> 范围声明：本规格只覆盖「版本号规则 + 发版动作」，不包含 npm 发布与跨仓升级通知。

## 1. 问题

| 现状 | 后果 |
| --- | --- |
| 三个包与根目录版本都是 `0.0.0`，靠人工记忆 | 版本漂移无人发现，包之间引用关系说不清 |
| 没有「什么算破坏性改动」的定义 | token 改名、组件 props 删除可能被当成 patch 放出去 |
| `[Unreleased]` 没有归档动作 | 日志永远只有一个 Unreleased，历史版本无法追溯 |
| 没有发版检查清单 | 打 tag 前后顺序不一致，tag 与 CHANGELOG 版本对不上 |

## 2. 已定决策

| # | 决策 | 结论 |
| --- | --- | --- |
| R-D1 | 版本策略 | 根目录与 `@ds/tokens` / `@ds/ui` / `@ds/docs` 使用**同一版本号**（lockstep），一次发版全部同步 |
| R-D2 | 发版范围 | 只到「归档 CHANGELOG + 打 tag + 校验」，不执行 `npm publish`；包保持 `private: true` |
| R-D3 | 包间依赖 | 包之间继续用 `workspace:*`，不写死版本号，避免 lockstep 下出现区间不一致 |
| R-D4 | 版本语义 | `patch`：修 bug / 视觉修正，不改 API 与 token 名；`minor`：新增 token、组件或变体，向后兼容；`major`：破坏性变更。`1.0.0` 之前的破坏性变更用 `minor` 表达 |
| R-D5 | 破坏性变更定义 | token 改名或删除、组件 props 删除或改名、组件默认行为或必填性变化、CSS 变量名变化；仅调整值不算破坏性 |
| R-D6 | 废弃过渡 | 破坏性改名必须先加 `$deprecated` 保留旧名，至少跨一个 `minor` 后才能删除；删除本身记入下一个版本的 Changed |
| R-D7 | 发版入口 | 只允许 `pnpm release:prepare <patch|minor|major>` 生成版本变更，禁止手改版本号与归档区块 |
| R-D8 | 校验范围 | `pnpm release:check` 在 CI 每次运行：版本一致、最新 tag 与版本一致、CHANGELOG 含对应版本区块 |
| R-D9 | 日期与格式 | 版本区块固定为 `## [x.y.z] - YYYY-MM-DD`；日期取本地时区当天 |
| R-D10 | 回滚 | tag 推送前可整体 revert `release:prepare` 产出的提交；tag 推送后发现错误，只能递增新版本修复，不移动已有 tag |

## 3. 范围

**做**

- 版本号规则与破坏性变更清单（本文件）
- `scripts/release.mjs` 与纯函数库、测试
- 根脚本 `release:prepare`、`release:check`
- CI 增加 `release:check`
- 根 `AGENTS.md` 与 `specs/tech-stack.md` 同步

**不做**

- npm 发布、GitHub Release、自动创建 PR
- 独立版本号、兼容矩阵、LTS 分支
- 跨仓升级通知
- 自动判断 patch / minor / major（由人选择）

## 4. 功能需求

### R1 版本一致性

- 根 `package.json` 与三个包 `package.json` 的 `version` 必须完全相同。
- 包间依赖必须为 `workspace:*`；出现具体版本号即失败。
- 校验提供 `release:check` 命令，失败时列出每个文件的实际版本。

**验收**：四个文件一致时通过；任意一个改成 `0.1.0` 时失败并指出文件。

### R2 tag 与版本对应

- 取最近的 `v*` tag，必须等于 `v<当前版本>`。
- 没有 `v*` tag 时失败，提示先执行 `release:prepare`。
- 支持 `0.0.0` 作为初始状态（已有 `v0.0.0`）。

**验收**：`v0.0.0` + 版本 `0.0.0` 通过；版本改成 `0.1.0` 而未打 tag 时失败；最新 tag 为 `v0.2.0` 而版本为 `0.1.0` 时失败。

### R3 CHANGELOG 版本区块

- `CHANGELOG.md` 必须保留 `## [Unreleased]`。
- 必须存在 `## [<当前版本>] - YYYY-MM-DD` 区块，且日期格式合法。
- 最新版本区块必须位于 `## [Unreleased]` 之后、其他版本区块之前。
- 缺区块或顺序错误时失败，提示执行 `release:prepare`。

**验收**：当前 `## [0.0.0] - 2026-11-20` 通过；删除该区块或把版本号改成 `0.0.1` 时失败。

### R4 `release:prepare`

- 用法：`pnpm release:prepare <patch|minor|major>`，缺少或非法参数时退出 2。
- 前置：工作区干净（允许 `CHANGELOG.md` 之外的改动？——不允许，必须干净，避免把半成品带进版本）。
- 动作：
  1. 按 semver 计算新版本；
  2. 写入根与三个包的 `version`；
  3. 把现有 `[Unreleased]` 正文归档为 `## [新版本] - 当天`；
  4. 插入新的空 `[Unreleased]`（内容为「暂无未发布变更」）；
  5. 输出后续步骤：全量校验 → 提交 `chore(repo): 发布 vX.Y.Z` → 打 tag → 推送。
- 不自动提交、不自动打 tag、不推送。
- 重复执行幂等：若目标版本已存在同名区块，直接失败，不产生半成品。

**验收**：在临时副本中执行 minor，四个版本同步变为 `0.1.0`，旧 Unreleased 内容进入 `## [0.1.0] - 当天`，新的 Unreleased 为空；`release:check` 在打 tag 前失败并提示缺 `v0.1.0`。

### R5 CI 接入

- `ci.yml` 在现有 `verify` job 增加 `pnpm release:check`，位置在 `changelog:check` 之后。
- 依赖 `fetch-depth: 0`（已具备）以读取 tag。

**验收**：CI 绿灯且步骤列表包含 release check；版本与 tag 被人为改错时 CI 失败。

### R6 规则同步

- 根 `AGENTS.md`：命令表新增两条；硬规则新增「版本号只能由 `release:prepare` 修改」「破坏性改名必须走 `$deprecated`」。
- `specs/tech-stack.md`：补版本策略与发版校验两行。
- 本规格作为破坏性变更清单的唯一来源，AGENTS 只引用不复述。

**验收**：AGENTS 命令可直接执行；tech-stack 与 requirements 描述一致。

## 5. 不变量

- 包保持 `private: true`，不因本阶段改动发布属性。
- 不移动已推送的 tag；错误版本用新版本修复。
- 不手改版本号、不手改已归档的版本区块。
- 发版不改变组件 API、token 值与文档站产物。

## 6. 待输入

| 问题 | 处理 |
| --- | --- |
| 何时进入 `1.0.0` | 等 API 稳定、有真实下游后再定，本阶段不预设 |
| 是否需要各包独立版本与兼容矩阵 | 当前三包 lockstep，不适用；以后拆分再议 |
