import type { ReactNode } from 'react';
import type { RouteMatch } from '../router';
import type { Theme } from '../lib/support';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import './AppShell.css';

interface AppShellProps {
  route: RouteMatch;
  title: string;
  theme: Theme;
  brand: string;
  brands: string[];
  supportedThemes: Theme[];
  onSelect(theme: Theme, brand: string): void;
  onOpenSearch(): void;
  children: ReactNode;
}

export default function AppShell({
  route,
  title,
  theme,
  brand,
  brands,
  supportedThemes,
  onSelect,
  onOpenSearch,
  children,
}: AppShellProps) {
  return (
    <div className="docs-app">
      <Sidebar route={route} theme={theme} brand={brand} />
      <div className="docs-main">
        <Header
          title={title}
          theme={theme}
          brand={brand}
          brands={brands}
          supportedThemes={supportedThemes}
          onSelect={onSelect}
          onOpenSearch={onOpenSearch}
        />
        <main className="docs-content">{children}</main>
      </div>
    </div>
  );
}
