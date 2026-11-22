# ADR-0014 治理门禁：自写提交规范与变更日志生成

- 状态：Accepted
- 决策日期：2026-11-20
- 记录日期：2026-11-22
- 决策者：项目所有者

## 背景

S3 上线后，`CHANGELOG.md` 完全手写，2026-11-20 的边框与遮罩调整就漏记过；提交信息没有格式约定，无法从历史派生变更；CI 只覆盖构建、测试、lint 与 registry 漂移，生成物入库、token 引用方向、带 `base` 构建都缺少检查。

变更日志需要知道「从哪儿开始算」，而仓库当时没有任何 tag 或版本基线。

## 备选方案

**A. 引入成熟工具链**：changesets 管理版本与日志，commitlint + husky 校验提交，conventional-changelog 生成日志。

**B. 自写 Node 脚本 + CI 门禁**：提交标题用正则校验，`[Unreleased]` 从 git 历史生成，全部用 `node --test` 覆盖，不新增依赖。

**C. 维持手写**：只补 CI 检查，日志继续人工维护。

**D. 只加本地 hook**：靠 husky 在提交时拦截，不依赖 CI。

## 决策

采用 **B**，并配套以下约束：

1. 提交标题采用 Conventional Commits 子集：`type(scope): 描述`，`type` 限定 `feat` / `fix` / `refactor` / `perf` / `docs` / `style` / `test` / `build` / `ci` / `chore`，`scope` 限定 `tokens` / `ui` / `docs` / `repo` / `skills`，允许中文描述。
2. `[Unreleased]` 由 `pnpm changelog:write` 生成，`pnpm changelog:check` 在 CI 拦截过期；禁止手改。
3. 条目只取单行 subject；`feat` → Added，`fix` → Fixed，`perf` / `refactor` → Changed；`docs` / `style` / `test` / `build` / `ci` / `chore` 不进日志；破坏性变更统一进入 Changed 并加「破坏性：」前缀。
4. 现有手写历史整体下移为 `## [0.0.0] - 2026-11-20`，并打 tag `v0.0.0` 作为生成边界。
5. CI 复用现有 `verify` job，追加提交标题、CHANGELOG 过期、生成物入库、token 引用方向、带 `base` 构建五类检查。
6. 不设置本地 hook；校验以 CI 为唯一强制入口。

## 理由

1. **当前包未发布**：changesets 的版本编排能力用不上，反而引入配置与依赖。
2. **逻辑可测**：生成与校验拆成纯函数，`node --test` 可直接覆盖分组、破坏性、幂等、历史区块不变等场景。
3. **避免两套逻辑**：CI 只调用与本地相同的命令，失败可在本地复现。
4. **历史不重排**：用 tag 切分开发期与生成期，S1–S3 的手写记录保持可读，不变成几十条流水账。
5. **中文优先**：项目内提交一直是中文，强制英文会让人写得更差；只约束结构，不约束语言。
6. **不设本地 hook**：hook 可以被 `--no-verify` 绕过，还会拖慢提交；CI 是必须通过的关卡。
7. **生成物与引用方向前移**：越早拦截越便宜，避免部署后才发现资源路径或层级引用错误。

## 后果

- 提交标题不合规时 CI 失败，必须修正后重推。
- 改了 `feat` / `fix` / `perf` / `refactor` 类内容后，必须先 `pnpm changelog:write` 再提交。
- `CHANGELOG.md` 的 `[Unreleased]` 成为生成物，人工只能在 commit body 里补充说明。
- tag 成为生成边界；没有 tag 时脚本回退到最近一条提交。
- 新增 `scripts/` 目录与三条根命令，CI 串行时间略增。

## 重新评估的触发条件

1. 出现多人协作或外部贡献者，需要更强的格式约束（如 commitlint 与 PR 模板）。
2. 包需要发布到 npm，changelog 与版本编排复杂度上升。
3. 生成规则无法表达真实变更（例如需要按组件维度聚合条目）。
4. CI 串行时间成为瓶颈，需要拆分 job 或缓存。

## 参考

- [ADR-0007](./0007-sdd-process.md)
- [ADR-0013](./0013-versioning-and-release.md)
- `specs/2026-11-20-governance/requirements.md`
- `specs/2026-11-20-governance/plan.md`
