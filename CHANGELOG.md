# Changelog

本文件记录对外可感知的变更。格式参考 Keep a Changelog，版本号遵循 semver。

- `Added` 新增能力
- `Changed` 行为变化
- `Deprecated` 已弃用但保留
- `Removed` 移除
- `Fixed` 修复

## [Unreleased]

### Added

- tokens: 接入第二品牌 zhixing 与品牌级主题覆盖（`01ceaa4`）

## [0.2.0] - 2026-11-22

### Added

- repo: 增加公共 npm 分发（`b457902`）

## [0.1.0] - 2026-11-22

### Added

- tokens: 支持弃用标记与移除门禁（`00fcde2`）
- repo: 增加 semver 与发版规则（`dee300b`）
- repo: 引入提交规范与变更日志生成（`85be48f`）

## [0.0.0] - 2026-11-20

S1–S3 开发期，未发布。

### Added

- S3 文档站：九条路由、应用外壳、总览、排版、间距与圆角、主题与品牌、组件地图与详情、变更记录
- 全局搜索（页面 / 组件 / token），快捷键 `Cmd/Ctrl+K` 与 `/`
- 文档站 lint、路由与支持矩阵测试、lint fixture，并接入 CI
- `page-assembly` skill 与项目设置样板页 `/examples/project-settings`
- GitHub Pages 部署 workflow、`404.html` 深链回退与 `.nojekyll`；文档站已上线：<https://ahomeyonglin.github.io/design-system/>
- 仓库骨架：pnpm workspace、三份宪法、根与包级 `AGENTS.md`
- 首个功能规格：`specs/2026-11-14-token-foundation/`
- S2 组件最小集：`Text` / `Button` / `TextField` / `Card` / `Badge` 三件套与 `registry.json`
- 组件 lint、违规 fixture 与 `component-sync` skill
- 文档站 `/color` 组合预览接入真实组件，新增表单面板
- 最小 CI workflow：tokens 构建/测试、ui lint/typecheck、registry 漂移、docs 构建
- 新增 `raw.color.scrim` 与 `semantic.color.bg.scrim`，供遮罩层统一使用

### Changed

- 全站圆角改为直角：`semantic.radius.control` / `surface` / `pill` 均映射到 0，组件与文档站统一
- TextField 聚焦改为深灰边框 + 2px 品牌色底边，文档站搜索框聚焦样式同步对齐
- 新增 9 个交互状态语义 token；浅色 `semantic.color.text.disabled` 由 `neutral.400` 调整为 `neutral.500`
- 文档站样式迁到语义 token 与 `--docs-*` 布局变量；`/color` 接入应用外壳，主题切换移到页头
- `semantic.color.border.strong` 由 `neutral.500` 改为 `neutral.800`，TextField 静止态与文档站搜索框边框统一使用
- 搜索弹窗遮罩改用 `semantic.color.bg.scrim`，修复浅色模式遮罩发虚
- 文档站亮/暗切换控件改为胶囊形，样板页操作按钮间距由 `inline-sm` 调整为 `inline-lg`

## 版本记录

尚未发布首个版本。
