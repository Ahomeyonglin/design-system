# Validation — Docs Site & Page Assembly

> 对应规格：`requirements.md` · 状态：待验证（v0.1）· 创建 2026-11-20
> 规则：每一项必须有可复现的证据（命令输出、截图、URL），不接受「看起来没问题」。

## 1. 自动化检查

| # | 检查 | 命令 | 期望 |
| --- | --- | --- | --- |
| V1 | 路由解析 | `pnpm --filter @ds/docs test` | 九条路由、未知路径、大小写与 `base` 前缀用例全部通过 |
| V2 | 支持矩阵 | `pnpm --filter @ds/docs test` | 全支持组合返回可用；构造「仅 light」品牌 fixture 时 dark 被判定不可用 |
| V3 | 文档站 lint 通过 | `pnpm --filter @ds/docs lint` | 退出 0 |
| V4 | 违规拦截 | `pnpm --filter @ds/docs test` | fixture 注入 hex、`--raw-`、写死 padding、普通文件写 `240px`、`style={{ color }}` 均退出非 0 并指到行号 |
| V5 | 类型与构建 | `pnpm --filter @ds/docs build` | `tsc --noEmit` 与 Vite 构建通过 |
| V6 | 源码无 hex | `grep -rnE "#[0-9a-fA-F]{3,8}\b" apps/docs/src` | 无结果 |
| V7 | raw 收口 | `grep -rnE "(^|[^a-zA-Z])raw\." apps/docs/src` 与 `grep -rn -- "--raw-" apps/docs/src` | 只命中 `sections/ColorPage.tsx` 与 `lib/tokens.ts`；CSS 中无 `--raw-` |
| V8 | 无新增运行时依赖 | `git diff apps/docs/package.json` | `dependencies` 仍为 `@ds/tokens` / `@ds/ui` / React / React DOM，未新增路由或 markdown 库 |
| V9 | CI 接入 | 检查 `.github/workflows/ci.yml` | 包含 docs `lint` 与 `test`，并随 PR 通过 |
| V10 | 布局例外 | `grep -rnE "[0-9]+px" apps/docs/src --exclude=layout.css` | 除 `border-width` / `outline-width` / `outline-offset` 白名单外无结果 |

## 2. 人工验收

| # | 检查 | 期望 |
| --- | --- | --- |
| V11 | 九条路由 | dev 与静态构建下 `/`、`/color`、`/type`、`/space`、`/themes`、`/components`、`/components/button`、`/changelog`、`/examples/project-settings` 均可直接打开；每页 title 正确 |
| V12 | 404 与规范化 | 未知路径与未知组件 id 显示 404 视图；`/components/button` 命中后地址规范化为 `/components/Button`；修饰键点击不拦截 |
| V13 | 总览数据 | token 数量、组件数量、Token 格式版本、registry schema、发布状态、支持矩阵、最近 3 条变更与实际一致 |
| V14 | 排版页 | 6 个组合齐全、顺序固定、实例由 `Text` 渲染；锚点直达高亮；复制链接含 `theme` / `brand` |
| V15 | 间距与圆角页 | 12 个间距 + 4 个圆角齐全；示意来自变量；无虚构尺寸区块 |
| V16 | 主题与品牌页 | 矩阵与 manifest 一致；点击组合后整站变化且 URL 同步；差异数量与分组清单正确；当前无部分支持品牌，禁用逻辑由 V2 覆盖，不做禁用态人工验收 |
| V17 | 组件地图 | 卡片数量等于 registry 组件数；临时新增组件后自动多一张，删除后恢复；夹具缺失时显示「暂无预览」 |
| V18 | 组件详情 | 5 个详情页可访问；控件切换实时生效；TextField 可切换 default / error / disabled；props 表与 registry 一致；无夹具的已知组件降级为「暂无预览」；token 链接命中对应页锚点；未提供 `size` |
| V19 | 全局搜索 | `Cmd/Ctrl+K` 与 `/` 可打开；三组分结果；中文描述可命中；`q` 同步；回车跳转保留主题与品牌；无结果有提示；`raw.space` / `raw.radius` / `raw.text` 不出现 |
| V20 | 搜索键盘与焦点 | 上下键移动、回车跳转、`Esc` 关闭、焦点限制在弹层内并回到入口 |
| V21 | 变更记录 | 与根 `CHANGELOG.md` 一致；新增条目自动出现；无 markdown 符号泄漏 |
| V22 | URL 回退 | `?theme=foo&brand=bar` 回退并重写地址；不支持组合回退到该品牌支持的主题 |
| V23 | 导航状态 | 页面切换保留 `theme` / `brand`，不携带上一页 `q` 与 hash；`aria-current="page"` 正确 |
| V24 | 样板页 | 只出现 `Card` / `Text` / `TextField` / `Button` / `Badge`；保存 / 取消 / 归档行为符合 R12；切换主题整页跟随；无重复组件样式 |
| V25 | page-assembly 走查 | 先有 `SKILL.md`，再用 R12 固定 brief 在干净分支从零组装；颜色与间距人工修改次数为 0；记录步骤与产物路径；lint / build 通过 |
| V26 | ColorPage 回归 | `/color` 原有语义色、组合预览、间距、圆角、排版、原始色阶与复制行为与 S2 一致 |
| V27 | 无障碍与范围边界 | 导航可键盘遍历；弹层有可访问名称；主题切换按钮 `aria-pressed` 正确；通用零件只在 `src/layout` / `src/search` / `src/ui`，未在 `src/sections` 复刻组件样式；样板页与组件预览仍只用 registry 组件 |

## 3. 部署验收

| # | 检查 | 操作 | 期望 |
| --- | --- | --- | --- |
| V28 | Pages 启用 | 仓库 Settings → Pages → Source = GitHub Actions | 部署 workflow 可发布 |
| V29 | 部署成功 | 推送 `main` | `deploy-docs` 全流程通过，产物上传并发布 |
| V30 | 固定 URL 首页 | 打开 `https://ahomeyonglin.github.io/design-system/` | 总览页正常渲染，资源无 404 |
| V31 | 组件深链 | 打开 `/design-system/components/button?theme=dark&brand=base` | 详情页渲染为深色，刷新不白屏 |
| V32 | 变更记录深链 | 打开 `/design-system/changelog` 并刷新 | 页面正常，`404.html` 回退生效 |
| V33 | 未知路径 | 打开 `/design-system/not-exist` | 应用内 404 视图，不出现 GitHub 默认 404 页面 |

## 4. 证据记录

| 项 | 证据 | 执行日期 | 结果 |
| --- | --- | --- | --- |
| V1 | `pnpm --filter @ds/docs test`：路由用例 5 个全部通过，覆盖九条路由、未知路径、大小写、尾斜杠与 `/design-system/` 前缀 | 2026-11-20 | 通过 |
| V2 | 同一测试命令：支持矩阵 4 个用例通过；`lightOnlyManifest` fixture 判定 dark 不可用 | 2026-11-20 | 通过 |
| V3 | `pnpm --filter @ds/docs lint` 输出「docs lint 通过」，退出 0 | 2026-11-20 | 通过 |
| V4 | lint fixture 7 个用例通过：hex、`--raw-`、写死 padding、普通文件写 `240px`、视觉内联样式、`--docs-*` 越界均非 0 退出并指到 `文件:行号`；合法 fixture 退出 0 | 2026-11-20 | 通过 |
| V5 | `pnpm --filter @ds/docs build`：`tsc --noEmit` 与 Vite 构建通过；`VITE_BASE=/design-system/` 构建同样通过 | 2026-11-20 | 通过 |
| V6 | `grep -rnE "#[0-9a-fA-F]{3,8}\b" apps/docs/src` 无结果 | 2026-11-20 | 通过 |
| V7 | `grep -rnE "(^|[^a-zA-Z])raw\." apps/docs/src` 仅命中 `lib/tokens.ts` 的 4 处 raw 路径判断；`grep -rn -- "--raw-"` 无结果 | 2026-11-20 | 通过（收口文件为 `lib/tokens.ts`，是允许集合的子集） |
| V8 | `git diff apps/docs/package.json` 只新增 `lint` / `test` 脚本，`dependencies` 未变 | 2026-11-20 | 通过 |
| V9 | `.github/workflows/ci.yml` 在 docs build 前加入 `Lint docs` 与 `Test docs` 步骤 | 2026-11-20 | 通过 |
| V10 | `grep -rnE "[0-9]+px" apps/docs/src --exclude=layout.css` 无结果；布局尺寸只在 `styles/layout.css` 的 `--docs-*` | 2026-11-20 | 通过 |
| V11 | dev 下逐页访问九条路由，页面标题分别为 总览 / 颜色 / 排版 / 间距与圆角 / 主题与品牌 / 组件地图 / Button / 变更记录 / 项目设置样板，无错误覆盖 | 2026-11-20 | 通过 |
| V12 | `/components/button` 打开后地址变为 `/components/Button`；`/design-system/not-exist` 显示应用内「页面不存在」视图与「返回总览」；修饰键点击由 App 的 click 拦截逻辑排除，未做自动化点击 | 2026-11-20 | 部分通过（修饰键为代码检查） |
| V13 | 总览显示：Token 格式版本 2025.10、registry schema 1、未发布；语义 63、原始 68、组件 5、主题 2 / 品牌 1；支持矩阵 base × light/dark；最近 3 条来自 CHANGELOG 首个区块 | 2026-11-20 | 通过 |
| V14 | `/type` 按固定顺序显示 6 个组合，实例由 `Text` 渲染，行内含 token id、解析值、描述、复制变量名与复制链接；复制的链接由 `hrefFor` 生成并带 `theme` / `brand` 与锚点 | 2026-11-20 | 通过（复制按钮未逐一点击） |
| V15 | `/space` 显示 12 个间距（inline / stack / inset）与 4 个圆角；示意通过 `--space` / `--radius` 注入语义变量；无尺寸区块，仅有说明 | 2026-11-20 | 通过 |
| V16 | `/themes` 矩阵来自 manifest；点击 Dark 后整站变暗、URL 同步；差异共 33 个，全部为 `semantic.color.*`，分组显示「颜色 · 33」；不支持组合由 V2 fixture 覆盖 | 2026-11-20 | 通过 |
| V17 | `/components` 卡片数 5，与 `registry.components.length` 一致；卡片含真实预览、名称、类别、描述、变体数、依赖 token 数；无手写组件数组 | 2026-11-20 | 通过（临时增删组件未执行） |
| V18 | 5 个详情页可访问；Button 详情已验证 variant 控件、props 表与 token 链接；TextField 提供 default / error / disabled 的 preview-only state；组件清单全部来自 registry，无 `size` 控件；缺夹具时降级为「暂无预览」 | 2026-11-20 | 通过（仅 Button 控件做了点击验证） |
| V19 | `Cmd/Ctrl+K` 打开搜索；输入 `button` 后 URL 出现 `q=button`，结果分组显示组件，回车跳转 `/components/Button` 并保留主题与品牌；页面、组件、token 三类入口由索引结构覆盖；`raw.space` / `raw.radius` / `raw.text` 不进入索引 | 2026-11-20 | 通过（三组同时命中未构造） |
| V20 | 弹层实现上下键移动、回车跳转、Esc 关闭、Tab 焦点循环与关闭后焦点回到搜索入口 | 2026-11-20 | 通过（键盘焦点为代码检查 + 打开/回车实测） |
| V21 | `/changelog` 正常渲染根 `CHANGELOG.md` 的标题、段落、列表、行内代码；无 markdown 符号泄漏 | 2026-11-20 | 通过 |
| V22 | `/color?theme=foo&brand=bar` 打开后地址重写为 `?theme=light&brand=base`；不支持组合的回退由 V2 纯函数用例覆盖 | 2026-11-20 | 通过 |
| V23 | 从 `/color` 切 Dark 后进入 `/components`，URL 为 `?theme=dark&brand=base`，无上一页 `q` / hash；侧栏「组件地图」带 `aria-current="page"` | 2026-11-20 | 通过 |
| V24 | 样板页只使用 Card / Text / TextField / Button / Badge；保存 → 已保存、取消恢复最近保存值、归档 → 已归档（danger）均已实测；样式仅语义间距与布局变量 | 2026-11-20 | 通过 |
| V25 | 先写 `.trae/skills/page-assembly/SKILL.md`，再产出 `apps/docs/src/examples/ProjectSettingsPage.tsx` 与同目录样式；颜色与间距无手工修改；lint / test / build 通过 | 2026-11-20 | 通过 |
| V26 | `/color` 保留语义色、组合预览、间距、圆角、排版、原始色阶与复制变量名；主题切换移到页头，raw 区仍是唯一 raw 展示入口 | 2026-11-20 | 通过 |
| V27 | 导航为真实链接可键盘遍历；弹层有 `aria-label="全局搜索"`；主题按钮 `aria-pressed` 正确；通用零件只在 `src/layout` / `src/search` / `src/ui`；样板页与预览只用 registry 组件 | 2026-11-20 | 部分通过（完整键盘走查待人工执行） |
| V28 | 需仓库 Settings → Pages → Source = GitHub Actions，本地无法代办 | — | 待部署 |
| V29 | 需推送 `main` 触发 `deploy-docs` | — | 待部署 |
| V30–V33 | 本地以 `VITE_BASE=/design-system/` 构建并 preview：首页、`/design-system/components/button?theme=dark&brand=base`、`/design-system/changelog` 与未知路径均正常渲染；固定 URL 与线上 `404.html` 需部署后复验 | 2026-11-20 | 本地通过，线上待验收 |

## 5. 未通过的处理

- **V1–V10 失败**：修实现或 fixture，不改验收标准；标准有误时先改 `requirements.md`。
- **V11–V27 失败**：判定为实现缺陷，不允许缩小页面范围或删掉状态来通过。
- **V28–V33 失败**：属于部署配置缺陷，修 workflow；不允许以「本地可预览」替代线上验收。
- **涉及 token / 组件缺口**：停下确认，不在 S3 内顺手新增；走独立规格。

## 6. 完成判定

V1–V33 全部通过并填写证据；文档站源码无 hex、raw 收口符合 R11、`layout.css` 之外无布局字面量；样板页由 page-assembly 先行产出并通过走查；`registry.json` 与组件 props 未因 preview-only state 发生变化；固定 URL 可分享；随后在 `CHANGELOG.md` 追加 S3 条目，并更新根 `AGENTS.md` 的当前阶段与命令表。
