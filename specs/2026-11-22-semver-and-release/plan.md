# Plan — Semver 与发版流程

> 对应规格：`requirements.md` · 状态：已确认（2026-11-22）· 创建 2026-11-22
> 前置：`specs/2026-11-20-governance/` 已交付提交规范、`[Unreleased]` 生成与 CI 门禁。

## 1. 实施顺序

| 步 | 内容 | 产出 | 验证 |
| --- | --- | --- | --- |
| P0 | 规则确认 | `requirements.md` 的 R-D1–R-D10 | 版本策略、范围、破坏性定义无歧义 |
| P1 | 纯函数库 | `scripts/lib/release.mjs`：版本计算、区块归档、一致性判定 | 单元测试覆盖 patch / minor / major、缺 tag、区块错位 |
| P2 | 命令入口 | `scripts/release.mjs`：`--check` 与 `<patch\|minor\|major>` | 在仓库副本中演练发版与回滚 |
| P3 | 根脚本 | `package.json`：`release:prepare`、`release:check` | 两条命令可直接执行 |
| P4 | CI 接入 | `ci.yml` 增加 release check | 本地与 CI 输出一致 |
| P5 | 规则同步 | `AGENTS.md`、`tech-stack.md` | 命令与规则描述可直接照做 |
| P6 | 收尾 | `validation.md` 证据、（如需要）试发一版并回退 | 全部验收通过 |

## 2. 文件清单

**新增**

```
scripts/
├── release.mjs               # prepare / check 入口
├── lib/release.mjs           # 纯函数：nextVersion / archiveUnreleased / collectIssues
└── tests/release.test.mjs

specs/2026-11-22-semver-and-release/
├── requirements.md
├── plan.md
└── validation.md
```

**修改**

- `package.json`（根）：`release:prepare`、`release:check`。
- `.github/workflows/ci.yml`：`changelog:check` 之后追加 release check。
- `AGENTS.md`：命令表、硬规则、阶段说明。
- `specs/tech-stack.md`：版本策略与发版校验。
- 各 `package.json` 的 `version`：只在执行 `release:prepare` 时改动，本阶段保持 `0.0.0`。

## 3. 关键决策

1. **lockstep（R-D1）**：三个包目前互相以 `workspace:*` 引用，拆独立版本只会带来无收益的依赖区间维护；统一版本让「一次发版 = 一次 tag」成立。
2. **不发布 npm（R-D2）**：包仍是 `private: true`，npm 发布与 scope 归属尚未确认；发版流程先解决内部里程碑与可追溯性。
3. **显式选择 bump 类型（R-D10）**：不自动从提交推断 major/minor。自动推断在破坏性变更上极易误判，宁可让人显式承担判断。
4. **`1.0.0` 前破坏性用 minor（R-D4）**：遵循 semver 对 0.x 的惯例，同时保留 `major` 参数，进入 1.0.0 后无需改工具。
5. **`$deprecated` 过渡（R-D6）**：token 名是 API，直接改名会静默破坏下游；保留旧名一个 minor 以上，让文档和消费方有时间迁移。
6. **prepare 不自动提交/打 tag（R-D4）**：版本提交需要人确认 diff 与校验结果；自动打 tag 会把未验证的状态固化成版本。
7. **check 基于 tag 而非 CHANGELOG 推断版本（R2/R3）**：tag 是唯一不可篡改的版本事实；CHANGELOG 只校验与它一致。
8. **禁止移动已推送 tag（R-D10）**：下游可能已按该 tag 拉取；修正只能发新版本。
9. **CI 复用现有 job（R5）**：与 S4 第一部分一致，失败点集中；`fetch-depth: 0` 已具备，无需新增 job。
10. **工作区必须干净（R4）**：发版提交只应包含版本与日志变更，混入功能改动会让版本内容不可信。

## 4. 风险

| 风险 | 应对 |
| --- | --- |
| 三个包版本漏改 | `release:prepare` 用同一函数批量写入；`release:check` 在 CI 每轮比对 |
| 归档时误删历史区块 | 只替换 `[Unreleased]` 段；单元测试断言历史区块字节不变 |
| 发版后才想起漏了改动 | 流程要求先跑全量校验；漏掉的改动进入下一个 patch，不回改版本 |
| tag 已推送但 CI 未跑 | 推送后检查 CI 与部署；失败时发新 patch，不移动 tag |
| 浅克隆取不到 tag | CI 已设 `fetch-depth: 0`；本地演练在完整仓库进行 |
| 手工改版本绕过工具 | AGENTS 硬规则 + CI `release:check` 双重拦截 |
| 日期跨时区导致不一致 | 统一用本地日期（Asia/Shanghai），只作为展示信息，不参与校验语义 |

## 5. 回滚

- 未推送：`git revert` 发版提交，或在提交前 `git checkout -- package.json packages/*/package.json CHANGELOG.md`。
- 已推送 tag：不删除、不移动；递增 patch 发新版本，在 CHANGELOG 说明。
- 删除 `scripts/release.mjs`、`scripts/lib/release.mjs`、测试与 CI 步骤即可退回当前状态；版本保持 `0.0.0`。

## 6. 不在本计划内

npm 发布、GitHub Release、自动生成 PR、独立版本号、兼容矩阵、LTS、跨仓升级通知、自动判断 bump 类型。
