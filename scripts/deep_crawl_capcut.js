const { chromium } = require('../frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, '../docs/audit-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const url = 'https://www.capcut.com/editor?__from_page=video_editor&__enter_from=create_new&scenario=custom';

  console.log('Navigating to CapCut editor...');
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);

  // Function to dismiss all modals and popups
  async function dismissPopups() {
    await page.evaluate(() => {
      // Click close icons
      const closeIcons = document.querySelectorAll('.lv-modal-close-icon, [aria-label="Close"], [aria-label="close"], .semi-modal-close, [class*="guide-close"]');
      closeIcons.forEach(el => {
        try { el.click(); } catch {}
      });
      // Click outside if backdrop exists
      const mask = document.querySelector('.lv-modal-mask, .semi-modal-mask');
      if (mask) {
        try { mask.click(); } catch {}
      }
    });
    await page.waitForTimeout(1000);
  }

  console.log('Dismissing popups (pass 1)...');
  await dismissPopups();
  await page.waitForTimeout(2000);
  console.log('Dismissing popups (pass 2)...');
  await dismissPopups();
  await page.waitForTimeout(1000);

  // Take screenshot of clean editor
  await page.screenshot({ path: path.join(screenshotDir, '00_clean_workspace.png'), fullPage: true });

  const tabs = [
    { name: 'Media', selector: '.siderMenuMedia-menu' },
    { name: 'Templates', selector: '.siderTabTemplate-menu' },
    { name: 'Elements', selector: '.siderMenuElement-menu' },
    { name: 'Audio', selector: '.siderMenuAudio-menu' },
    { name: 'Text', selector: '.siderMenuText-menu' },
    { name: 'Captions', selector: '.siderMenuCaption-menu' },
    { name: 'Transcript', selector: '.siderMenuTextEditMedia-menu' },
    { name: 'Effects', selector: '.siderMenuEffect-menu' },
    { name: 'Transitions', selector: '.siderMenuTransition-menu' },
    { name: 'Filters', selector: '.siderMenuFilter-menu' },
    { name: 'Brand kit', selector: '.siderMenuBrandKit-menu' },
    { name: 'Plugins', selector: '.siderMenuPlugin-menu' }
  ];

  const results = {};

  for (let i = 0; i < tabs.length; i++) {
    const t = tabs[i];
    console.log(`Processing Tab ${i + 1}/${tabs.length}: ${t.name}...`);
    try {
      await page.click(t.selector, { timeout: 5000 });
      await page.waitForTimeout(2500);
      await dismissPopups();

      const shotName = `tab_${String(i + 1).padStart(2, '0')}_${t.name.toLowerCase().replace(/\s+/g, '_')}.png`;
      await page.screenshot({ path: path.join(screenshotDir, shotName), fullPage: true });

      // Extract details from the panel (area between x: 60 and 380)
      const data = await page.evaluate((tabName) => {
        const panelEls = Array.from(document.querySelectorAll('*')).filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 60 && r.right <= 420 && r.top >= 50 && r.height > 10 && el.innerText && el.innerText.trim().length > 0;
        });

        // Subtabs
        const subtabs = Array.from(document.querySelectorAll('[role="tab"], .semi-tabs-tab, .tab-item, [class*="tab"]'))
          .filter(el => {
            const r = el.getBoundingClientRect();
            return r.left >= 60 && r.right <= 420 && r.top >= 50 && r.top <= 200;
          })
          .map(el => el.innerText.trim())
          .filter(txt => txt.length > 0 && txt.length < 30);

        // Search inputs
        const inputs = Array.from(document.querySelectorAll('input'))
          .filter(el => {
            const r = el.getBoundingClientRect();
            return r.left >= 60 && r.right <= 420;
          })
          .map(el => ({ placeholder: el.placeholder, type: el.type }));

        // Category headers
        const categories = Array.from(document.querySelectorAll('h2, h3, h4, h5, [class*="title"], [class*="category"], [class*="header"]'))
          .filter(el => {
            const r = el.getBoundingClientRect();
            return r.left >= 60 && r.right <= 420 && el.innerText && el.innerText.trim().length > 0;
          })
          .map(el => el.innerText.trim())
          .filter(txt => txt.length > 0 && txt.length < 50);

        // All distinct text strings in the panel
        const allText = Array.from(new Set(panelEls.map(el => el.innerText.trim()).filter(t => t.length > 0 && t.length < 80)));

        return {
          tabName,
          subtabs: Array.from(new Set(subtabs)),
          inputs: inputs,
          categories: Array.from(new Set(categories)).slice(0, 30),
          allText: allText.slice(0, 50)
        };
      }, t.name);

      results[t.name] = data;
      console.log(`Tab ${t.name}: found ${data.subtabs.length} subtabs, ${data.categories.length} categories.`);
    } catch (err) {
      console.log(`Error clicking ${t.name}:`, err.message);
    }
  }

  // Save audit data
  const outPath = path.join(__dirname, '../docs/audit-screenshots/crawled_tabs.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log('Saved crawled tabs to:', outPath);

  await browser.close();
  console.log('Deep crawl complete!');
})();
