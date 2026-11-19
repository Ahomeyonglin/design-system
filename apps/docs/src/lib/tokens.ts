import tokensFile from '@ds/tokens/dist/tokens.json';

export interface TokenEntry {
  $type: string;
  $description?: string;
  $value: unknown;
  hex?: string;
}

export interface TokensFile {
  version: string;
  themes: string[];
  brands: string[];
  combinations: Record<string, Record<string, TokenEntry>>;
}

export const tokens = tokensFile as TokensFile;

export const SEMANTIC_GROUPS = [
  { key: 'bg', label: 'Background' },
  { key: 'text', label: 'Text' },
  { key: 'border', label: 'Border' },
  { key: 'action', label: 'Action' },
  { key: 'status', label: 'Status' },
] as const;

export const RAW_GROUPS = ['brand', 'neutral', 'success', 'warning', 'danger', 'info'];

export function cssVar(id: string): string {
  return `--${id.replaceAll('.', '-')}`;
}

function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true });
}

export function getCombination(theme: string, brand: string): Record<string, TokenEntry> {
  return (
    tokens.combinations[`${theme}/${brand}`] ??
    tokens.combinations[`light/${tokens.brands[0]}`] ??
    {}
  );
}

export interface ColorToken {
  id: string;
  description: string;
}

export function semanticGroups(combination: Record<string, TokenEntry>) {
  return SEMANTIC_GROUPS.map((group) => ({
    ...group,
    tokens: Object.keys(combination)
      .filter((id) => id.startsWith(`semantic.color.${group.key}.`))
      .sort(naturalSort)
      .map<ColorToken>((id) => ({
        id,
        description: combination[id].$description ?? '',
      })),
  })).filter((group) => group.tokens.length > 0);
}

export interface RawScale {
  group: string;
  steps: { id: string; step: string }[];
}

export function rawColorScales(combination: Record<string, TokenEntry>): RawScale[] {
  return RAW_GROUPS.map((group) => ({
    group,
    steps: Object.keys(combination)
      .filter((id) => id.startsWith(`raw.color.${group}.`))
      .sort(naturalSort)
      .map((id) => ({ id, step: id.split('.').pop() ?? id })),
  })).filter((scale) => scale.steps.length > 0);
}

export interface DimensionValue {
  value: number;
  unit: string;
}

export interface TypographyValue {
  fontFamily: string[];
  fontSize: DimensionValue;
  fontWeight: number;
  lineHeight: DimensionValue;
  letterSpacing: DimensionValue;
}

export interface DimensionToken {
  id: string;
  description: string;
  value: DimensionValue;
}

export interface TypographyToken {
  id: string;
  description: string;
  value: TypographyValue;
}

export const SPACE_GROUPS = [
  { key: 'inline', label: 'Inline' },
  { key: 'stack', label: 'Stack' },
  { key: 'inset', label: 'Inset' },
] as const;

const RADIUS_ORDER = ['none', 'control', 'surface', 'pill'];
const TYPOGRAPHY_ORDER = ['display.lg', 'heading.md', 'body.md', 'body.sm', 'label.md', 'code.md'];

export function formatDimension(value: DimensionValue): string {
  return `${value.value}${value.unit}`;
}

export function spaceGroups(combination: Record<string, TokenEntry>) {
  return SPACE_GROUPS.map((group) => ({
    ...group,
    tokens: Object.keys(combination)
      .filter((id) => id.startsWith(`semantic.space.${group.key}.`))
      .sort(naturalSort)
      .map<DimensionToken>((id) => ({
        id,
        description: combination[id].$description ?? '',
        value: combination[id].$value as DimensionValue,
      })),
  })).filter((group) => group.tokens.length > 0);
}

export function radiusTokens(combination: Record<string, TokenEntry>): DimensionToken[] {
  return Object.keys(combination)
    .filter((id) => id.startsWith('semantic.radius.'))
    .sort((a, b) => {
      const rank = (id: string) => {
        const index = RADIUS_ORDER.indexOf(id.split('.').pop() ?? '');
        return index === -1 ? RADIUS_ORDER.length : index;
      };
      return rank(a) - rank(b) || naturalSort(a, b);
    })
    .map((id) => ({
      id,
      description: combination[id].$description ?? '',
      value: combination[id].$value as DimensionValue,
    }));
}

export function typographyTokens(combination: Record<string, TokenEntry>): TypographyToken[] {
  return Object.keys(combination)
    .filter((id) => id.startsWith('semantic.text.'))
    .sort((a, b) => {
      const rank = (id: string) => {
        const index = TYPOGRAPHY_ORDER.indexOf(id.replace('semantic.text.', ''));
        return index === -1 ? TYPOGRAPHY_ORDER.length : index;
      };
      return rank(a) - rank(b) || naturalSort(a, b);
    })
    .map((id) => ({
      id,
      description: combination[id].$description ?? '',
      value: combination[id].$value as TypographyValue,
    }));
}
