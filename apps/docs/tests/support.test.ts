import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fallbackBrand,
  fallbackTheme,
  isCombinationSupported,
  supportedThemes,
} from '../src/lib/support.ts';

const fullManifest = {
  brands: {
    base: { themes: ['light', 'dark'] },
  },
};

const lightOnlyManifest = {
  brands: {
    base: { themes: ['light'] },
  },
};

test('全支持组合返回可用', () => {
  assert.deepEqual(supportedThemes(fullManifest, 'base'), ['light', 'dark']);
  assert.equal(isCombinationSupported(fullManifest, 'base', 'light'), true);
  assert.equal(isCombinationSupported(fullManifest, 'base', 'dark'), true);
});

test('仅 light 品牌判定 dark 不可用', () => {
  assert.deepEqual(supportedThemes(lightOnlyManifest, 'base'), ['light']);
  assert.equal(isCombinationSupported(lightOnlyManifest, 'base', 'dark'), false);
});

test('非法品牌回退到 manifest 第一个品牌', () => {
  assert.deepEqual(fallbackBrand(fullManifest, 'nope'), { brand: 'base', changed: true });
  assert.deepEqual(fallbackBrand(fullManifest, 'base'), { brand: 'base', changed: false });
});

test('不支持的主题回退到该品牌支持的主题', () => {
  assert.deepEqual(fallbackTheme(lightOnlyManifest, 'base', 'dark'), {
    theme: 'light',
    changed: true,
  });
  assert.deepEqual(fallbackTheme(fullManifest, 'base', 'dark'), {
    theme: 'dark',
    changed: false,
  });
  assert.deepEqual(fallbackTheme(fullManifest, 'base', 'foo'), {
    theme: 'light',
    changed: true,
  });
});
