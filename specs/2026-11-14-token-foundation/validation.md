# Validation — Token Foundation

> 对应规格：`requirements.md` · 状态：S1 实现完成（V11 移出 S1；V12 暂时通过，后续调色需复验） · 创建 2026-11-14
> 规则：每一项必须有可复现的证据（命令输出、截图、URL），不接受「看起来没问题」。

## 1. 自动化检查

| # | 检查 | 命令 | 期望 |
| --- | --- | --- | --- |
| V1 | 源码无 hex / rgb | `pnpm --filter @ds/tokens build` | 存在 hex 时构建失败 |
| V2 | 色域合规 | `pnpm --filter @ds/tokens test` | 超 sRGB 时报错并指出 token 名 |
| V3 | hex 快照 | `pnpm --filter @ds/tokens test` | 未更新快照时失败，diff 指出具体项 |
| V4 | 产物数量 | 构建后统计 CSS 文件 | 等于 `2 + N`（S1 为 3） |
| V5 | alias 完整性 | 构建期校验 | 悬空引用导致失败 |
| V6 | 构建可重复 | 连续构建两次并比对 | 产物字节一致 |
| V16 | 命名分层 | `src/**` 中检索 token 路径 | 全部以 `raw` / `semantic` 开头，无 `comp` |
| V17 | raw 变量隔离 | 检查 `dist/**/*.css` 与组件源码 | 主题 CSS 同时含 `--raw-*` / `--semantic-*`；品牌 CSS 只含 `--raw-color-brand-*`；组件源码无 `--raw-*` 引用 |
| V18 | 非颜色产物 | 检查 CSS 与 JSON | space / text / radius 均存在，Color 页不出现 |

## 2. 人工验收

| # | 检查 | 期望 |
| --- | --- | --- |
| V7 | Color 页无硬编码 | 页面源码 `grep` 不到 hex |
| V8 | 切换生效 | 切换 theme 后色块与变量名同步变化；brand 参数经 URL 生效 |
| V9 | 复制变量名 | 点击复制得到 `--semantic-color-bg-surface` 这类变量名，不是 `#ffffff` |
| V10 | 状态可复现 | 刷新、复制 URL 到新标签页，状态一致 |
| V11 | 支持矩阵 | fixture 品牌不支持暗色时，不产出对应 CSS 且切换被禁用 |
| V12 | 观感比对 | 关键色与旧版设计稿并排比对，差异已确认可接受 |
| V13 | 语义色分组 | 分组为 Background / Text / Border / Action / Status，无按色相的分组 |
| V14 | 原始色阶降级 | 默认收起、无复制按钮、无可点击进入的独立入口 |
| V15 | 组合预览联动 | 切换 theme / brand 后组合预览整块重绘，与当前 token 一致 |
| V19 | 状态展示 | 有状态变体的 token 按状态并列展示，行数与产物一一对应 |

## 3. 证据记录

| 项 | 证据 | 执行日期 | 结果 |
| --- | --- | --- | --- |
| V1 | `tests/violations.test.mjs`：fixture 注入 hex，构建退出码非 0 | 2026-11-19 | 通过 |
| V2 | `tests/build.test.mjs` 产物色域检查；fixture 超色域报 `probeGamut` | 2026-11-19 | 通过 |
| V3 | 快照测试；临时把 neutral.500 改为 0.681 后列出 3 项变更 | 2026-11-19 | 通过 |
| V4 | `dist` 含 3 个 CSS：theme-light / theme-dark / brand-base | 2026-11-19 | 通过 |
| V5 | fixture 把 alias 指向 `raw.color.neutral.999`，构建失败 | 2026-11-19 | 通过 |
| V6 | 连续两次构建 sha256 一致 | 2026-11-19 | 通过 |
| V7 | `grep -rnE "#[0-9a-fA-F]{3,8}\b" apps/docs/src` 无结果 | 2026-11-19 | 通过 |
| V8 | 浏览器点击 Dark：URL `theme=dark`，swatch 由 oklch(0.985 0 0) 变为 oklch(0.155 0 0) | 2026-11-19 | 通过 |
| V9 | 点击「复制变量名」后显示「已复制」，写入值为 `--semantic-color-bg-page` | 2026-11-19 | 通过 |
| V10 | 新标签打开 `?theme=dark&brand=base`，Cmd+R 前后 URL 与 aria-pressed 一致 | 2026-11-19 | 通过 |
| V11 | 仅单品牌 base，支持 light / dark；fixture 品牌与切换禁用移出 S1 | — | 移出 S1 |
| V12 | 用户确认当前关键色可接受；后续继续调色时需重新比对 | 2026-11-19 | 暂通过 |
| V13 | 页面分组 Background / Text / Border / Action / Status | 2026-11-19 | 通过 |
| V14 | 原始色阶默认收起、无复制按钮、无独立入口 | 2026-11-19 | 通过 |
| V15 | 切 Light / Dark 后组合预览与色卡整块变化 | 2026-11-19 | 通过 |
| V16 | 测试断言 token id 仅以 raw / semantic 开头，无 comp | 2026-11-19 | 通过 |
| V17 | 测试断言主题 CSS 含两类变量，品牌 CSS 仅 `--raw-color-brand-*` | 2026-11-19 | 通过 |
| V18 | 测试断言 CSS / JSON 含 space / text / radius；Color 页只渲染颜色 | 2026-11-19 | 通过 |
| V19 | 无状态变体（D10）；语义色 32 个对应 32 行 | 2026-11-19 | 通过 |

## 4. 未通过的处理

- **V1–V6、V16–V18 失败**：修实现，不改验收标准。若确认标准有误，先改 `requirements.md` 再改测试。
- **V7–V15、V19 失败**：判定为实现缺陷，不走「先记一条已知问题」。
- **V12 观感不通过**：属于品牌色决策，回到 `plan.md §3.3` 重新定色阶，不在页面层做补偿。

## 5. 完成判定

V1–V10、V13–V19 全部通过并填写证据；V11 移出 S1，随第二个品牌引入时验收；V12 由用户确认暂时可接受，后续调整颜色时重新验证。之后在 `CHANGELOG.md` 追加对应版本条目。
