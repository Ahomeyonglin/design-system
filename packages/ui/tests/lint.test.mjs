import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(pkgRoot, 'src');

function runLint(edit, extraEnv = {}) {
  const workDir = mkdtempSync(join(tmpdir(), 'ds-ui-lint-'));
  const fixtureSrc = join(workDir, 'src');
  cpSync(srcDir, fixtureSrc, { recursive: true });
  if (edit) {
    edit(fixtureSrc);
  }
  try {
    const stdout = execFileSync(process.execPath, ['scripts/lint-components.mjs'], {
      cwd: pkgRoot,
      env: { ...process.env, UI_SRC_DIR: fixtureSrc, ...extraEnv },
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return { code: 0, output: stdout };
  } catch (error) {
    return { code: error.status ?? 1, output: `${error.stdout ?? ''}${error.stderr ?? ''}` };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function append(file, text) {
  writeFileSync(file, `${readFileSync(file, 'utf8')}${text}`);
}

function withTokenFixture(entries) {
  const workDir = mkdtempSync(join(tmpdir(), 'ds-ui-tokens-'));
  const file = join(workDir, 'tokens.json');
  writeFileSync(file, JSON.stringify({ combinations: { 'light/base': entries } }));
  return { file, cleanup: () => rmSync(workDir, { recursive: true, force: true }) };
}

test('R5 正例：现有五个组件通过 lint', () => {
  const result = runLint();
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /组件 lint 通过/);
});

test('R5 反例：写死色值失败并给出行号与文件', () => {
  const result = runLint((src) => {
    append(join(src, 'components/Button/Button.css'), '\n.probe {\n  color: #ff0000;\n}\n');
  });
  assert.notEqual(result.code, 0);
  assert.match(result.output, /Button\.css:\d+/);
  assert.match(result.output, /颜色字面量/);
});

test('R5 反例：引用 --raw-* 失败', () => {
  const result = runLint((src) => {
    append(join(src, 'components/Text/Text.css'), '\n.probe {\n  color: var(--raw-color-brand-500);\n}\n');
  });
  assert.notEqual(result.code, 0);
  assert.match(result.output, /Text\.css:\d+/);
  assert.match(result.output, /raw/);
});

test('R5 反例：写死 padding 失败', () => {
  const result = runLint((src) => {
    const file = join(src, 'components/Card/Card.css');
    writeFileSync(
      file,
      readFileSync(file, 'utf8').replace(
        'padding: var(--semantic-space-inset-lg);',
        'padding: 16px;',
      ),
    );
  });
  assert.notEqual(result.code, 0);
  assert.match(result.output, /Card\.css:\d+/);
  assert.match(result.output, /写死间距/);
});

test('R5 反例：内联 style 失败', () => {
  const result = runLint((src) => {
    append(join(src, 'components/Text/Text.tsx'), '\nexport const probe = <span style={{}} />;\n');
  });
  assert.notEqual(result.code, 0);
  assert.match(result.output, /Text\.tsx:\d+/);
  assert.match(result.output, /内联样式/);
});

test('R5 反例：props 含 className 失败', () => {
  const result = runLint((src) => {
    const file = join(src, 'components/Text/Text.tsx');
    writeFileSync(
      file,
      readFileSync(file, 'utf8').replace(
        'export type TextProps = {',
        'export type TextProps = {\n  className?: string;',
      ),
    );
  });
  assert.notEqual(result.code, 0);
  assert.match(result.output, /className/);
});

test('R5 反例：meta 缺字段失败', () => {
  const result = runLint((src) => {
    const file = join(src, 'components/Badge/component.meta.json');
    writeFileSync(
      file,
      readFileSync(file, 'utf8').replace(/\n\s*"\$description": "[^"]*",/, ''),
    );
  });
  assert.notEqual(result.code, 0);
  assert.match(result.output, /component\.meta\.json:\d+/);
  assert.match(result.output, /缺少字段 \$description/);
});

test('R5 反例：meta token 前缀非法失败', () => {
  const result = runLint((src) => {
    const file = join(src, 'components/Badge/component.meta.json');
    writeFileSync(
      file,
      readFileSync(file, 'utf8').replace('"semantic.color.bg.subtle"', '"raw.color.bg.subtle"'),
    );
  });
  assert.notEqual(result.code, 0);
  assert.match(result.output, /tokens 含非法前缀/);
});

test('R5 反例：组件目录缺三件套失败', () => {
  const result = runLint((src) => {
    unlinkSync(join(src, 'components/Badge/Badge.css'));
  });
  assert.notEqual(result.code, 0);
  assert.match(result.output, /Badge\.css/);
  assert.match(result.output, /缺少/);
});

test('R5 反例：组件目录出现多余文件失败', () => {
  const result = runLint((src) => {
    writeFileSync(join(src, 'components/Card/index.ts'), '');
  });
  assert.notEqual(result.code, 0);
  assert.match(result.output, /index\.ts/);
  assert.match(result.output, /多余文件/);
});

test('R6 正例：未被引用的弃用 token 不影响 lint', () => {
  const tokens = withTokenFixture({
    'semantic.color.bg.retired': {
      $type: 'color',
      $deprecated: '改用 semantic.color.bg.surface',
      $value: {},
    },
  });
  try {
    const result = runLint(undefined, { UI_TOKENS_JSON: tokens.file });
    assert.equal(result.code, 0, result.output);
  } finally {
    tokens.cleanup();
  }
});

test('R6 反例：组件样式引用已弃用 token 失败', () => {
  const tokens = withTokenFixture({
    'semantic.color.bg.surface': {
      $type: 'color',
      $deprecated: '改用 semantic.color.bg.subtle',
      $value: {},
    },
  });
  try {
    const result = runLint((src) => {
      append(join(src, 'components/Text/Text.css'), '\n.probe {\n  color: var(--semantic-color-bg-surface);\n}\n');
    }, { UI_TOKENS_JSON: tokens.file });
    assert.notEqual(result.code, 0);
    assert.match(result.output, /Text\.css:\d+/);
    assert.match(result.output, /已弃用 token semantic\.color\.bg\.surface/);
    assert.match(result.output, /改用 semantic\.color\.bg\.subtle/);
  } finally {
    tokens.cleanup();
  }
});

test('R6 反例：引用已弃用 typography token 的派生变量失败', () => {
  const tokens = withTokenFixture({
    'semantic.text.label.md': {
      $type: 'typography',
      $deprecated: '改用 semantic.text.label.sm',
      $value: {},
    },
  });
  try {
    const result = runLint((src) => {
      append(
        join(src, 'components/Text/Text.css'),
        '\n.probe {\n  font-size: var(--semantic-text-label-md-font-size);\n}\n',
      );
    }, { UI_TOKENS_JSON: tokens.file });
    assert.notEqual(result.code, 0);
    assert.match(result.output, /已弃用 token semantic\.text\.label\.md/);
  } finally {
    tokens.cleanup();
  }
});

test('R6 反例：meta 声明已弃用 token 失败', () => {
  const tokens = withTokenFixture({
    'semantic.color.bg.subtle': {
      $type: 'color',
      $deprecated: '改用 semantic.color.bg.surface',
      $value: {},
    },
  });
  try {
    const result = runLint(undefined, { UI_TOKENS_JSON: tokens.file });
    assert.notEqual(result.code, 0);
    assert.match(result.output, /Badge\/component\.meta\.json:\d+/);
    assert.match(result.output, /含已弃用 token semantic\.color\.bg\.subtle/);
  } finally {
    tokens.cleanup();
  }
});
