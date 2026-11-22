import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@ahomeyonglin/tokens/dist/theme-light.css';
import '@ahomeyonglin/tokens/dist/theme-dark.css';
import '@ahomeyonglin/tokens/dist/brand-base.css';
import './styles/globals.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
