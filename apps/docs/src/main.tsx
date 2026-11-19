import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@ds/tokens/dist/theme-light.css';
import '@ds/tokens/dist/theme-dark.css';
import '@ds/tokens/dist/brand-base.css';
import './styles/globals.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
