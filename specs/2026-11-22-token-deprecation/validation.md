# Validation — Token 弃用与移除门禁

> 对应规格：`requirements.md` · 记录日期 2026-11-22
> 结论：R1–R6 全部通过；本地校验与临时副本三轮演练均按预期拦截或放行。

## 1. 本地校验

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @ds/tokens test` | 16 项通过（含 V19 移除门禁、V20 产物透传与格式反例） |
| `pnpm --filter @ds/ui lint` | 5 个组件通过 |
| `pnpm --filter @ds/ui test` | 14 项通过（含 4 项弃用引用 fixture） |
| `pnpm --filter @ds/docs lint` | 通过 |
| `pnpm --filter @ds/docs test` | 16 项通过 |
| `pnpm --filter @ds/docs build` | 通过 |
| `pnpm release:check` | 版本与发版状态校验通过 |
| `pnpm changelog:check` | 通过（生成变更日志后复跑） |

## 2. 演练环境

- 方式：`git clone` 当前仓库到 `/tmp/ds-rehearsal`，`node_modules` 以符号链接复用，避免联网安装。
- 起点：`v0.0.0`，四个 `package.json` 均为 `0.0.0`。
- 对象：`semantic.color.bg.subtle`（同时被 `Badge` 与 `TextField` 使用）。

## 3. 第一轮：弃用（v0.0.0 → v0.1.0）

| 步 | 动作 | 结果 |
| --- | --- | --- |
| 1 | 给 `semantic.color.bg.subtle` 加 `$deprecated`，`UPDATE_SNAPSHOT=1` 后复跑 tokens 测试 | 16 项通过，快照只多出 `$deprecated` |
| 2 | 运行 `node packages/ui/scripts/lint-components.mjs` | 4 处违规，CSS 与 meta 各 2 处 |
| 3 | 迁移 `Badge` / `TextField` 到 `semantic.color.bg.surface`，重新生成 registry | lint 通过 |
| 4 | 在未打 tag 前删除该 token，运行 `--test-name-pattern="移除门禁"` | 门禁失败，提示 `v0.0.0` 中未标记 `$deprecated` |
| 5 | `node scripts/release.mjs minor`、提交、`git tag v0.1.0`、`release.mjs check` | 版本 `0.1.0`，校验通过 |

消费拦截的实际输出：

```text
components/Badge/Badge.css:17  引用了已弃用 token semantic.color.bg.subtle：改用 semantic.color.bg.surface
components/Badge/component.meta.json:21  tokens 含已弃用 token semantic.color.bg.subtle：改用 semantic.color.bg.surface
components/TextField/TextField.css:47  引用了已弃用 token semantic.color.bg.subtle：改用 semantic.color.bg.surface
components/TextField/component.meta.json:77  tokens 含已弃用 token semantic.color.bg.subtle：改用 semantic.color.bg.surface
✖ 组件 lint 失败：4 处违规
```

提前删除被拦截的实际输出：

```text
✖ V19 移除门禁：删除的 token 必须在最近 v* tag 中已弃用
AssertionError: 以下 token 在 v0.0.0 中未标记 $deprecated 就被删除，请先发一版弃用：
```

## 4. 第二轮：移除（v0.1.0 → v0.2.0）

| 步 | 动作 | 结果 |
| --- | --- | --- |
| 1 | 从 `semantic.tokens.json` 与 `themes/dark.tokens.json` 删除该 token | — |
| 2 | 更新快照、同步 token 数量断言（133 → 132） | 16 项通过，V19 门禁放行 |
| 3 | ui lint / docs lint / docs test | 全部通过 |
| 4 | `changelog:write` → 提交 → `release.mjs minor` → 提交 → `git tag v0.2.0` → `release.mjs check` | 版本 `0.2.0`，校验通过 |

最终 tag 序列与提交：

```text
v0.0.0 → v0.1.0 → v0.2.0
e2875a4 chore(repo): 发布 v0.2.0
ec56ce7 chore(repo): 更新变更日志
d4c7a22 feat(tokens)!: 移除已弃用 token
44b0626 chore(repo): 发布 v0.1.0
526ea61 feat(tokens): 弃用 semantic.color.bg.subtle
```

## 5. 备注

- 归档 `0.1.0` 后 `[Unreleased]` 为空，`release:prepare` 会拒绝归档；先运行 `pnpm changelog:write` 即可，属于既有发版流程。
- 主题文件重复声明同一 token 时，弃用标记按「任一文件带 `$deprecated` 即生效」合并，避免暗色覆盖丢失标记。
- 文档站在本轮演练中只迁移了 `search.css` 的变量引用，未改动呈现；弃用信息的展示留到出现真实弃用 token 时再定。
