# README — 设计系统

一套可被 AI 消费的设计系统：token 定义视觉值，组件按规范消费 token，`registry.json` 作为 AI 的能力索引，文档站作为人的验收台。

## 约束入口

先读下面两处，再动手：

| 文件 | 作用 |
| --- | --- |
| `specs/mission.md` | 什么是成功、什么不做 |
| `specs/tech-stack.md` | 技术选型与合规约束 |
| `specs/roadmap.md` | 当前阶段与该阶段范围 |
| `AGENTS.md` | 给 AI 的常驻规则；包级规则见 `packages/ui/AGENTS.md` |

## 结构

```
specs/              宪法（3 份）+ 功能规格（每个功能一个日期目录）
specs/adr/          架构决策记录（只增不改，索引见 README）
packages/tokens/    源 token（DTCG），产出 CSS 变量与 JSON
packages/ui/        组件 + registry.json
apps/docs/          文档站（验收台 + 查询台）
.trae/skills/       AI 可执行流程
.github/workflows/  CI 门禁
```

## 开始

```bash
pnpm install
```

其他命令尚未引入，随阶段落地：

| 命令 | 状态 |
| --- | --- |
| `pnpm --filter @ds/tokens build` | S1 |
| `pnpm --filter @ds/tokens test` | S1 |
| `pnpm --filter @ds/ui build:registry` | S2 |
| `pnpm --filter @ds/docs dev` | S1 |

## 当前状态

S0（地基）：目录骨架与宪法已完成，包内无实现代码。首个功能规格见 `specs/2026-11-14-token-foundation/`。
