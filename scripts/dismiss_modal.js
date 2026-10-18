const { chromium } = require('../frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, '../docs/audit-screenshots');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const url = 'https://www.capcut.com/editor?__from_page=video_editor&__enter_from=create_new&scenario=custom';

  console.log('Navigating to CapCut editor...');
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);

  console.log('Clicking close button on login modal at (1110, 325)...');
  await page.mouse.click(1110, 325);
  await page.waitForTimeout(2000);

  console.log('Clicking onboarding tooltip close or next at (385, 485)...');
  await page.mouse.click(385, 485);
  await page.waitForTimeout(2000);

  const shotPath = path.join(screenshotDir, '04_dismissed_workspace.png');
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log('Dismissed workspace screenshot saved to:', shotPath);

  await browser.close();
})();
