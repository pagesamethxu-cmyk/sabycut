import React, { useState, useEffect } from 'react';

interface SafeAreaDebugOverlayProps {
  enabled: boolean;
}

export const SafeAreaDebugOverlay: React.FC<SafeAreaDebugOverlayProps> = ({ enabled }) => {
  const [metrics, setMetrics] = useState({
    width: 0,
    height: 0,
    visualHeight: 0,
    topInset: 0,
    bottomInset: 0,
    leftInset: 0,
    rightInset: 0,
    orientation: 'portrait'
  });

  useEffect(() => {
    if (!enabled) return;

    const measure = () => {
      const probe = document.createElement('div');
      probe.style.position = 'fixed';
      probe.style.top = '0';
      probe.style.left = '0';
      probe.style.right = '0';
      probe.style.bottom = '0';
      probe.style.paddingTop = 'env(safe-area-inset-top, 0px)';
      probe.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
      probe.style.paddingLeft = 'env(safe-area-inset-left, 0px)';
      probe.style.paddingRight = 'env(safe-area-inset-right, 0px)';
      probe.style.visibility = 'hidden';
      probe.style.pointerEvents = 'none';
      document.body.appendChild(probe);

      const computed = window.getComputedStyle(probe);
      const top = parseFloat(computed.paddingTop) || 0;
      const bottom = parseFloat(computed.paddingBottom) || 0;
      const left = parseFloat(computed.paddingLeft) || 0;
      const right = parseFloat(computed.paddingRight) || 0;

      document.body.removeChild(probe);

      setMetrics({
        width: window.innerWidth,
        height: window.innerHeight,
        visualHeight: window.visualViewport ? Math.round(window.visualViewport.height) : window.innerHeight,
        topInset: Math.round(top),
        bottomInset: Math.round(bottom),
        leftInset: Math.round(left),
        rightInset: Math.round(right),
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      });
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', measure);
    }

    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      id="safe-area-debug-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        outline: '2px solid rgba(16, 185, 129, 0.4)'
      }}
    >
      {/* Top Safe Area Inset Zone */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--sat, 0px)',
          minHeight: metrics.topInset > 0 ? `${metrics.topInset}px` : '0px',
          backgroundColor: 'rgba(239, 68, 68, 0.3)',
          borderBottom: '2px dashed #ef4444',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '2px'
        }}
      >
        <span style={{ fontSize: '10px', color: '#fca5a5', fontFamily: 'monospace', fontWeight: 700, textShadow: '0 1px 2px #000' }}>
          TOP INSET: {metrics.topInset}px
        </span>
      </div>

      {/* Bottom Safe Area Inset Zone */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'var(--sab, 0px)',
          minHeight: metrics.bottomInset > 0 ? `${metrics.bottomInset}px` : '0px',
          backgroundColor: 'rgba(239, 68, 68, 0.3)',
          borderTop: '2px dashed #ef4444',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '2px'
        }}
      >
        <span style={{ fontSize: '10px', color: '#fca5a5', fontFamily: 'monospace', fontWeight: 700, textShadow: '0 1px 2px #000' }}>
          BOTTOM INSET: {metrics.bottomInset}px
        </span>
      </div>

      {/* Left Safe Area Inset Zone */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 'var(--sal, 0px)',
          minWidth: metrics.leftInset > 0 ? `${metrics.leftInset}px` : '0px',
          backgroundColor: 'rgba(245, 158, 11, 0.3)',
          borderRight: '2px dashed #f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {metrics.leftInset > 0 && (
          <span style={{ fontSize: '9px', color: '#fde68a', fontFamily: 'monospace', transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>
            LEFT: {metrics.leftInset}px
          </span>
        )}
      </div>

      {/* Right Safe Area Inset Zone */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 'var(--sar, 0px)',
          minWidth: metrics.rightInset > 0 ? `${metrics.rightInset}px` : '0px',
          backgroundColor: 'rgba(245, 158, 11, 0.3)',
          borderLeft: '2px dashed #f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {metrics.rightInset > 0 && (
          <span style={{ fontSize: '9px', color: '#fde68a', fontFamily: 'monospace', transform: 'rotate(90deg)', whiteSpace: 'nowrap' }}>
            RIGHT: {metrics.rightInset}px
          </span>
        )}
      </div>

      {/* 16px Edge Margin Guidelines */}
      <div
        style={{
          position: 'absolute',
          top: 'max(var(--sat, 0px), 16px)',
          bottom: 'max(var(--sab, 0px), 16px)',
          left: 'max(var(--sal, 0px), 16px)',
          right: 'max(var(--sar, 0px), 16px)',
          border: '1px dotted rgba(59, 130, 246, 0.5)',
          pointerEvents: 'none'
        }}
      />

      {/* Diagnostic Info Badge */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(var(--sat, 0px) + 50px)',
          right: 'calc(var(--sar, 0px) + 12px)',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#93c5fd',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)'
        }}
      >
        <span style={{ color: '#60a5fa', fontWeight: 700 }}>SAFE-AREA DEBUG</span>
        <span>Screen: {metrics.width}x{metrics.height} ({metrics.orientation})</span>
        <span>Viewport: {metrics.visualHeight}px</span>
        <span>T: {metrics.topInset}px | B: {metrics.bottomInset}px</span>
        <span>L: {metrics.leftInset}px | R: {metrics.rightInset}px</span>
      </div>
    </div>
  );
};

export default SafeAreaDebugOverlay;
