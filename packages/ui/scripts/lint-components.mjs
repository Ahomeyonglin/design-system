import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = process.env.UI_SRC_DIR ? resolve(process.env.UI_SRC_DIR) : join(root, 'src');
const componentsDir = join(srcDir, 'components');

const violations = [];

function report(file, line, message) {
  violations.push({ file, line, message });
}

function lineOf(text, key) {
  const index = text.split('\n').findIndex((line) => line.includes(`"${key}"`));
  return index < 0 ? 1 : index + 1;
}

/** 保留行数，抹掉注释内容，避免注释里的示例被误报 */
function blankComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '));
}

const COLOR_LITERAL = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|oklch)\(/i;
const RAW_VAR = /--raw-/;
const RAW_PATH = /(?<![\w-])raw\./;

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
]);

const DECLARATION = /^\s*([a-zA-Z-]+)\s*:\s*([^;]+);?\s*$/;

function scanFile(path) {
  const rel = relative(srcDir, path);
  const extension = path.slice(path.lastIndexOf('.'));
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
    if (RAW_VAR.test(line) || RAW_PATH.test(line)) {
      report(rel, lineNumber, '引用了 raw 层，组件只能消费 semantic / comp token');
    }
    if (extension !== '.css') {
      if (/\bstyle\s*=/.test(line)) {
        report(rel, lineNumber, '出现内联样式 style=，请改用组件变体 express');
      }
      if (/\b(?:className|style)\s*\??\s*:/.test(line)) {
        report(rel, lineNumber, 'props 类型包含 className / style，组件不对外暴露样式入口');
      }
      return;
    }

    const declaration = line.match(DECLARATION);
    if (!declaration) {
      return;
    }
    const property = declaration[1].toLowerCase();
    if (!SPACING_PROPS.has(property)) {
      return;
    }
    const remainder = declaration[2].replace(/var\(--[\w-]+\)/g, '');
    if (/[\w.#%-]/.test(remainder)) {
      report(rel, lineNumber, `写死间距或字号：${property}: ${declaration[2].trim()}，请改用 --semantic-* 变量`);
    }
  });
}

let componentCount = 0;

if (!existsSync(componentsDir)) {
  console.error(`找不到组件目录：${componentsDir}`);
  process.exit(1);
}

for (const entry of readdirSync(componentsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }
  componentCount += 1;
  const id = entry.name;
  const dir = join(componentsDir, id);
  const expected = [`${id}.tsx`, `${id}.css`, 'component.meta.json'];
  const actual = readdirSync(dir).filter((file) => !file.startsWith('.'));
  const missing = expected.filter((file) => !actual.includes(file));
  const extra = actual.filter((file) => !expected.includes(file));

  for (const file of missing) {
    report(relative(srcDir, join(dir, file)), 1, `组件目录缺少 ${file}`);
  }
  for (const file of extra) {
    report(relative(srcDir, join(dir, file)), 1, `组件目录只允许三件套，发现多余文件 ${file}`);
  }

  const metaPath = join(dir, 'component.meta.json');
  if (!existsSync(metaPath)) {
    continue;
  }
  const metaText = readFileSync(metaPath, 'utf8');
  const metaRel = relative(srcDir, metaPath);
  let meta;
  try {
    meta = JSON.parse(metaText);
  } catch (error) {
    report(metaRel, 1, `meta 不是合法 JSON：${error.message}`);
    continue;
  }

  for (const field of ['name', 'category', '$description']) {
    if (typeof meta[field] !== 'string' || meta[field].trim() === '') {
      report(metaRel, lineOf(metaText, field), `meta 缺少字段 ${field}`);
    }
  }

  if (!Array.isArray(meta.props)) {
    report(metaRel, lineOf(metaText, 'props'), 'meta 缺少 props 数组');
  } else {
    meta.props.forEach((prop, index) => {
      const missingFields = [];
      if (typeof prop.name !== 'string' || prop.name.trim() === '') {
        missingFields.push('name');
      }
      if (typeof prop.type !== 'string' || prop.type.trim() === '') {
        missingFields.push('type');
      }
      if (typeof prop.required !== 'boolean') {
        missingFields.push('required');
      }
      if (typeof prop.description !== 'string' || prop.description.trim() === '') {
        missingFields.push('description');
      }
      if (prop.defaultValue !== undefined && typeof prop.defaultValue !== 'string') {
        missingFields.push('defaultValue（应为字符串）');
      }
      if (missingFields.length > 0) {
        report(metaRel, lineOf(metaText, 'props'), `props[${index}] 缺少或错误：${missingFields.join('、')}`);
      }
    });
  }

  if (!Array.isArray(meta.tokens)) {
    report(metaRel, lineOf(metaText, 'tokens'), 'meta 缺少 tokens 数组');
  } else {
    for (const token of meta.tokens) {
      if (typeof token !== 'string' || !(token.startsWith('semantic.') || token.startsWith('comp.'))) {
        report(metaRel, lineOf(metaText, 'tokens'), `tokens 含非法前缀：${token}`);
      }
    }
  }
}

for (const file of readdirSync(join(srcDir, 'components'), { recursive: true })) {
  const path = join(srcDir, 'components', String(file));
  if (path.endsWith('.css') || path.endsWith('.tsx')) {
    scanFile(path);
  }
}

if (violations.length > 0) {
  violations.sort(
    (a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0) || a.line - b.line,
  );
  for (const violation of violations) {
    console.error(`${violation.file}:${violation.line}  ${violation.message}`);
  }
  console.error(`\n✖ 组件 lint 失败：${violations.length} 处违规`);
  process.exit(1);
}

console.log(`✔ 组件 lint 通过（${componentCount} 个组件）`);
