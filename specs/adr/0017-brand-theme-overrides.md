# ADR-0017 品牌级主题语义覆盖

- 状态：Accepted
- 决策日期：2026-11-23
- 记录日期：2026-11-23
- 决策者：项目所有者
- 关联：[ADR-0004](./0004-theme-brand.md)、[ADR-0016](./0016-zhixing-brand-color.md)

## 背景

现有模型是 `theme` + `brand` 双 modifier：品牌只能覆盖 `raw.color.brand.*`，主题只能覆盖 `semantic.*`。主题文件对所有品牌统一生效。

`zhixing` 需要在暗色下只调整自己的主操作颜色（见 ADR-0016）。如果直接修改 `themes/dark.tokens.json`，`base` 也会被一起改掉，违反「品牌独立」的前提。

## 备选方案

**A. 修改全局主题**：在 `themes/dark.tokens.json` 覆盖 `action.primary`。

**B. 为每个品牌复制一份主题文件**：resolver 的 theme context 按品牌拆分。

**C. manifest 声明品牌级覆盖文件**：品牌在指定主题下对 `semantic.*` 打补丁，构建时合并。

## 决策

采用 **C**。manifest 的品牌配置允许声明 `overrides`：

```json
"zhixing": {
  "themes": ["light", "dark"],
  "overrides": { "dark": "./brands/zhixing.dark.tokens.json" }
}
```

覆盖文件规则：

1. 只允许 `semantic.*` 且在该组合中已存在的 token，不允许 `raw.*`、`comp.*` 或新增 token。
2. 值只允许 alias（如 `{raw.color.brand.400}`）；alias 目标必须在同一组合中存在，且类型一致。支持 color / dimension / fontWeight / fontFamily；复合 `typography` 需改为调整其组成 token。
3. 每个 token 必须带非空 `$description`，`$type` 必填。
4. 声明的主题必须在该品牌 `themes` 内。
5. 构建时把覆盖合并进对应 `theme/brand` 组合，token 数量不变；颜色合入后仍走 sRGB 色域校验。
6. 生成 CSS 放入 `@layer tokens.theme` 与 `@layer tokens.brand`，并在每个文件声明层级顺序；品牌层固定高于主题层，选择器只负责匹配。覆盖只输出到 `brand-<brand>.css`，主题 CSS 以 manifest 首个品牌为基准，不包含任何品牌覆盖。

## 理由

1. **品牌独立**：覆盖挂在品牌上，`base` 的解析值与产物完全不变。
2. **不新增解析维度**：resolver 仍是 theme × brand 两维；覆盖只是组合内的补丁，工具与页面读取逻辑无需特判。
3. **只允许 alias**：覆盖只做重映射，不写新值；这条规则与类型无关，颜色、间距、字重、字体共用一条代码路径，避免为每种类型实现字面量校验。
4. **校验可执行**：层级、目标存在性、类型一致性、非空说明与 sRGB 都在构建期拦截，不依赖人工 review。
5. **用级联层固定优先级**：`tokens.brand` 高于 `tokens.theme`，不靠 `[data-theme][data-brand]` 的特异性取胜，也不依赖文件加载顺序；选择器只负责匹配。

## 后果

- `build.mjs` 增加覆盖解析、校验、合并与品牌 CSS 输出；没有 `overrides` 的品牌行为不变。
- 主题 CSS 显式以 manifest 第一个品牌为基准，避免 permutation 顺序影响产物。
- 产物 JSON 的 `dark/zhixing` 是完整组合，文档站与下游无需了解覆盖机制。
- 生成 CSS 位于 `@layer tokens.theme` / `tokens.brand`：这是样式级行为变化，宿主未分层声明会高于 tokens 层；下游升级时需知悉，变更日志应标注。
- 覆盖范围支持非复合 token；复合 `typography` 与新增 token 仍不支持，需要时另开规格。

## 重新评估的触发条件

1. 覆盖需求扩展到复合 `typography` 或需要新增 token。
2. 出现「同一品牌同一主题需要多个覆盖文件」的复杂场景。
3. resolver 升级后原生支持品牌级主题补丁，可简化 manifest 设计。
4. 宿主样式与 `@layer` 的协作方式出现无法接受的冲突。

## 参考

- [ADR-0004](./0004-theme-brand.md)
- [ADR-0016](./0016-zhixing-brand-color.md)
- `specs/2026-11-23-second-brand/requirements.md` R3–R5
