import { PAGES, type RouteMatch } from '../router';
import type { Theme } from '../lib/support';
import { hrefFor } from '../lib/url-state';

interface SidebarProps {
  route: RouteMatch;
  theme: Theme;
  brand: string;
}

function isActive(route: RouteMatch, name: string): boolean {
  if (name === 'components') {
    return route.name === 'components' || route.name === 'component-detail';
  }
  return route.name === name;
}

export function Sidebar({ route, theme, brand }: SidebarProps) {
  return (
    <aside className="docs-sidebar">
      <a className="docs-brand" href={hrefFor('/', { theme, brand })}>
        <span>Design System</span>
        <span className="docs-brand__meta">Token 验收台与查询台</span>
      </a>

      <nav className="docs-nav" aria-label="主导航">
        <ul>
          {PAGES.filter((page) => !page.hidden).map((page) => {
            const active = isActive(route, page.name);
            return (
              <li key={page.path}>
                <a
                  href={hrefFor(page.path, { theme, brand })}
                  aria-current={active ? 'page' : undefined}
                >
                  {page.title}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
