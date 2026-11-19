# Changelog

本文件记录对外可感知的变更。格式参考 Keep a Changelog，版本号遵循 semver。

- `Added` 新增能力
- `Changed` 行为变化
- `Deprecated` 已弃用但保留
- `Removed` 移除
- `Fixed` 修复

## [Unreleased]

### Added

- 仓库骨架：pnpm workspace、三份宪法、根与包级 `AGENTS.md`
- 首个功能规格：`specs/2026-11-14-token-foundation/`
- S2 组件最小集：`Text` / `Button` / `TextField` / `Card` / `Badge` 三件套与 `registry.json`
- 组件 lint、违规 fixture 与 `component-sync` skill
- 文档站 `/color` 组合预览接入真实组件，新增表单面板
- 最小 CI workflow：tokens 构建/测试、ui lint/typecheck、registry 漂移、docs 构建

### Changed

- 新增 9 个交互状态语义 token；浅色 `semantic.color.text.disabled` 由 `neutral.400` 调整为 `neutral.500`

## 版本记录

尚未发布首个版本。
