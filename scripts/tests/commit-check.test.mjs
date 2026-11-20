import assert from 'node:assert/strict';
import test from 'node:test';
import { isExempt, parseSubject, validateSubject } from '../lib/commits.mjs';

test('合法标题通过', () => {
  const subjects = [
    'feat(ui): 新增禁用态样式',
    'fix: 修复遮罩发虚',
    'feat(repo)!: 重命名语义 token',
    'docs(repo): 归档 S1–S3 变更并建立 v0.0.0 基线',
    'chore: 更新依赖',
    'refactor(tokens): 拆分解析函数',
    'perf(ui): 减少重复渲染',
  ];
  for (const subject of subjects) {
    assert.equal(validateSubject(subject), null, subject);
  }
});

test('中文标题按字符计数', () => {
  const subject = `feat(ui): ${'字'.repeat(60)}`;
  assert.equal(validateSubject(subject), null);
  const tooLong = `feat(ui): ${'字'.repeat(63)}`;
  assert.match(validateSubject(tooLong), /72 个字符/);
});

test('豁免标题通过', () => {
  const subjects = ['Merge branch main', 'Revert "feat: x"', 'fixup! feat: x', 'squash! fix: y'];
  for (const subject of subjects) {
    assert.equal(isExempt(subject), true, subject);
    assert.equal(validateSubject(subject), null, subject);
  }
});

test('非法标题给出可读原因', () => {
  assert.match(validateSubject('update something'), /格式应为/);
  assert.match(validateSubject('feature: x'), /格式应为/);
  assert.match(validateSubject('feat(design): x'), /scope 必须是/);
  assert.match(validateSubject('feat:缺空格'), /格式应为/);
  assert.match(validateSubject('feat: '), /格式应为/);
  assert.equal(validateSubject('feat: 描述'), null);
});

test('解析结果包含类型、scope 与破坏性标记', () => {
  assert.deepEqual(parseSubject('feat(ui)!: 新增禁用态'), {
    type: 'feat',
    scope: 'ui',
    breaking: true,
    description: '新增禁用态',
  });
  assert.equal(parseSubject('update something'), null);
});
