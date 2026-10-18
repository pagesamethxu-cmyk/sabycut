const { chromium } = require('../frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, '../docs/audit-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('Launching Chrome via Playwright...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const url = 'https://www.capcut.com/editor?__from_page=video_editor&__enter_from=create_new&scenario=custom';

  console.log('Navigating to:', url);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('Page DOM content loaded. Waiting 10s for JavaScript app hydration...');
    await page.waitForTimeout(10000);

    const title = await page.title();
    console.log('Page Title:', title);
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Save initial screenshot
    const screenshotPath = path.join(screenshotDir, '01_initial_load.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Initial screenshot saved to:', screenshotPath);

    // Check for cookie/dialog banners or login walls
    const textContent = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('Initial text snippet:', textContent.replace(/\n+/g, ' '));

  } catch (err) {
    console.error('Error during inspection:', err.message);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
