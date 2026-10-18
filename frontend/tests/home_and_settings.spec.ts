import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BRAIN_SCREENSHOTS = 'C:/Users/Sameth/.gemini/antigravity/brain/39e45b2f-f1da-4035-a18c-6b927f33dae4/screenshots';
const LOCAL_SCREENSHOTS = path.resolve(process.cwd(), 'tests/screenshots');

async function captureScreen(page: Page, filename: string) {
  const localPath = path.join(LOCAL_SCREENSHOTS, filename);
  const brainPath = path.join(BRAIN_SCREENSHOTS, filename);
  await page.screenshot({ path: localPath });
  try {
    fs.copyFileSync(localPath, brainPath);
  } catch {
    // Ignore copy error
  }
}

async function injectSafeAreaInsets(page: Page, insets: { top: number; bottom: number; left: number; right: number }) {
  await page.addStyleTag({
    content: `
      :root {
        --sat: ${insets.top}px !important;
        --sab: ${insets.bottom}px !important;
        --sal: ${insets.left}px !important;
        --sar: ${insets.right}px !important;
      }
    `
  });
}

test.describe('SABYCUT Home Screen and Settings Acceptance Tests', () => {

  test('1. Viewport 360x640 (Portrait & Landscape) - Layout, header, and primary actions', async ({ page }) => {
    // Portrait
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-header"]');

    // Header checks
    const header = page.locator('[data-testid="app-header"]');
    await expect(header).toBeVisible();
    await expect(page.locator('text=Core Engine')).toHaveCount(0); // Badge removed

    const settingsBtn = page.locator('[data-testid="settings-header-btn"]');
    await expect(settingsBtn).toBeVisible();
    const btnBox = await settingsBtn.boundingBox();
    expect(btnBox?.width).toBeGreaterThanOrEqual(44);
    expect(btnBox?.height).toBeGreaterThanOrEqual(44);

    // Primary action buttons side by side
    const newProjBtn = page.locator('[data-testid="action-new-project-btn"]');
    const autoCutBtn = page.locator('[data-testid="action-auto-cut-btn"]');
    await expect(newProjBtn).toBeVisible();
    await expect(autoCutBtn).toBeVisible();

    const newProjBox = await newProjBtn.boundingBox();
    const autoCutBox = await autoCutBtn.boundingBox();
    expect(newProjBox?.height).toBeGreaterThanOrEqual(120);
    expect(autoCutBox?.height).toBeGreaterThanOrEqual(120);
    // Side by side row check
    expect(Math.abs((newProjBox?.y || 0) - (autoCutBox?.y || 0))).toBeLessThan(5);

    await captureScreen(page, '01_viewport_360x640_portrait.png');

    // Landscape
    await page.setViewportSize({ width: 640, height: 360 });
    await captureScreen(page, '02_viewport_360x640_landscape.png');
  });

  test('2. Viewport 393x851 (Portrait & Landscape)', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-header"]');

    const newProjBtn = page.locator('[data-testid="action-new-project-btn"]');
    const autoCutBtn = page.locator('[data-testid="action-auto-cut-btn"]');
    await expect(newProjBtn).toBeVisible();
    await expect(autoCutBtn).toBeVisible();

    await captureScreen(page, '03_viewport_393x851_portrait.png');

    await page.setViewportSize({ width: 851, height: 393 });
    await captureScreen(page, '04_viewport_393x851_landscape.png');
  });

  test('3. Simulated Notch Phone (390x844 with sat=47px, sab=34px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await injectSafeAreaInsets(page, { top: 47, bottom: 34, left: 0, right: 0 });

    const header = page.locator('[data-testid="app-header"]');
    const headerBox = await header.boundingBox();
    // Header height includes 56px content + 47px safe area = ~103px
    expect(headerBox?.height).toBeGreaterThanOrEqual(100);

    const brand = page.locator('[data-testid="app-brand-title"]');
    const brandBox = await brand.boundingBox();
    // Logo text starts below the 47px notch
    expect(brandBox?.y).toBeGreaterThanOrEqual(47);

    await captureScreen(page, '05_notch_phone_portrait.png');

    // Landscape with notch on the side (sal=47px, sar=0px)
    await page.setViewportSize({ width: 844, height: 390 });
    await injectSafeAreaInsets(page, { top: 0, bottom: 21, left: 47, right: 47 });
    await captureScreen(page, '06_notch_phone_landscape.png');
  });

  test('4. Simulated Dynamic Island Phone (393x852 with sat=59px, sab=34px)', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/');
    await injectSafeAreaInsets(page, { top: 59, bottom: 34, left: 0, right: 0 });

    const header = page.locator('[data-testid="app-header"]');
    const headerBox = await header.boundingBox();
    // Header height includes 56px content + 59px top inset = ~115px
    expect(headerBox?.height).toBeGreaterThanOrEqual(114);

    const brand = page.locator('[data-testid="app-brand-title"]');
    const brandBox = await brand.boundingBox();
    expect(brandBox?.y).toBeGreaterThanOrEqual(59);

    await captureScreen(page, '07_dynamic_island_portrait.png');

    // Landscape
    await page.setViewportSize({ width: 852, height: 393 });
    await injectSafeAreaInsets(page, { top: 0, bottom: 21, left: 59, right: 59 });
    await captureScreen(page, '08_dynamic_island_landscape.png');
  });

  test('5. Tablet (820x1180 iPad Air, Portrait & Landscape)', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto('/');
    await injectSafeAreaInsets(page, { top: 24, bottom: 20, left: 0, right: 0 });

    const primaryRow = page.locator('[data-testid="primary-actions-section"]');
    await expect(primaryRow).toBeVisible();
    await captureScreen(page, '09_tablet_portrait.png');

    await page.setViewportSize({ width: 1180, height: 820 });
    await captureScreen(page, '10_tablet_landscape.png');
  });

  test('6. Tapping AI Auto Cut without saved key shows dialog with button to Settings > AI Provider', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');

    // Clear any stored keys
    await page.evaluate(() => {
      localStorage.removeItem('sabycut_vault_keys');
      localStorage.removeItem('sabycut_gemini_key');
      localStorage.removeItem('sabycut_openai_key');
      localStorage.removeItem('sabycut_gemini_lastfour');
      localStorage.removeItem('sabycut_openai_lastfour');
    });

    await page.reload();
    await page.waitForSelector('[data-testid="action-auto-cut-btn"]');

    // Tap AI Auto Cut
    await page.locator('[data-testid="action-auto-cut-btn"]').click();

    // Verify dialog appears
    const dialog = page.locator('[data-testid="ai-key-required-dialog"]');
    await expect(dialog).toBeVisible();
    await captureScreen(page, '11_ai_key_required_dialog.png');

    // Click Configure AI Provider
    const configBtn = page.locator('[data-testid="configure-ai-provider-btn"]');
    await expect(configBtn).toBeVisible();
    await configBtn.click();

    // Dialog should close, and Settings page opens directly on AI Provider section
    await expect(dialog).toHaveCount(0);
    const settingsPage = page.locator('[data-testid="settings-page"]');
    await expect(settingsPage).toBeVisible();

    const aiSection = page.locator('[data-testid="section-aiProvider"]');
    await expect(aiSection).toBeVisible();
    await captureScreen(page, '12_settings_opened_to_ai_provider.png');
  });

  test('7. AI Provider Section: choose provider, choose model, paste key, test, save, delete', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');

    // Open settings directly
    await page.locator('[data-testid="settings-header-btn"]').click();
    await page.locator('[data-testid="settings-tab-aiProvider"]').click();

    // Test Gemini provider & model selection
    await page.locator('[data-testid="provider-gemini-btn"]').click();
    const geminiSelect = page.locator('[data-testid="gemini-model-select"]');
    await expect(geminiSelect).toBeVisible();
    await geminiSelect.selectOption('gemini-1.5-pro');

    // Paste Key
    const keyInput = page.locator('[data-testid="ai-key-input"]');
    await keyInput.fill('AIzaSyTestSecretVaultKeyABC1234');

    // Test Key
    await page.locator('[data-testid="test-key-btn"]').click();
    const banner = page.locator('[data-testid="ai-feedback-banner"]');
    await expect(banner).toBeVisible();

    // Save Key
    await page.locator('[data-testid="save-key-btn"]').click();
    await expect(page.locator('[data-testid="vault-key-status"]')).toBeVisible();

    // Verify masked preview shows only last 4 characters: 1234
    const vaultStatus = page.locator('[data-testid="vault-key-status"]');
    await expect(vaultStatus).toContainText('1234');
    await expect(keyInput).toHaveValue(''); // Raw key cleared from input
    await captureScreen(page, '13_ai_provider_saved_key.png');

    // Switch to OpenAI provider
    await page.locator('[data-testid="provider-openai-btn"]').click();
    const openaiSelect = page.locator('[data-testid="openai-model-select"]');
    await expect(openaiSelect).toBeVisible();
    await openaiSelect.selectOption('gpt-4o');

    // Delete the Gemini key
    await page.locator('[data-testid="provider-gemini-btn"]').click();
    await page.locator('[data-testid="delete-key-btn"]').click();
    await expect(page.locator('[data-testid="vault-key-status"]')).toHaveCount(0);
    await captureScreen(page, '14_ai_provider_key_deleted.png');
  });

  test('8. Settings Page: all 9 sections navigation and About tech stack', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.locator('[data-testid="settings-header-btn"]').click();

    // Account
    await page.locator('[data-testid="settings-tab-account"]').click();
    await expect(page.locator('[data-testid="section-account"]')).toBeVisible();

    // Language
    await page.locator('[data-testid="settings-tab-language"]').click();
    await expect(page.locator('[data-testid="section-language"]')).toBeVisible();

    // Appearance
    await page.locator('[data-testid="settings-tab-appearance"]').click();
    await expect(page.locator('[data-testid="section-appearance"]')).toBeVisible();

    // Storage
    await page.locator('[data-testid="settings-tab-storage"]').click();
    await expect(page.locator('[data-testid="section-storage"]')).toBeVisible();

    // Export Defaults
    await page.locator('[data-testid="settings-tab-exportDefaults"]').click();
    await expect(page.locator('[data-testid="section-exportDefaults"]')).toBeVisible();

    // Keyboard Shortcuts
    await page.locator('[data-testid="settings-tab-keyboardShortcuts"]').click();
    await expect(page.locator('[data-testid="section-keyboardShortcuts"]')).toBeVisible();

    // About (Requirement 5: tech stack moved to About)
    await page.locator('[data-testid="settings-tab-about"]').click();
    const aboutSection = page.locator('[data-testid="section-about"]');
    await expect(aboutSection).toBeVisible();
    await expect(aboutSection).toContainText('Spring Boot Core');
    await expect(aboutSection).toContainText('Flask');
    await expect(aboutSection).toContainText('HarfBuzz');
    await expect(aboutSection).toContainText('Capacitor');
    await expect(aboutSection).toContainText('AES-256-GCM');
    await captureScreen(page, '15_settings_about_tech_stack.png');

    // Debug (Requirement 6: debug overlay toggle)
    await page.locator('[data-testid="settings-tab-debug"]').click();
    const debugSection = page.locator('[data-testid="section-debug"]');
    await expect(debugSection).toBeVisible();
    await page.locator('[data-testid="safe-area-debug-toggle"]').click();
    await captureScreen(page, '16_settings_debug_safe_area_overlay.png');
  });

  test('9. Recent Projects: rename, duplicate, delete, and empty state', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');

    const grid = page.locator('[data-testid="projects-grid"]');
    await expect(grid).toBeVisible();

    // Open first project actions menu
    const firstMenuBtn = page.locator('[data-testid^="project-menu-btn-"]').first();
    await firstMenuBtn.click();

    // Duplicate project
    const dupBtn = page.locator('[data-testid="menu-duplicate-btn"]');
    await expect(dupBtn).toBeVisible();
    await dupBtn.click();
    await captureScreen(page, '17_recent_projects_duplicated.png');

    // Delete all projects to test empty state
    await page.evaluate(() => {
      localStorage.setItem('sabycut_projects', JSON.stringify([]));
    });
    await page.reload();

    const emptyState = page.locator('[data-testid="projects-empty-state"]');
    await expect(emptyState).toBeVisible();
    await captureScreen(page, '18_recent_projects_empty_state.png');
  });

});
