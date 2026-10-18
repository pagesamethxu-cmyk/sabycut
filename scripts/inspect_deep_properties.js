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

  // Clean popups
  await page.evaluate(() => {
    document.querySelectorAll('.lv-modal-wrapper, .lv-modal-mask, .semi-modal-wrapper, .semi-modal-mask, [class*="guide"], [class*="tour"], [class*="mask"]').forEach(el => el.remove());
    Array.from(document.querySelectorAll('*')).forEach(el => {
      if (el.innerText && (el.innerText.includes('Material resources') || el.innerText.includes('CapCut plugin'))) el.remove();
    });
  });

  // Click Text tab
  console.log('Opening Text tab and adding heading...');
  await page.evaluate(() => {
    const el = document.querySelector('.siderMenuText-menu');
    if (el) el.click();
  });
  await page.waitForTimeout(2500);

  // Click Add heading
  await page.mouse.click(140, 160);
  await page.waitForTimeout(3000);

  // Remove the yellow "Make custom fonts with AI" tooltip
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('*')).forEach(el => {
      if (el.innerText && el.innerText.includes('Make custom fonts with AI')) el.remove();
    });
  });

  // ==========================================
  // 1. INSPECT RIGHT PANEL TABS FOR TEXT
  // ==========================================
  const rightTabs = [
    { name: 'Basic', selector: 'text: Basic' },
    { name: 'Presets', selector: 'text: Presets' },
    { name: 'Text to speech', selector: 'text: Text to speech' },
    { name: 'Animation', selector: 'text: Animation' },
    { name: 'Motion tracking', selector: 'text: Motion tracking' }
  ];

  const rightPanelData = {};

  for (const t of rightTabs) {
    console.log(`Inspecting Right Panel Tab: ${t.name}...`);
    // Click the tab on the right vertical bar (around x: 1980 or find element)
    const clicked = await page.evaluate((tabName) => {
      const el = Array.from(document.querySelectorAll('*')).find(e => {
        const r = e.getBoundingClientRect();
        return r.left >= 1800 && e.innerText && e.innerText.trim() === tabName && e.children.length === 0;
      });
      if (el) {
        el.parentElement.click();
        return true;
      }
      return false;
    }, t.name);

    console.log(`Tab ${t.name} clicked:`, clicked);
    await page.waitForTimeout(2000);

    const shotName = `text_prop_${t.name.toLowerCase().replace(/\s+/g, '_')}.png`;
    await page.screenshot({ path: path.join(screenshotDir, shotName) });

    // Extract all controls inside the right panel sub-section (x: 1500 to 1900)
    const details = await page.evaluate(() => {
      const panelEls = Array.from(document.querySelectorAll('*')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 1450 && r.right <= 1920 && r.top >= 40 && r.bottom <= 1000 && el.children.length === 0 && el.innerText;
      });

      const inputs = Array.from(document.querySelectorAll('input, select, textarea')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 1450 && r.right <= 1920;
      }).map(el => ({
        tag: el.tagName,
        type: el.type,
        placeholder: el.placeholder,
        value: el.value,
        ariaLabel: el.getAttribute('aria-label')
      }));

      return {
        texts: Array.from(new Set(panelEls.map(e => e.innerText.trim()))).filter(t => t.length > 0 && t.length < 60),
        inputs
      };
    });

    rightPanelData[t.name] = { ...details, screenshot: shotName };
  }

  // ==========================================
  // 2. INSPECT TIMELINE CLIP CONTEXT MENU (RIGHT-CLICK)
  // ==========================================
  console.log('Right clicking text clip on timeline...');
  // Text clip is roughly at y: 910, x: 400
  await page.mouse.click(400, 910, { button: 'right' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotDir, 'timeline_clip_context_menu.png') });

  const clipContextMenu = await page.evaluate(() => {
    const menuEls = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 200 && r.right <= 800 && r.top >= 600 && r.bottom <= 1050 && el.children.length === 0 && el.innerText;
    });
    return Array.from(new Set(menuEls.map(e => e.innerText.trim()))).filter(t => t.length > 0 && t.length < 50);
  });
  console.log('Clip context menu items:', clipContextMenu);

  // Close context menu
  await page.mouse.click(800, 300);
  await page.waitForTimeout(1000);

  // ==========================================
  // 3. INSPECT CANVAS CONTEXT MENU (RIGHT-CLICK)
  // ==========================================
  console.log('Right clicking canvas...');
  await page.mouse.click(800, 400, { button: 'right' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotDir, 'canvas_context_menu.png') });

  const canvasContextMenu = await page.evaluate(() => {
    const menuEls = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 600 && r.right <= 1200 && r.top >= 200 && r.bottom <= 800 && el.children.length === 0 && el.innerText;
    });
    return Array.from(new Set(menuEls.map(e => e.innerText.trim()))).filter(t => t.length > 0 && t.length < 50);
  });
  console.log('Canvas context menu items:', canvasContextMenu);

  await page.mouse.click(200, 200);
  await page.waitForTimeout(1000);

  // ==========================================
  // 4. CLICK BLUE EXPORT BUTTON (NOW TIMELINE HAS A CLIP!)
  // ==========================================
  console.log('Clicking blue Export button with active timeline clip...');
  const exportClicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === 'Export');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Export button clicked:', exportClicked);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(screenshotDir, 'export_modal_with_clip.png') });

  const exportSettings = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 300 && r.right <= 1600 && r.top >= 50 && r.bottom <= 950 && el.children.length === 0 && el.innerText;
    }).map(e => e.innerText.trim()).filter(t => t.length > 0 && t.length < 60);

    const inputs = Array.from(document.querySelectorAll('input, select, [role="combobox"]')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 300 && r.right <= 1600;
    }).map(el => ({
      tag: el.tagName,
      type: el.type,
      placeholder: el.placeholder,
      value: el.value,
      ariaLabel: el.getAttribute('aria-label')
    }));

    const buttons = Array.from(document.querySelectorAll('button')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 300 && r.right <= 1600 && r.top >= 100 && r.bottom <= 950;
    }).map(b => b.innerText.trim()).filter(t => t.length > 0);

    return {
      texts: Array.from(new Set(all)),
      inputs,
      buttons: Array.from(new Set(buttons))
    };
  });
  console.log('Export settings extracted:', exportSettings.texts.slice(0, 30));

  // Save audit data
  const outPath = path.join(screenshotDir, 'deep_properties_and_export.json');
  fs.writeFileSync(outPath, JSON.stringify({
    rightPanelData,
    clipContextMenu,
    canvasContextMenu,
    exportSettings
  }, null, 2), 'utf-8');

  await browser.close();
  console.log('Deep properties inspection finished.');
})();
