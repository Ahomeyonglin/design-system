# ADR-0015 分发方式：公共 npm 与构建产物

- 状态：Accepted
- 决策日期：2026-11-22
- 记录日期：2026-11-22
- 决策者：项目所有者

## 背景

S4 最后一项「跨仓升级 PR」需要下游能拿到包，但三个包都是 `private: true`，只存在于 workspace。此前分发方式被挂起，理由是「没有下游项目」。现在要补上分发，先得回答两件事：包放哪里、以什么形态放。

另一个事实改变了判断：仓库本身是公开的，源码与品牌 token 已经可见；同时 `@ds/ui` 导出的是 TSX 源码，没有构建产物。

## 备选方案

**A. 公共 npm + 构建产物**：包改名为 `@ahomeyonglin/*`，`ui` 产出 `dist`，tag 触发发布。

**B. GitHub Packages**：同样公开（可见性跟随公开仓库），下游需配置 `.npmrc` 与 token。

**C. GitHub Release tarball**：包挂在 Release 上，下游用 URL 安装，省认证配置。

**D. 仅 workspace**：下游作为 `apps/*` 并入本仓，不分发。

**E. 只分发静态 CSS/JSON**：下游通过 URL 引用 token 产物。

## 决策

采用 **A**，并配套以下约束：

1. 渠道是 `registry.npmjs.org`，包公开；scope 为 `@ahomeyonglin`，三个包统一改名。
2. 只发布 `tokens` 与 `ui`；`docs` 保持 private。
3. `ui` 新增构建：`tsc` 输出 JS 与 `.d.ts`，复制 CSS，`exports` 指向 `dist`。
4. 文档站统一消费 `dist`，`predev` / `prebuild` 先构建，不做源码条件导出。
5. 发布由 `v*` tag 触发，顺序 tokens → ui；已存在同版本则跳过，保证重跑安全。
6. `ui` 不声明对 `tokens` 的依赖；下游按 `theme-light.css` → `theme-dark.css` → `brand-*.css` 顺序自行引入。

## 理由

1. **公共 npm 的接入成本最低**：不需要下游配置 registry 与 token，`pnpm add` 即可。
2. **公开不增加暴露**：仓库已公开，源码可读；再把包设私有只增加运维成本。
3. **发 `dist` 而不是源码**：发布 TSX 等于要求每个消费者配置能编译 `node_modules` 的打包器。
4. **文档站吃 `dist`**：让发布产物在 CI 中每天被真实消费，产物坏了会在本仓暴露，而不是等下游发现。
5. **tag 触发**：版本事实由 tag 唯一确定，与 ADR-0013 的「tag 是版本唯一事实」一致。
6. **不删 tag、不覆盖版本**：发布失败靠幂等重跑，修正靠新版本，保持历史可追溯。

## 后果

- 三个包名变化属于对消费者的破坏性变更，但当前没有真实下游，成本可控。
- 每次发版多一个发布 workflow；`NPM_TOKEN` 成为必需 secret。
- 已发布版本不可撤回；回滚只能靠下游锁版本。
- 包采用 MIT 许可，`LICENSE` 随两包发布；下游可自由商用。
- 下游必须自己引入 tokens CSS，缺引会导致组件无色，属于文档必须写清的接入步骤。
- `@ds/*` 不再存在，所有命令、文档与 skill 中的包名同步更新。

## 重新评估的触发条件

1. 需要私有分发（例如出现不能公开的品牌资产），转 GitHub Packages 或私有 registry。
2. 出现非 Web 消费方，需要额外产物形态。
3. 需要来源证明与签名发布，单独引入 provenance。
4. 包数量增长到需要 changesets 管理独立版本。

## 参考

- [ADR-0013](./0013-versioning-and-release.md)
- [ADR-0005](./0005-registry-committed.md)
- `specs/2026-11-22-distribution/requirements.md`
- `specs/roadmap.md` S4
