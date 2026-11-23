import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test, { before } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ColorSpace, inGamut, OKLCH, sRGB } from 'colorjs.io/fn';

ColorSpace.register(OKLCH);
ColorSpace.register(sRGB);

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(pkgRoot, 'dist');
const snapshotPath = join(pkgRoot, 'tests/snapshots/tokens.snapshot.json');

function build() {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: pkgRoot, stdio: 'pipe' });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function snapshotOf(dist) {
  const combinations = {};
  for (const [combo, tokens] of Object.entries(dist.combinations)) {
    combinations[combo] = Object.fromEntries(
      Object.entries(tokens).map(([id, token]) => {
        const entry = { $type: token.$type, $value: token.$value };
        if (token.hex) {
          entry.hex = token.hex;
        }
        if (token.$deprecated) {
          entry.$deprecated = token.$deprecated;
        }
        return [id, entry];
      }),
    );
  }
  return { version: dist.version, themes: dist.themes, brands: dist.brands, combinations };
}

function flatten(snapshot) {
  const flat = new Map();
  for (const [combo, tokens] of Object.entries(snapshot.combinations)) {
    for (const [id, entry] of Object.entries(tokens)) {
      flat.set(`${combo} ${id}`, JSON.stringify(entry));
    }
  }
  return flat;
}

before(() => build());

test('V3 快照：hex 与非颜色值变化必须显式更新', () => {
  const actual = snapshotOf(readJson(join(distDir, 'tokens.json')));

  if (process.env.UPDATE_SNAPSHOT === '1') {
    mkdirSync(dirname(snapshotPath), { recursive: true });
    writeFileSync(snapshotPath, `${JSON.stringify(actual, undefined, 2)}\n`);
    return;
  }

  assert.ok(existsSync(snapshotPath), '缺少快照文件，先运行 UPDATE_SNAPSHOT=1 pnpm --filter @ahomeyonglin/tokens test');
  const expectedFlat = flatten(readJson(snapshotPath));
  const actualFlat = flatten(actual);
  const changes = [];
  for (const [key, value] of actualFlat) {
    if (!expectedFlat.has(key)) {
      changes.push(`新增 ${key}`);
    } else if (expectedFlat.get(key) !== value) {
      changes.push(`变更 ${key}`);
    }
  }
  for (const key of expectedFlat.keys()) {
    if (!actualFlat.has(key)) {
      changes.push(`删除 ${key}`);
    }
  }
  assert.deepEqual(changes, [], `快照不一致：\n${changes.join('\n')}`);
});

test('V2 色域：产物中所有颜色均在 sRGB 内', () => {
  const dist = readJson(join(distDir, 'tokens.json'));
  const failures = [];
  for (const [combo, tokens] of Object.entries(dist.combinations)) {
    for (const [id, token] of Object.entries(tokens)) {
      if (token.$type !== 'color') {
        continue;
      }
      const color = {
        spaceId: 'oklch',
        space: OKLCH,
        coords: token.$value.components,
        alpha: token.$value.alpha ?? 1,
      };
      if (!inGamut(color, 'srgb')) {
        failures.push(`${combo} ${id}`);
      }
    }
  }
  assert.deepEqual(failures, [], `超出 sRGB：${failures.join(', ')}`);
});

test('V4/V16/V17/V18 产物数量、分层与非颜色产物', () => {
  const dist = readJson(join(distDir, 'tokens.json'));
  const cssFiles = readdirSync(distDir).filter((file) => file.endsWith('.css'));
  const expectedCss = dist.themes.length + dist.brands.length;
  assert.equal(cssFiles.length, expectedCss, `CSS 文件数量应为 ${expectedCss}，实际 ${cssFiles.join(', ')}`);

  const themeCss = readFileSync(join(distDir, 'theme-light.css'), 'utf8');
  assert.match(themeCss, /--raw-/, '主题 CSS 缺少 --raw-*');
  assert.match(themeCss, /--semantic-/, '主题 CSS 缺少 --semantic-*');
  assert.match(themeCss, /--semantic-space-inline-sm/, '主题 CSS 缺少语义间距');
  assert.match(themeCss, /--semantic-radius-control/, '主题 CSS 缺少语义圆角');
  assert.match(themeCss, /--semantic-text-body-md-font-size/, '主题 CSS 缺少语义排版');
  assert.match(themeCss, /@layer tokens\.theme, tokens\.brand;/, '主题 CSS 缺少层级顺序声明');
  assert.match(themeCss, /@layer tokens\.theme \{/, '主题 CSS 未放入 tokens.theme 层');

  const brandCss = readFileSync(join(distDir, 'brand-base.css'), 'utf8');
  assert.match(brandCss, /--raw-color-brand-500/, '品牌 CSS 缺少品牌色阶');
  assert.doesNotMatch(brandCss, /--semantic-/, '品牌 CSS 不应包含语义变量');
  assert.match(brandCss, /@layer tokens\.brand \{/, '品牌 CSS 未放入 tokens.brand 层');

  const zhixingCss = readFileSync(join(distDir, 'brand-zhixing.css'), 'utf8');
  assert.match(zhixingCss, /\[data-brand="zhixing"\]/, 'zhixing 品牌 CSS 缺少品牌选择器');
  assert.match(
    zhixingCss,
    /\[data-theme="dark"\]\[data-brand="zhixing"\]/,
    'zhixing 品牌 CSS 缺少暗色主题覆盖块',
  );
  assert.match(
    zhixingCss,
    /--semantic-color-action-primary-bg:\s*var\(--raw-color-brand-400\)/,
    'zhixing 暗色主操作背景应引用品牌 400',
  );
  assert.match(
    zhixingCss,
    /--semantic-color-action-primary-bg-hover:\s*var\(--raw-color-brand-500\)/,
    'zhixing 暗色主操作悬停背景应引用品牌 500',
  );
  assert.doesNotMatch(zhixingCss, /--semantic-color-bg-page/, '品牌 CSS 不应输出无关语义变量');

  const badLayers = [];
  for (const [combo, tokens] of Object.entries(dist.combinations)) {
    for (const id of Object.keys(tokens)) {
      if (!id.startsWith('raw.') && !id.startsWith('semantic.')) {
        badLayers.push(`${combo} ${id}`);
      }
      if (id.startsWith('comp.')) {
        badLayers.push(`${combo} ${id}`);
      }
    }
  }
  assert.deepEqual(badLayers, [], `非法层级：${badLayers.join(', ')}`);

  for (const [combo, tokens] of Object.entries(dist.combinations)) {
    assert.equal(Object.keys(tokens).length, 133, `${combo} token 数量应为 133`);
    for (const [id, token] of Object.entries(tokens)) {
      if (token.$type === 'color') {
        assert.equal(token.$value.colorSpace, 'oklch', `${combo} ${id} 不是 oklch`);
        assert.match(token.hex, /^#[0-9A-F]{6}(?:[0-9A-F]{2})?$/, `${combo} ${id} hex 格式错误`);
      }
      if (token.$type === 'dimension') {
        assert.equal(typeof token.$value.unit, 'string', `${combo} ${id} 缺少单位`);
      }
    }
  }
});

test('V6 构建可重复：连续两次产物字节一致', () => {
  const hash = () =>
    Object.fromEntries(
      readdirSync(distDir)
        .sort()
        .map((file) => [
          file,
          createHash('sha256').update(readFileSync(join(distDir, file))).digest('hex'),
        ]),
    );
  const first = hash();
  build();
  assert.deepEqual(hash(), first);
});
