# Plan — 第二个品牌 zhixing 与品牌级主题覆盖

> 对应规格：`requirements.md` · 状态：已确认（2026-11-23）· 创建 2026-11-23
> 前置：多品牌矩阵、品牌切换与文档站验收台已在 S3 完成。

## 1. 实施顺序

| 步 | 内容 | 产出 | 验证 |
| --- | --- | --- | --- |
| P0 | 规格确认 | `requirements.md` 的 B-D1–B-D9 | 色阶、暗色策略、覆盖范围无歧义 |
| P1 | 品牌色阶 | `brands/zhixing.tokens.json` | 构建后 500 为 #183E7B，色域通过 |
| P2 | 暗色覆盖 | `brands/zhixing.dark.tokens.json` | 4 个 alias token，均带说明 |
| P3 | 声明与解析 | `manifest.json`、`resolver.json` | 产出 4 个组合 |
| P4 | 构建机制 | `build.mjs` 覆盖校验、合并与 CSS 输出 | 正例产物正确，反例被拦截 |
| P5 | 测试 | `build.test.mjs`、`references.test.mjs`、`overrides.test.mjs` | 23 项通过 |
| P6 | 文档站 | `apps/docs/src/main.tsx` | lint / test / build 通过 |
| P7 | 规则同步 | specs 三件套、ADR-0016/0017、`tech-stack.md`、`AGENTS.md`、`README.md` | 描述与实现一致 |

## 2. 文件清单

**新增**

```
packages/tokens/src/brands/zhixing.tokens.json
packages/tokens/src/brands/zhixing.dark.tokens.json
packages/tokens/tests/overrides.test.mjs

specs/2026-11-23-second-brand/
├── requirements.md
├── plan.md
└── validation.md

specs/adr/0016-zhixing-brand-color.md
specs/adr/0017-brand-theme-overrides.md
```

**修改**

- `packages/tokens/src/brands/manifest.json`：`zhixing` 声明 `overrides.dark`。
- `packages/tokens/src/resolver.json`：`brand.contexts` 增加 `zhixing`。
- `packages/tokens/scripts/build.mjs`：读取并校验 `overrides`，合并进组合，品牌 CSS 追加主题覆盖块；主题 CSS 以 manifest 首个品牌为基准。
- `packages/tokens/tests/build.test.mjs`：CSS 数量与 zhixing 断言。
- `packages/tokens/tests/references.test.mjs`：`*.dark.tokens.json` 归入 semantic 层。
- `apps/docs/src/main.tsx`：引入 `brand-zhixing.css`。
- `specs/adr/README.md`、`specs/tech-stack.md`、`AGENTS.md`、`README.md`：索引与规则同步。

## 3. 关键决策

1. **覆盖放在品牌而不是主题（B-D4）**：主题文件是全局的，按品牌改语义必须挂在品牌上，否则会连带改变 `base`。
2. **manifest 驱动而不是新增 resolver modifier（R3）**：覆盖是「品牌 + 主题」的补丁，不是新的解析维度；用 manifest 声明可保持 resolver 结构不变。
3. **只允许 alias（B-D5）**：覆盖只做重映射，不写新值；规则与类型无关，颜色、间距、字重、字体共用一条代码路径，复合 typography 除外。
4. **覆盖合并进组合（R4）**：产物 JSON 与页面读取逻辑无需特判，`dark/zhixing` 就是完整的 133 个 token。
5. **用级联层而非特异性（B-D6）**：生成 CSS 放入 `@layer tokens.theme` / `tokens.brand`，品牌层固定高于主题层；选择器只负责匹配，不承担优先级，文件加载顺序也不影响结果。
6. **主题 CSS 固定基准品牌（B-D6）**：显式使用 manifest 首个品牌，避免 permutation 顺序影响产物。
7. **测试用临时副本（R6）**：覆盖校验的反例必须改坏源文件，复制到临时目录构建，避免污染真实产物。

## 4. 风险

| 风险 | 应对 |
| --- | --- |
| 覆盖写进主题 CSS，影响其他品牌 | 主题 CSS 只输出基准品牌；覆盖只进 `brand-*.css` |
| 别名目标不存在导致产物空值 | 构建期校验目标在当前组合存在 |
| 覆盖值超出 sRGB | 合并后仍走统一的色域校验 |
| 快照被覆盖变动误判为色值变化 | 快照显式更新；diff 只新增 zhixing 组合与暗色覆盖 |
| 宿主未分层样式覆盖 token | tokens 位于 `@layer`，未分层声明优先级更高；文档与组件规则禁止在业务样式里重声明 `--semantic-*` |
| 文档站未引入品牌 CSS 导致切换无效果 | `main.tsx` 显式引入，文档站测试与构建兜底 |

## 5. 回滚

- 删除 `zhixing` 的两个 token 文件、manifest 与 resolver 中的 `zhixing`，重新构建并更新快照，即可退回单品牌。
- `build.mjs` 的覆盖逻辑对没有 `overrides` 的品牌无副作用，可保留。

## 6. 不在本计划内

组件改造、复合 typography 覆盖、视觉回归基线、npm 发布、跨仓升级 PR。
