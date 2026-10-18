const { chromium } = require('../frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, '../docs/audit-screenshots');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('https://www.capcut.com/editor?__from_page=video_editor&__enter_from=create_new&scenario=custom', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);

  console.log('Attempting to click .lv-modal-close-icon or [aria-label="Close"]...');
  try {
    const closeBtn = await page.$('.lv-modal-close-icon, [aria-label="Close"]');
    if (closeBtn) {
      await closeBtn.click();
      console.log('Close button clicked via selector!');
    } else {
      console.log('Selector not found, clicking coordinates (1108, 363)...');
      await page.mouse.click(1108, 363);
    }
  } catch (e) {
    console.log('Click error, fallback to coord:', e.message);
    await page.mouse.click(1108, 363);
  }

  await page.waitForTimeout(3000);

  // Look for any onboarding tooltip / guide dialog and close it
  try {
    const nextOrClose = await page.$('.guide-close, [class*="guide"] [aria-label="close"], [class*="tooltip"] button, [class*="tour"] button');
    if (nextOrClose) {
      await nextOrClose.click();
      console.log('Guide/tooltip dismissed');
    }
  } catch {}

  const shot = path.join(screenshotDir, '05_workspace_clean.png');
  await page.screenshot({ path: shot, fullPage: true });
  console.log('Workspace clean screenshot saved to:', shot);

  await browser.close();
})();
