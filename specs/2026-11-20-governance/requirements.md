# Requirements — Governance：CI 门禁与变更日志

> 包名说明：文中 `@ds/*` 为当时的包名，已于 2026-11-22 改为 `@ahomeyonglin/*`（见 [ADR-0015](../adr/0015-public-npm-distribution.md)）。照抄命令时请替换包名。

> 阶段：S4（第一部分）· 状态：已确认（2026-11-20）· 创建 2026-11-20
> 上游约束：`specs/mission.md`、`specs/tech-stack.md`、`specs/roadmap.md`
> 范围声明：本规格只覆盖 S4 的「CI 门禁 + CHANGELOG 自动生成」。完整 semver 策略、npm 发布、跨仓升级 PR 不在本阶段，见 `roadmap.md` S4 其余项。

## 1. 问题

| 现状 | 后果 |
| --- | --- |
| CI 只跑构建、测试、lint、registry 漂移 | 生成物被误入库、token 引用方向错误、带 `base` 的产物坏掉，都要等部署后才发现 |
| `CHANGELOG.md` 全手写 | 必然漏记：2026-11-20 的边框与遮罩调整就没有记录，靠人提醒补 |
| 提交信息没有格式约定 | 无法从提交历史派生变更条目，review 时也看不出影响面 |
| 没有版本基线（无 tag） | 「自上次以来」没有边界，生成器无从判断范围 |

## 2. 目标

1. 建立可执行的提交信息规范，并在 CI 中拦截不合规提交。
2. `[Unreleased]` 区块由脚本从 git 历史生成，CI 拦截过期文件。
3. 补齐五条 CI 门禁：提交信息、CHANGELOG 过期、生成物入库、token 引用方向、带 `base` 构建。
4. 零新增依赖：纯 Node 脚本 + `node --test`。
5. 文档站 `/changelog` 不做改动即可渲染新结构。

## 3. 已定决策

2026-11-20 讨论确认，后续实现以此为准：

| # | 决策 | 结论 |
| --- | --- | --- |
| D1 | 提交规范 | Conventional Commits 子集：`type(scope): subject`，允许中文 subject；`type` 限定 `feat` / `fix` / `refactor` / `perf` / `docs` / `style` / `test` / `build` / `ci` / `chore`；`scope` 可选，白名单 `tokens` / `ui` / `docs` / `repo` / `skills` |
| D2 | 生成机制 | 自写 `scripts/changelog.mjs`，不引入 changesets、conventional-changelog、commitlint 等依赖 |
| D3 | 条目来源 | 条目文案只取单行 subject；`BREAKING CHANGE` footer 只用于判定破坏性，不进入文案；需要额外说明时写进 commit body，不写进日志 |
| D4 | 分组映射 | `feat` → Added，`fix` → Fixed，`perf` / `refactor` → Changed；`docs` / `style` / `test` / `build` / `ci` / `chore` 不进入日志；`!` 或 `BREAKING CHANGE` 统一归入 Changed，并在条目文案前加「破坏性：」，不新增四级标题（文档站只渲染到三级标题） |
| D5 | 版本基线 | 现有 `[Unreleased]`（S1–S3 手写记录）整体下移为 `## [0.0.0] - 2026-11-20`，并打 tag `v0.0.0` 作为生成边界；此后 `[Unreleased]` 只由脚本写入 |
| D6 | 版本策略 | 本阶段不定义 semver 与发版流程；脚本按「最近的 `v*` tag」取范围，为后续发版保留接口 |
| D7 | 手改禁令 | `[Unreleased]` 除脚本写入外禁止人工编辑；人工补充说明写 commit body |
| D8 | 校验范围 | CI 对 `push` 与 `pull_request` 都校验；首次接入不追溯 tag 之前的历史提交 |
| D9 | 失败提示 | 违规时输出 SHA、原提交标题与期望格式，只报错不自动改写提交 |
| D10 | 门禁形态 | 每条门禁都要有可复现的本地命令，CI 只负责调用同一命令，不写第二套逻辑 |

## 4. 范围

**做**

- 根目录 `scripts/`：提交信息校验、CHANGELOG 生成与校验
- 根 `package.json` 新增 `commit:check`、`changelog:check`、`changelog:write`
- `CHANGELOG.md` 历史条目迁移与 `v0.0.0` 基线
- token 引用方向测试（在 `@ds/tokens` 现有测试中追加）
- CI 新增五项检查，保持现有步骤不变
- 根 `AGENTS.md` 与 `specs/tech-stack.md §6` 同步

**不做**

- 完整 semver 策略、发版流程、`CHANGELOG` 版本区块的自动归档
- npm 发布、GitHub Release、自动打 tag
- 跨仓通知与升级 PR
- 本地 commit hook（husky / lefthook）
- 视觉回归基线
- 第二个品牌

## 5. 功能需求

### R1 提交信息规范

- 标题格式：`<type>(<scope>)!: <subject>`，`!` 与 `scope` 可省略。
- 正则：`^(feat|fix|refactor|perf|docs|style|test|build|ci|chore)(\((tokens|ui|docs|repo|skills)\))?!?: .{1,72}$`。
- subject 长度 1–72 字符，中英文均按字符计数。
- 豁免：`Merge ...`、`Revert "..."` 以及以 `fixup!` / `squash!` 开头的标题。
- 校验范围由参数传入：`<base>..<head>`；本地默认校验 `HEAD~1..HEAD`。
- 违规输出：短 SHA、原标题、期望格式各一行；任一违规即退出非 0。

**验收**：fixture 中合法标题全部通过；缺 type、非法 type、非法 scope、缺空格、超长、空 subject 均失败并指到具体提交。

### R2 CI 门禁

在现有 `ci.yml` 的 `verify` job 中追加，不新建 job：

| # | 门禁 | 命令 | 拦截内容 |
| --- | --- | --- | --- |
| G1 | 提交信息 | `pnpm commit:check` | 不合规的提交标题 |
| G2 | CHANGELOG 过期 | `pnpm changelog:check` | 代码已改但 `[Unreleased]` 未重新生成 |
| G3 | 生成物入库 | `git ls-files packages/tokens/dist` 必须为空，且 `git diff --exit-code` 覆盖 `registry.json`（已有） | 手改或误提交生成物 |
| G4 | token 引用方向 | `pnpm --filter @ds/tokens test`（新增用例） | 反向引用与跨层引用 |
| G5 | 带 base 构建 | `VITE_BASE=/design-system/ pnpm --filter @ds/docs build` | 只在默认 base 下能通过的资源路径问题 |

- G1 / G2 的范围来源：PR 用 `github.event.pull_request.base.sha..head.sha`；push 用 `github.event.before..sha`；`before` 全 0 时回退到 `v0.0.0`。
- 现有步骤与顺序不变，新步骤插在 `Lint docs` 之前。

**验收**：五条门禁各自注入反例即失败、恢复即通过；CI 绿灯时本地跑同样命令也是绿灯。

### R3 CHANGELOG 自动生成

- 生成范围：最近 `v*` tag（含 `v0.0.0`）到 `HEAD` 的提交。
- 输出结构：

```markdown
## [Unreleased]

### Added

- 新增控件禁用态 token（`abc1234`）

### Changed

- `semantic.color.border.strong` 改为中性 800（`def5678`）
```

- 分组固定顺序：Added / Changed / Deprecated / Removed / Fixed；空分组不输出。
- 存在 `!` 或 `BREAKING CHANGE` 时，无论原 type 为何，一律归入 Changed，并在条目文案前加「破坏性：」；该条目不再重复出现在 Added / Fixed。
- 条目文案：去掉 `type(scope): ` 前缀；有 scope 时渲染为 `<scope>: 描述`；末尾附短 SHA。
- scope 对应的 type 不进入日志时（如 `docs(repo)`），整条跳过。
- 无新增提交时输出 `## [Unreleased]` 加一行纯文本「暂无未发布变更」，不使用斜体等未支持的语法。
- `--write` 重写 `[Unreleased]` 区块，保留其下所有历史区块原样；连续执行两次字节一致。
- `--check` 只比较不写入，过期时打印期望区块的前 20 行并退出非 0。
- 生成逻辑拆成纯函数（解析提交 → 分组 → 渲染），可用 fixture 提交列表测试，不依赖真实仓库。

**验收**：feat / fix / refactor 正确分组；docs / chore 不出现；破坏性变更进入独立小节；中文 subject 原样保留；重复执行幂等；手工改动的 Unreleased 会被 `--check` 拦下。

### R4 历史迁移与基线

- 现有 `[Unreleased]` 内容整体下移为 `## [0.0.0] - 2026-11-20`，正文首行注明「S1–S3 开发期，未发布」。
- 新的 `[Unreleased]` 由脚本生成。
- 在迁移提交上创建 tag `v0.0.0` 并推送；后续发版沿用 `v*` 前缀。
- 迁移只做一次，历史区块此后再不参与生成。

**验收**：`git tag -l` 含 `v0.0.0`；迁移后 `changelog:check` 通过；历史区块内容与迁移前逐条一致。

### R5 token 引用方向

- `raw.*` 只能引用 `raw.*` 或字面量。
- `semantic.*` 可引用 `raw.*` 与 `semantic.*`，禁止引用 `comp.*`。
- `comp.*` 可引用 `semantic.*` 与 `comp.*`，禁止引用 `raw.*`。
- 解析 `tokens.json` 中的 alias 值，逐条校验目标层；违规时报出 token 路径与目标路径。

**验收**：现有 token 全部通过；三类违规 fixture 分别失败并指出 token 路径。

### R6 规则与文档同步

- 根 `AGENTS.md`：命令表新增 `commit:check`、`changelog:check`、`changelog:write`；硬规则新增「`[Unreleased]` 禁止手改」与「提交信息必须符合规范」。
- `specs/tech-stack.md §6`：验收与 CI 表新增 G1–G5。
- `CHANGELOG.md`：本次治理工作本身按新规范记录。
- 文档站 `/changelog` 不改代码，确认新结构可渲染（`##` 标题 + 列表）。

**验收**：AGENTS.md 与 tech-stack 描述的命令可直接执行；`/changelog` 页面显示迁移后的历史区块与新的 Unreleased。

## 6. 不变量

- 不新增任何运行时或开发依赖；不引入第三方 changelog / commitlint 工具。
- 现有 CI 步骤与顺序不减少，registry 漂移检查保留。
- 生成脚本只写 `CHANGELOG.md` 的 `[Unreleased]` 区块，不触碰其他文件。
- `packages/tokens/dist` 继续不入库；`registry.json` 继续入库。
- tag 只作为生成边界，不代表发布。

## 7. 待输入

| 问题 | 处理 |
| --- | --- |
| 是否要本地 pre-commit hook | 本阶段不做；若需要，后续单独加，不塞进本次范围 |
| tag 是否使用 `v0.0.0` | 已按包版本 `0.0.0` 与「未发布」状态确认，发版时另立 semver 规格 |
| 合并方式 | 若改用 squash merge，G1 校验对象是 PR 标题与提交列表，需在实现时确认仓库当前合并策略 |
