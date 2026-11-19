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
