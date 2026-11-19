import ColorPage from './sections/ColorPage';

export default function App() {
  if (window.location.pathname === '/color') {
    return <ColorPage />;
  }

  return (
    <main className="page">
      <h1>Design System</h1>
      <p>Token 验收台。</p>
      <p>
        <a className="page__link" href="/color?theme=light&brand=base">
          查看颜色
        </a>
      </p>
    </main>
  );
}
