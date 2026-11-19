# ADR-0011 采用 Terrazzo 2.10.0 解析 DTCG 2025.10 Resolver

- 状态：Accepted
- 决策日期：2026-11-19
- 记录日期：2026-11-19
- 决策者：项目所有者
- 取代：无

## 背景

S1 的源文件分成 raw / semantic / brand / theme，并用 DTCG 2025.10 Resolver 声明 `theme`（light / dark）与 `brand` 两个 modifier。构建需要按 **theme × brand** 组合展开，且必须原生解析跨文件 alias、同名覆盖与 `resolutionOrder`。

此前解析库一直待定，是 P0 的唯一阻塞项。若没有库支持 Resolver，就只能自研合并逻辑。

## 备选方案

**A. Terrazzo 2.10.0**：DTCG 优先的解析器，原生实现 resolver 与 modifier。

**B. Style Dictionary 5.8.0**：生态成熟，但对 2025.10 的 Resolver 支持未完成。

**C. Cobalt UI 1.12.0**：已停止维护，且不接受 2025.10 的颜色对象格式。

**D. 自研最小解析器**：只实现本项目需要的行为。

## 验证方式

按官方 Resolver 规范构造最小 fixture：1 个 raw 颜色、1 个 semantic alias、1 个 brand 同名覆盖、light / dark 各 1 个 theme 覆盖，resolver 使用 `sets` + `modifiers` + `resolutionOrder`。对每个候选实际执行解析，检查四件事：alias、brand 覆盖、theme 切换、组合输出。

结果：

| 候选 | 版本 | Resolver | Modifier | 结论 |
| --- | --- | --- | --- | --- |
| Terrazzo | `@terrazzo/parser@2.10.0` | 原生支持 | `contexts` + `default` + permutation | 4 个组合全部正确，采用 |
| Style Dictionary | `style-dictionary@5.8.0` | 把 resolver 当普通 group，输出 0 个变量 | 无 modifier 概念 | 不通过 |
| Cobalt UI | `@cobalt-ui/core@1.12.0` | 解析即抛错 | 仅有私有 `$extensions.mode` | 排除 |

Terrazzo 的 `resolver.apply({ theme, brand })` 在 light/base、dark/base、light/acme、dark/acme 四种组合下均返回正确值；`listPermutations()` 能枚举组合。

## 决策

采用 **A**，并锁定同一 release 线的精确版本：

```json
{
  "@terrazzo/parser": "2.10.0",
  "@terrazzo/cli": "2.10.0",
  "@terrazzo/plugin-css": "2.10.0"
}
```

不使用 `^` 或 `~`。合并、alias 解析、modifier 选择与循环引用检测交给 parser，不自行实现。

## 理由

1. **唯一通过验证**：三个候选中只有 Terrazzo 原生支持 2025.10 的 resolver 与 modifier。
2. **组合枚举现成**：`listPermutations()` 直接给出 theme × brand，映射到 `2 + N` 份 CSS。
3. **覆盖语义正确**：同名覆盖后解析 alias，符合品牌覆盖 `raw.*`、主题覆盖 `semantic.*` 的设计。
4. **维护活跃**：Cobalt 官方已在 npm 弃用并指向 Terrazzo。

## 后果

- `2 + N` 份 CSS 通过 `resolver.listPermutations()` + `resolver.apply(input)` 循环生成，每个组合单独输出；resolver 逻辑不进入业务代码。
- `@terrazzo/plugin-css` 会把 oklch 做色彩空间转换（例如 `0.62 0.19 250` 输出为 `62.35% 0.186 251.9`）。**parser 的 `apply()` 数值是精确的**；若要求 CSS 数值逐位一致，需在输出层写自定义 transform / plugin。
- CSS 插件默认输出「一个文件内多个 selector」，不自动拆成多份文件。拆文件属于输出层循环，不改变解析方式。
- CSS 的 hex 回退（R2 / R4）需要在输出层实现，不能依赖插件默认行为。
- P5 必须补一条循环 alias 的失败用例；P0 未覆盖该错误路径。
- 依赖升级前先跑 P0 fixture；Terrazzo 若移除或改变 resolver 行为，视为破坏性变更。

## 重新评估的触发条件

1. Terrazzo 不再支持 DTCG 2025.10 resolver，或 resolver API 出现破坏性变更。
2. 输出层为了 hex 回退与数值保真需要维护的插件复杂度超过自研解析器。
3. 项目需要脱离 Node 生态生成 token 产物。

## 参考

- [DTCG 2025.10 Format](https://www.designtokens.org/TR/2025.10/format/)
- [DTCG 2025.10 Resolver](https://www.designtokens.org/TR/2025.10/resolver/)
- [Terrazzo Resolvers](https://terrazzo.app/docs/guides/resolvers/)
- `specs/2026-11-14-token-foundation/plan.md` P0
- [ADR-0002](./0002-dtcg-2025-10.md)、[ADR-0004](./0004-theme-brand.md)
