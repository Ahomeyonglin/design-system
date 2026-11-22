import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(pkgRoot, '../..');
const srcDir = join(pkgRoot, 'src');

function walkTokens(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkTokens(path);
    }
    return entry.name.endsWith('.tokens.json') ? [path] : [];
  });
}

function collectTokens(node, path, out) {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    if ('$value' in node) {
      out.set(path, { deprecated: node.$deprecated });
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (!key.startsWith('$')) {
        collectTokens(child, path ? `${path}.${key}` : key, out);
      }
    }
  }
}

function tokensOf(json) {
  const out = new Map();
  collectTokens(json, '', out);
  return out;
}

/** 同一 id 可能被主题/品牌文件重复声明，任一文件带 $deprecated 即视为已弃用 */
function mergeTokens(map, json) {
  for (const [id, meta] of tokensOf(json)) {
    const previous = map.get(id);
    map.set(id, { deprecated: meta.deprecated ?? previous?.deprecated });
  }
}

function currentSourceTokens() {
  const tokens = new Map();
  for (const file of walkTokens(srcDir)) {
    mergeTokens(tokens, JSON.parse(readFileSync(file, 'utf8')));
  }
  return tokens;
}

function latestVersionTag() {
  try {
    const output = execFileSync('git', ['tag', '--list', 'v*', '--sort=-v:refname'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return output.split('\n').map((line) => line.trim()).filter(Boolean)[0] ?? null;
  } catch {
    return null;
  }
}

function tagSourceTokens(tag) {
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', tag, '--', 'packages/tokens/src'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .map((line) => line.trim())
    .filter((file) => file.endsWith('.tokens.json'));

  const tokens = new Map();
  for (const file of files) {
    const content = execFileSync('git', ['show', `${tag}:${file}`], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    mergeTokens(tokens, JSON.parse(content));
  }
  return tokens;
}

function findUndeclaredRemovals(baseline, current) {
  return [...baseline]
    .filter(([id, meta]) => !current.has(id) && !meta.deprecated)
    .map(([id]) => id)
    .sort();
}

test('V19 移除门禁：删除的 token 必须在最近 v* tag 中已弃用', (t) => {
  const tag = latestVersionTag();
  if (!tag) {
    t.skip('没有 v* tag，跳过移除门禁（发布态由 release:check 保证）');
    return;
  }
  const failures = findUndeclaredRemovals(tagSourceTokens(tag), currentSourceTokens());
  assert.deepEqual(
    failures,
    [],
    `以下 token 在 ${tag} 中未标记 $deprecated 就被删除，请先发一版弃用：\n${failures.join('\n')}`,
  );
});

test('V19 反例：未弃用就直接删除被判定为失败', () => {
  const baseline = new Map([['semantic.color.bg.legacy', { deprecated: undefined }]]);
  const current = new Map();

  assert.deepEqual(findUndeclaredRemovals(baseline, current), ['semantic.color.bg.legacy']);
});

test('V19 反例：已弃用的 token 允许删除', () => {
  const baseline = new Map([['semantic.color.bg.legacy', { deprecated: '改用 semantic.color.bg.surface' }]]);
  const current = new Map();

  assert.deepEqual(findUndeclaredRemovals(baseline, current), []);
});

function runFixture(mutate) {
  const workDir = mkdtempSync(join(tmpdir(), 'ds-tokens-deprecated-'));
  const fixtureSrc = join(workDir, 'src');
  const fixtureDist = join(workDir, 'dist');
  cpSync(srcDir, fixtureSrc, { recursive: true });
  mutate(fixtureSrc);

  try {
    execFileSync(process.execPath, ['scripts/build.mjs'], {
      cwd: pkgRoot,
      env: { ...process.env, TOKENS_SRC_DIR: fixtureSrc, TOKENS_DIST_DIR: fixtureDist },
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return {
      code: 0,
      stderr: '',
      tokensJson: readFileSync(join(fixtureDist, 'tokens.json'), 'utf8'),
      lightCss: readFileSync(join(fixtureDist, 'theme-light.css'), 'utf8'),
    };
  } catch (error) {
    return { code: error.status ?? 1, stderr: String(error.stderr ?? ''), tokensJson: '', lightCss: '' };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function editSemantic(srcPath, mutate) {
  const file = join(srcPath, 'semantic.tokens.json');
  const json = JSON.parse(readFileSync(file, 'utf8'));
  mutate(json);
  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}

test('V20 弃用说明进入产物，旧 CSS 变量保留', () => {
  const result = runFixture((src) =>
    editSemantic(src, (json) => {
      json.semantic.color.bg.surface.$deprecated = '改用 semantic.color.bg.subtle';
    }),
  );
  assert.equal(result.code, 0, result.stderr);

  const dist = JSON.parse(result.tokensJson);
  for (const [combinationId, tokens] of Object.entries(dist.combinations)) {
    assert.equal(
      tokens['semantic.color.bg.surface'].$deprecated,
      '改用 semantic.color.bg.subtle',
      `${combinationId} 缺少 $deprecated`,
    );
  }

  assert.match(result.lightCss, /--semantic-color-bg-surface:/);
});

test('V20 反例：$deprecated 非字符串时构建失败', () => {
  const result = runFixture((src) =>
    editSemantic(src, (json) => {
      json.semantic.color.bg.surface.$deprecated = true;
    }),
  );
  assert.notEqual(result.code, 0, '布尔值 $deprecated 应导致构建失败');
  assert.match(result.stderr, /semantic\.color\.bg\.surface/);
  assert.match(result.stderr, /\$deprecated/);
});
