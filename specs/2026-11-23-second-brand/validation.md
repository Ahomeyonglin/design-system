# Validation — 第二个品牌 zhixing 与品牌级主题覆盖

> 对应规格：`requirements.md` · 记录日期 2026-11-23
> 结论：R1–R8 全部通过；构建产出 4 份 CSS，token 测试 23 项、docs lint / test / build 均通过。

## 1. 本地校验

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @ahomeyonglin/tokens build` | 通过，产出 `theme-light` / `theme-dark` / `brand-base` / `brand-zhixing` 与 `tokens.json` |
| `UPDATE_SNAPSHOT=1 pnpm --filter @ahomeyonglin/tokens test` | 23 项通过，快照新增 `light/zhixing`、`dark/zhixing` |
| `pnpm --filter @ahomeyonglin/tokens test` | 23 项通过 |
| `pnpm --filter @ahomeyonglin/docs lint` | 通过 |
| `pnpm --filter @ahomeyonglin/docs test` | 16 项通过 |
| `pnpm --filter @ahomeyonglin/docs build` | 通过（tokens build → ui build → tsc → vite build） |

## 2. 色阶与对比度

| 级 | oklch | hex | 在 sRGB |
| --- | --- | --- | --- |
| 50 | `0.96 0.018 259.59` | #EBF2FE | 是 |
| 100 | `0.895 0.042 259.59` | #CCDEF9 | 是 |
| 200 | `0.79 0.075 259.59` | #9EBCEB | 是 |
| 300 | `0.65 0.105 259.59` | #6890CF | 是 |
| 400 | `0.5 0.128 259.59` | #3461AB | 是 |
| **500** | **`0.3734 0.1126 259.5882`** | **#183E7B** | 是 |
| 600 | `0.315 0.104 259.59` | #0C2F65 | 是 |
| 700 | `0.26 0.09 259.59` | #05214E | 是 |
| 800 | `0.21 0.073 259.59` | #031639 | 是 |
| 900 | `0.16 0.055 259.59` | #010C24 | 是 |
| 950 | `0.115 0.039 259.59` | #010413 | 是 |

关键对比度（白字）：

- 500 对白底 10.43:1，亮色可用作品牌主操作背景。
- 500 对暗底 `neutral.950` 仅 1.87:1，暗色不可继续使用。
- 400 对白 6.07:1、对暗底 3.22:1；300 对暗底 6.02:1。因此暗色主操作背景改用 400。

## 3. 产物检查

`theme-*.css` 与 `brand-*.css` 都以 `@layer tokens.theme, tokens.brand;` 声明层级顺序：主题内容位于 `tokens.theme`，品牌色阶与覆盖位于 `tokens.brand`。层级由 `@layer` 保证，不依赖选择器特异性或文件加载顺序。

`brand-zhixing.css` 在 `tokens.brand` 层内包含两块：

1. `[data-brand="zhixing"]`：11 级品牌色阶，500 为 `#183E7B`。
2. `[data-theme="dark"][data-brand="zhixing"]`：4 个语义覆盖，全部为 alias：

```css
--semantic-color-action-primary-bg: var(--raw-color-brand-400);
--semantic-color-action-primary-bg-hover: var(--raw-color-brand-500);
--semantic-color-action-primary-border: var(--raw-color-brand-400);
--semantic-color-action-primary-border-hover: var(--raw-color-brand-500);
```

`theme-light.css` 与 `theme-dark.css` 位于 `tokens.theme` 层，未出现 zhixing 覆盖。

## 4. 覆盖机制正反例

`tests/overrides.test.mjs` 在临时副本中构建：

| 用例 | 结果 |
| --- | --- |
| 正例：颜色 + 间距覆盖 | 通过；`dark/zhixing` 的 primary bg 等于品牌 400，`semantic.space.inline.md` 等于 `raw.space.500`，`light/zhixing` 仍为品牌 500 |
| 反例：覆盖 `raw.*` | 失败，提示不在 semantic 层 |
| 反例：缺 `$description` | 失败，提示缺少非空 `$description` |
| 反例：alias 目标不存在 | 失败，提示目标在 `dark/zhixing` 中不存在 |
| 反例：alias 类型与目标不一致 | 失败，提示目标类型为 dimension、与 color 不一致 |
| 反例：覆盖不存在的 token | 失败，提示只允许重映射已有 token |
| 反例：非 alias 值 | 失败，提示只允许 alias |

## 5. 备注

- 快照差异只包含新增的两组组合与暗色覆盖，`base` 的 token 值未变化。
- 本轮加入级联层与通用 alias 覆盖后没有改 token 值，快照内容未变化。
- 文档站品牌下拉、支持矩阵与浅深色差异均由 manifest 与产物驱动，未改页面代码。
- 生成 CSS 位于 `@layer tokens.theme` / `tokens.brand`，属于样式级行为变化：宿主未分层声明会高于 tokens 层，发版时应在变更日志中说明。
- 本次未执行 git 提交，等确认后再提交。
