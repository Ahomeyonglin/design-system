# ADR-0013 版本与发版策略：三包锁步、只到 tag 与 CHANGELOG

- 状态：Accepted
- 决策日期：2026-11-22
- 记录日期：2026-11-22
- 决策者：项目所有者

## 背景

S4 第一部分已经交付提交规范、`[Unreleased]` 自动生成与 CI 门禁，但「什么算破坏性改动、版本号怎么加、发版要做什么」仍靠人工记忆。三个包与根目录都是 `0.0.0`，没有任何机制阻止版本漂移，也没有规则说明 token 改名应该配哪个版本号。

同时，包全部 `private: true`，没有下游项目，npm 发布此前被明确搁置。

## 备选方案

**A. 每包独立版本**：`@ds/tokens`、`@ds/ui`、`@ds/docs` 各自 semver，依赖写版本区间。

**B. 三包锁步 + 只到 tag 与 CHANGELOG**：根与三个包共用一个版本号，发版动作归档日志、打 tag、跑校验，不发布 npm。

**C. 三包锁步 + changesets + npm 发布**：引入 changesets 管理版本与日志，发版同时 `npm publish`。

**D. 暂不定规则**：继续人工管理 `version`，等有下游再说。

## 决策

采用 **B**，并配套以下约束：

1. 根 `package.json` 与三个包 `version` 始终相同，包间依赖固定 `workspace:*`。
2. `patch` 表示修 bug 或视觉修正；`minor` 表示新增 token、组件或变体；`major` 表示破坏性变更。`1.0.0` 之前破坏性变更用 `minor`。
3. 破坏性变更指：token 改名或删除、组件 props 删除或改名、默认行为或必填性变化、CSS 变量名变化。仅调整值不算破坏性。
4. 破坏性改名必须先加 `$deprecated` 保留旧名至少一个 `minor`，删除本身记入下一个版本的 Changed。
5. 发版入口只有 `pnpm release:prepare <patch|minor|major>`：同步四个版本号、归档 `[Unreleased]`、开新的空区块；不自动提交、不自动打 tag、不推送。
6. `pnpm release:check` 在 CI 每轮校验：四个版本一致、最新 `v*` tag 等于 `v<version>`、`CHANGELOG.md` 含对应版本区块。

完整判定清单见 `specs/2026-11-22-semver-and-release/requirements.md`。

## 理由

1. **包间用 `workspace:*`**：独立版本需要维护依赖区间与兼容矩阵，而三个包始终同仓同批改动，拆分没有收益。
2. **不发布 npm**：scope 归属与发布范围尚未确认；先把版本事实与日志历史建立起来，发布可以作为后续独立决策。
3. **显式选择 bump 类型**：从提交自动推断破坏性变更容易误判，宁可让人显式承担判断。
4. **遵守 0.x 惯例**：初始阶段破坏性变更用 `minor`，进入 `1.0.0` 后工具无需修改。
5. **`$deprecated` 过渡**：token 名是 API，直接改名会静默破坏下游；保留旧名给迁移留窗口。
6. **发版不自动化提交与 tag**：版本提交需要人确认 diff 与校验结果；自动打 tag 会把未验证状态固化成版本。
7. **tag 是版本唯一事实**：`release:check` 以 tag 为准校验 CHANGELOG，避免日志与版本各说各话。

## 后果

- 四个 `package.json` 的 `version` 只能由脚本修改，手改会被 CI 拦截。
- 每次发版产生一个 `chore(repo): 发布 vX.Y.Z` 提交与一个 `vX.Y.Z` tag，tag 不移动、不删除。
- `CHANGELOG.md` 除 `[Unreleased]` 外新增版本区块，规则为 `## [x.y.z] - YYYY-MM-DD`。
- 包仍是 `private: true`，不发 npm；下游接入前必须单独决策分发方式。
- 破坏性改名需要跨版本完成：先 `$deprecated`，下一个 `minor` 才允许删除。

## 重新评估的触发条件

1. 决定发布到 npm 或私有 registry，需要版本区间与发布流水线。
2. 出现需要独立升级 `@ds/tokens` 而不动 `@ds/ui` 的真实场景。
3. 进入 `1.0.0`，或 API 稳定性有明确定义。
4. 出现第二个真实下游，需要跨仓升级通知与升级 PR。

## 参考

- [ADR-0007](./0007-sdd-process.md)
- [ADR-0009](./0009-token-naming.md)
- `specs/2026-11-22-semver-and-release/requirements.md`
- `specs/2026-11-20-governance/requirements.md`
