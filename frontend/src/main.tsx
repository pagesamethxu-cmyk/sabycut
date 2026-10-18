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

// Prevent mobile gesture zoom, pinch-to-zoom, and double-tap zoom
function preventViewportZoom(): void {
  if (typeof document === 'undefined') return;

  // Prevent Safari / iOS gesture events
  document.addEventListener('gesturestart', (e: Event) => {
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('gesturechange', (e: Event) => {
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('gestureend', (e: Event) => {
    e.preventDefault();
  }, { passive: false });

  // Prevent multi-touch pinch zoom
  document.addEventListener('touchstart', (e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevent double tap zoom
  let lastTouchTime = 0;
  document.addEventListener('touchend', (e: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchTime <= 300) {
      e.preventDefault();
    }
    lastTouchTime = now;
  }, { passive: false });
}

initViewportHeight();
preventViewportZoom();
platformQuirks.init();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
