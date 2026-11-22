# Requirements — Token 弃用与移除门禁

> 阶段：S4（治理）· 状态：已确认（2026-11-22）· 创建 2026-11-22
> 上游约束：`specs/mission.md`、`specs/tech-stack.md`、`specs/roadmap.md`
> 前置：`specs/2026-11-22-semver-and-release/` 已定义破坏性变更与 `$deprecated` 过渡规则。
> 范围声明：本规格只覆盖 token 的弃用标记、产物透传、消费拦截与移除门禁；不包含文档站呈现与自动迁移工具。

## 1. 问题

| 现状 | 后果 |
| --- | --- |
| `$deprecated` 只写在文档里，构建会丢弃它 | 下游拿到的产物看不出 token 已弃用 |
| 没有拦截组件消费已弃用 token | 旧的引用会跟着 token 一起被移除，破坏在使用方 |
| 没有「何时可以删」的可执行校验 | 旧名可能今天弃用、明天删除，等于直接改名 |
| 没有跑通完整流程的演练 | 规则只停留在纸面，第一次真实改名才会暴露断点 |

## 2. 已定决策

| # | 决策 | 结论 |
| --- | --- | --- |
| T-D1 | 元数据格式 | 使用 DTCG 原生 `$deprecated`，值必须是**非空字符串**，写明替代 token 或迁移方式；不接受 `true` 这类无法指导迁移的写法 |
| T-D2 | 产物透传 | `dist/tokens.json` 每个 token 条目在存在时输出 `$deprecated`；CSS 变量继续输出，旧引用不会立刻失效 |
| T-D3 | 消费拦截 | `@ds/ui` lint 禁止组件样式与 `component.meta.json` 引用已弃用 token |
| T-D4 | 移除门禁 | 从源码删除 token 时，该 token 必须在最近 `v*` tag 中已带 `$deprecated`；否则测试失败，要求先发一版弃用 |
| T-D5 | 门禁位置 | 放进 `@ds/tokens` 测试，随现有 `test` 命令在 CI 执行，不新增脚本 |
| T-D6 | 无 tag 时 | 跳过移除门禁并输出提示；发布态由 `release:check` 保证有 tag |
| T-D7 | 快照 | 快照只记录实际存在的 `$deprecated`，现有快照内容不变；新增弃用需显式更新快照 |
| T-D8 | 文档站 | 本阶段不改文档站；弃用信息先通过产物与 lint 生效 |

## 3. 范围

**做**

- 构建校验与透传 `$deprecated`
- `@ds/ui` lint 拦截已弃用 token（CSS 变量与 meta 声明）
- `@ds/tokens` 移除门禁测试与反例
- 规格、规则文件同步
- 临时副本中跑通 `0.0.0 → 0.1.0（弃用）→ 0.2.0（移除）`

**不做**

- 文档站展示弃用状态
- 自动改写下游引用或生成迁移 PR
- 自动判断弃用是否已跨够版本（以 tag 事实为准）
- group 级 `$deprecated` 继承
- npm 发布

## 4. 功能需求

### R1 格式校验

- token 带 `$deprecated` 时，构建必须校验其为非空字符串。
- 非字符串或空字符串时构建失败，错误信息包含组合、token id。

**验收**：给任一 token 写 `"$deprecated": true`，构建失败并指出该 token。

### R2 产物透传

- `dist/tokens.json` 的条目在 token 带 `$deprecated` 时输出该字段，位置固定在 `$description` 与 `$value` 之间。
- CSS 产物仍输出对应变量，不因弃用而删除。
- 快照在 token 带 `$deprecated` 时记录该字段。

**验收**：临时源码中给 `semantic.color.bg.surface` 加弃用说明后构建，JSON 含 `$deprecated`，`theme-light.css` 仍有 `--semantic-color-bg-surface`；快照测试在未更新快照时失败。

### R3 组件禁消费

- lint 扫描 `components/**/*.css`，出现已弃用 token 的变量（含 typography 派生的 `-font-size` 等）时报错。
- lint 校验 `component.meta.json` 的 `tokens`，包含已弃用 token 时报错。
- 报错信息包含文件、行号、token id 与弃用说明。
- 读取 `packages/tokens/dist/tokens.json`；缺失时报错并提示先构建 tokens。

**验收**：在组件 CSS 引用已弃用变量、或在 meta 中声明已弃用 token，lint 均失败。

### R4 移除门禁

- 测试读取最近 `v*` tag 中 `packages/tokens/src/**/*.tokens.json` 的 token 集合。
- 当前源码中缺失的 token，若在 tag 中未带 `$deprecated`，测试失败并列出 id。
- tag 中已带 `$deprecated` 的 token 允许删除。
- 无 `v*` tag 或 git 不可用时跳过并输出提示。

**验收**：`$deprecated` 未发布前直接删除 token → 失败；发版后再删除 → 通过。

### R5 完整流程演练

- 在临时副本中按 `v0.0.0 → v0.1.0（旧名弃用 + 新名可用）→ v0.2.0（移除旧名）` 演练。
- 记录每轮的命令与结果到 `validation.md`。

**验收**：三轮都能用现有命令完成，负例被拦截，最终 `release:check` 通过。

### R6 规则同步

- 根 `AGENTS.md`：阶段说明引用本规格；硬规则与连带责任表补充「删除 token 需上一版已弃用」。
- `packages/ui/AGENTS.md`：硬规则补充「禁止消费已弃用 token」。
- `specs/tech-stack.md`：CI 表补充弃用门禁一行。

**验收**：三处描述与本规格一致，且命令可直接执行。

## 5. 不变量

- 不新增依赖。
- 弃用不改变 token 值、CSS 变量名与现有快照。
- 不手改 `dist/**` 与 `registry.json`。
- 移除门禁只判断「是否已发布过弃用」，不判断跨了几个 minor。

## 6. 待输入

| 问题 | 处理 |
| --- | --- |
| 弃用信息是否要进文档站 | 等有真实弃用 token 时再决定呈现方式 |
| 是否需要自动迁移提示 | 当前人工按 `$deprecated` 文案迁移，不引入工具 |
