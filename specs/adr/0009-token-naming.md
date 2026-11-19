# ADR-0009 Token 命名采用 raw / semantic / comp 前缀

- 状态：Accepted
- 决策日期：2026-11-19
- 记录日期：2026-11-19
- 决策者：项目所有者
- 取代：无

## 背景

S1 需要先固定 token 命名，否则源文件、产物、文档页三处会各自发明写法。参考对象是 Fluent 2 的 alias token 与 Material 3 的 ref / sys / comp 三层命名；本项目沿用三层结构，前缀改用更直白的 raw / semantic / comp。

两份规范的共同点是：按用途命名、类分层、主题改值不改名。差异在于类前缀与层级表达：Fluent 不加前缀、用数字层级；M3 加前缀、用角色词。

本项目还有两个额外约束：token 名要能被 AI 直接读懂；组件引用 raw 层必须能被 lint 机械拦截，而不是靠文档约定。

## 备选方案

**A. 不加前缀（Fluent 风格）**：`color.bg.surface`，靠分组区分层。

**B. 加类前缀（本项目采用 raw / semantic / comp）**：`semantic.color.bg.surface`。

**C. Fluent 数字层级**：`color.bg.1` 到 `color.bg.6`。

## 决策

采用 **B**，并同时确定四条细则：

1. **类前缀**：路径首段即层，`raw`（原始值）/ `semantic`（用途）/ `comp`（组件局部）。
2. **语义层级用描述词**，不用数字：`bg.surface`、`bg.surface-raised`、`bg.subtle`。
3. **状态进语义层**，作为角色段后缀，默认态省略：`semantic.color.action.primary.bg`、`semantic.color.action.primary.bg-hover`。
4. **品牌不进路径**：品牌是 modifier，不是命名空间；跨品牌可变的色阶用调色板名 `brand`，品牌身份只存在于文件名、resolver 与 URL。

完整结构：

```
<层>.<类别>.<分组>.<角色>[-状态]
```

示例：

| 层 | 示例 |
| --- | --- |
| raw | `raw.color.brand.500`、`raw.color.neutral.50`、`raw.space.4`、`raw.text.size.300`、`raw.radius.2` |
| semantic | `semantic.color.bg.surface`、`semantic.color.action.primary.bg-hover`、`semantic.space.inline.md`、`semantic.text.body.md`、`semantic.radius.none` |
| comp | `comp.button.bg`、`comp.button.bg-hover` |

## 理由

1. **层信息不靠记忆**：`raw` / `semantic` 在名字里，AI 不需要先查文件才知道能不能用。
2. **lint 可机械执行**：组件与页面里出现 `raw.` 即违规，不需要维护「哪些分组属于 raw」的白名单。
3. **描述词优于数字**：`bg.1` 与 `bg.2` 的差别无法自解释，AI 只能靠外部文档；`surface` / `surface-raised` 自带语义。
4. **状态用后缀而不是独立层级**：DTCG 中一个 token 不能同时有 `$value` 和子节点，写成 `bg.hover` 会迫使默认态也变成 `bg.rest`。后缀方案让默认态保持短名。
5. **与产物一致**：CSS 变量名由 token 路径直接转换，变量名本身就能看出层级。
6. **品牌是上下文不是命名空间**：品牌名进路径会让 `semantic` 层随品牌分裂，组件无法写一次跨品牌复用；同名覆盖能让 `semantic` / `comp` 契约保持稳定。

## 后果

- 源文件路径全部带层前缀；brand 覆盖 `raw.*`，theme 覆盖 `semantic.*`，两者路径与基础文件一致。
- 源文件名与层前缀一致：`raw.tokens.json`、`semantic.tokens.json`。
- 品牌名不进入 token 路径，只出现在 `brands/<brand>.tokens.json`、resolver 与 URL 参数中。跨品牌可变的色阶用 `raw.color.brand.*`，色相名只留给不随品牌变化的调色板。
- 构建产物同时输出 `--raw-*` 与 `--semantic-*`（S2 起增加 `--comp-*`）：`--raw-*` 供品牌文件覆盖，`--semantic-*` 是组件与页面的消费入口。
- 组件与页面只允许消费 `--semantic-*`；组件内部可消费 `--comp-*`。引用 `--raw-*` 视为违规，由 lint 拦截，不依赖人工检查。
- 状态后缀只在确有视觉差异时创建，不要求每个 token 配齐所有状态，避免 token 数量无意义膨胀。
- 数字只作序号：`raw.space.4` 的 4 不代表 4px，单位在值里。
- 固定缩写仅保留 `bg`，其余全拼。
- ADR-0006 中的旧示例按本 ADR 的命名理解为 `raw.color.red.500`、`--semantic-color-action-primary-bg`；其信息架构决策本身不变，按「只增不改」规则不修改原文。
- `tech-stack.md` §3.3 与 `.trae/skills/` 中的命名示例需与本 ADR 保持一致。

## 重新评估的触发条件

1. token 数量增长到前缀带来的长度明显影响可读性，且 lint 已能稳定区分层级。
2. DTCG 后续版本对命名或分组提出强制约定。
3. 出现第二个消费方需要按层过滤产物，前缀不再是最省的表达方式。

## 参考

- [Fluent 2 Color tokens](https://fluent2.microsoft.design/color-tokens)
- [Material 3 Design tokens](https://m3.material.io/foundations/design-tokens/overview)
- `specs/tech-stack.md` §3.3
- `specs/2026-11-14-token-foundation/requirements.md` R1、R2、R9
- [ADR-0006](./0006-docs-information-architecture.md)
