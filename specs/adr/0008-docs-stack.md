# ADR-0008 文档站采用 Vite + React + TS

- 状态：Accepted
- 决策日期：2026-11-16
- 记录日期：2026-11-16
- 决策者：项目所有者
- 取代：无

## 背景

S1 需要一个可运行的 Color 页作为验收台，S2/S3 还要在同一站点里渲染真实组件预览与 `registry.json` 驱动的组件地图。站点没有 SSR、SEO 或内容分发的需求，只是本地与静态托管都能打开的查询台。

文档站框架在 `tech-stack.md` 中一直标为待确认，阻塞 S1 的 P6/P7。

## 备选方案

**A. Vite + React + TS**：单页应用，Vite 构建，React 视图层。

**B. Astro + React islands**：内容页静态输出，交互区域挂 React。

**C. Vite + 原生 TS**：零视图框架，手写 DOM。

## 决策

采用 **A**。

## 理由

1. **与组件同栈**：S2 的组件是 `.tsx`，文档站直接复用同一套 React 渲染路径，不需要为预览再写一层适配。
2. **没有 SSR 需求**：theme / brand / 锚点状态都在 URL 里，纯客户端足够；静态产物托管即可满足 S3 的部署要求。
3. **概念最少**：一个构建工具加一个视图库，不引入内容集合、islands 等额外模型。
4. **样式方案与本决策解耦**：Tailwind v4 还是原生 CSS 仍未定，不影响框架选择。

## 后果

- `apps/docs` 以 Vite 构建、React 渲染、TypeScript strict。
- S2 的组件预览不需要额外渲染适配层。
- 不引入 SSR / SSG；S3 的静态部署只托管 `vite build` 产物。
- 如果后续页面以大量 Markdown 为主，再评估 Astro，不在本期预留抽象。

## 重新评估的触发条件

1. 文档站需要 SEO，或首屏性能无法靠 SPA 满足。
2. Markdown 驱动的页面成为主要工作量，React 手写成本明显高于 Astro。
3. 出现第二个消费方，需要拆分成独立站点部署。

## 参考

- `specs/tech-stack.md` §1、§5
- `specs/2026-11-14-token-foundation/requirements.md` R5、R7
- [ADR-0006](./0006-docs-information-architecture.md)
