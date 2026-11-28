export type RouteName =
  | 'overview'
  | 'color'
  | 'type'
  | 'space'
  | 'themes'
  | 'components'
  | 'component-detail'
  | 'changelog'
  | 'example-project-settings'
  | 'not-found';

export interface RouteMatch {
  name: RouteName;
  params: { id?: string };
}

export interface PageLink {
  name: Exclude<RouteName, 'component-detail' | 'not-found'>;
  path: string;
  title: string;
  hidden?: boolean;
}

export const PAGES: PageLink[] = [
  { name: 'overview', path: '/', title: '总览' },
  { name: 'color', path: '/color', title: '颜色' },
  { name: 'type', path: '/type', title: '排版' },
  { name: 'space', path: '/space', title: '间距与圆角' },
  { name: 'themes', path: '/themes', title: '主题与品牌' },
  { name: 'components', path: '/components', title: '组件地图' },
  { name: 'changelog', path: '/changelog', title: '变更记录', hidden: true },
  { name: 'example-project-settings', path: '/examples/project-settings', title: '项目设置样板' },
];

const STATIC_ROUTES: Record<string, RouteName> = {
  '/': 'overview',
  '/color': 'color',
  '/type': 'type',
  '/space': 'space',
  '/themes': 'themes',
  '/components': 'components',
  '/changelog': 'changelog',
  '/examples/project-settings': 'example-project-settings',
};

export function normalizeBase(base: string): string {
  const value = base.trim();
  if (!value || value === '/') {
    return '/';
  }
  const leading = value.startsWith('/') ? value : `/${value}`;
  return leading.endsWith('/') ? leading : `${leading}/`;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function stripBase(pathname: string, base: string): string {
  const normalized = normalizeBase(base);
  if (normalized === '/') {
    return pathname;
  }
  if (pathname === normalized.slice(0, -1)) {
    return '/';
  }
  if (pathname.startsWith(normalized)) {
    return pathname.slice(normalized.length - 1);
  }
  return pathname;
}

export function matchRoute(
  pathname: string,
  base = '/',
  componentIds: string[] = [],
): RouteMatch {
  const stripped = safeDecode(stripBase(pathname, base));
  const trimmed = stripped.length > 1 && stripped.endsWith('/') ? stripped.slice(0, -1) : stripped;
  const path = trimmed || '/';

  const staticName = STATIC_ROUTES[path.toLowerCase()];
  if (staticName) {
    return { name: staticName, params: {} };
  }

  const detail = path.match(/^\/components\/([^/]+)$/i);
  if (detail) {
    const requested = detail[1].toLowerCase();
    const id = componentIds.find((candidate) => candidate.toLowerCase() === requested);
    if (id) {
      return { name: 'component-detail', params: { id } };
    }
  }

  return { name: 'not-found', params: {} };
}

export function routeTitle(route: RouteMatch): string {
  if (route.name === 'component-detail') {
    return route.params.id ?? '组件详情';
  }
  if (route.name === 'not-found') {
    return '页面不存在';
  }
  return PAGES.find((page) => page.name === route.name)?.title ?? 'Design System';
}
