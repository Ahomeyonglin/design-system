import { useEffect, useMemo, useRef, useState } from 'react';
import manifestFile from '../../../packages/tokens/src/brands/manifest.json';
import AppShell from './layout/AppShell';
import SearchDialog from './search/SearchDialog';
import { componentIds } from './lib/registry';
import { manifestBrands, supportedThemes, type BrandManifest, type Theme } from './lib/support';
import { buildSearch, hrefFor, parseUrlState } from './lib/url-state';
import { matchRoute, routeTitle } from './router';
import OverviewPage from './sections/OverviewPage';
import ColorPage from './sections/ColorPage';
import TypePage from './sections/TypePage';
import SpacePage from './sections/SpacePage';
import ThemesPage from './sections/ThemesPage';
import ComponentsPage from './sections/ComponentsPage';
import ComponentDetailPage from './sections/ComponentDetailPage';
import ChangelogPage from './sections/ChangelogPage';
import ProjectSettingsPage from './examples/ProjectSettingsPage';
import BranchTransferPage from './examples/BranchTransferPage';
import './styles/layout.css';

const manifest = manifestFile as BrandManifest;
const COMPONENT_IDS = componentIds();
const BASE = import.meta.env.BASE_URL ?? '/';

function readLocation() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export default function App() {
  const [location, setLocation] = useState(readLocation);
  const [searchOpen, setSearchOpen] = useState(() =>
    Boolean(new URLSearchParams(window.location.search).get('q')),
  );
  const searchWasOpen = useRef(searchOpen);

  const route = useMemo(() => matchRoute(location.pathname, BASE, COMPONENT_IDS), [location.pathname]);
  const state = useMemo(() => parseUrlState(location.search, manifest), [location.search]);
  const brands = manifestBrands(manifest);
  const supported = supportedThemes(manifest, state.brand);

  useEffect(() => {
    document.title = `${routeTitle(route)} · Design System`;
  }, [route]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.dataset.brand = state.brand;
  }, [state.theme, state.brand]);

  useEffect(() => {
    if (!state.needsRewrite) {
      return;
    }
    const url = new URL(window.location.href);
    url.search = buildSearch(state.theme, state.brand, state.q);
    window.history.replaceState(null, '', url);
  }, [state.needsRewrite, state.theme, state.brand, state.q]);

  useEffect(() => {
    if (route.name !== 'component-detail' || !route.params.id) {
      return;
    }
    const url = new URL(window.location.href);
    const segments = url.pathname.split('/');
    const current = decodeURIComponent(segments[segments.length - 1] ?? '');
    if (current !== route.params.id) {
      segments[segments.length - 1] = route.params.id;
      url.pathname = segments.join('/');
      window.history.replaceState(null, '', url);
    }
  }, [route]);

  const scrollKey = `${location.pathname}|${location.hash}`;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const anchor = location.hash.replace(/^#/, '');
      if (anchor) {
        const target = document.getElementById(anchor);
        if (target) {
          const details = target.closest('details');
          if (details && !details.open) {
            details.open = true;
          }
          target.scrollIntoView({ block: 'start' });
          target.classList.add('is-anchor-target');
          window.setTimeout(() => target.classList.remove('is-anchor-target'), 1600);
          return;
        }
      }
      window.scrollTo(0, 0);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [scrollKey]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (
        event.key === '/' &&
        !isTyping(event.target) &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      if (!(event.target instanceof Element)) {
        return;
      }
      const anchor = event.target.closest('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return;
      }
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) {
        return;
      }
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) {
        return;
      }
      event.preventDefault();
      window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`);
      setLocation(readLocation());
      setSearchOpen(false);
    }

    function handlePopState() {
      setLocation(readLocation());
    }

    document.addEventListener('click', handleClick);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (searchWasOpen.current && !searchOpen) {
      document.querySelector<HTMLElement>('.docs-search-trigger')?.focus();
    }
    searchWasOpen.current = searchOpen;
  }, [searchOpen]);

  function selectCombination(theme: Theme, brand: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('theme', theme);
    url.searchParams.set('brand', brand);
    window.history.replaceState(null, '', url);
    setLocation(readLocation());
  }

  function updateQuery(q: string) {
    const url = new URL(window.location.href);
    if (q) {
      url.searchParams.set('q', q);
    } else {
      url.searchParams.delete('q');
    }
    window.history.replaceState(null, '', url);
    setLocation(readLocation());
  }

  function navigate(href: string) {
    const url = new URL(href, window.location.href);
    window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`);
    setLocation(readLocation());
    setSearchOpen(false);
  }

  function renderPage() {
    switch (route.name) {
      case 'overview':
        return <OverviewPage theme={state.theme} brand={state.brand} />;
      case 'color':
        return <ColorPage theme={state.theme} brand={state.brand} />;
      case 'type':
        return <TypePage theme={state.theme} brand={state.brand} />;
      case 'space':
        return <SpacePage theme={state.theme} brand={state.brand} />;
      case 'themes':
        return (
          <ThemesPage
            theme={state.theme}
            brand={state.brand}
            onSelect={selectCombination}
          />
        );
      case 'components':
        return <ComponentsPage theme={state.theme} brand={state.brand} />;
      case 'component-detail':
        return (
          <ComponentDetailPage
            key={route.params.id}
            id={route.params.id ?? ''}
            theme={state.theme}
            brand={state.brand}
          />
        );
      case 'changelog':
        return <ChangelogPage />;
      case 'example-project-settings':
        return <ProjectSettingsPage />;
      case 'example-branch-transfer':
        return <BranchTransferPage />;
      default:
        return (
          <div className="not-found">
            <h1>页面不存在</h1>
            <p className="docs-page-lead">没有匹配的路由：{location.pathname}</p>
            <a href={hrefFor('/', { theme: state.theme, brand: state.brand })}>返回总览</a>
          </div>
        );
    }
  }

  return (
    <>
      <AppShell
        route={route}
        title={routeTitle(route)}
        theme={state.theme}
        brand={state.brand}
        brands={brands}
        supportedThemes={supported}
        onSelect={selectCombination}
        onOpenSearch={() => setSearchOpen(true)}
      >
        {renderPage()}
      </AppShell>

      {searchOpen ? (
        <SearchDialog
          query={state.q}
          theme={state.theme}
          brand={state.brand}
          onQueryChange={updateQuery}
          onClose={() => setSearchOpen(false)}
          onNavigate={navigate}
        />
      ) : null}
    </>
  );
}
