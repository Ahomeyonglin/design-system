# Plan — Token 弃用与移除门禁

> 对应规格：`requirements.md` · 状态：已确认（2026-11-22）· 创建 2026-11-22
> 前置：`specs/2026-11-22-semver-and-release/` 已定义破坏性变更与 `$deprecated` 规则。

## 1. 实施顺序

| 步 | 内容 | 产出 | 验证 |
| --- | --- | --- | --- |
| P0 | 规格确认 | `requirements.md` 的 T-D1–T-D8 | 元数据格式、门禁时机、范围无歧义 |
| P1 | 构建透传 | `build.mjs` 校验并输出 `$deprecated` | fixture 构建后 JSON 含字段、CSS 变量仍在 |
| P2 | 快照 | `build.test.mjs` 记录 `$deprecated` | 现有快照不变，新增弃用需显式更新 |
| P3 | 移除门禁 | `tests/deprecation.test.mjs` | 真实仓库正例 + 纯函数反例 |
| P4 | 消费拦截 | `lint-components.mjs` 与 lint fixture | CSS 与 meta 两类引用均被拦截 |
| P5 | 规则同步 | 根 `AGENTS.md`、`packages/ui/AGENTS.md`、`tech-stack.md` | 描述与实现一致 |
| P6 | 演练 | 临时副本三轮发版 | `validation.md` 记录命令与结果 |

## 2. 文件清单

**新增**

```
packages/tokens/tests/deprecation.test.mjs

specs/2026-11-22-token-deprecation/
├── requirements.md
├── plan.md
└── validation.md
```

**修改**

- `packages/tokens/scripts/build.mjs`：校验 `$deprecated` 格式并写入 JSON 产物。
- `packages/tokens/tests/build.test.mjs`：快照包含 `$deprecated`。
- `packages/ui/scripts/lint-components.mjs`：读取 token 产物，拦截已弃用引用。
- `packages/ui/tests/lint.test.mjs`：新增弃用引用 fixture。
- `AGENTS.md`、`packages/ui/AGENTS.md`、`specs/tech-stack.md`：规则同步。

## 3. 关键决策

1. **只认字符串（T-D1）**：`$deprecated: true` 无法告诉使用者该换成什么，项目内强制写迁移说明。
2. **CSS 继续输出（T-D2）**：弃用期内旧变量必须可用，否则「弃用」等于立即破坏。
3. **门禁放在测试而非新脚本（T-D5）**：CI 已执行 `tokens test`，不增加入口；本地也能通过同一条命令复现。
4. **以 tag 为事实（T-D4/T-D6）**：是否存在「已发布的弃用」只能由 tag 判断，不看 CHANGELOG 文本。
5. **只校验 token 级 `$deprecated`（范围）**：group 继承会让门禁判断变复杂，当前 token 数量与命名粒度不需要。
6. **文档站不动（T-D8）**：本阶段先让机制闭环；等出现真实弃用，再决定验收台如何呈现。
7. **lint 依赖 tokens 产物**：CI 顺序已是 build tokens → lint，本地缺产物时给出明确指令，不静默跳过。

## 4. 风险

| 风险 | 应对 |
| --- | --- |
| 本地未构建 tokens 就跑 ui lint | 缺失产物时直接失败并提示 `pnpm --filter @ds/tokens build` |
| 快照随弃用变动导致误判为色值变化 | 快照字段顺序固定，diff 只出现 `$deprecated` |
| 删除合法但门禁误报 | 只比对最近 tag 与当前源码的 token id 集合 |
| 前缀相同的 token 被误报 | 变量匹配要求右侧为 `)`、空白、逗号或分号；typography 派生名单独枚举 |
| 演练污染真实仓库 | 全部操作在 `git clone` 的临时副本中进行，不推送 |

## 5. 回滚

- 删除 `deprecation.test.mjs`、lint 中的弃用检查与 fixture，即可退回只有文档规则的状态。
- 已写入源码的 `$deprecated` 可单独移除；不影响 token 值与产物结构。

## 6. 不在本计划内

文档站呈现弃用、自动迁移、group 级弃用、npm 发布、跨仓升级 PR。
