import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@terrazzo/parser';
import { ColorSpace, inGamut, OKLCH, sRGB, serialize } from 'colorjs.io/fn';

ColorSpace.register(OKLCH);
ColorSpace.register(sRGB);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = process.env.TOKENS_SRC_DIR ? resolve(process.env.TOKENS_SRC_DIR) : join(root, 'src');
const distDir = process.env.TOKENS_DIST_DIR ? resolve(process.env.TOKENS_DIST_DIR) : join(root, 'dist');
const resolverPath = join(srcDir, 'resolver.json');

const manifest = JSON.parse(readFileSync(join(srcDir, 'brands/manifest.json'), 'utf8'));
const resolverSource = readFileSync(resolverPath, 'utf8');

const { resolver } = await parse(
  [{ filename: new URL(`file://${resolverPath}`), src: resolverSource }],
  { config: { permutationLimit: 1000 } },
);

const permutations = (resolver.listPermutations?.() ?? []).filter((input) =>
  manifest.brands[input.brand]?.themes.includes(input.theme),
);
if (permutations.length === 0) {
  throw new Error('manifest 与 resolver 没有任何有效组合');
}

for (const [brand, config] of Object.entries(manifest.brands)) {
  for (const theme of config.themes) {
    if (!permutations.some((input) => input.brand === brand && input.theme === theme)) {
      throw new Error(`manifest 声明的组合 ${theme}/${brand} 在 resolver 中不存在`);
    }
  }
}

for (const file of readdirSync(srcDir, { recursive: true })) {
  if (!String(file).endsWith('.tokens.json')) {
    continue;
  }
  const hit = readFileSync(join(srcDir, String(file)), 'utf8').match(/#[0-9a-f]{3,8}\b|\brgba?\(/gi);
  if (hit) {
    throw new Error(`${file} 出现 hex / rgb：${hit[0]}。颜色源值只允许 oklch。`);
  }
}

const themes = [...new Set(permutations.map((input) => input.theme))];
const brands = [...new Set(permutations.map((input) => input.brand))];
const combinations = Object.fromEntries(
  permutations.map((input) => [`${input.theme}/${input.brand}`, resolver.apply(input)]),
);

for (const [combinationId, tokens] of Object.entries(combinations)) {
  for (const [id, token] of Object.entries(tokens)) {
    if (token.$deprecated !== undefined) {
      if (typeof token.$deprecated !== 'string' || token.$deprecated.trim() === '') {
        throw new Error(
          `${combinationId} 的 ${id} 的 $deprecated 必须是非空字符串，写明替代 token 或迁移方式`,
        );
      }
    }
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
      throw new Error(`${combinationId} 的 ${id} 超出 sRGB 色域`);
    }
  }
}

/** token id → CSS 变量名 */
function cssVar(id) {
  return `--${id.replaceAll('.', '-')}`;
}

/** DTCG alias → CSS 变量引用；兼容单元素数组形式的 fontFamily alias */
function aliasToVar(value) {
  const raw = Array.isArray(value) && value.length === 1 ? value[0] : value;
  const match = typeof raw === 'string' ? raw.match(/^\{([\w.-]+)\}$/) : null;
  return match ? `var(${cssVar(match[1])})` : undefined;
}

function formatDimension(value) {
  return `${value.value}${value.unit}`;
}

const GENERIC_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-monospace',
  'ui-sans-serif',
  'ui-serif',
  'ui-rounded',
  'emoji',
  'math',
  'fangsong',
]);

function formatFontFamily(families) {
  const list = Array.isArray(families) ? families : [families];
  return list
    .map((family) => (GENERIC_FAMILIES.has(family) || /^[\w-]+$/.test(family) ? family : `"${family}"`))
    .join(', ');
}

function colorToHex(value) {
  const color = {
    spaceId: 'oklch',
    space: OKLCH,
    coords: value.components,
    alpha: value.alpha ?? 1,
  };
  return serialize(color, { format: 'hex', collapse: false }).toUpperCase();
}

function colorToOklch(value) {
  const [l, c, h] = value.components;
  const alpha = value.alpha ?? 1;
  return alpha === 1 ? `oklch(${l} ${c} ${h})` : `oklch(${l} ${c} ${h} / ${alpha})`;
}

/** 单个 token 的 CSS 声明；无法表达时返回空数组 */
function declarations(id, token, { honorAliases }) {
  const alias = honorAliases ? aliasToVar(token.$value) : undefined;
  if (alias) {
    return [`${cssVar(id)}: ${alias};`];
  }

  switch (token.$type) {
    case 'color':
      return [`${cssVar(id)}: ${colorToHex(token.$value)};`];
    case 'dimension':
      return [`${cssVar(id)}: ${formatDimension(token.$value)};`];
    case 'fontWeight':
      return [`${cssVar(id)}: ${token.$value};`];
    case 'fontFamily':
      return [`${cssVar(id)}: ${formatFontFamily(token.$value)};`];
    case 'typography': {
      const fields = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'];
      return fields.flatMap((field) => {
        const value = token.$value[field];
        if (value === undefined) {
          return [];
        }
        const fieldAlias = honorAliases ? aliasToVar(value) : undefined;
        if (fieldAlias) {
          return [`${cssVar(id)}-${kebab(field)}: ${fieldAlias};`];
        }
        if (field === 'fontFamily') {
          return [`${cssVar(id)}-font-family: ${formatFontFamily(value)};`];
        }
        if (field === 'fontSize' || field === 'lineHeight' || field === 'letterSpacing') {
          return [`${cssVar(id)}-${kebab(field)}: ${formatDimension(value)};`];
        }
        return [`${cssVar(id)}-${kebab(field)}: ${value};`];
      });
    }
    default:
      return [];
  }
}

function kebab(value) {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function sortedIds(tokens, layer) {
  return Object.keys(tokens)
    .filter((id) => id.startsWith(`${layer}.`))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function block(selector, lines, indent = '') {
  const indentedSelector = selector.replaceAll('\n', `\n${indent}`);
  const body = lines
    .map((line) => (line === '' ? '' : `${indent}  ${line}`))
    .join('\n');
  return `${indent}${indentedSelector} {\n${body}\n${indent}}`;
}

const header = [
  '/* 生成物，禁止手改。由 packages/tokens/scripts/build.mjs 产出。 */',
  '/* 加载顺序：theme-light.css → theme-dark.css → brand-*.css。 */',
].join('\n');

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

for (const theme of themes) {
  const combinationId = `${theme}/${brands[0]}`;
  const resolved = combinations[combinationId];
  const unresolved = resolver.apply(
    { theme, brand: brands[0] },
    { resolveAliases: false },
  );

  const rawLines = sortedIds(resolved, 'raw').flatMap((id) =>
    declarations(id, resolved[id], { honorAliases: false }),
  );
  const semanticLines = sortedIds(unresolved, 'semantic').flatMap((id) =>
    declarations(id, unresolved[id], { honorAliases: true }),
  );

  const colorOverrides = sortedIds(resolved, 'raw')
    .filter((id) => resolved[id].$type === 'color')
    .map((id) => `${cssVar(id)}: ${colorToOklch(resolved[id].$value)};`);

  const selector = theme === 'light' ? ':root,\n[data-theme="light"]' : `[data-theme="${theme}"]`;
  const css = [
    header,
    '',
    block(selector, [
      '/* raw */',
      ...rawLines,
      '',
      '/* semantic */',
      ...semanticLines,
    ].filter((line) => line !== undefined)),
    '',
    '@supports (color: oklch(0 0 0)) {',
    block(selector, [
      '/* 颜色使用 oklch 覆盖 hex 回退 */',
      ...colorOverrides,
    ], '  '),
    '}',
    '',
  ].join('\n');

  writeFileSync(join(distDir, `theme-${theme}.css`), css);
}

for (const brand of brands) {
  const theme = manifest.brands[brand].themes[0];
  const resolved = combinations[`${theme}/${brand}`];
  const brandIds = sortedIds(resolved, 'raw').filter((id) => id.startsWith('raw.color.brand.'));
  const lines = brandIds.flatMap((id) => declarations(id, resolved[id], { honorAliases: false }));
  const overrides = brandIds.map((id) => `${cssVar(id)}: ${colorToOklch(resolved[id].$value)};`);
  const selector = `[data-brand="${brand}"]`;

  const css = [
    header,
    '',
    block(selector, ['/* 品牌色阶覆盖 */', ...lines]),
    '',
    '@supports (color: oklch(0 0 0)) {',
    block(selector, [...overrides], '  '),
    '}',
    '',
  ].join('\n');

  writeFileSync(join(distDir, `brand-${brand}.css`), css);
}

/** JSON：每个组合保留 oklch 源值 + 6 位 hex */
const json = {
  version: '2025.10',
  themes,
  brands,
  combinations: {},
};
for (const input of permutations.sort((a, b) => `${a.theme}/${a.brand}`.localeCompare(`${b.theme}/${b.brand}`))) {
  const id = `${input.theme}/${input.brand}`;
  const tokens = combinations[id];
  json.combinations[id] = {};
  for (const tokenId of Object.keys(tokens).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
    const token = tokens[tokenId];
    const entry = { $type: token.$type, $description: token.$description };
    if (token.$deprecated !== undefined) {
      entry.$deprecated = token.$deprecated;
    }
    entry.$value = token.$value;
    if (token.$type === 'color') {
      entry.hex = colorToHex(token.$value);
    }
    json.combinations[id][tokenId] = entry;
  }
}

writeFileSync(join(distDir, 'tokens.json'), `${JSON.stringify(json, undefined, 2)}\n`);
