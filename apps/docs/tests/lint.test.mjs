import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, '..', 'scripts', 'lint-docs.mjs');

function run(fixture) {
  return spawnSync(process.execPath, [script], {
    env: {
      ...process.env,
      DOCS_SRC_DIR: join(here, 'fixtures', fixture),
    },
    encoding: 'utf8',
  });
}

function expectFailure(fixture, pattern) {
  const result = run(fixture);
  assert.equal(result.status, 1, `fixture ${fixture} 应失败\n${result.stdout}${result.stderr}`);
  assert.match(result.stderr, pattern);
}

test('合法 fixture 通过', () => {
  const result = run('valid');
  assert.equal(result.status, 0, result.stderr);
});

test('hex 被拦截并指到行号', () => {
  expectFailure('hex', /Page\.tsx:2/);
});

test('--raw- 引用被拦截', () => {
  expectFailure('raw', /Page\.css:2/);
});

test('写死 padding 被拦截', () => {
  expectFailure('padding', /Page\.css:2/);
});

test('普通文件写布局尺寸被拦截', () => {
  expectFailure('layout', /Page\.css:2/);
});

test('视觉内联样式被拦截', () => {
  expectFailure('inline', /Page\.tsx:2/);
});

test('--docs-* 在 layout.css 之外声明被拦截', () => {
  expectFailure('docsvar', /Page\.css:2/);
});
