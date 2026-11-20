import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(pkgRoot, 'src');

const ALLOWED_TARGETS = {
  raw: ['raw'],
  semantic: ['raw', 'semantic'],
  comp: ['semantic', 'comp'],
};
const ALIAS_PATTERN = /^\{([^}]+)\}$/;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(path);
    }
    return entry.name.endsWith('.tokens.json') ? [path] : [];
  });
}

function layerOf(file) {
  const name = basename(file);
  const segments = file.split('/');
  if (name === 'raw.tokens.json' || segments.includes('brands')) {
    return 'raw';
  }
  if (name === 'semantic.tokens.json' || segments.includes('themes')) {
    return 'semantic';
  }
  if (name.startsWith('comp')) {
    return 'comp';
  }
  return null;
}

function collectTokens(node, path, out) {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    if ('$value' in node) {
      out.push({ path, value: node.$value });
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (!key.startsWith('$')) {
        collectTokens(child, path ? `${path}.${key}` : key, out);
      }
    }
    return;
  }
  if (path) {
    out.push({ path, value: node });
  }
}

function checkReferences(files) {
  const failures = [];
  for (const file of files) {
    const layer = layerOf(file.name);
    if (!layer) {
      failures.push(`${file.name} 无法判定层级`);
      continue;
    }

    const tokens = [];
    collectTokens(JSON.parse(file.content), '', tokens);
    for (const token of tokens) {
      const match = String(token.value).match(ALIAS_PATTERN);
      if (!match) {
        continue;
      }
      const targetLayer = match[1].split('.')[0];
      if (!ALLOWED_TARGETS[layer].includes(targetLayer)) {
        failures.push(
          `${file.name} ${token.path} 引用了 ${match[1]}，${layer} 层不允许引用 ${targetLayer} 层`,
        );
      }
    }
  }
  return failures;
}

function readSourceFiles() {
  return walk(srcDir).map((path) => ({
    name: relative(srcDir, path),
    content: readFileSync(path, 'utf8'),
  }));
}

test('V19 现有 token 引用方向合法', () => {
  const failures = checkReferences(readSourceFiles());
  assert.deepEqual(failures, []);
});

test('V19 反例：raw 引用 semantic 失败', () => {
  const failures = checkReferences([
    {
      name: 'raw.tokens.json',
      content: JSON.stringify({ color: { alias: { $value: '{semantic.color.bg.surface}' } } }),
    },
  ]);
  assert.match(failures[0], /raw 层不允许引用 semantic 层/);
});

test('V19 反例：semantic 引用 comp 失败', () => {
  const failures = checkReferences([
    {
      name: 'semantic.tokens.json',
      content: JSON.stringify({ color: { alias: { $value: '{comp.button.bg}' } } }),
    },
  ]);
  assert.match(failures[0], /semantic 层不允许引用 comp 层/);
});

test('V19 反例：comp 引用 raw 失败', () => {
  const failures = checkReferences([
    {
      name: 'comp.button.tokens.json',
      content: JSON.stringify({ bg: { $value: '{raw.color.brand.500}' } }),
    },
  ]);
  assert.match(failures[0], /comp 层不允许引用 raw 层/);
});
