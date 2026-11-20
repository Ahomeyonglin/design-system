# Plan — Governance：CI 门禁与变更日志

> 对应规格：`requirements.md` · 状态：已确认（2026-11-20）· 创建 2026-11-20
> 前置：S3 已上线，`main` 干净；本计划不修改 token 值、组件实现与文档站代码。

## 1. 实施顺序

按依赖排列，每步单独可验证。

| 步 | 内容 | 产出 | 验证 |
| --- | --- | --- | --- |
| P0 | 规格评审 | 本目录三件套定稿 | 决策无冲突，门禁清单与范围无遗漏 |
| P1 | 历史迁移与基线 | `CHANGELOG.md` 历史区块、tag `v0.0.0` | `git tag -l` 含 `v0.0.0`；历史条目逐条一致 |
| P2 | 提交信息校验 | `scripts/commit-check.mjs`、fixture 与测试、根脚本 `commit:check` | 合法标题通过，六类反例分别失败 |
| P3 | CHANGELOG 生成 | `scripts/changelog.mjs`、纯函数与测试、根脚本 `changelog:write` / `changelog:check` | 分组、破坏性小节、中文、幂等、过期拦截全部通过 |
| P4 | token 引用方向 | `packages/tokens/tests/references.test.mjs` | 三类违规 fixture 失败，现有 token 通过 |
| P5 | CI 接入 | `.github/workflows/ci.yml` | 五条新门禁接入且顺序合理；`fetch-depth: 0` |
| P6 | 收尾 | `AGENTS.md`、`tech-stack.md §6`、`CHANGELOG.md`、`validation.md` 证据 | 全部验收通过并记录 |

## 2. 文件清单

**新增**

```
scripts/
├── commit-check.mjs          # 提交标题校验（可被测试直接引用）
├── changelog.mjs             # 生成 / 校验入口
├── lib/
│   ├── commits.mjs           # 读取并解析 git 提交
│   └── render.mjs            # 分组与 Markdown 渲染（纯函数）
└── tests/
    ├── commit-check.test.mjs
    └── changelog.test.mjs

packages/tokens/tests/references.test.mjs
```

**修改**

- `package.json`（根）：新增 `scripts` 三条：`commit:check`、`changelog:write`、`changelog:check`。
- `CHANGELOG.md`：现有 `[Unreleased]` 下移为 `## [0.0.0] - 2026-11-20`，新 `[Unreleased]` 由脚本生成。
- `.github/workflows/ci.yml`：`checkout` 增加 `fetch-depth: 0`；追加 G1–G5 五步。
- `AGENTS.md`：命令表与硬规则。
- `specs/tech-stack.md §6`：门禁表补 G1–G5。
- `specs/2026-11-20-governance/validation.md`：证据记录。

## 3. 关键决策

1. **自写脚本而非 changesets（D2）**：当前三个包全部 `private: true` 且未发布，changesets 的版本编排能力用不上；它还会引入配置与依赖。自写约百行，逻辑可测，边界完全可控。
2. **tag 作为边界（D5/D6）**：用 `v0.0.0` 把「开发期历史」与「生成期」切开，避免把 S1–S3 的几十个提交重排成条目。后续 semver 发版直接沿用 `v*`。
3. **只取 subject（D3）**：解析 body 需要处理换行、缩进与多段结构，收益低；需要解释时写进 PR 描述或 commit body，日志保持一行一条。
4. **生成与校验分离（D9）**：`--write` 供本地更新，`--check` 供 CI 只读判断；同一套渲染函数，避免两份逻辑。
5. **历史区块冻结（R4）**：已写好的 0.0.0 区块不再参与生成，人工可读性优先；脚本只重写 Unreleased。
6. **门禁不新建 job（D10）**：复用现有 `verify`，保证失败点集中在同一处；代价是串行时间略增，可接受。
7. **`fetch-depth: 0`**：默认浅克隆拿不到历史与 tag，生成与校验都会失效；必须显式全量拉取。
8. **提交规范允许中文（D1）**：项目内提交信息一直是中文，强制英文会让人写得更差；只约束结构，不约束语言。
9. **引用方向按层校验（R5）**：构建期只保证 alias 目标存在，保证不了方向；独立用例覆盖 `raw ← semantic ← comp` 的单向约束。
10. **不改文档站（R6）**：`/changelog` 已支持标题与列表，新增结构落在现有语法子集内，避免为治理工作扩大前端改动面。

## 4. 风险

| 风险 | 应对 |
| --- | --- |
| Actions 浅克隆导致取不到 tag 与历史 | 所有相关 job 设 `fetch-depth: 0`；本地验证脚本在完整仓库跑一遍 |
| CI 中 `push` 的 `before` 为全 0（首次推送或强推） | 回退到 `v0.0.0..HEAD`；无 tag 时退化为 `HEAD~1..HEAD` 并打印提示 |
| 中文 subject 被按字节截断 | 统一按字符计数；测试覆盖中文与中英混排 |
| squash merge 导致 PR 内提交标题与最终标题不一致 | 实现前确认仓库合并策略；若使用 squash，G1 以 PR 标题为主、提交列表为辅 |
| `--write` 误伤历史区块 | 只替换从 `## [Unreleased]` 到下一个 `## [` 之间的内容；测试覆盖历史区块字节不变 |
| 生成脚本与文档站渲染不兼容 | 只产出 `##` / `###` 与列表、行内代码；验收检查 `/changelog` 无语法泄漏 |
| 手写条目在迁移中丢失 | 迁移使用纯移动（不改文案），逐条比对后再提交；迁移提交单独一个 PR |
| 新门禁在已有历史提交上全红 | 所有校验范围从 `v0.0.0` 之后开始，不追溯 |

## 5. 回滚

- 删除 `scripts/` 与根 `package.json` 的三条脚本、移除 CI 新增步骤，即恢复 S3 的验证形态。
- `v0.0.0` tag 可本地与远端删除（`git push origin :refs/tags/v0.0.0`）；`CHANGELOG.md` 迁移为单次提交，可整体 revert。
- token 引用方向测试为新增文件，删除即回退，不影响现有构建与快照。
- 本阶段不改 token 值、组件与文档站代码，无数据与视觉回滚需求。

## 6. 不在本计划内

完整 semver 策略、npm 发布、自动打 tag 与 Release、跨仓通知与升级 PR、本地 commit hook、视觉回归基线、第二个品牌、组件与页面开发。
