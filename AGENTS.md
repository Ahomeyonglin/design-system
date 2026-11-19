# AGENTS.md — 项目级 AI 工作规则

本文件是 AI 编码工具进入本仓库时自动加载的常驻上下文。**只写规则与事实，不写背景故事。**
详细流程在 `.trae/skills/`，逐条规格在 `specs/`，不要在本文件里重复它们。

## 1. 约束优先级

从高到低，冲突时以高者为准：

1. `specs/mission.md`（什么是成功、什么不做）
2. `specs/tech-stack.md`（技术选型与合规约束）
3. `specs/roadmap.md`（当前阶段与该阶段范围）
4. 本文件
5. `.trae/skills/*/SKILL.md`（按需加载的执行流程）

## 2. 这是什么

一套「可被 AI 消费的设计系统」：token 定义视觉值，组件按规范消费 token，`registry.json` 作为 AI 的能力索引，文档站作为人的验收台。

```
packages/tokens/   源 token（DTCG），产出 CSS 变量与 JSON
packages/ui/       组件 + registry.json
apps/docs/         文档站（验收台 + 查询台）
specs/             宪法、功能规格与 ADR（决策记录见 specs/adr/README.md）
.trae/skills/      可执行流程（component-sync / page-assembly）
```

## 3. 当前阶段

**S1（Token 地基）已实现**：`packages/tokens` 具备 raw / semantic / brand / theme / resolver、构建与测试；`apps/docs` 具备可运行的 Color 验收页。`packages/ui` 仍为空，组件与 `registry.json` 属于 S2。

因此：

- 包内脚本以各 `package.json` 为准，不要发明脚本名。
- 改 token 值必须重新构建并更新快照：`UPDATE_SNAPSHOT=1 pnpm --filter @ds/tokens test`。
- 未确认项（品牌支持矩阵的运行时行为、组件层）先问，不要替用户决定。

## 4. 命令

| 命令 | 用途 | 状态 |
| --- | --- | --- |
| `pnpm install` | 安装 workspace 依赖 | 可用 |
| `pnpm --filter @ds/tokens build` | 生成 token 产物 | 可用 |
| `pnpm --filter @ds/tokens test` | 快照 + 色域 + 违规 fixture | 可用 |
| `pnpm --filter @ds/ui build:registry` | 聚合 `registry.json` | S2 引入 |
| `pnpm --filter @ds/docs dev` | 启动文档站 | 可用 |
| `pnpm --filter @ds/docs build` | 文档站类型检查与静态构建 | 可用 |

## 5. 硬规则

违反以下任一条即为不合格改动，不要用「暂时」「以后治理」作为理由：

1. **`packages/tokens/src/**` 中禁止出现 hex / rgb**。源值只用 `oklch`；hex 只允许出现在生成产物里。
2. **组件样式禁止硬编码**颜色、间距、字号、圆角，必须引用 `semantic` / `comp` token 变量。
3. **组件禁止直接引用 raw 层色阶**（`raw.*`），只能消费 `semantic` / `comp` 层。
4. **禁止手改生成物**：`packages/tokens/dist/**`、`packages/ui/registry.json` 一律由脚本产出。
5. **禁止臆造组件**：页面或组件里只能使用 `registry.json` 中已存在的组件。
6. **token 名即 API**：重命名属于破坏性变更，必须走 `$deprecated` 过渡，不能直接改名删旧。
7. **不为未来预留抽象**：不要加「以后可能用到」的参数、配置项或空实现。

## 6. 改动的连带责任

改动不是改完文件就结束：

| 改了什么 | 必须同时做 |
| --- | --- |
| token 值或色阶 | 重新构建 + 更新 hex 快照 |
| 新增/修改 token 名 | 按 semver 判断是否破坏性，补 `$deprecated` |
| 组件实现 | 重新生成 `registry.json` 并一并提交 |
| 组件 props / 变体 | 同步 `component.meta.json` 与 `AGENTS.md` 中的用法说明 |

## 7. 工作方式

- 一个功能一个分支，从 `main` 切出；规格先于实现。
- 涉及多文件的结构性改动，先给出方案再动手。
- 不确定技术选型时停下来问，不要替用户做架构决定。
- 交付时说清「改了什么、没做什么、怎么验证」。

## 8. 不要做

- 不要写设计理念、背景说明、欢迎语。
- 不要在文档里放示例代码片段，除非它当前就能运行（过期示例会被照抄）。
- 不要在本文件中复述 `registry.json` 的内容，让读者自己去读。
- 不要一次性铺开多个阶段的任务，只做当前阶段范围内的。
