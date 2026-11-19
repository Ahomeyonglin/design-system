# Validation — Component Foundation

> 对应规格：`requirements.md` · 状态：V1–V25 已完成（V23–V25 为 CI 等价本地模拟，远程 CI 待首个 PR 触发）· 创建 2026-11-19
> 规则：每一项必须有可复现的证据（命令输出、截图、URL），不接受「看起来没问题」。

## 1. 自动化检查

| # | 检查 | 命令 | 期望 |
| --- | --- | --- | --- |
| V1 | 状态 token 可解析 | `pnpm --filter @ds/tokens build` | 9 个新 token 出现在 light / dark 两个组合中 |
| V2 | 快照同步 | `pnpm --filter @ds/tokens test` | 未更新快照时失败，更新后通过 |
| V3 | 主题无字面量 | `pnpm --filter @ds/tokens build` | `themes/dark.tokens.json` 出现 hex / rgb 即失败 |
| V4 | 既有值变更范围 | `git diff packages/tokens/src` | 新增 9 个状态 token；既有值只有浅色 `text.disabled` 一处变化，其余未改动 |
| V5 | 组件可编译 | `pnpm --filter @ds/ui typecheck` | 五个组件与 docs 引用均通过严格类型检查 |
| V6 | 组件禁 raw / hex | `pnpm --filter @ds/ui lint` | 源码出现 `--raw-`、`raw.`、hex、`rgb(`、`oklch(` 即失败 |
| V7 | 禁写死间距 | `pnpm --filter @ds/ui lint` | padding / margin / gap / radius / font 使用字面量即失败；尺寸白名单仅三项 |
| V8 | 目录完整性 | `pnpm --filter @ds/ui lint` | 组件目录缺三件套、出现桶文件即失败 |
| V9 | meta 完整性 | `pnpm --filter @ds/ui lint` | 字段缺失、tokens 前缀非 `semantic.` / `comp.` 即失败 |
| V10 | 违规 fixture | `pnpm --filter @ds/ui test` | 注入写死色值 / raw 引用 / 写死 padding 的样例均返回非 0 并指出行号 |
| V11 | registry 可重复 | `pnpm --filter @ds/ui build:registry && git diff --exit-code packages/ui/registry.json` | 连续生成 diff 为空 |
| V12 | registry 排序 | 检查 `packages/ui/registry.json` | `components` 按 id 升序；`tokens` 按字母升序；字段顺序固定 |
| V13 | API 无泄漏 | 检查 registry 的 props | 任何组件都不含 `className` / `style` / `size` |
| V14 | docs 无 hex | `grep -rnE "#[0-9a-fA-F]{3,8}\b" apps/docs/src` | 无结果 |
| V15 | docs 可构建 | `pnpm --filter @ds/docs build` | 类型检查与静态构建通过，证明 `@ds/ui` 子路径导出可解析 |

## 2. 人工验收

| # | 检查 | 期望 |
| --- | --- | --- |
| V16 | 组合预览为真实组件 | `/color` 的 Action / Status / Text 面板分别渲染 Button / Badge / Text，无手写 `demo-*` 样式 |
| V17 | 表单面板 | 新增 TextField 默认 / 错误 / 禁用三个示例；错误态边框与文案可见 |
| V18 | 主题联动 | 切换 light / dark，按钮 hover、禁用、焦点边框与输入框错误边框同步变化 |
| V19 | 焦点可见 | 用 Tab 键依次经过按钮与输入框，焦点轮廓清晰可见且颜色来自 `border.focus` |
| V20 | 禁用不可交互 | 禁用按钮点击无回调；禁用输入框不可输入、不可聚焦 |
| V21 | 无障碍接线 | 检查 DOM：label 的 `for` 指向输入框；description / error 在 `aria-describedby` 中；错误态 `aria-invalid="true"` |
| V22 | 新增流程可走通 | 按 `component-sync/SKILL.md` 新增一个临时组件，registry diff 稳定且可读，lint 通过；完成后删除该临时组件 |

## 3. CI 验收

| # | 检查 | 操作 | 期望 |
| --- | --- | --- | --- |
| V23 | 手改 registry 被拦 | 本地手改 `registry.json` 后提交 PR | workflow 在漂移检查步骤失败 |
| V24 | 写死色值被拦 | 在组件 CSS 中临时写一个 hex 后提交 PR | workflow 在 lint 步骤失败 |
| V25 | 正常提交通过 | 恢复上述改动后重新提交 | workflow 全流程通过 |

## 4. 证据记录

| 项 | 证据 | 执行日期 | 结果 |
| --- | --- | --- | --- |
| V1 | light/base 与 dark/base 各 131 个 token，9 个新 id 均在两个组合中存在 | 2026-11-19 | 通过 |
| V2 | `pnpm --filter @ds/tokens test`：7 pass / 0 fail；快照已随 token 更新 | 2026-11-19 | 通过 |
| V3 | `dark.tokens.json` 无 hex / rgb / oklch 字面量，构建通过 | 2026-11-19 | 通过 |
| V4 | 快照 diff：两组合各新增 9 项；light 仅 `semantic.color.text.disabled` 变更 1 项；无删除 | 2026-11-19 | 通过 |
| V5 | `pnpm --filter @ds/ui typecheck` 通过；docs `tsc --noEmit` 通过 | 2026-11-19 | 通过 |
| V6 | `pnpm --filter @ds/ui lint` 通过；fixture 注入 `--raw-*` / hex 均退出 1 | 2026-11-19 | 通过 |
| V7 | fixture 将 padding 改为 `16px` 后 lint 退出 1，并指到 `Card.css:行号` | 2026-11-19 | 通过 |
| V8 | fixture 删除 `Badge.css`、新增 `index.ts` 均退出 1 | 2026-11-19 | 通过 |
| V9 | fixture 删除 meta `$description`、改 token 前缀为 `raw.` 均退出 1 | 2026-11-19 | 通过 |
| V10 | `pnpm --filter @ds/ui test`：10 pass / 0 fail，违规输出含文件与行号 | 2026-11-19 | 通过 |
| V11 | `build:registry` 连续两次 SHA-1 均为 `17f51c10cf2ef570425e620adfd567b899ea629b` | 2026-11-19 | 通过 |
| V12 | registry 顺序 `Badge, Button, Card, Text, TextField`；所有 `tokens` 字母升序 | 2026-11-19 | 通过 |
| V13 | registry props 中无 `className` / `style` / `size`（脚本校验） | 2026-11-19 | 通过 |
| V14 | `grep` `apps/docs/src` 无 hex | 2026-11-19 | 通过 |
| V15 | `pnpm --filter @ds/docs build` 通过（tsc + vite，31 modules） | 2026-11-19 | 通过 |
| V16 | 浏览器：Action 4 Button、Status 5 Badge、Text 六档排版；`demo-button/status/text` 命中 0，`demo-border` 3 | 2026-11-19 | 通过（截图） |
| V17 | 浏览器：Form 三个输入框；第二个 invalid 红框 + 错误文案；第三个 disabled | 2026-11-19 | 通过（截图） |
| V18 | 浏览器：禁用按钮背景 `rgb(230,230,230)` → `rgb(48,48,48)`；错误边框 `rgb(148,0,12)` → `rgb(255,200,193)` | 2026-11-19 | 通过 |
| V19 | 键盘焦点：按钮与错误输入框均命中 `:focus-visible`，outline 2px，颜色 `oklch(0.5592 0.2131 1.33)` | 2026-11-19 | 通过 |
| V20 | 浏览器：禁用按钮 `disabled=true`；禁用输入框 `disabled=true` 且 focus 不落焦 | 2026-11-19 | 通过 |
| V21 | 浏览器：label `for` 与 input `id` 一致；`aria-invalid="true"`；`aria-describedby` 指向说明 / 错误文案 | 2026-11-19 | 通过 |
| V22 | 临时 Divider：lint 6 组件通过、typecheck 通过、registry 排序正确；删除后 SHA 回到 `17f51c10…` | 2026-11-19 | 通过 |
| V23 | 临时 git 仓库：提交篡改后的 registry → 重建后 `git diff --exit-code` 退出 1 | 2026-11-19 | 通过（本地模拟） |
| V24 | 临时仓库注入 hex 后 lint 退出 1 | 2026-11-19 | 通过（本地模拟） |
| V25 | 还原后 lint 退出 0；完整 workflow 序列本地全部通过 | 2026-11-19 | 通过（本地模拟） |

## 5. 未通过的处理

- **V1–V15 失败**：修实现，不改验收标准。若确认标准有误，先改 `requirements.md` 再改测试。
- **V16–V22 失败**：判定为实现或组件 API 缺陷，不走「先记一条已知问题」。
- **观感类不通过（V18–V19）**：回到 `requirements.md` R1 调整 alias 档位，不在组件层补色值。
- **V23–V25 失败**：属于 CI 配置缺陷，修 workflow，不允许缩小检查范围来通过。

## 6. 完成判定

V1–V25 全部通过并填写证据；`registry.json` 已提交且与源码一致；`/color` 无手写组件样式；之后在 `CHANGELOG.md` 追加 S2 条目。
