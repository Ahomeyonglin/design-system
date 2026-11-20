import assert from 'node:assert/strict';
import test from 'node:test';
import { groupCommits, renderUnreleased, replaceUnreleased } from '../lib/render.mjs';

const commits = [
  { shortHash: 'a1', subject: 'feat(ui): 新增禁用态', body: '' },
  { shortHash: 'b2', subject: 'fix: 修复遮罩发虚', body: '' },
  { shortHash: 'c3', subject: 'perf(tokens): 减少解析次数', body: '' },
  { shortHash: 'd4', subject: 'refactor(ui): 拆分预览夹具', body: '' },
  { shortHash: 'e5', subject: 'docs(repo): 补充说明', body: '' },
  { shortHash: 'f6', subject: 'chore: 更新依赖', body: '' },
  { shortHash: 'g7', subject: 'feat(repo)!: 重命名 token', body: '' },
  { shortHash: 'h8', subject: 'fix(ui): 调整间距', body: 'BREAKING CHANGE: 旧间距变量移除' },
];

test('按类型分组，非日志类型被跳过', () => {
  const groups = groupCommits(commits);
  assert.deepEqual(
    groups.get('Added').regular.map((entry) => entry.shortHash),
    ['a1'],
  );
  assert.deepEqual(
    groups.get('Fixed').regular.map((entry) => entry.shortHash),
    ['b2'],
  );
  assert.deepEqual(
    groups.get('Changed').regular.map((entry) => entry.shortHash),
    ['c3', 'd4'],
  );
});

test('破坏性变更只进入 Changed 的破坏性条目', () => {
  const groups = groupCommits(commits);
  assert.deepEqual(
    groups.get('Changed').breaking.map((entry) => entry.shortHash),
    ['g7', 'h8'],
  );
  assert.deepEqual(
    groups.get('Added').breaking.map((entry) => entry.shortHash),
    [],
  );
  assert.deepEqual(
    groups.get('Fixed').regular.map((entry) => entry.shortHash),
    ['b2'],
  );
});

test('渲染包含 scope、短哈希与破坏性前缀', () => {
  const block = renderUnreleased(commits);
  assert.match(block, /^## \[Unreleased\]\n/);
  assert.match(block, /### Added\n\n- ui: 新增禁用态（`a1`）/);
  assert.match(block, /### Changed\n\n- 破坏性：repo: 重命名 token（`g7`）/);
  assert.match(block, /- 破坏性：ui: 调整间距（`h8`）/);
  assert.doesNotMatch(block, /补充说明/);
  assert.doesNotMatch(block, /更新依赖/);
});

test('无提交时输出占位文案', () => {
  assert.equal(renderUnreleased([]), '## [Unreleased]\n\n暂无未发布变更\n');
});

const markdown = `# Changelog

## [Unreleased]

旧的未发布内容

## [0.0.0] - 2026-11-20

S1–S3 开发期，未发布。

### Added

- 历史条目
`;

test('写入只替换 Unreleased，历史区块字节不变', () => {
  const block = renderUnreleased(commits);
  const next = replaceUnreleased(markdown, block);
  assert.match(next, /历史条目/);
  assert.doesNotMatch(next, /旧的未发布内容/);
  assert.ok(next.includes('## [0.0.0] - 2026-11-20\n\nS1–S3 开发期，未发布。'));

  const again = replaceUnreleased(next, renderUnreleased(commits));
  assert.equal(again, next);
});

test('缺少 Unreleased 区块时报错', () => {
  assert.throws(() => replaceUnreleased('# Changelog\n', 'x'), /缺少 ## \[Unreleased\]/);
});
