import { useState, useEffect } from 'react';

export interface ViewportInfo {
  isMobile: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  width: number;
  height: number;
  isFoldableOrTablet: boolean;
}

function computeIsMobile(breakpoint: number): boolean {
  if (typeof window === 'undefined') return false;
  const w = window.innerWidth;
  const h = window.innerHeight;
  // Mobile phone in portrait (width < breakpoint)
  // Mobile phone in landscape (height <= 520 and width < 1000)
  return w < breakpoint || (h <= 520 && w < 1000);
}

export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => computeIsMobile(breakpoint));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(computeIsMobile(breakpoint));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}

export function useViewport(breakpoint: number = 768): ViewportInfo {
  const [info, setInfo] = useState<ViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isLandscape: false,
        isPortrait: true,
        width: 1024,
        height: 768,
        isFoldableOrTablet: false
      };
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const mobile = computeIsMobile(breakpoint);
    return {
      isMobile: mobile,
      isLandscape: w > h,
      isPortrait: h >= w,
      width: w,
      height: h,
      isFoldableOrTablet: w >= 600 && w <= 1024 && h >= 600
    };
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = computeIsMobile(breakpoint);
      setInfo({
        isMobile: mobile,
        isLandscape: w > h,
        isPortrait: h >= w,
        width: w,
        height: h,
        isFoldableOrTablet: w >= 600 && w <= 1024 && h >= 600
      });
    };

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', update);
    }

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [breakpoint]);

  return info;
}
