import assert from 'node:assert/strict';
import test from 'node:test';
import { archiveUnreleased, collectIssues, nextVersion } from '../lib/release.mjs';

test('按 semver 计算新版本', () => {
  assert.equal(nextVersion('1.2.3', 'patch'), '1.2.4');
  assert.equal(nextVersion('1.2.3', 'minor'), '1.3.0');
  assert.equal(nextVersion('1.2.3', 'major'), '2.0.0');
  assert.equal(nextVersion('0.0.0', 'minor'), '0.1.0');
});

test('非法版本或类型报错', () => {
  assert.throws(() => nextVersion('1.2', 'patch'), /不是合法 semver/);
  assert.throws(() => nextVersion('1.2.3', 'feature'), /版本类型必须是/);
});

const changelog = `# Changelog

## [Unreleased]

### Added

- 新功能（\`abc1234\`）

## [0.0.0] - 2026-11-20

S1–S3 开发期，未发布。

### Added

- 历史条目
`;

test('归档 Unreleased 并生成新的空区块', () => {
  const next = archiveUnreleased(changelog, '0.1.0', '2026-11-22');
  assert.match(next, /^# Changelog\n\n## \[Unreleased\]\n\n暂无未发布变更\n\n## \[0\.1\.0\] - 2026-11-22/);
  assert.match(next, /## \[0\.1\.0\] - 2026-11-22\n\n### Added\n\n- 新功能（`abc1234`）/);
  assert.match(next, /## \[0\.0\.0\] - 2026-11-20\n\nS1–S3 开发期，未发布。/);
});

test('重复归档同一版本报错', () => {
  const released = archiveUnreleased(changelog, '0.1.0', '2026-11-22');
  assert.throws(() => archiveUnreleased(released, '0.1.0', '2026-11-22'), /已存在/);
});

test('没有条目或日期非法时报错', () => {
  assert.throws(
    () => archiveUnreleased('## [Unreleased]\n\n暂无未发布变更\n', '0.1.0', '2026-11-22'),
    /没有可归档的条目/,
  );
  assert.throws(() => archiveUnreleased(changelog, '0.1.0', '2026/11/22'), /日期格式/);
});

const base = {
  versions: [
    { file: 'package.json', version: '0.0.0' },
    { file: 'packages/tokens/package.json', version: '0.0.0' },
    { file: 'packages/ui/package.json', version: '0.0.0' },
    { file: 'apps/docs/package.json', version: '0.0.0' },
  ],
  dependencies: {
    'apps/docs/package.json': { '@ahomeyonglin/tokens': 'workspace:*', '@ahomeyonglin/ui': 'workspace:*' },
  },
  tag: 'v0.0.0',
  changelog: '## [Unreleased]\n\n暂无未发布变更\n\n## [0.0.0] - 2026-11-20\n\n### Added\n\n- 历史条目\n',
};

test('版本、标签与日志一致时通过', () => {
  assert.deepEqual(collectIssues(base), []);
});

test('版本不一致被发现', () => {
  const issues = collectIssues({
    ...base,
    versions: base.versions.map((entry) =>
      entry.file === 'packages/ui/package.json' ? { ...entry, version: '0.1.0' } : entry,
    ),
  });
  assert.match(issues[0], /packages\/ui\/package\.json 版本为 0\.1\.0/);
});

test('依赖写死版本被发现', () => {
  const issues = collectIssues({
    ...base,
    dependencies: { 'apps/docs/package.json': { '@ahomeyonglin/ui': '^0.1.0' } },
  });
  assert.match(issues[0], /应使用 workspace:\*/);
});

test('缺少 tag 或 tag 不匹配被发现', () => {
  assert.match(collectIssues({ ...base, tag: null })[0], /没有 v\* 标签/);
  assert.match(collectIssues({ ...base, tag: 'v0.1.0' })[0], /最新标签为 v0\.1\.0/);
});

test('日志版本或顺序错误被发现', () => {
  assert.match(
    collectIssues({ ...base, changelog: '## [Unreleased]\n\n## [0.1.0] - 2026-11-22\n' })[0],
    /最新版本区块为 0\.1\.0/,
  );
  assert.match(
    collectIssues({
      ...base,
      changelog: '## [0.0.0] - 2026-11-20\n\n## [Unreleased]\n',
    }).join('\n'),
    /必须位于 ## \[Unreleased\] 之后/,
  );
});

test('版本区块缺少日期被发现', () => {
  const issues = collectIssues({
    ...base,
    changelog: '## [Unreleased]\n\n## [0.0.0]\n',
  });
  assert.match(issues.join('\n'), /缺少合法日期/);
});
