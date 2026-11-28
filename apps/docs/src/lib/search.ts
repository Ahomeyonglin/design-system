import { PAGES } from '../router';
import type { Theme } from './support';
import { searchableTokens, tokenLink, type TokenEntry } from './tokens';
import type { RegistryComponent } from './registry';
import { hrefFor } from './url-state';

export type SearchGroup = 'page' | 'component' | 'token';

export interface SearchEntry {
  group: SearchGroup;
  id: string;
  title: string;
  description: string;
  href: string;
}

export interface SearchResults {
  pages: SearchEntry[];
  components: SearchEntry[];
  tokens: SearchEntry[];
  totals: Record<SearchGroup, number>;
}

export const EMPTY_RESULTS: SearchResults = {
  pages: [],
  components: [],
  tokens: [],
  totals: { page: 0, component: 0, token: 0 },
};

export function buildSearchIndex(
  combination: Record<string, TokenEntry>,
  registryComponents: RegistryComponent[],
  state: { theme: Theme; brand: string },
): SearchEntry[] {
  const pages: SearchEntry[] = PAGES.filter((page) => !page.hidden).map((page) => ({
    group: 'page',
    id: page.path,
    title: page.title,
    description: page.path,
    href: hrefFor(page.path, state),
  }));

  const components: SearchEntry[] = registryComponents.map((component) => ({
    group: 'component',
    id: component.id,
    title: component.name,
    description: `${component.category} · ${component.$description}`,
    href: hrefFor(`/components/${component.id}`, state),
  }));

  const tokens: SearchEntry[] = searchableTokens(combination).flatMap((token) => {
    const link = tokenLink(token.id);
    if (!link) {
      return [];
    }
    return [
      {
        group: 'token' as const,
        id: token.id,
        title: token.id,
        description: token.description,
        href: `${hrefFor(link.path, state)}#${link.anchor}`,
      },
    ];
  });

  return [...pages, ...components, ...tokens];
}

export function searchEntries(
  entries: SearchEntry[],
  query: string,
  limit = 5,
): SearchResults {
  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    return EMPTY_RESULTS;
  }

  const matched = entries.filter((entry) =>
    `${entry.title} ${entry.id} ${entry.description}`.toLowerCase().includes(keyword),
  );

  const group = (name: SearchGroup) => matched.filter((entry) => entry.group === name);

  const pages = group('page');
  const components = group('component');
  const tokens = group('token');

  return {
    pages: pages.slice(0, limit),
    components: components.slice(0, limit),
    tokens: tokens.slice(0, limit),
    totals: { page: pages.length, component: components.length, token: tokens.length },
  };
}

export function flattenResults(results: SearchResults): SearchEntry[] {
  return [...results.pages, ...results.components, ...results.tokens];
}
