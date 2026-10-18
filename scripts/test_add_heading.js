const { chromium } = require('../frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, '../docs/audit-screenshots');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const url = 'https://www.capcut.com/editor?__from_page=video_editor&__enter_from=create_new&scenario=custom';

  console.log('Loading page:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);

  await page.evaluate(() => {
    document.querySelectorAll('.lv-modal-wrapper, .lv-modal-mask, .semi-modal-wrapper, .semi-modal-mask, [class*="guide"], [class*="tour"], [class*="mask"]').forEach(el => el.remove());
    Array.from(document.querySelectorAll('*')).forEach(el => {
      if (el.innerText && (el.innerText.includes('Material resources') || el.innerText.includes('CapCut plugin'))) el.remove();
    });
  });

  // Click Text tab
  await page.evaluate(() => {
    const el = document.querySelector('.siderMenuText-menu');
    if (el) el.click();
  });
  await page.waitForTimeout(2500);

  // Click 'Add heading' by mouse coordinate
  console.log('Clicking Add heading at (140, 160)...');
  await page.mouse.click(140, 160);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(screenshotDir, 'after_add_heading.png') });

  // Inspect right properties panel!
  const rightPanel = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 1400 && r.top >= 40 && r.bottom <= 1000 && el.children.length === 0 && el.innerText;
    }).map(el => el.innerText.trim()).filter(t => t.length > 0 && t.length < 50);

    const inputs = Array.from(document.querySelectorAll('input, select, textarea')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 1400;
    }).map(el => ({
      tag: el.tagName,
      type: el.type,
      val: el.value,
      placeholder: el.placeholder
    }));

    return { texts: Array.from(new Set(els)), inputs };
  });

  console.log('Right panel extracted texts count:', rightPanel.texts.length);
  console.log('Right panel texts:', rightPanel.texts);
  console.log('Right panel inputs:', rightPanel.inputs);

  fs.writeFileSync(path.join(screenshotDir, 'right_panel_text_properties.json'), JSON.stringify(rightPanel, null, 2), 'utf-8');

  await browser.close();
  console.log('Done test_add_heading.');
})();
