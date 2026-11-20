import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = process.env.DOCS_SRC_DIR ? resolve(process.env.DOCS_SRC_DIR) : join(root, 'src');
const layoutFile = join(srcDir, 'styles', 'layout.css');

const violations = [];

function report(file, line, message) {
  violations.push({ file, line, message });
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(path);
    }
    return /\.(css|ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

function blankComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '));
}

const COLOR_LITERAL = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|oklch)\s*\(/i;
const RAW_VAR = /--raw-/;
const RAW_PATH = /(?<![\w-])raw\./;
const LITERAL_LENGTH = /(?<![\w-])(?:\d+\.?\d*|\.\d+)(?:px|rem|em|vh|vw)\b/;

const RAW_ALLOWED = new Set(['lib/tokens.ts', 'sections/ColorPage.tsx']);

const DECLARATION = /^\s*([a-zA-Z-]+)\s*:\s*([^;]+);?\s*$/;

const SPACING_PROPS = new Set([
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'padding-block',
  'padding-block-start',
  'padding-block-end',
  'padding-inline',
  'padding-inline-start',
  'padding-inline-end',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'margin-block',
  'margin-block-start',
  'margin-block-end',
  'margin-inline',
  'margin-inline-start',
  'margin-inline-end',
  'gap',
  'row-gap',
  'column-gap',
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'font-size',
  'line-height',
  'font-weight',
  'letter-spacing',
]);

const COLOR_PROPS = new Set([
  'color',
  'background',
  'background-color',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'fill',
  'stroke',
]);

const LITERAL_LENGTH_PROPS = new Set(['border-width', 'outline-width', 'outline-offset']);

const INLINE_STYLE = /style=\{\s*\{([\s\S]*?)\}\s*(?:as\s+[\w$.]+\s*)?\}/g;
const STYLE_KEY = /(['"]?)([A-Za-z][\w-]*|--[\w-]+)\1\s*:/g;

function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function checkInlineStyles(rel, text) {
  for (const match of text.matchAll(INLINE_STYLE)) {
    const block = match[1];
    const baseIndex = match.index ?? 0;
    for (const keyMatch of block.matchAll(STYLE_KEY)) {
      const key = keyMatch[2];
      if (key.startsWith('--')) {
        continue;
      }
      const line = lineAt(text, baseIndex + keyMatch.index);
      report(rel, line, `内联样式只能注入 CSS 自定义属性（--*），发现 ${key}`);
    }
  }
}

function checkCssDeclaration(rel, lineNumber, line, isLayout) {
  const declaration = line.match(DECLARATION);
  if (!declaration) {
    if (!isLayout && LITERAL_LENGTH.test(line)) {
      report(rel, lineNumber, '布局尺寸只能声明在 styles/layout.css');
    }
    return;
  }

  const property = declaration[1].toLowerCase();
  const value = declaration[2].trim();

  if (!isLayout && LITERAL_LENGTH.test(value) && !LITERAL_LENGTH_PROPS.has(property)) {
    report(rel, lineNumber, `布局尺寸只能声明在 styles/layout.css：${property}: ${value}`);
  }

  if (SPACING_PROPS.has(property)) {
    const remainder = value
      .replace(/var\(--[\w-]+\)/g, '')
      .replace(/\b(?:0|auto|none|inherit|initial)\b/g, '');
    if (/[\w.#%]/.test(remainder)) {
      report(rel, lineNumber, `写死间距、字号或圆角：${property}: ${value}`);
    }
  }

  if (COLOR_PROPS.has(property)) {
    const allowed =
      value.includes('var(--') ||
      /^(?:transparent|none|currentColor|inherit|initial|unset)$/i.test(value);
    if (!allowed) {
      report(rel, lineNumber, `颜色必须来自语义 token 变量：${property}: ${value}`);
    }
  }
}

function scanFile(path) {
  const rel = relative(srcDir, path).split(sep).join('/');
  const extension = path.slice(path.lastIndexOf('.'));
  const isLayout = path === layoutFile;
  const text = extension === '.css' ? blankComments(readFileSync(path, 'utf8')) : readFileSync(path, 'utf8');

  text.split('\n').forEach((line, index) => {
    const lineNumber = index + 1;
    if (!line.trim()) {
      return;
    }

    if (COLOR_LITERAL.test(line)) {
      report(rel, lineNumber, '出现颜色字面量 hex，请改用 --semantic-* 变量');
    }
    if (COLOR_FUNCTION.test(line)) {
      report(rel, lineNumber, '出现颜色字面量函数（rgb / hsl / oklch），请改用 --semantic-* 变量');
    }

    const rawAllowed = RAW_ALLOWED.has(rel);
    if (!rawAllowed && (RAW_VAR.test(line) || RAW_PATH.test(line))) {
      report(rel, lineNumber, '引用了 raw 层，文档站只允许 /color 原始色阶区与 lib/tokens.ts 消费 raw');
    }

    if (!isLayout && /--docs-[\w-]+\s*:/.test(line)) {
      report(rel, lineNumber, '--docs-* 变量只能声明在 styles/layout.css');
    }

    if (extension === '.css') {
      checkCssDeclaration(rel, lineNumber, line, isLayout);
    } else if (!isLayout && LITERAL_LENGTH.test(line)) {
      report(rel, lineNumber, '布局尺寸只能声明在 styles/layout.css');
    }
  });

  if (extension !== '.css') {
    checkInlineStyles(rel, text);
  }
}

if (!existsSync(srcDir)) {
  console.error(`找不到源码目录：${srcDir}`);
  process.exit(1);
}

for (const file of walk(srcDir)) {
  scanFile(file);
}

if (violations.length > 0) {
  console.error(`docs lint 失败（${violations.length} 处）：`);
  for (const violation of violations) {
    console.error(`  ${violation.file}:${violation.line} ${violation.message}`);
  }
  process.exit(1);
}

console.log('docs lint 通过');
