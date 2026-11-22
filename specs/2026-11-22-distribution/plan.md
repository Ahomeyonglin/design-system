# Plan — 公共 npm 分发

> 对应规格：`requirements.md` · 状态：已实现（2026-11-22）· 创建 2026-11-22
> 前置：`v0.1.0` 已打 tag；`@ahomeyonglin` scope 与 `NPM_TOKEN` 由用户提供。

## 1. 实施顺序

| 步 | 内容 | 产出 | 验证 |
| --- | --- | --- | --- |
| P0 | 规格确认 | `requirements.md` 的 D-D1–D-D14 | 渠道、scope、产物形态无歧义 |
| P1 | 改名与清单 | 三个 `package.json`、`pnpm-lock.yaml`、全仓引用 | `grep '@ds/'` 为空；`--frozen-lockfile` 通过 |
| P2 | ui 构建 | `tsconfig.build.json`、`scripts/build.mjs`、`build` 脚本 | `dist` 含 5 个组件的 JS / `.d.ts` / `.css` |
| P3 | tokens 引用面 | `exports` 映射 | 文档站构建通过 |
| P4 | 文档站消费 dist | `predev` / `prebuild` | `dev` 与 `build` 均通过 |
| P5 | 发布流水线 | `.github/workflows/publish.yml` | 临时副本模拟重跑幂等 |
| P6 | 规则同步 | 根与包级 `AGENTS.md`、`tech-stack.md`、`README.md` | 命令与包名一致 |
| P7 | 真实安装验证 | 临时 Vite 项目 | 安装后正常渲染，无 `src` 泄漏 |

## 2. 文件清单

**新增**

```
packages/ui/tsconfig.build.json
packages/ui/scripts/build.mjs
.github/workflows/publish.yml

specs/2026-11-22-distribution/
├── requirements.md
├── plan.md
└── validation.md

specs/adr/0015-public-npm-distribution.md
```

**修改**

- `package.json`（根）：无版本变化；仅确认无 `@ds/*` 引用。
- `packages/tokens/package.json`：改名、去 `private`、`exports`、`publishConfig`、`files`。
- `packages/ui/package.json`：改名、去 `private`、`build` 脚本、`exports` 指向 `dist`、`files`、`publishConfig`。
- `apps/docs/package.json`：改名、依赖改名、`predev` / `prebuild` 增加 ui 构建。
- `pnpm-lock.yaml`：importer 名同步（由 `pnpm install` 生成，不手改）。
- `apps/docs/src/**`：`@ds/ui/*`、`@ds/tokens/dist/*` 引用改 scope。
- `.github/workflows/ci.yml`、`deploy-docs.yml`：`--filter` 包名与新增 ui 构建步骤。
- `AGENTS.md`、`packages/ui/AGENTS.md`、`README.md`、`specs/tech-stack.md`。
- `.trae/skills/component-sync/SKILL.md`、`.trae/skills/page-assembly/SKILL.md`：命令中的包名。
- `specs/adr/README.md`：索引新增 0015，并把「分发方式」从「仍未决策」移出。

## 3. 关键决策

1. **公共 npm 而非 GitHub Packages（D-D1/D-D2）**：仓库已公开，私有包收益低；公共 npm 免去下游配置 `.npmrc` 认证，安装路径最短。
2. **连 `docs` 一起改名（D-D3）**：只改两个发布包会留下两种 scope，命令与文档长期混用；统一改名是一次性成本。
3. **ui 产出 dist 而非发源码（D-D5）**：发布 TSX 要求下游能编译 `node_modules` 里的源码，等价于把构建配置泄漏给每个消费者。
4. **文档站也吃 dist（D-D6）**：文档站成为发布产物的第一消费者，构建通过即代表产物可用；代价是 `dev` 前多一次构建。
5. **tag 触发而非 `main` 触发（D-D7）**：版本事实由 tag 唯一确定，避免每个提交都发布或需要额外判断。
6. **幂等靠查版本（D-D8）**：不删 tag、不改版本，失败重跑安全。
7. **不做 provenance（范围）**：先让发布闭环；签名与来源证明等流程稳定后单独决策。

## 4. 风险

| 风险 | 应对 |
| --- | --- |
| scope 未注册导致首发布 `E403` | P0 前先确认 npm 账号与 scope；失败不产生任何版本 |
| 改名后 lockfile 与 filter 失配 | 改名后立即 `pnpm install`，CI 用 `--frozen-lockfile` 验证 |
| `tsc` 不复制 CSS，产物缺样式 | `build.mjs` 显式复制并在 `npm pack --dry-run` 中检查 |
| 文档站改吃 `dist` 后旧缓存导致白屏 | `predev` 先构建；本地清 `node_modules/.vite` 再验证 |
| 下游只装 ui 未引 tokens CSS | 写入 `packages/ui/AGENTS.md` 与 README 的接入步骤 |
| 发布中途失败留下半套版本 | 幂等重跑；已发布的包跳过，未发布的继续 |
| 误发不可撤回的版本 | 发布前校验 tag 与版本一致；本地不直接 `npm publish`，只在 workflow 中发布 |

## 5. 回滚

- 未推送时代码可整体回退；已推送但未发布时删除 workflow 即可停止发布。
- 已发布版本无法撤回：只能发新 `patch` 修正，并在 CHANGELOG 记录。

## 6. 不在本计划内

跨仓升级 PR、私有 registry、自动迁移、provenance、changesets、独立版本号、非 Web 产物。
