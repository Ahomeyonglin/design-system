# Plan — Token Foundation

> 对应规格：`requirements.md` · 状态：待评审 · 创建 2026-11-14
> 前置：解析库选型完成后进入 P0；品牌基色与文档站框架已确定。

## 1. 实施顺序

按依赖排列，每一步都能单独验证，不攒到最后一起跑。

| 步 | 内容 | 产出 | 验证 |
| --- | --- | --- | --- |
| P0 | 环境与依赖 | Terrazzo 2.10.0 精确版本、构建脚本空壳 | 4 组合解析通过（已完成） |
| P1 | raw 色阶 | `raw.tokens.json` | 无 hex、全 oklch、色域在范围内 |
| P2 | semantic + 映射 | `semantic.tokens.json` | 所有 alias 指向存在的 raw 项 |
| P3 | brand + theme + resolver | 品牌完整色阶、两套 theme、支持矩阵 | theme 内无字面量 |
| P4 | 构建 | CSS（`2 + N`）+ JSON + hex 回退 | 产物数量与内容符合 R2 |
| P5 | 校验 | 禁 hex、色域、快照三项测试 | 故意违规时失败 |
| P6 | 文档站骨架 | 可启动的空站 | 能访问 |
| P7 | Color 页 | 三段式：语义色分组 / 组合预览 / 原始色阶折叠；含切换、复制、URL 状态 | 符合 R5、R7、R8 |

## 2. 文件清单

**新增**

```
packages/tokens/
├── src/raw.tokens.json
├── src/semantic.tokens.json
├── src/resolver.json
├── src/brands/<brand>.tokens.json
├── src/themes/light.tokens.json
├── src/themes/dark.tokens.json
├── scripts/build.*
├── tests/hex-snapshot.test.*
└── tests/gamut.test.*

apps/docs/
├── index.html
├── src/sections/color.*
└── src/styles/（消费 token 产物，不写值）
```

**修改**

- `packages/tokens/package.json`：增加 `build`、`test` 脚本
- `apps/docs/package.json`：增加 `dev` 脚本
- `specs/tech-stack.md`：把待确认项落成结论

## 3. 关键决策点

1. **解析库选型（已定，ADR-0011）**：Terrazzo 2.10.0，原生支持 DTCG 2025.10 resolver 与 modifier；精确版本已锁定。
2. **hex 回退时机（已定）**：在构建期转换，而非运行时；产物中同时保留 oklch（JSON）与 hex（CSS）。
3. **色阶生成方式（已定，D4）**：关键级手定，其余级别按 L/C/H 规则补全。
4. **文档站框架（已定，ADR-0008）**：Vite + React + TS。
5. **Color 页三段式（已定，R8）**：语义色在上、组合预览居中、原始色阶折叠在底部；组件层 token 不进入本页（S1 无组件，该规则在 S2 生效）。

## 4. 风险

| 风险 | 应对 |
| --- | --- |
| 解析库对 DTCG 2025.10 支持不完整 | P0 已验证 Terrazzo 2.10.0 的 4 组合解析；升级前重跑 fixture |
| Terrazzo CSS 插件做色彩空间转换，数值与源值不逐位一致 | P4 用自定义 transform / plugin 输出，快照以 parser 结果为准 |
| 品牌色在 oklch 下重算后观感偏移 | P3 产出后先做小样比对，确认后再全量 |
| 超色域颜色被静默接受 | P5 的色域测试必须在 P4 产物上跑，而不是只测源文件 |

## 5. 回滚

token 源文件与产物分离，产物不入库。若某一步失败，删除对应源文件并重跑构建即可回到上一状态，不涉及数据迁移。

## 6. 不在本计划内

组件、registry、AI skill、其它 token 类别、npm 发布。
