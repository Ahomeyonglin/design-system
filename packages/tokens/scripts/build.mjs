import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

/** 品牌 → 主题 → 覆盖源 token（用于品牌 CSS 输出 alias 引用） */
const overrideSources = {};

for (const [brand, config] of Object.entries(manifest.brands)) {
  for (const [theme, file] of Object.entries(config.overrides ?? {})) {
    if (!config.themes.includes(theme)) {
      throw new Error(`品牌 ${brand} 的 overrides 主题 ${theme} 未在 manifest themes 中声明`);
    }
    const combinationId = `${theme}/${brand}`;
    const target = combinations[combinationId];
    if (!target) {
      throw new Error(`品牌 ${brand} 的 overrides 组合 ${combinationId} 不存在`);
    }
    const overridePath = join(srcDir, file);
    if (!existsSync(overridePath)) {
      throw new Error(`品牌 ${brand} 的 overrides 文件不存在：${file}`);
    }

    const entries = [];
    collectOverrideTokens(JSON.parse(readFileSync(overridePath, 'utf8')), '', undefined, entries);
    if (entries.length === 0) {
      throw new Error(`品牌 ${brand} 的 overrides 文件 ${file} 没有任何 token`);
    }

    const sourceTokens = {};
    for (const { id, type, token } of entries) {
      if (!id.startsWith('semantic.')) {
        throw new Error(`${file} 的 ${id} 不在 semantic 层，品牌主题覆盖只允许 semantic token`);
      }
      if (!type) {
        throw new Error(`${file} 的 ${id} 缺少 $type`);
      }
      if (type === 'typography') {
        throw new Error(`${file} 的 ${id} 是复合 typography，请改为调整其组成 token`);
      }
      if (typeof token.$description !== 'string' || token.$description.trim() === '') {
        throw new Error(`${file} 的 ${id} 缺少非空 $description`);
      }
      if (!(id in target)) {
        throw new Error(`${file} 的 ${id} 在 ${combinationId} 中不存在，覆盖只允许重映射已有 token`);
      }
      if (target[id].$type !== type) {
        throw new Error(`${file} 的 ${id} 的 $type ${type} 与目标 ${target[id].$type} 不一致`);
      }

      const match = typeof token.$value === 'string' ? token.$value.match(/^\{([\w.-]+)\}$/) : null;
      if (!match) {
        throw new Error(`${file} 的 ${id} 只允许 alias，覆盖用于重映射而不是写新值`);
      }
      if (!(match[1] in target)) {
        throw new Error(`${file} 的 ${id} 引用的 ${match[1]} 在 ${combinationId} 中不存在`);
      }
      if (target[match[1]].$type !== type) {
        throw new Error(
          `${file} 的 ${id} 引用的 ${match[1]} 类型为 ${target[match[1]].$type}，与 ${type} 不一致`,
        );
      }

      target[id] = {
        ...target[id],
        $value: target[match[1]].$value,
        $description: token.$description,
      };
      sourceTokens[id] = token;
    }

    overrideSources[brand] ??= {};
    overrideSources[brand][theme] = sourceTokens;
  }
}

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

function sortedKeys(tokens) {
  return Object.keys(tokens).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/** 收集品牌主题覆盖文件中的叶子 token，携带从父级继承的 $type */
function collectOverrideTokens(node, path, inheritedType, out) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    return;
  }
  if ('$value' in node) {
    out.push({ id: path, type: inheritedType, token: node });
    return;
  }
  const type = node.$type ?? inheritedType;
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) {
      continue;
    }
    collectOverrideTokens(child, path ? `${path}.${key}` : key, type, out);
  }
}

function block(selector, lines, indent = '') {
  const indentedSelector = selector.replaceAll('\n', `\n${indent}`);
  const body = lines
    .map((line) => (line === '' ? '' : `${indent}  ${line}`))
    .join('\n');
  return `${indent}${indentedSelector} {\n${body}\n${indent}}`;
}

/** 用级联层包裹一段 CSS，保证层级顺序不依赖选择器特异性与文件加载顺序 */
function wrapLayer(name, css, indent = '') {
  const body = css
    .split('\n')
    .map((line) => (line === '' ? '' : `${indent}  ${line}`))
    .join('\n');
  return `${indent}@layer ${name} {\n${body}\n${indent}}`;
}

const LAYER_ORDER = '@layer tokens.theme, tokens.brand;';

const header = [
  '/* 生成物，禁止手改。由 packages/tokens/scripts/build.mjs 产出。 */',
  '/* 层级顺序由 @layer tokens.theme → tokens.brand 保证，文件加载顺序不影响结果。 */',
].join('\n');

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

/** 主题 CSS 以 manifest 声明的第一个品牌为基准，品牌级覆盖只进 brand-*.css */
const themeBrand = Object.keys(manifest.brands)[0];

for (const theme of themes) {
  const combinationId = `${theme}/${themeBrand}`;
  const resolved = combinations[combinationId];
  if (!resolved) {
    throw new Error(`主题 CSS 的基准品牌 ${themeBrand} 缺少 ${theme} 组合`);
  }
  const unresolved = resolver.apply(
    { theme, brand: themeBrand },
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
  const body = [
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
  ].join('\n');

  const css = [header, '', LAYER_ORDER, '', wrapLayer('tokens.theme', body), ''].join('\n');

  writeFileSync(join(distDir, `theme-${theme}.css`), css);
}

for (const brand of brands) {
  const theme = manifest.brands[brand].themes[0];
  const resolved = combinations[`${theme}/${brand}`];
  const brandIds = sortedIds(resolved, 'raw').filter((id) => id.startsWith('raw.color.brand.'));
  const lines = brandIds.flatMap((id) => declarations(id, resolved[id], { honorAliases: false }));
  const overrides = brandIds.map((id) => `${cssVar(id)}: ${colorToOklch(resolved[id].$value)};`);
  const selector = `[data-brand="${brand}"]`;

  const parts = [
    block(selector, ['/* 品牌色阶覆盖 */', ...lines]),
    '',
    '@supports (color: oklch(0 0 0)) {',
    block(selector, [...overrides], '  '),
    '}',
  ];

  for (const [overrideTheme, sourceTokens] of Object.entries(overrideSources[brand] ?? {})) {
    const ids = sortedKeys(sourceTokens);
    const overrideLines = ids.flatMap((id) =>
      declarations(id, sourceTokens[id], { honorAliases: true }),
    );
    const overrideSelector = `[data-theme="${overrideTheme}"][data-brand="${brand}"]`;
    parts.push('', block(overrideSelector, ['/* 品牌主题语义覆盖 */', ...overrideLines]));
  }

  const css = [header, '', LAYER_ORDER, '', wrapLayer('tokens.brand', parts.join('\n')), ''].join('\n');

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
