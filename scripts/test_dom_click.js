const { chromium } = require('../frontend/node_modules/playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('https://www.capcut.com/editor?__from_page=video_editor&__enter_from=create_new&scenario=custom', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);

  const clicked = await page.evaluate(() => {
    // Remove modals, backdrops, guides
    document.querySelectorAll('.lv-modal-wrapper, .lv-modal-mask, [class*="guide"], [class*="tour"], [class*="mask"]').forEach(e => e.remove());

    const el = document.querySelector('.siderTabTemplate-menu') || document.getElementById('siderTabTemplate');
    if (el) {
      el.click();
      return true;
    }
    return false;
  });

  console.log('Templates tab clicked via DOM:', clicked);
  await page.waitForTimeout(4000);

  const shot = path.join(__dirname, '../docs/audit-screenshots/tab_templates_direct.png');
  await page.screenshot({ path: shot, fullPage: true });
  console.log('Saved to:', shot);

  await browser.close();
})();
