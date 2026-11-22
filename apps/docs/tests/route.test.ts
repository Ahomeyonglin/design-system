import assert from 'node:assert/strict';
import test from 'node:test';
import { matchRoute, routeTitle } from '../src/router.ts';

const IDS = ['Badge', 'Button', 'Card', 'Text', 'TextField'];

test('十条路由可直接解析', () => {
  assert.equal(matchRoute('/', '/', IDS).name, 'overview');
  assert.equal(matchRoute('/color', '/', IDS).name, 'color');
  assert.equal(matchRoute('/type', '/', IDS).name, 'type');
  assert.equal(matchRoute('/space', '/', IDS).name, 'space');
  assert.equal(matchRoute('/themes', '/', IDS).name, 'themes');
  assert.equal(matchRoute('/components', '/', IDS).name, 'components');
  assert.equal(matchRoute('/changelog', '/', IDS).name, 'changelog');
  assert.equal(matchRoute('/examples/project-settings', '/', IDS).name, 'example-project-settings');
  assert.equal(matchRoute('/examples/branch-transfer', '/', IDS).name, 'example-branch-transfer');
  assert.deepEqual(matchRoute('/components/button', '/', IDS), {
    name: 'component-detail',
    params: { id: 'Button' },
  });
});

test('大小写与尾斜杠归一', () => {
  assert.equal(matchRoute('/Color', '/', IDS).name, 'color');
  assert.equal(matchRoute('/components/', '/', IDS).name, 'components');
  assert.deepEqual(matchRoute('/components/BUTTON/', '/', IDS), {
    name: 'component-detail',
    params: { id: 'Button' },
  });
});

test('未知路径与未知组件返回 not-found', () => {
  assert.equal(matchRoute('/not-exist', '/', IDS).name, 'not-found');
  assert.equal(matchRoute('/components/unknown', '/', IDS).name, 'not-found');
});

test('部署 base 前缀被剥离', () => {
  assert.equal(matchRoute('/design-system/', '/design-system/', IDS).name, 'overview');
  assert.equal(matchRoute('/design-system', '/design-system/', IDS).name, 'overview');
  assert.deepEqual(matchRoute('/design-system/components/button', '/design-system/', IDS), {
    name: 'component-detail',
    params: { id: 'Button' },
  });
  assert.equal(matchRoute('/design-system/not-exist', '/design-system/', IDS).name, 'not-found');
});

test('标题按路由生成', () => {
  assert.equal(routeTitle({ name: 'overview', params: {} }), '总览');
  assert.equal(routeTitle({ name: 'component-detail', params: { id: 'Button' } }), 'Button');
  assert.equal(routeTitle({ name: 'not-found', params: {} }), '页面不存在');
});
