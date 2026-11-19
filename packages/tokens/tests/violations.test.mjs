import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(pkgRoot, 'src');

function runFixture(edits) {
  const workDir = mkdtempSync(join(tmpdir(), 'ds-tokens-'));
  const fixtureSrc = join(workDir, 'src');
  const fixtureDist = join(workDir, 'dist');
  cpSync(srcDir, fixtureSrc, { recursive: true });

  for (const [file, replace] of edits) {
    const path = join(fixtureSrc, file);
    const next = replace(readFileSync(path, 'utf8'));
    writeFileSync(path, next);
  }

  try {
    execFileSync(process.execPath, ['scripts/build.mjs'], {
      cwd: pkgRoot,
      env: { ...process.env, TOKENS_SRC_DIR: fixtureSrc, TOKENS_DIST_DIR: fixtureDist },
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return { code: 0, stderr: '' };
  } catch (error) {
    return { code: error.status ?? 1, stderr: String(error.stderr ?? '') };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

test('V1 源码出现 hex 时构建失败', () => {
  const result = runFixture([
    [
      'raw.tokens.json',
      (text) =>
        text.replace(
          '\n    "space": {',
          '\n    "probeHex": {\n      "$type": "color",\n      "$value": "#CE1B6C",\n      "$description": "fixture"\n    },\n    "space": {',
        ),
    ],
  ]);
  assert.notEqual(result.code, 0, '写入 hex 后构建应失败');
});

test('V2 超出 sRGB 色域时构建失败并指出 token', () => {
  const result = runFixture([
    [
      'raw.tokens.json',
      (text) =>
        text.replace(
          '\n    "space": {',
          '\n    "probeGamut": {\n      "$type": "color",\n      "$value": { "colorSpace": "oklch", "components": [0.7, 0.4, 30], "alpha": 1 },\n      "$description": "fixture"\n    },\n    "space": {',
        ),
    ],
  ]);
  assert.notEqual(result.code, 0, '超色域时应构建失败');
  assert.match(result.stderr, /probeGamut/, `错误信息应指出问题 token，实际：${result.stderr}`);
});

test('V5 悬空 alias 时构建失败', () => {
  const result = runFixture([
    [
      'semantic.tokens.json',
      (text) => text.replace('"{raw.color.neutral.100}"', '"{raw.color.neutral.999}"'),
    ],
  ]);
  assert.notEqual(result.code, 0, '悬空 alias 应导致构建失败');
});
