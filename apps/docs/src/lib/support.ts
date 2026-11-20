export type Theme = 'light' | 'dark';

export const THEMES: Theme[] = ['light', 'dark'];

export interface BrandManifest {
  brands: Record<string, { themes: string[] }>;
}

export function manifestBrands(manifest: BrandManifest): string[] {
  return Object.keys(manifest.brands);
}

export function supportedThemes(manifest: BrandManifest, brand: string): Theme[] {
  const declared = manifest.brands[brand]?.themes ?? [];
  return THEMES.filter((theme) => declared.includes(theme));
}

export function isCombinationSupported(
  manifest: BrandManifest,
  brand: string,
  theme: string,
): boolean {
  return supportedThemes(manifest, brand).includes(theme as Theme);
}

export function fallbackBrand(
  manifest: BrandManifest,
  requested: string | null,
): { brand: string; changed: boolean } {
  const brands = manifestBrands(manifest);
  if (requested && brands.includes(requested)) {
    return { brand: requested, changed: false };
  }
  return { brand: brands[0] ?? 'base', changed: true };
}

export function fallbackTheme(
  manifest: BrandManifest,
  brand: string,
  requested: string | null,
): { theme: Theme; changed: boolean } {
  const themes = supportedThemes(manifest, brand);
  const candidate: Theme = requested === 'dark' ? 'dark' : 'light';
  if (themes.includes(candidate)) {
    return { theme: candidate, changed: requested !== candidate };
  }
  return { theme: themes[0] ?? 'light', changed: true };
}
