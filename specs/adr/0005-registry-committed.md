# ADR-0005 `registry.json` 生成后提交

- 状态：Accepted
- 决策日期：2026-11-14
- 记录日期：2026-11-15
- 决策者：项目所有者
- 取代：无

## 背景

组件库的核心产物不是代码，而是 **AI 能检索到的能力清单**：搜不到就等于组件不存在，AI 会自己造一个。

`registry.json` 的内容全部来自各组件的 `component.meta.json`，属于派生数据。是否让它进入版本库，决定了 AI 能否「clone 下来直接读」。

## 备选方案

**A. 生成后提交到包根目录**：`packages/ui/registry.json` 入库。

**B. 放 `dist/` 不入库**：与 token 产物策略一致。

**C. 不生成**：让 AI 直接 glob `**/component.meta.json`。

## 决策

采用 **A**，并同时施加三条约束：

1. CI 校验一致性：重新生成后 `git diff --exit-code`，不一致即失败。
2. 字段与排序固定（按组件 id 排序），保证 diff 稳定；排序变化视为脚本 bug。
3. 文件内标注 `generatedFrom`，说明唯一来源是 `component.meta.json`，禁止手改。

C 不采用：没有稳定路径可指向，AI 每次都要扫目录，组件一多检索效率与一致性都会下降。

## 理由

1. **AI 与 skill 免构建**：`page-assembly` 在任意新项目里工作，最不希望先跑一遍构建才能知道有哪些组件。
2. **远端与网页可检索**：GitHub 上能直接读 raw 文件、能被代码搜索索引；gitignore 的内容做不到。
3. **PR diff 暴露 API 变化**：新增 prop、删除变体都会出现在 registry 的 diff 里，评审时看得见。
4. **构建失败仍有清单**：文档站和 skill 不会因为一次构建失败而失去索引。

## 后果

- 每次组件变更都会带一条生成物 diff，PR 变长；用固定排序把冲突压到最小。
- 存在漂移风险（改了 meta 忘记重新生成），由 CI 的 `git diff --exit-code` 兜住。
- 组件目录结构固定：`src/components/<PascalCase>/` 下三件套（实现、样式、`component.meta.json`），meta 一律同名。
- 聚合清单统一叫 `registry.json`，放包根；`manifest` 一词不再用于组件清单。
- 包 `files` 必须包含 `src`、`registry.json`、`AGENTS.md`，否则装包后 AI 读不到索引。
- 文档站与页面只读 registry，不维护第二份组件清单。

## 重新评估的触发条件

1. 组件数量增长到数百个，registry 成为大文件、冲突成本高于收益。
2. 团队高频并行新增组件，合并冲突成为主要摩擦。
3. 仓库定位改为纯源码仓，所有消费方只通过安装包使用。

## 参考

- `packages/ui/AGENTS.md` §6
- `specs/tech-stack.md` §4
- [ADR-0001](./0001-monorepo.md)
