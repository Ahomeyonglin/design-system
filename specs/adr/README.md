# 架构决策记录（ADR）

本目录记录已经拍板的架构取舍：**为什么这么选、否掉了什么、什么条件下重新评估**。

## 规则

- 一条决策一篇，只增不改。
- 决策变化时新写一篇，旧记录状态改为 `Superseded by ADR-00XX`，原文保留。
- 当前生效的约束看 `specs/` 宪法；本目录只回答「当时怎么想的」。
- 记录编号即时间顺序，不复用编号。

## 索引

| 编号 | 标题 | 状态 | 决策日 |
| --- | --- | --- | --- |
| [0001](./0001-monorepo.md) | 采用单仓多包（monorepo）而非多仓 | Accepted | 2026-11-14 |
| [0002](./0002-dtcg-2025-10.md) | 以 DTCG 2025.10 作为 token 源格式 | Accepted | 2026-11-14 |
| [0003](./0003-oklch-source.md) | 颜色以 OKLCH 为唯一源，hex 由构建生成 | Accepted | 2026-11-14 |
| [0004](./0004-theme-brand.md) | theme + brand 双 modifier + 支持矩阵 | Accepted | 2026-11-14 |
| [0005](./0005-registry-committed.md) | `registry.json` 生成后提交 | Accepted | 2026-11-14 |
| [0006](./0006-docs-information-architecture.md) | 文档站信息架构与三层呈现 | Accepted | 2026-11-14 |
| [0007](./0007-sdd-process.md) | 采用 SDD 流程与规格生命周期 | Accepted | 2026-11-14 |
| [0008](./0008-docs-stack.md) | 文档站采用 Vite + React + TS | Accepted | 2026-11-16 |
| [0009](./0009-token-naming.md) | Token 命名采用 raw / semantic / comp 前缀 | Accepted | 2026-11-19 |
| [0010](./0010-brand-color.md) | 品牌基色采用 `#C52935` | Superseded by [0012](./0012-brand-color-change.md) | 2026-11-19 |
| [0011](./0011-parser.md) | 采用 Terrazzo 2.10.0 解析 DTCG Resolver | Accepted | 2026-11-19 |
| [0012](./0012-brand-color-change.md) | 品牌基色改为 `#CE1B6C` | Accepted | 2026-11-19 |
| [0013](./0013-versioning-and-release.md) | 版本与发版策略：三包锁步、只到 tag 与 CHANGELOG | Accepted | 2026-11-22 |
| [0014](./0014-governance-gates.md) | 治理门禁：自写提交规范与变更日志生成 | Accepted | 2026-11-20 |
| [0015](./0015-public-npm-distribution.md) | 分发方式：公共 npm 与构建产物 | Accepted | 2026-11-22 |

## 仍未决策

以下项目在对话中被明确挂起，尚未形成 ADR：

- 文档站样式方案：Tailwind v4 还是原生 CSS（技术栈已定为 Vite + React + TS，见 ADR-0008）。
