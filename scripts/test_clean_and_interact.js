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

  // Permanently neutralize all tour guides, popups, and masks
  await page.evaluate(() => {
    // 1. Remove tour guides and modals
    const removeSelectors = [
      '.lv-modal-wrapper',
      '.lv-modal-mask',
      '.semi-modal-wrapper',
      '.semi-modal-mask',
      '[class*="guide"]',
      '[class*="tour"]',
      '[class*="mask"]',
      '[class*="popover"]',
      '[class*="tooltip"]'
    ];
    removeSelectors.forEach(s => document.querySelectorAll(s).forEach(el => el.remove()));

    // 2. Remove any element with "Material resources"
    Array.from(document.querySelectorAll('*')).forEach(el => {
      if (el.innerText && (el.innerText.includes('Material resources') || el.innerText.includes('CapCut plugin'))) {
        let parent = el;
        while (parent && parent !== document.body && parent.parentElement !== document.body) {
          parent = parent.parentElement;
        }
        if (parent && parent !== document.body) parent.remove();
        else el.remove();
      }
    });

    // 3. Remove inline highlight styles
    document.querySelectorAll('*').forEach(el => {
      if (el.style && el.style.border && el.style.border.includes('rgb(255')) {
        el.style.border = '';
      }
    });
  });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, 'workspace_fully_unlocked.png') });
  console.log('Saved unlocked workspace.');

  // 1. Click Ratio button
  console.log('Clicking Ratio button...');
  const ratioClicked = await page.evaluate(() => {
    const ratioBtn = Array.from(document.querySelectorAll('*')).find(el => {
      return el.children.length === 0 && el.innerText && el.innerText.trim() === 'Ratio';
    });
    if (ratioBtn) {
      ratioBtn.parentElement.click();
      return true;
    }
    return false;
  });
  console.log('Ratio clicked:', ratioClicked);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotDir, 'ratio_popup_open.png') });

  const ratios = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 200 && r.right <= 600 && r.top >= 50 && r.bottom <= 600 && el.children.length === 0 && el.innerText;
      })
      .map(el => el.innerText.trim())
      .filter(t => t.length > 0 && (/\d+:\d+/i.test(t) || /original/i.test(t)));
  });
  console.log('Ratios found:', Array.from(new Set(ratios)));

  // Close Ratio popup
  await page.mouse.click(800, 300);
  await page.waitForTimeout(1000);

  // 2. Click Elements Tab -> Stock Videos -> Add to track
  console.log('Clicking Elements tab...');
  await page.evaluate(() => {
    const el = document.querySelector('.siderMenuElement-menu');
    if (el) el.click();
  });
  await page.waitForTimeout(3000);

  // Check what cards are present in Elements tab
  const cardData = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 60 && r.right <= 450 && r.top >= 150 && r.bottom <= 500 && r.width > 40 && r.height > 30;
    });
    return cards.length;
  });
  console.log('Cards in Elements:', cardData);

  // Hover over the first stock video card
  await page.mouse.move(85, 220);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, 'stock_card_hovered.png') });

  // In CapCut, clicking the "+" icon on a card or clicking the card adds it to timeline
  // Let's click the card at 85, 220
  await page.mouse.click(85, 220);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(screenshotDir, 'after_card_clicked.png') });

  // 3. Click Blue Export Button
  console.log('Clicking Export button...');
  const expClicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === 'Export');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Export button clicked:', expClicked);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(screenshotDir, 'export_modal_clean.png') });

  const exportTexts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 400 && r.right <= 1500 && r.top >= 100 && r.bottom <= 900 && el.children.length === 0 && el.innerText;
      })
      .map(el => el.innerText.trim())
      .filter(t => t.length > 0 && t.length < 50);
  });
  console.log('Export texts:', Array.from(new Set(exportTexts)));

  await browser.close();
  console.log('Clean interaction complete.');
})();
