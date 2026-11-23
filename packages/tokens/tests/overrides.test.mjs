import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(pkgRoot, 'src');
const buildScript = join(pkgRoot, 'scripts/build.mjs');
const OVERRIDE = join('brands', 'zhixing.dark.tokens.json');

/** 在临时副本中构建，避免污染真实产物；成功时把产物读进内存 */
function runBuild(mutate) {
  const root = mkdtempSync(join(tmpdir(), 'tokens-overrides-'));
  const tempSrc = join(root, 'src');
  const tempDist = join(root, 'dist');
  cpSync(srcDir, tempSrc, { recursive: true });
  try {
    if (mutate) {
      mutate(tempSrc);
    }
    const result = spawnSync(process.execPath, [buildScript], {
      env: { ...process.env, TOKENS_SRC_DIR: tempSrc, TOKENS_DIST_DIR: tempDist },
      encoding: 'utf8',
    });
    const outputs =
      result.status === 0
        ? {
            tokens: JSON.parse(readFileSync(join(tempDist, 'tokens.json'), 'utf8')),
            brandCss: readFileSync(join(tempDist, 'brand-zhixing.css'), 'utf8'),
          }
        : null;
    return { result, outputs };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function readOverride(src) {
  return JSON.parse(readFileSync(join(src, OVERRIDE), 'utf8'));
}

function writeOverride(src, value) {
  writeFileSync(join(src, OVERRIDE), `${JSON.stringify(value, undefined, 2)}\n`);
}

function expectFailure(mutate, pattern) {
  const { result } = runBuild(mutate);
  assert.equal(result.status, 1, `应构建失败\n${result.stdout}${result.stderr}`);
  assert.match(result.stderr, pattern);
}

test('V21 正例：品牌覆盖支持颜色与非复合 token', () => {
  const { result, outputs } = runBuild((src) => {
    const override = readOverride(src);
    override.semantic.space = {
      $type: 'dimension',
      inline: {
        md: {
          $value: '{raw.space.500}',
          $description: '品牌覆盖测试：行内间距改用 16px。',
        },
      },
    };
    writeOverride(src, override);
  });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(outputs, '构建成功但没有产物');

  const dark = outputs.tokens.combinations['dark/zhixing'];
  const light = outputs.tokens.combinations['light/zhixing'];
  assert.deepEqual(
    dark['semantic.color.action.primary.bg'].$value,
    dark['raw.color.brand.400'].$value,
    '暗色主操作背景应解析为品牌 400',
  );
  assert.deepEqual(
    dark['semantic.color.action.primary.bg-hover'].$value,
    dark['raw.color.brand.500'].$value,
    '暗色主操作悬停背景应解析为品牌 500',
  );
  assert.deepEqual(
    light['semantic.color.action.primary.bg'].$value,
    light['raw.color.brand.500'].$value,
    '亮色主操作背景仍应解析为品牌 500',
  );
  assert.deepEqual(
    dark['semantic.space.inline.md'].$value,
    dark['raw.space.500'].$value,
    '间距覆盖应解析为 raw.space.500',
  );
  assert.match(outputs.brandCss, /\[data-theme="dark"\]\[data-brand="zhixing"\]/);
  assert.match(
    outputs.brandCss,
    /--semantic-color-action-primary-bg:\s*var\(--raw-color-brand-400\)/,
  );
  assert.match(outputs.brandCss, /--semantic-space-inline-md:\s*var\(--raw-space-500\)/);
});

test('V21 反例：覆盖非 semantic token 失败', () => {
  expectFailure((src) => {
    writeOverride(src, {
      raw: {
        color: {
          $type: 'color',
          brand: {
            500: {
              $value: { colorSpace: 'oklch', components: [0.3734, 0.1126, 259.5882], alpha: 1 },
              $description: '非法覆盖层级。',
            },
          },
        },
      },
    });
  }, /不在 semantic 层/);
});

test('V21 反例：缺少 $description 失败', () => {
  expectFailure((src) => {
    const override = readOverride(src);
    delete override.semantic.color.action.primary.bg.$description;
    writeOverride(src, override);
  }, /缺少非空 \$description/);
});

test('V21 反例：alias 目标不存在失败', () => {
  expectFailure((src) => {
    const override = readOverride(src);
    override.semantic.color.action.primary.bg.$value = '{raw.color.brand.999}';
    writeOverride(src, override);
  }, /在 dark\/zhixing 中不存在/);
});

test('V21 反例：alias 类型与目标 token 不一致失败', () => {
  expectFailure((src) => {
    const override = readOverride(src);
    override.semantic.color.action.primary.bg.$value = '{raw.space.500}';
    writeOverride(src, override);
  }, /类型为 dimension，与 color 不一致/);
});

test('V21 反例：覆盖不存在的 token 失败', () => {
  expectFailure((src) => {
    const override = readOverride(src);
    override.semantic.color.action.primary.foo = {
      $value: '{raw.color.brand.400}',
      $description: '不存在的 token。',
    };
    writeOverride(src, override);
  }, /不存在，覆盖只允许重映射已有 token/);
});

test('V21 反例：非法值失败', () => {
  expectFailure((src) => {
    const override = readOverride(src);
    override.semantic.color.action.primary.bg.$value = 'brand-400';
    writeOverride(src, override);
  }, /只允许 alias/);
});
