# Roadmap — 交付路线

> 状态：草案 v0.2 · 最后更新 2026-11-16
> 原则：每个阶段都能独立验收，不做「半成品等最后一起来」的交付。

## 规格目录约定

每个功能一个目录，路径为 `specs/<YYYY-MM-DD>-<kebab-case-功能名>/`，内含 `requirements.md`、`plan.md`、`validation.md` 三件套。

- 只用日期，不用序号：日期本身即时间顺序，不需要额外维护计数器。
- 目录一经创建不改名，功能范围变化时改内容而不是改名字。
- 宪法三份（mission / tech-stack / roadmap）直接放在 `specs/` 根，不进入功能目录。

## 阶段总览

| 阶段 | 主题 | 核心交付 | 依赖 |
| --- | --- | --- | --- |
| S0 | 地基 | 宪法 + 仓库骨架 | 无 |
| S1 | 单一事实源 | token 包 + Color 页 | S0 |
| S2 | 组件可消费 | 最小组件集 + `registry.json` + component-sync | S1 |
| S3 | AI 可组装 | 文档站补全 + page-assembly | S2 |
| S4 | 治理 | semver / changelog / 门禁 / 跨仓通知 | S3 |

顺序理由：token 是一切的输入，必须先稳定；组件是可复用单元，先于页面；治理放到最后，因为没有真实变更有治理对象时，规则只会写空。

---

## S0 · 地基

**目标**：把「做什么、怎么算合规」写成可引用的文件，避免后续每一步重新争论。

**交付**
- 三份宪法：`mission.md`、`tech-stack.md`、`roadmap.md`
- 仓库骨架：pnpm workspace、三个包、skills 目录、CI 目录
- 根 `AGENTS.md`：项目级约定入口

**验收**
- 三份宪法无相互冲突的条款
- `pnpm -v` 环境就绪，workspace 能被 pnpm 识别

**不包含**：任何 token 值、任何组件、文档站页面。

---

## S1 · token 包 + Color 页

**目标**：跑通「源文件 → 解析 → CSS/JSON → 页面展示」的最小闭环，并且闭环里没有硬编码。

**交付**
- `src/raw.tokens.json`：原始色阶
- `src/semantic.tokens.json`：语义 alias，`theme` 只做重映射
- `src/brands/<brand>.tokens.json`：品牌完整色阶
- `src/themes/{light,dark}.tokens.json`
- `src/resolver.json`：声明 theme × brand 组合与支持矩阵
- 非颜色基线 token（space / typography / radius）：与颜色同一链路，类别与命名规则待定
- `scripts/build`：产出 CSS 变量（`2 + N` 份）、JSON、6 位 hex 回退
- `tests/`：hex 快照 + 超 sRGB 色域校验 + 非颜色值快照
- `apps/docs`：可运行骨架 + Color 页

**验收**
- `src/**` 中 `grep` 不到 hex
- 构建产出 `2 + N` 份 CSS（S1 只有 1 个品牌，即 3 份），切换 theme 生效
- Color 页所有色块与色值来自解析结果，无手写值
- 可一键复制变量名
- 单品牌下不渲染品牌切换器；仅 light 品牌的禁用逻辑由测试 fixture 验证
- 非颜色 token 出现在 CSS / JSON 产物中，并在 Color 页有对应区块
- 故意改一个颜色或间距 → 快照测试失败

**不包含**：Type / Space / Themes / Changelog 页、第二个品牌、非颜色 token 的独立页面、组件、AI skill。

---

## S2 · 组件最小集 + registry

**目标**：让组件成为 AI 能读懂的单元，而不是只能被人肉搜索的代码。

**交付**
- 5 个原子组件（覆盖文本、操作、表单、容器、标记五类）
- Button / TextField 所需的交互状态 token：hover / disabled / focus / invalid
- 每个组件目录含实现、样式、`component.meta.json`
- `scripts/build-registry`：聚合成固定排序的 `registry.json`，**生成后提交**
- `packages/ui/AGENTS.md`：组件使用规则
- `.trae/skills/component-sync`：新增/修改组件的执行规则
- 组件 lint：禁止直接引用 `raw` token、禁止硬编码间距
- `apps/docs` 的组合预览改用真实组件（不新增组件预览页）

**验收**
- 新增一个组件后重新生成 registry，diff 稳定且可读
- 手改 registry 会被 CI 拦下
- 故意在组件里写死色值 → lint 失败
- 按 component-sync 流程走一遍，产出符合规范
- 组合预览全部由真实组件渲染，切换主题后组件颜色与边框同步变化

**不包含**：页面级组合、文档站的组件地图与组件详情页。

---

## S3 · 文档站补全 + page-assembly

**目标**：验证「AI 只读规范就能拼页」这一核心假设。

**交付**
- 文档站补齐总览 / Type / Space / Themes / Changelog
- Components 页：组件地图 + 组件详情，全部由 `registry.json` 渲染
- 搜索、锚点、品牌与模式状态进 URL
- 文档站自身完全用本套 token 构建
- 静态构建并部署到固定 URL，链接可分享
- `.trae/skills/page-assembly`：从需求到页面的组装规则
- 一个真实页面作为样板

**验收**
- 给 AI 一段页面需求，产出页面无需人工改颜色/间距
- 页面中 `grep` 不到硬编码样式值
- 所有页面的值均来自解析结果
- 新增一个组件后，组件地图自动多一项，无需改页面代码
- 静态产物可部署，他人通过 URL 即可访问

**不包含**：视觉回归基线自动化（只在人工确认后更新基线）。

---

## S4 · 治理

**目标**：让这套系统在持续变更下不腐化。

**交付**
- semver 策略与 `$deprecated` 过渡流程
- `CHANGELOG.md` 由变更自动生成
- CI 完整门禁：hex 快照、色域、registry 漂移、token 引用完整性、lint
- 跨仓变更的通知与升级 PR 流程（只通知 + 提 PR，不自动改下游视觉基线）

**验收**
- 一次破坏性改名能完整走完「弃用 → 迁移 → 移除」
- 下游仓库收到升级 PR 且能单独回滚

---

## 风险

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| DTCG 格式仍是 Final Report，可能再变 | 解析链路返工 | 锁版本 + 快照测试，把差异显性化 |
| 品牌色阶在 oklch 下重算后观感与旧版不一致 | 需要重新审色 | 品牌色确认后再进 S1，不在链路里做折中 |
| AI 生成质量不稳定 | 能否验收变模糊 | 每个 skill 都带可执行校验，用校验结果而非观感判定 |
