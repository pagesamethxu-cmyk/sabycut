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
  async function cleanOverlays() {
    return await page.evaluate(() => {
      const sels = [
        '.lv-modal-wrapper',
        '.lv-modal-mask',
        '.semi-modal-wrapper',
        '.semi-modal-mask',
        '[class*="guide-placeholder"]',
        '[class*="tour"]',
        '[class*="overlay-mask"]',
        '[class*="chatgpt"]'
      ];
      sels.forEach(s => {
        document.querySelectorAll(s).forEach(el => el.remove());
      });
    });
  }

  await cleanOverlays();

  // 1. Inspect Ratio dropdown
  console.log('Inspecting Ratio dropdown...');
  const ratioClicked = await page.evaluate(() => {
    const ratioBtn = Array.from(document.querySelectorAll('*')).find(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 240 && r.right <= 350 && r.top >= 60 && r.top <= 180 && el.innerText && el.innerText.includes('Ratio');
    });
    if (ratioBtn) {
      ratioBtn.click();
      return true;
    }
    return false;
  });
  console.log('Ratio clicked:', ratioClicked);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotDir, 'ratio_dropdown_opened.png') });

  const ratioOptions = await page.evaluate(() => {
    const opts = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 200 && r.right <= 450 && r.top >= 80 && r.bottom <= 600 && el.children.length === 0 && el.innerText;
    }).map(el => el.innerText.trim()).filter(t => /\d+:\d+|Original/i.test(t));
    return Array.from(new Set(opts));
  });
  console.log('Ratio options:', ratioOptions);

  // Click outside to close ratio dropdown
  await page.mouse.click(800, 300);
  await page.waitForTimeout(1000);

  // 2. Inspect Zoom dropdown
  console.log('Inspecting Zoom dropdown...');
  const zoomClicked = await page.evaluate(() => {
    const zoomBtn = Array.from(document.querySelectorAll('*')).find(el => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= 60 && el.innerText && el.innerText.includes('100%');
    });
    if (zoomBtn) {
      zoomBtn.click();
      return true;
    }
    return false;
  });
  console.log('Zoom clicked:', zoomClicked);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotDir, 'zoom_dropdown_opened.png') });

  const zoomOptions = await page.evaluate(() => {
    const opts = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 500 && r.right <= 800 && r.top >= 40 && r.bottom <= 400 && el.children.length === 0 && el.innerText;
    }).map(el => el.innerText.trim()).filter(t => /Fit|\d+%/i.test(t));
    return Array.from(new Set(opts));
  });
  console.log('Zoom options:', zoomOptions);

  await page.mouse.click(800, 300);
  await page.waitForTimeout(1000);

  // 3. Inspect Export modal
  console.log('Opening Export modal...');
  await page.evaluate(() => {
    const exportBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === 'Export');
    if (exportBtn) exportBtn.click();
  });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(screenshotDir, 'export_modal_detail.png') });

  const exportOptions = await page.evaluate(() => {
    const texts = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 400 && r.right <= 1500 && r.top >= 80 && r.bottom <= 950 && el.children.length === 0 && el.innerText;
      })
      .map(el => el.innerText.trim())
      .filter(t => t.length > 0 && t.length < 80);

    const inputs = Array.from(document.querySelectorAll('input, select, [role="combobox"]'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 400 && r.right <= 1500 && r.top >= 80 && r.bottom <= 950;
      })
      .map(el => ({
        tag: el.tagName,
        type: el.type,
        value: el.value,
        placeholder: el.placeholder,
        ariaLabel: el.getAttribute('aria-label')
      }));

    return {
      allTexts: Array.from(new Set(texts)),
      inputs
    };
  });
  console.log('Export options captured:', exportOptions.allTexts.slice(0, 20));

  await cleanOverlays();
  await page.waitForTimeout(1000);

  // 4. Inspect Shortcuts icon at bottom-left
  console.log('Checking shortcuts icon at bottom left...');
  const shortcutTarget = await page.evaluate(() => {
    const el = document.elementFromPoint(20, 970);
    if (!el) return null;
    const btn = el.closest('button') || el.closest('[role="button"]') || el;
    btn.click();
    return { tag: el.tagName, ariaLabel: el.getAttribute('aria-label') || el.getAttribute('title') };
  });
  console.log('Shortcut icon target:', shortcutTarget);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, 'shortcuts_modal_open.png') });

  const shortcutList = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 200 && r.right <= 1700 && r.top >= 50 && r.bottom <= 950 && el.children.length === 0 && el.innerText;
    }).map(el => el.innerText.trim()).filter(t => t.length > 0 && t.length < 60);

    return Array.from(new Set(rows)).slice(0, 100);
  });
  console.log('Shortcut rows found:', shortcutList.length);

  await cleanOverlays();

  // 5. Add stock video/element to timeline and inspect Right Properties Panel
  console.log('Navigating to Elements tab to add media to timeline...');
  await page.evaluate(() => {
    const el = document.querySelector('.siderMenuElement-menu');
    if (el) el.click();
  });
  await page.waitForTimeout(3000);
  await cleanOverlays();

  // Hover over the first element thumbnail and look for "+" button
  console.log('Hovering thumbnail in Elements panel...');
  const cardHovered = await page.evaluate(() => {
    const thumbs = Array.from(document.querySelectorAll('img, video, [class*="thumb"], [class*="card"]'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 60 && r.right <= 450 && r.top >= 150 && r.bottom <= 600 && r.width > 40 && r.height > 30;
      });
    if (thumbs.length > 0) {
      thumbs[0].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      thumbs[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      return { found: true, x: thumbs[0].getBoundingClientRect().x + 20, y: thumbs[0].getBoundingClientRect().y + 20 };
    }
    return { found: false };
  });

  console.log('Card hovered:', cardHovered);
  if (cardHovered.found) {
    await page.mouse.move(cardHovered.x, cardHovered.y);
    await page.waitForTimeout(1000);
    await page.mouse.click(cardHovered.x, cardHovered.y);
    console.log('Clicked card directly at:', cardHovered.x, cardHovered.y);
    await page.waitForTimeout(3000);
  }

  await cleanOverlays();
  await page.screenshot({ path: path.join(screenshotDir, 'timeline_after_element_add.png') });

  // Now check if right properties panel appeared
  const propertiesData = await page.evaluate(() => {
    const rightEls = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 1400 && r.top >= 40 && r.bottom <= 1020 && r.width > 0 && r.height > 0;
    });

    const tabs = Array.from(document.querySelectorAll('[role="tab"], [class*="tab"]')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 1400 && r.top >= 40 && r.top <= 120;
    }).map(el => el.innerText.trim()).filter(t => t.length > 0 && t.length < 30);

    const sections = Array.from(document.querySelectorAll('h3, h4, h5, [class*="title"], [class*="header"], [class*="section"]')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 1400;
    }).map(el => el.innerText.trim()).filter(t => t.length > 0 && t.length < 50);

    const labelsAndTexts = Array.from(new Set(
      rightEls
        .filter(el => el.children.length === 0 && el.innerText && el.innerText.trim().length > 0)
        .map(el => el.innerText.trim())
        .filter(t => t.length < 60)
    ));

    return {
      tabs: Array.from(new Set(tabs)),
      sections: Array.from(new Set(sections)),
      labelsAndTexts: labelsAndTexts.slice(0, 50)
    };
  });

  console.log('Right panel extracted:', propertiesData);

  // Save full detail JSON
  fs.writeFileSync(path.join(screenshotDir, 'capcut_inspected_details.json'), JSON.stringify({
    ratioOptions,
    zoomOptions,
    exportOptions,
    shortcutTarget,
    shortcutList,
    propertiesData
  }, null, 2), 'utf-8');

  await browser.close();
  console.log('Done!');
})();
