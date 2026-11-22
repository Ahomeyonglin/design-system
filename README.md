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

| 命令 | 用途 |
| --- | --- |
| `pnpm --filter @ahomeyonglin/tokens build` | 生成 token 产物 |
| `pnpm --filter @ahomeyonglin/tokens test` | 快照、色域与弃用门禁 |
| `pnpm --filter @ahomeyonglin/ui build:registry` | 聚合 `registry.json` |
| `pnpm --filter @ahomeyonglin/ui build` | 生成组件产物 |
| `pnpm --filter @ahomeyonglin/docs dev` | 启动文档站 |

## 分发

- 发布包：`@ahomeyonglin/tokens`、`@ahomeyonglin/ui`；`@ahomeyonglin/docs` 保持 private。
- 当前 license 未定，`tokens` 与 `ui` 暂时保留 `private: true` 作为发布保险；确认许可后移除再发版。
- 发版：`pnpm release:prepare <patch|minor|major>` → 全量校验 → 提交 → 打 `v*` tag → 推送。
- 发布由 `.github/workflows/publish.yml` 在 tag 推送时执行，顺序 tokens → ui，已存在版本跳过。
- 下游须自行引入 tokens 的 CSS，顺序为 `theme-light.css` → `theme-dark.css` → `brand-*.css`。
- 决策记录见 `specs/adr/0015-public-npm-distribution.md`。

## 当前状态

S4（治理）进行中：CI 门禁、semver 与发版、token 弃用门禁与公共 npm 分发已完成，剩余跨仓升级 PR。规格见 `specs/` 下对应日期目录。
