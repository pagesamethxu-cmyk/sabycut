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
  async function cleanAllPopups() {
    await page.evaluate(() => {
      // Remove modal wrappers
      document.querySelectorAll('.lv-modal-wrapper, .lv-modal-mask, .semi-modal-wrapper, .semi-modal-mask, [class*="guide"], [class*="tour"], [class*="mask"]').forEach(el => el.remove());
      
      // Remove yellow tooltip or elements containing "1/2" or "Next"
      Array.from(document.querySelectorAll('*')).forEach(el => {
        if (el.innerText && (el.innerText.includes('1/2') && el.innerText.includes('Next')) && el.getBoundingClientRect().top < 100) {
          el.remove();
        }
      });

      // Remove ChatGPT promo card
      Array.from(document.querySelectorAll('*')).forEach(el => {
        if (el.innerText && el.innerText.includes('CapCut plugin is now on ChatGPT')) {
          el.remove();
        }
      });
    });
  }

  await cleanAllPopups();
  await page.waitForTimeout(1000);

  // 1. Inspect and click Ratio button (icon at x: ~270, y: ~130)
  console.log('Finding and clicking Ratio button...');
  const ratioResult = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const ratioEl = all.find(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 240 && r.left <= 300 && r.top >= 100 && r.top <= 160 && el.innerText && el.innerText.includes('Ratio');
    });
    if (ratioEl) {
      ratioEl.click();
      return { found: true, text: ratioEl.innerText };
    }
    return { found: false };
  });
  console.log('Ratio click result:', ratioResult);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotDir, 'ratio_menu_open.png') });

  // Extract ratio menu items
  const ratios = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 200 && r.right <= 450 && r.top >= 100 && r.bottom <= 600 && el.children.length === 0 && el.innerText;
      })
      .map(el => el.innerText.trim())
      .filter(t => t.length > 0);
  });
  console.log('Ratios extracted:', ratios);

  // Close ratio popup
  await page.mouse.click(800, 300);
  await page.waitForTimeout(1000);

  // 2. Click Elements Tab and Drag First Stock Video to Timeline
  console.log('Clicking Elements Tab...');
  await page.evaluate(() => {
    const el = document.querySelector('.siderMenuElement-menu');
    if (el) el.click();
  });
  await page.waitForTimeout(3000);
  await cleanAllPopups();

  // Drag first stock video thumbnail from panel (x: 85, y: 220) to timeline (x: 500, y: 800)
  console.log('Dragging stock video thumbnail to timeline...');
  await page.mouse.move(85, 220);
  await page.mouse.down();
  await page.waitForTimeout(200);
  await page.mouse.move(500, 800, { steps: 25 });
  await page.waitForTimeout(500);
  await page.mouse.up();
  await page.waitForTimeout(4000);

  await cleanAllPopups();
  await page.screenshot({ path: path.join(screenshotDir, 'timeline_with_dropped_video.png') });

  // Let's also try clicking the '+' icon that appears on hover of stock video
  console.log('Hovering thumbnail to inspect add icon...');
  await page.mouse.move(85, 220);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, 'thumbnail_hovered.png') });

  // Check if clip is now on timeline or can be selected
  console.log('Clicking on timeline at x: 450, y: 780 to select clip...');
  await page.mouse.click(450, 780);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, 'after_timeline_clip_click.png') });

  // 3. Inspect Export Button
  console.log('Clicking Export button (blue button top right)...');
  const exportClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const exp = btns.find(b => b.innerText && b.innerText.trim() === 'Export');
    if (exp) {
      exp.click();
      return true;
    }
    return false;
  });
  console.log('Export button clicked:', exportClicked);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(screenshotDir, 'export_dialog_active.png') });

  const exportDialogTexts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 400 && r.right <= 1500 && r.top >= 100 && r.bottom <= 900 && el.children.length === 0 && el.innerText;
      })
      .map(el => el.innerText.trim())
      .filter(t => t.length > 0 && t.length < 50);
  });
  console.log('Export Dialog Texts:', Array.from(new Set(exportDialogTexts)));

  // Close Export Dialog
  await cleanAllPopups();
  await page.mouse.click(100, 100);
  await page.waitForTimeout(1000);

  // 4. Click Keyboard Icon at bottom left
  console.log('Clicking keyboard icon at x: 20, y: 970...');
  await page.mouse.click(20, 970);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(screenshotDir, 'shortcuts_dialog_active.png') });

  const shortcutsTexts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 200 && r.right <= 1700 && r.top >= 100 && r.bottom <= 950 && el.children.length === 0 && el.innerText;
      })
      .map(el => el.innerText.trim())
      .filter(t => t.length > 0 && t.length < 50);
  });
  console.log('Shortcuts Dialog Texts count:', shortcutsTexts.length);

  // Save results
  fs.writeFileSync(path.join(screenshotDir, 'exact_controls_result.json'), JSON.stringify({
    ratios,
    exportDialogTexts: Array.from(new Set(exportDialogTexts)),
    shortcutsTexts: Array.from(new Set(shortcutsTexts))
  }, null, 2), 'utf-8');

  await browser.close();
  console.log('Exact controls inspection complete.');
})();
