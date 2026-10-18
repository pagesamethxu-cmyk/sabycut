import { test, expect, Page } from '@playwright/test';

interface DeviceConfig {
  name: string;
  width: number;
  height: number;
  insets: { top: number; bottom: number; left: number; right: number };
  landscape?: boolean;
}

const deviceMatrix: DeviceConfig[] = [
  // Android phones and devices
  {
    name: 'Android Small (360x640, 3-button nav)',
    width: 360,
    height: 640,
    insets: { top: 24, bottom: 48, left: 0, right: 0 },
  },
  {
    name: 'Android Standard (393x851, punch-hole camera)',
    width: 393,
    height: 851,
    insets: { top: 36, bottom: 16, left: 0, right: 0 },
  },
  {
    name: 'Android Tall (412x915, large notch & gesture nav)',
    width: 412,
    height: 915,
    insets: { top: 44, bottom: 20, left: 0, right: 0 },
  },
  {
    name: 'Android Foldable Closed (340x800)',
    width: 340,
    height: 800,
    insets: { top: 32, bottom: 16, left: 0, right: 0 },
  },
  {
    name: 'Android Foldable Open (768x840)',
    width: 768,
    height: 840,
    insets: { top: 28, bottom: 16, left: 0, right: 0 },
  },
  {
    name: 'Android Tablet (800x1280)',
    width: 800,
    height: 1280,
    insets: { top: 24, bottom: 24, left: 0, right: 0 },
  },
  // iOS devices
  {
    name: 'iOS iPhone SE (375x667)',
    width: 375,
    height: 667,
    insets: { top: 20, bottom: 0, left: 0, right: 0 },
  },
  {
    name: 'iOS iPhone with Notch (390x844)',
    width: 390,
    height: 844,
    insets: { top: 47, bottom: 34, left: 0, right: 0 },
  },
  {
    name: 'iOS iPhone with Dynamic Island (393x852)',
    width: 393,
    height: 852,
    insets: { top: 59, bottom: 34, left: 0, right: 0 },
  },
  {
    name: 'iOS iPad (810x1080)',
    width: 810,
    height: 1080,
    insets: { top: 24, bottom: 20, left: 0, right: 0 },
  },
  // Landscape phone configurations (notch / camera on side)
  {
    name: 'iOS iPhone Dynamic Island Landscape (852x393)',
    width: 852,
    height: 393,
    insets: { top: 0, bottom: 21, left: 59, right: 59 },
    landscape: true,
  },
  {
    name: 'Android Standard Landscape (851x393)',
    width: 851,
    height: 393,
    insets: { top: 0, bottom: 16, left: 36, right: 36 },
    landscape: true,
  },
];

async function applySimulatedSafeInsets(page: Page, insets: { top: number; bottom: number; left: number; right: number }) {
  await page.evaluate((ins) => {
    document.documentElement.style.setProperty('--sat', `${ins.top}px`);
    document.documentElement.style.setProperty('--sab', `${ins.bottom}px`);
    document.documentElement.style.setProperty('--sal', `${ins.left}px`);
    document.documentElement.style.setProperty('--sar', `${ins.right}px`);
  }, insets);
}

test.describe('Mobile Viewports & Safe Area Inset Validation', () => {
  for (const device of deviceMatrix) {
    test(`Dashboard layout on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await applySimulatedSafeInsets(page, device.insets);

      // Verify no horizontal overflow at body level
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(device.width + 1);

      // Verify header is above or at top inset
      const header = page.locator('header');
      await expect(header).toBeVisible();
      const headerBox = await header.boundingBox();
      expect(headerBox).not.toBeNull();
      if (headerBox) {
        expect(headerBox.y).toBeGreaterThanOrEqual(0);
        expect(headerBox.width).toBeLessThanOrEqual(device.width + 1);
      }

      // Check header action buttons do not overlap lateral insets
      const buttons = await page.locator('header button').all();
      for (const btn of buttons) {
        const box = await btn.boundingBox();
        if (box && await btn.isVisible()) {
          expect(box.x).toBeGreaterThanOrEqual(device.insets.left - 2);
          expect(box.x + box.width).toBeLessThanOrEqual(device.width - device.insets.right + 2);
          // Touch target test
          if (device.width < 768) {
            expect(box.height).toBeGreaterThanOrEqual(40);
          }
        }
      }
    });

    test(`Studio Editor Studio layout on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await applySimulatedSafeInsets(page, device.insets);

      // Navigate to Editor Studio
      const newProjectBtn = page.getByTestId('action-new-project-btn');
      await newProjectBtn.waitFor({ state: 'visible', timeout: 5000 });
      await newProjectBtn.click();

      await page.waitForTimeout(300);

      // Verify Studio Header
      const studioHeader = page.locator('header').first();
      await expect(studioHeader).toBeVisible();

      // Verify Timeline section is within bottom bounds
      const splitBtn = page.locator('button').filter({ hasText: /Split|កាត់បំបែក/ }).first();
      await expect(splitBtn).toBeVisible();
      const timelineBox = await splitBtn.boundingBox();
      expect(timelineBox).not.toBeNull();
      if (timelineBox) {
        expect(timelineBox.y + timelineBox.height).toBeLessThanOrEqual(device.height - device.insets.bottom + 5);
      }

      // Verify interactive tools have touch-friendly height on mobile
      if (device.width < 768) {
        if (timelineBox) {
          expect(timelineBox.height).toBeGreaterThanOrEqual(38);
        }
      }
    });
  }

  test('Settings Modal Safe Area Boundary Debug Overlay Toggle', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await applySimulatedSafeInsets(page, { top: 59, bottom: 34, left: 0, right: 0 });

    // Open settings modal
    const settingsBtn = page.getByTestId('settings-header-btn');
    await settingsBtn.click();
    await page.waitForTimeout(200);

    // Switch to Debug section tab
    const debugTab = page.getByTestId('settings-tab-debug');
    await debugTab.click();

    // Toggle debug overlay ON
    const toggleBtn = page.getByTestId('safe-area-debug-toggle');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // Verify debug overlay container is rendered
    const overlay = page.locator('#safe-area-debug-overlay');
    await expect(overlay).toBeAttached();

    // Close settings modal
    const cancelBtn = page.getByTestId('close-settings-btn');
    await cancelBtn.click();
    await page.waitForTimeout(200);

    // Verify debug overlay remains visible on dashboard
    await expect(page.locator('#safe-area-debug-overlay')).toBeAttached();
  });

  test('Keyboard Open and Visual Viewport Resize Simulation', async ({ page }) => {
    // Standard phone in portrait (393x851)
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Simulate keyboard open by reducing viewport height to 450px
    await page.setViewportSize({ width: 393, height: 450 });
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--app-height', '450px');
    });

    // Verify layout remains contained without broken root height
    const rootHeight = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.getBoundingClientRect().height : 0;
    });
    expect(rootHeight).toBeLessThanOrEqual(451);
  });
});
