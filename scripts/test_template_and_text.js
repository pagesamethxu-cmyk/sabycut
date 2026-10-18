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

  // Clean overlays
  await page.evaluate(() => {
    document.querySelectorAll('.lv-modal-wrapper, .lv-modal-mask, .semi-modal-wrapper, .semi-modal-mask, [class*="guide"], [class*="tour"], [class*="mask"]').forEach(el => el.remove());
    Array.from(document.querySelectorAll('*')).forEach(el => {
      if (el.innerText && (el.innerText.includes('Material resources') || el.innerText.includes('CapCut plugin'))) {
        el.remove();
      }
    });
  });

  // 1. Click Templates tab
  console.log('Opening Templates tab...');
  await page.evaluate(() => {
    const el = document.querySelector('.siderTabTemplate-menu');
    if (el) el.click();
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(screenshotDir, 'templates_panel_view.png') });

  // Click first template card
  console.log('Clicking first template card...');
  const templateClicked = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll('*')).find(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 60 && r.right <= 450 && r.top >= 200 && r.bottom <= 500 && r.width > 80 && r.height > 60;
    });
    if (card) {
      card.click();
      return true;
    }
    return false;
  });
  console.log('Template clicked:', templateClicked);
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(screenshotDir, 'after_template_click.png') });

  // 2. Click Text tab
  console.log('Opening Text tab...');
  await page.evaluate(() => {
    const el = document.querySelector('.siderMenuText-menu');
    if (el) el.click();
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(screenshotDir, 'text_panel_view.png') });

  // Click first text card
  const textClicked = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll('*')).find(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 60 && r.right <= 450 && r.top >= 150 && r.bottom <= 500 && r.width > 60 && r.height > 30;
    });
    if (card) {
      card.click();
      return true;
    }
    return false;
  });
  console.log('Text card clicked:', textClicked);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(screenshotDir, 'after_text_click.png') });

  // 3. Inspect if right panel opened or timeline has items
  const inspectionResult = await page.evaluate(() => {
    const rightPanelTexts = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 1350 && r.top >= 40 && r.bottom <= 1000 && el.children.length === 0 && el.innerText;
      })
      .map(el => el.innerText.trim())
      .filter(t => t.length > 0 && t.length < 50);

    const timelineItems = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.top >= 700 && r.bottom <= 1000 && r.width > 20 && r.height > 20;
      })
      .map(el => el.className ? String(el.className) : '');

    return {
      rightPanelTexts: Array.from(new Set(rightPanelTexts)),
      timelineItemsCount: timelineItems.length
    };
  });
  console.log('Inspection result:', inspectionResult);

  await browser.close();
  console.log('Done test_template_and_text.');
})();
