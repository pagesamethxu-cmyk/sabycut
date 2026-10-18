import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { platformQuirks } from './services/codecSafety';

// Manage dynamic visual viewport height for mobile keyboards, URL bars, and system bars
function initViewportHeight(): void {
  const updateAppHeight = () => {
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${vh}px`);
  };

  updateAppHeight();

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateAppHeight);
    window.visualViewport.addEventListener('scroll', updateAppHeight);
  }
  window.addEventListener('resize', updateAppHeight);
  window.addEventListener('orientationchange', updateAppHeight);
}

initViewportHeight();
platformQuirks.init();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
