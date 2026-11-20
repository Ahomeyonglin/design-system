import { fallbackBrand, fallbackTheme, type BrandManifest, type Theme } from './support';

export interface UrlState {
  theme: Theme;
  brand: string;
  q: string;
  needsRewrite: boolean;
}

export function buildSearch(theme: Theme, brand: string, q = ''): string {
  const params = new URLSearchParams();
  params.set('theme', theme);
  params.set('brand', brand);
  if (q) {
    params.set('q', q);
  }
  return `?${params.toString()}`;
}

export function parseUrlState(search: string, manifest: BrandManifest): UrlState {
  const params = new URLSearchParams(search);
  const brandResult = fallbackBrand(manifest, params.get('brand'));
  const themeResult = fallbackTheme(manifest, brandResult.brand, params.get('theme'));
  const q = params.get('q') ?? '';
  const canonical = buildSearch(themeResult.theme, brandResult.brand, q).slice(1);

  return {
    theme: themeResult.theme,
    brand: brandResult.brand,
    q,
    needsRewrite: brandResult.changed || themeResult.changed || params.toString() !== canonical,
  };
}

export function docsBase(): string {
  const configured = import.meta.env?.BASE_URL ?? '/';
  return configured.endsWith('/') ? configured : `${configured}/`;
}

export function hrefFor(
  path: string,
  state: { theme: Theme; brand: string; q?: string },
  hash?: string,
): string {
  const base = docsBase();
  const prefix = base === '/' ? '' : base.slice(0, -1);
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const search = buildSearch(state.theme, state.brand, state.q ?? '');
  return `${prefix}${normalized}${search}${hash ? `#${hash}` : ''}`;
}
