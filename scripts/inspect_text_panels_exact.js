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
      document.querySelectorAll('.lv-modal-wrapper, .lv-modal-mask, .semi-modal-wrapper, .semi-modal-mask, [class*="guide"], [class*="tour"], [class*="mask"]').forEach(el => el.remove());
      Array.from(document.querySelectorAll('*')).forEach(el => {
        if (el.innerText && (el.innerText.includes('Material resources') || el.innerText.includes('CapCut plugin') || el.innerText.includes('Make custom fonts with AI'))) {
          el.remove();
        }
      });
    });
  }

  await cleanAllPopups();

  // 1. Click Text tab
  console.log('Clicking Text tab...');
  await page.evaluate(() => {
    const el = document.querySelector('.siderMenuText-menu');
    if (el) el.click();
  });
  await page.waitForTimeout(2500);

  // 2. Click Add heading
  console.log('Clicking Add heading at 140, 160...');
  await page.mouse.click(140, 160);
  await page.waitForTimeout(3000);
  await cleanAllPopups();

  const results = {};

  // 3. Click Basic tab (x: 1890, y: 195)
  console.log('Clicking Basic tab on right rail at (1890, 195)...');
  await page.mouse.click(1890, 195);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, 'prop_01_text_basic.png') });

  results.text_basic = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 1400 && r.right <= 1860 && r.top >= 40 && r.bottom <= 1000 && el.children.length === 0 && el.innerText;
    }).map(e => e.innerText.trim()).filter(t => t.length > 0 && t.length < 60);

    const inputs = Array.from(document.querySelectorAll('input, select, textarea')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 1400 && r.right <= 1860;
    }).map(el => ({
      tag: el.tagName,
      type: el.type,
      placeholder: el.placeholder,
      value: el.value,
      ariaLabel: el.getAttribute('aria-label')
    }));

    return { texts: Array.from(new Set(els)), inputs };
  });
  console.log('Basic texts found:', results.text_basic.texts);

  // 4. Click Presets tab (x: 1890, y: 135)
  console.log('Clicking Presets tab on right rail at (1890, 135)...');
  await page.mouse.click(1890, 135);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, 'prop_02_text_presets.png') });

  results.text_presets = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 1400 && r.right <= 1860 && r.top >= 40 && r.bottom <= 1000 && el.children.length === 0 && el.innerText;
    }).map(e => e.innerText.trim()).filter(t => t.length > 0 && t.length < 60);
    return Array.from(new Set(els));
  });
  console.log('Presets texts found:', results.text_presets.length);

  // 5. Click Text to speech tab (x: 1890, y: 255)
  console.log('Clicking Text to speech tab on right rail at (1890, 255)...');
  await page.mouse.click(1890, 255);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, 'prop_03_text_tts.png') });

  results.text_tts = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 1400 && r.right <= 1860 && r.top >= 40 && r.bottom <= 1000 && el.children.length === 0 && el.innerText;
    }).map(e => e.innerText.trim()).filter(t => t.length > 0 && t.length < 60);
    return Array.from(new Set(els));
  });
  console.log('TTS texts found:', results.text_tts.slice(0, 25));

  // 6. Click Animation tab (x: 1890, y: 380)
  console.log('Clicking Animation tab on right rail at (1890, 380)...');
  await page.mouse.click(1890, 380);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, 'prop_04_text_animation.png') });

  results.text_animation = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 1400 && r.right <= 1860 && r.top >= 40 && r.bottom <= 1000 && el.children.length === 0 && el.innerText;
    }).map(e => e.innerText.trim()).filter(t => t.length > 0 && t.length < 60);
    return Array.from(new Set(els));
  });
  console.log('Animation texts found:', results.text_animation.slice(0, 25));

  // 7. Click Motion tracking tab (x: 1890, y: 440)
  console.log('Clicking Motion tracking tab on right rail at (1890, 440)...');
  await page.mouse.click(1890, 440);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, 'prop_05_text_motion_tracking.png') });

  results.text_motion_tracking = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 1400 && r.right <= 1860 && r.top >= 40 && r.bottom <= 1000 && el.children.length === 0 && el.innerText;
    }).map(e => e.innerText.trim()).filter(t => t.length > 0 && t.length < 60);
    return Array.from(new Set(els));
  });
  console.log('Motion tracking texts found:', results.text_motion_tracking.slice(0, 25));

  // 8. Now click Export button (now timeline definitely has the text clip!)
  console.log('Clicking Export button with text clip on timeline...');
  await page.mouse.click(1775, 75);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(screenshotDir, 'prop_06_export_dialog.png') });

  results.export_dialog = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 400 && r.right <= 1500 && r.top >= 80 && r.bottom <= 950 && el.children.length === 0 && el.innerText;
    }).map(e => e.innerText.trim()).filter(t => t.length > 0 && t.length < 60);
    return Array.from(new Set(els));
  });
  console.log('Export dialog texts:', results.export_dialog);

  // Save all properties JSON
  fs.writeFileSync(path.join(screenshotDir, 'text_and_export_properties_audit.json'), JSON.stringify(results, null, 2), 'utf-8');

  await browser.close();
  console.log('Inspection script completed successfully.');
})();
