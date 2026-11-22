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

**S3（文档站与页面组装）已完成并上线**：九条路由与外壳、总览 / 排版 / 间距与圆角 / 主题与品牌 / 组件地图与详情 / 变更记录、全局搜索、文档站 lint、`page-assembly` skill 与项目设置样板页、GitHub Pages 部署；线上地址 <https://ahomeyonglin.github.io/design-system/>。

**S4 治理进行中**：第一部分（CI 门禁与变更日志自动生成）与第二部分（semver 与发版规则）已完成，剩余跨仓升级 PR。规格见 `specs/2026-11-20-governance/` 与 `specs/2026-11-22-semver-and-release/`。

因此：

- 包内脚本以各 `package.json` 为准，不要发明脚本名。
- 改 token 值必须重新构建并更新快照：`UPDATE_SNAPSHOT=1 pnpm --filter @ds/tokens test`。
- 文档站改动必须同时通过 `lint`、`test`、`build`；布局尺寸只允许写在 `apps/docs/src/styles/layout.css` 的 `--docs-*`。
- 部署需要 `main` 推送；本地验证带 base 的产物用 `VITE_BASE=/design-system/ pnpm --filter @ds/docs build`。
- 未确认项（第二个品牌、S4 治理、npm 发布）先问，不要替用户决定。

## 4. 命令

| 命令 | 用途 | 状态 |
| --- | --- | --- |
| `pnpm install` | 安装 workspace 依赖 | 可用 |
| `pnpm --filter @ds/tokens build` | 生成 token 产物 | 可用 |
| `pnpm --filter @ds/tokens test` | 快照 + 色域 + 违规 fixture | 可用 |
| `pnpm --filter @ds/ui build:registry` | 聚合 `registry.json` | 可用 |
| `pnpm --filter @ds/docs dev` | 启动文档站 | 可用 |
| `pnpm --filter @ds/docs lint` | 文档站硬编码、raw 与布局尺寸检查 | 可用 |
| `pnpm --filter @ds/docs test` | 路由、支持矩阵与 lint fixture | 可用 |
| `pnpm --filter @ds/docs build` | 文档站类型检查与静态构建 | 可用 |
| `pnpm commit:check [range]` | 校验提交标题，默认最近一条 | 可用 |
| `pnpm changelog:write` | 从 git 提交生成 `[Unreleased]` | 可用 |
| `pnpm changelog:check` | 校验 `[Unreleased]` 是否过期 | 可用 |
| `pnpm release:prepare <patch\|minor\|major>` | 归档版本、同步四个 `version` | 可用 |
| `pnpm release:check` | 校验版本、tag 与日志版本区块一致 | 可用 |

## 5. 硬规则

违反以下任一条即为不合格改动，不要用「暂时」「以后治理」作为理由：

1. **`packages/tokens/src/**` 中禁止出现 hex / rgb**。源值只用 `oklch`；hex 只允许出现在生成产物里。
2. **组件样式禁止硬编码**颜色、间距、字号、圆角，必须引用 `semantic` / `comp` token 变量。
3. **组件禁止直接引用 raw 层色阶**（`raw.*`），只能消费 `semantic` / `comp` 层。
4. **禁止手改生成物**：`packages/tokens/dist/**`、`packages/ui/registry.json` 一律由脚本产出。
5. **禁止臆造组件**：页面或组件里只能使用 `registry.json` 中已存在的组件。
6. **token 名即 API**：重命名属于破坏性变更，必须走 `$deprecated` 过渡，不能直接改名删旧。
7. **不为未来预留抽象**：不要加「以后可能用到」的参数、配置项或空实现。
8. **`CHANGELOG.md` 的 `[Unreleased]` 禁止手改**：只能由 `pnpm changelog:write` 生成，`--check` 在 CI 中拦截过期。
9. **提交标题必须符合 `type(scope): 描述`**：type 与 scope 取值见 `specs/2026-11-20-governance/requirements.md`；允许中文描述。
10. **版本号只能由 `pnpm release:prepare` 修改**：根与三个包锁步同版本，禁止手改 `version` 或手写版本区块。
11. **破坏性改名必须先走 `$deprecated`**：token 改名/删除至少保留旧名一个 `minor`；判定清单见 `specs/2026-11-22-semver-and-release/requirements.md`。

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
