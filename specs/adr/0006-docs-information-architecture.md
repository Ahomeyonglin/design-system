# ADR-0006 文档站信息架构与三层呈现

- 状态：Accepted
- 决策日期：2026-11-14
- 记录日期：2026-11-15
- 决策者：项目所有者
- 取代：无

## 背景

文档站的定位是**验收台 + 查询台**，不是官网。三类读者的目的不同：设计师查「这个场景该用哪个 token」，开发与 AI 要复制准确的变量名，利益相关者要看「换品牌 / 暗色之后长什么样」。

三层 token（core / semantic / component）的读者也不同。若三层用同一个视图平铺，会直接鼓励使用方引用 core 色阶，也会让组件层 token 看起来像公共 API。

## 备选方案

**A. 三层各开一页**：`/color/raw`、`/color/semantic`、`/component-tokens` 三个平级入口。

**B. 分层呈现**：core 折叠在 Color 页底部；semantic 作为主视图；component 只挂在所属组件详情页。

**C. 纯表格索引**：只列名称与值，不做组合预览。

## 决策

采用 **B**，页面清单为 8 条路由，S1 只实现 `/color`：

```
/                    总览（版本、token 与组件数量、支持矩阵摘要、最近变更）
/color               颜色（S1）
/type                字号与文本样式
/space               间距与尺寸
/themes              主题 × 品牌矩阵
/components          组件地图
/components/<name>   组件详情
/changelog           变更记录
```

三层呈现规则：

| 层 | 位置 | 要点 |
| --- | --- | --- |
| core / raw | `/color` 底部折叠区，默认收起 | 无复制按钮，视觉上降级为参考 |
| semantic | `/color` 主视图，按用途分组 | Background / Text / Border / Action / Status |
| component | 组件详情页内，不单独成页 | 标注 light/dark 的覆盖关系 |

## 理由

1. **原始色阶不给入口**：能点到就会有人直接引用 `color.red.500`；把它折起来、去掉复制按钮，比写十条规范更有效。
2. **组件层脱离组件没有解释力**：`button.bg.primary` 单看无法判断用得对不对；且页面只应消费 semantic 层，给 component 层独立入口等于自相矛盾。
3. **组合预览是验收台的核心**：单看色块判断不出语义色用得是否正确，必须放进真实组件里看。
4. **组件地图必须由 registry 渲染**：手写清单一定会与真实组件集漂移，人与 AI 会看到两套东西。

## 后果

- 页面内所有展示值从解析结果读取，不出现手写色值；对比度、px/rem 换算同理。
- 复制的是变量名（`var(--color-action-primary-bg)`），不是色值。
- 品牌、模式、搜索词、锚点全部进 URL，链接可分享、刷新可复现。
- 无效组合（品牌不支持暗色）必须显式禁用并说明原因，不能静默显示成亮色。
- 组件层 token 只在组件确实需要独立调整时创建；仅转手一次的中间层不建。
- 组件地图与详情页数据来自 `registry.json` + `component.meta.json`，不新增事实源。
- S3 增加「静态构建并部署到固定 URL」，文档站不再只是本地 `dev`。

## 重新评估的触发条件

1. 组件数量大到需要独立的组件检索页，而不是挂在 token 文档站里。
2. 出现第二套文档消费方（如独立站点或外部合作方），需要拆分部署。
3. 需要在线编辑 token 或嵌入 Figma——这两项当前明确不做。

## 参考

- `specs/tech-stack.md` §5
- `specs/2026-11-14-token-foundation/requirements.md` R5、R7、R8
- `specs/roadmap.md` S3
- [ADR-0005](./0005-registry-committed.md)
