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

  // Helper to remove any obstructive overlays
  await page.evaluate(() => {
    document.querySelectorAll('.lv-modal-wrapper, .lv-modal-mask, .semi-modal-wrapper, .semi-modal-mask, [class*="guide"], [class*="tour"], [class*="mask"]').forEach(el => el.remove());
    Array.from(document.querySelectorAll('*')).forEach(el => {
      if (el.innerText && el.innerText.includes('CapCut plugin is now on ChatGPT')) el.remove();
    });
  });

  // 1. Locate Ratio button
  const ratioBox = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === 'Ratio' && e.children.length === 0);
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y - 10, width: r.width, height: r.height };
    }
    return null;
  });
  console.log('Ratio box:', ratioBox);

  if (ratioBox) {
    console.log('Clicking Ratio at:', ratioBox.x, ratioBox.y);
    await page.mouse.click(ratioBox.x, ratioBox.y);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, 'ratio_dropdown_menu.png') });

    const ratioOptions = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 200 && r.right <= 500 && r.top >= 100 && r.bottom <= 700 && el.children.length === 0 && el.innerText;
        })
        .map(el => el.innerText.trim())
        .filter(t => t.length > 0);
    });
    console.log('Extracted Ratio Options:', Array.from(new Set(ratioOptions)));
  }

  // Close ratio dropdown
  await page.mouse.click(800, 300);
  await page.waitForTimeout(1000);

  // 2. Locate Zoom dropdown
  const zoomBox = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim().includes('100%') && e.children.length === 0);
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }
    return null;
  });
  console.log('Zoom box:', zoomBox);
  if (zoomBox) {
    await page.mouse.click(zoomBox.x, zoomBox.y);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, 'zoom_dropdown_menu.png') });

    const zoomOptions = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.top >= 40 && r.bottom <= 500 && el.children.length === 0 && el.innerText;
        })
        .map(el => el.innerText.trim())
        .filter(t => /fit|\d+%/i.test(t));
    });
    console.log('Extracted Zoom Options:', Array.from(new Set(zoomOptions)));
  }

  // Close zoom dropdown
  await page.mouse.click(800, 300);
  await page.waitForTimeout(1000);

  // 3. Locate Top Right 3-dots Menu
  const threeDotsBox = await page.evaluate(() => {
    // 3 dots icon is at the far right of top bar, next to PiP and Export
    // roughly x: 980 to 1000 on a 1024 or 1900 on 1920
    const topBarBtns = Array.from(document.querySelectorAll('button, [role="button"]')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= 55 && r.left >= 1800;
    });
    if (topBarBtns.length > 0) {
      const last = topBarBtns[topBarBtns.length - 1];
      const r = last.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }
    return null;
  });
  console.log('Three dots box:', threeDotsBox);
  if (threeDotsBox) {
    await page.mouse.click(threeDotsBox.x, threeDotsBox.y);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, 'three_dots_menu.png') });

    const menuTexts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 1600 && r.top >= 40 && r.bottom <= 600 && el.children.length === 0 && el.innerText;
        })
        .map(el => el.innerText.trim())
        .filter(t => t.length > 0);
    });
    console.log('Three dots menu items:', Array.from(new Set(menuTexts)));
  }

  await page.mouse.click(800, 300);
  await page.waitForTimeout(1000);

  // 4. Click Blue Export Button
  const exportBox = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === 'Export');
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }
    return null;
  });
  console.log('Export box:', exportBox);
  if (exportBox) {
    await page.mouse.click(exportBox.x, exportBox.y);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(screenshotDir, 'export_modal_view.png') });

    const exportDetails = await page.evaluate(() => {
      const modal = Array.from(document.querySelectorAll('*')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 400 && r.right <= 1500 && r.top >= 100 && r.bottom <= 900 && el.children.length === 0 && el.innerText;
      }).map(el => el.innerText.trim()).filter(t => t.length > 0 && t.length < 50);

      const buttons = Array.from(document.querySelectorAll('button')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.top >= 150 && r.bottom <= 850;
      }).map(el => el.innerText.trim()).filter(t => t.length > 0);

      return {
        modalTexts: Array.from(new Set(modal)),
        buttons: Array.from(new Set(buttons))
      };
    });
    console.log('Export modal details:', exportDetails);
  }

  await browser.close();
  console.log('Menus inspection finished.');
})();
