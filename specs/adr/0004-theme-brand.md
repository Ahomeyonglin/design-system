# ADR-0004 theme + brand 双 modifier + 支持矩阵

- 状态：Accepted
- 决策日期：2026-11-14
- 记录日期：2026-11-15
- 决策者：项目所有者
- 取代：无

## 背景

需求是「多品牌、每个品牌下支持暗色、且有些品牌不支持暗色」。DTCG Resolver 的 modifier 只能各自枚举 context，没有「这个组合不合法」的语法。

讨论中评估过三种结构，其中「给不支持的品牌放一个空的 dark context」被明确否掉：它会生成一个看起来像亮色的暗色主题，属于静默错误。

## 备选方案

**A. 单 `theme` modifier**：品牌与模式拍平为 `light` / `dark` / `brandC-light` 等 2N 个 context。无效组合在结构上不可表达，但 CSS 也要输出 2N 份，加品牌需重写所有主题。

**B. 双 modifier + manifest**：`theme`（light/dark）与 `brand`（a/b/c）各自独立；另用一份 manifest 声明哪些组合真实存在。

**C. 双 modifier + 空 context 占位**：为不支持暗色的品牌提供空文件。

## 决策

采用 **B**，并配一份支持矩阵 manifest。C 明确禁止。

分工规则（这是 B 能保持正交的前提）：

| 谁 | 只允许定义 | 例子 |
| --- | --- | --- |
| `brand` modifier | 品牌完整色阶 | `color.brand.50`–`color.brand.950` |
| `theme` modifier | 语义角色 → 色阶档位的 alias | 暗色下 `action.primary.background → {color.brand.400}` |

## 理由

1. **CSS 从 2N 降到 2 + N**：`[data-theme="dark"]` 与 `[data-brand="b"]` 分开输出，浏览器自己组合；加一个品牌只多一个 `[data-brand]` 块。
2. **消费方只有一个输入**：`<ThemeProvider theme="dark" brand="b" />`，可选值来自枚举，AI 不会拼出不存在的组合。
3. **manifest 无论如何都需要**：即使选 A，也要回答「品牌 C 支持哪些模式」「系统暗色偏好是否覆盖」。既然要写，就让它同时驱动构建、文档、类型与 CI。
4. **完整色阶强制校验**：品牌必须给全 50–950，避免某个品牌只有主色、暗色下对比度不足。

## 后果

- 主题文件禁止出现颜色字面量，只能是 alias；构建时校验，否则品牌替换会断链。
- 无效组合在结构上仍然「可表达」，必须由 manifest 在构建期与运行时双重拦截，类型不能替代校验。
- 品牌不支持暗色时：强制 light、隐藏切换入口，不能静默显示成亮色。
- Resolver 只是构建期的组合描述；浏览器不读 `.resolver.json`，运行时仍靠 CSS 变量 + `data-theme` / `data-brand`。
- 响应式不进入 Resolver：它不产生互斥的静态变体，留在 CSS 媒体查询里，否则组合数与产物翻倍。

## 重新评估的触发条件

1. 超过一半的品牌不支持暗色，或每个品牌支持的模式各不相同（矩阵过稀，B 的正交只剩名义）。
2. 某个品牌需要专属的暗色中性色（此时把它降级为一个独立 context，与 B 共存）。
3. 品牌数量增长到需要按品牌拆人维护，且发布节奏不同。

## 参考

- `specs/tech-stack.md` §3.4
- `specs/2026-11-14-token-foundation/requirements.md` R6
- [ADR-0002](./0002-dtcg-2025-10.md)
