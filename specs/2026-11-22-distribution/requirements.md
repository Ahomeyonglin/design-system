# Requirements — 公共 npm 分发

> 阶段：S4（治理）· 状态：已实现（2026-11-22）· 创建 2026-11-22
> 上游约束：`specs/mission.md`、`specs/tech-stack.md`、`specs/roadmap.md`
> 前置：`specs/2026-11-22-semver-and-release/` 已确定版本与 tag 规则；`v0.1.0` 已发布。
> 范围声明：本规格只覆盖「包如何离开本仓到达下游」；跨仓升级 PR 不在本规格内。

## 1. 问题

| 现状 | 后果 |
| --- | --- |
| 三个包 `private: true`，只存在于 workspace | 下游拿不到任何东西，S4 的跨仓升级 PR 没有对象 |
| `@ds/ui` 导出 TSX 源码，没有构建产物 | 即使发布，下游也要能编译 `node_modules` 里的 TSX，接入脆弱 |
| `@ds/tokens` 没有 `exports` | 下游只能靠 `dist/xxx.css` 深路径，属于未承诺的引用面 |
| 分发方式未决策 | 无法判断发版是否算完成，也无法写跨仓升级流程 |

## 2. 已定决策

| # | 决策 | 结论 |
| --- | --- | --- |
| D-D1 | 分发渠道 | **公共 npm**（`registry.npmjs.org`），不使用 GitHub Packages |
| D-D2 | 可见性 | 包公开。仓库本身已公开，源码可见，包公开不增加暴露 |
| D-D3 | scope | `@ahomeyonglin`。三个包统一改名，包括不发布的 `docs` |
| D-D4 | 发布范围 | 只发布 `@ahomeyonglin/tokens` 与 `@ahomeyonglin/ui`；`docs` 保持 private |
| D-D5 | ui 产物 | 新增构建：`tsc` 输出 JS 与 `.d.ts`，复制 CSS；`exports` 指向 `dist` |
| D-D6 | 文档站消费 | 统一走 `dist`，`predev` / `prebuild` 先构建 ui，不做源码条件导出 |
| D-D7 | 触发方式 | 推送 `v*` tag 触发发布 workflow，顺序为 tokens → ui |
| D-D8 | 幂等 | 发布前检查该版本是否已存在；已存在则跳过，不删除或移动 tag |
| D-D9 | 认证 | 仓库 secret `NPM_TOKEN`，granular token 限定两个包且仅有 publish 权限 |
| D-D10 | 版本 | 沿用 `release:prepare` 的锁步版本；包版本必须等于 tag 去掉 `v` |
| D-D11 | 回滚 | 已发布版本不可覆盖；下游锁旧版本，修正以新 `patch` 发布 |
| D-D12 | tokens 引用面 | `exports` 暴露 `./dist/*`，CSS 与 `tokens.json` 都走这一条 |
| D-D13 | 使用契约 | `ui` 不依赖 `tokens`；下游须自行按 `theme-light.css` → `theme-dark.css` → `brand-*.css` 顺序引入 |
| D-D14 | 首次发布 | 需 npm 账号拥有 `@ahomeyonglin` scope 并配置 token，属于用户动作 |

## 3. 范围

**做**

- 三个包改名为 `@ahomeyonglin/*`，同步 workspace、lock、CI、文档与 skill 中的引用
- `tokens` 与 `ui` 去掉 `private`，补 `publishConfig`、`repository`、`license`
- 新增 `ui` 构建脚本与 `tsconfig.build.json`，产出 `dist`（JS + `.d.ts` + CSS）
- `tokens` 补 `exports`；`ui` 的 `exports` 改指 `dist`
- 文档站改为消费 `ui` 的 `dist`
- 新增 tag 触发的发布 workflow，含幂等检查与发布顺序
- 规则同步：根 `AGENTS.md`、`packages/ui/AGENTS.md`、`specs/tech-stack.md`、`README.md`
- 在临时项目里真实安装并渲染验证

**不做**

- 私有 registry、GitHub Packages、CDN 分发
- 跨仓升级 PR 与自动迁移
- changesets、独立版本号、`--provenance` 与发布签名
- 非 Web 端产物

## 4. 功能需求

### R1 包改名与清单

- 三个包改名为 `@ahomeyonglin/tokens`、`@ahomeyonglin/ui`、`@ahomeyonglin/docs`。
- `tokens` / `ui` 移除 `private: true`，加 `publishConfig: { "access": "public" }`、`repository`、`license`。
- `docs` 保持 `private: true`，仅改名。
- `pnpm-lock.yaml` 的 importer 名同步，`pnpm install --frozen-lockfile` 通过。

**验收**：仓库内 `grep '@ds/'` 无残留；`pnpm install --frozen-lockfile` 成功。

### R2 ui 构建产物

- 新增 `packages/ui/tsconfig.build.json`：`noEmit: false`、`outDir: dist`、`declaration: true`，仅包含 `src`。
- 新增 `packages/ui/scripts/build.mjs`：先 `tsc -p tsconfig.build.json`，再把 `src/components/**/*.css` 复制到对应 `dist` 路径。
- `package.json` 增加 `build` 脚本；`files` 改为 `["dist", "registry.json", "AGENTS.md"]`；`exports` 的 5 个入口指向 `dist/components/<Name>/<Name>.js`。
- 产物面向打包器消费，不承诺 Node 原生 ESM（无扩展名导入）。

**验收**：`pnpm --filter @ahomeyonglin/ui build` 生成 `dist`，包含 5 个组件的 JS、`.d.ts` 与 `.css`；`npm pack --dry-run` 的文件清单只含预期项。

### R3 tokens 引用面

- `packages/tokens/package.json` 增加 `exports`：`"./dist/*": "./dist/*"`。
- 现有文档站引用 `@ds/tokens/dist/tokens.json` 与三个 CSS 深路径在改名后继续可用。

**验收**：文档站构建通过，产出 CSS 中包含主题变量。

### R4 文档站消费 dist

- `apps/docs/package.json` 的 `predev` / `prebuild` 依次构建 tokens 与 ui。
- 文档站所有 `@ds/ui/*` 引用改为新 scope，行为不变。

**验收**：`pnpm --filter @ahomeyonglin/docs dev` 与 `build` 均通过；组件预览渲染正常。

### R5 发布流水线

- 新增 `.github/workflows/publish.yml`，在 `push` tag `v*` 时运行。
- 步骤：安装 → 构建 tokens → `npm publish` → 构建 ui → `npm publish`。
- 每个包发布前执行存在性检查：`npm view <pkg>@<version> version` 成功则跳过并输出提示。
- 版本不一致（tag 与 `package.json`）时失败，不发布。
- 使用 `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`，不打印 token。

**验收**：在临时副本中模拟重跑 workflow，第二次全部跳过且退出 0；版本不匹配时失败。

### R6 使用契约与规则同步

- `packages/ui/AGENTS.md` 写明下游安装方式与 CSS 引入顺序。
- 根 `AGENTS.md` 命令表补 `ui build`、`publish` 相关说明，阶段描述引用本规格。
- `specs/tech-stack.md` 与 `README.md` 同步包名与发布步骤。

**验收**：按文档从零接入一个临时项目，能正常渲染组件。

### R7 真实安装验证

- 在临时目录 `pnpm init`，安装 `@ahomeyonglin/tokens` 与 `@ahomeyonglin/ui` 的发布版本。
- 用 Vite 起一个最小页面，引入 tokens CSS 与 `Button`，构建通过且颜色来自 token。

**验收**：临时项目构建成功；`node_modules` 中不含 `src/*.tsx`。

## 5. 不变量

- 不新增运行时依赖；`ui` 仍只声明 `react` 为 peer。
- 不改变 token 值、组件视觉与 `registry.json` 内容。
- 不手改 `packages/tokens/dist/**` 与 `registry.json`。
- 版本号仍只由 `pnpm release:prepare` 修改。
- tag 一旦推送不删除、不移动。

## 6. 待输入

| 问题 | 处理 |
| --- | --- |
| `@ahomeyonglin` scope 是否已在 npm 注册 | 首次发布前由用户确认；未注册则先创建账号或组织 |
| 包 license 未定 | 两包暂时保留 `private: true` 作为硬保险；确认许可后移除再发布 |
| `NPM_TOKEN` 由谁提供 | 用户生成 granular token 并写入仓库 secret |
| 是否加 `--provenance` | 本规格不做，等发布流程稳定后再评估 |
