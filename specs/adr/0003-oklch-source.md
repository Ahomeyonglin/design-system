# ADR-0003 颜色以 OKLCH 为唯一源，hex 由构建生成

- 状态：Accepted
- 决策日期：2026-11-14
- 记录日期：2026-11-15
- 决策者：项目所有者
- 取代：无

## 背景

颜色是这套 token 的第一批内容，需要先定「源文件里颜色长什么样」。当时用同一组三个颜色分别写成 OKLCH 与 sRGB 做过对照，结论不是凭感觉得出的。

同时确认了首批消费方：**只有 Web（文档站 + 组件库）**，不含 iOS / Android。

## 备选方案

**A. sRGB 源**：`components: [r, g, b]`，0–1，全兼容。

**B. OKLCH 源 + 构建生成 hex**：源只写 `colorSpace: "oklch"` 与 L/C/H；`dist` 注入 6 位 hex。

**C. OKLCH 源 + 手写 hex**：两者都写在源文件里。

## 决策

采用 **B**。

- `packages/tokens/src/**` 禁止出现 hex / rgb。
- `packages/tokens/dist/**` 由构建注入 6 位 hex 回退，并保留原始 OKLCH。
- 转换库锁定精确版本，配 hex 快照测试。
- 超出 sRGB 色域直接报错，第一版不做 gamut mapping 策略。

## 理由

1. **色阶质量**：OKLCH 的 L/C/H 可独立调节，固定 C/H 只降 L 就能得到感知均匀的 50–950 色阶；sRGB 三个小数没有这层结构。
2. **人的可读性**：`0.72 / 0.15 / 25` 能看出「浅、艳、偏橙」；`0.9569 / 0.4824 / 0.4549` 只能靠工具。
3. **单一事实源**：hex 是派生值。同时写 `components` 和 `hex`，改一处忘一处会出现「同一个 token 两种颜色」且不报错。
4. **评审成本**：调色只改一个数，diff 只有一行；不用同步重算 hex。

## 后果

- 旧环境需要 hex 回退：CSS 先输出 hex，再用 `@supports (color: oklch(...))` 覆盖为 `oklch()`。
- 超色域颜色在不同工具下 gamut mapping 结果不一致，所以第一版直接禁止，而不是选一个算法。
- 构建依赖转换库的舍入行为，因此必须有 hex 快照锁住结果。
- 无原生端消费方，`dist` 不需要额外输出 sRGB 分量文件。

## 重新评估的触发条件

1. 需要 P3 / 宽色域品牌色（此时要为少数 token 引入显式 gamut mapping 策略）。
2. 出现 iOS / Android 等原生端消费方（需要在产物中增加 sRGB 分量与舍入规则）。
3. 设计侧改为在 Figma 中直接维护颜色（源格式可能变成 Figma 变量导出）。

## 参考

- `specs/tech-stack.md` §3.2
- [ADR-0002](./0002-dtcg-2025-10.md)
- `specs/mission.md` §5（不做原生端 token 输出）
