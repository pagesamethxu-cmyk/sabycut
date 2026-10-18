const { chromium } = require('../frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, '../docs/audit-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const auditData = {
    timestamp: new Date().toISOString(),
    panels: {},
    previewControls: [],
    timelineControls: [],
    rightPanel: {},
    exportDialog: {},
    shortcuts: []
  };

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

  // 1. Dismiss first login modal if present
  console.log('Step 1: Dismissing initial login modal...');
  try {
    // Coordinate of the X on initial login modal
    await page.mouse.click(1108, 363);
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('Login modal dismiss error:', e.message);
  }

  // 2. Dismiss Pro popup if present (X is around x=1115, y=345)
  console.log('Step 2: Dismissing Pro modal...');
  try {
    await page.mouse.click(1115, 345);
    await page.waitForTimeout(1500);
  } catch (e) {
    console.log('Pro modal dismiss error:', e.message);
  }

  // 3. Dismiss onboarding tooltip (X is around x=388, y=486 or button at x=380, y=555)
  console.log('Step 3: Dismissing onboarding tooltip...');
  try {
    await page.mouse.click(388, 486);
    await page.waitForTimeout(1000);
    // Also try next button or any close button
    const closeBtns = await page.$$('[class*="guide"] [aria-label*="close"], [class*="tooltip"] [aria-label*="close"]');
    for (const b of closeBtns) {
      await b.click().catch(() => {});
    }
  } catch {}

  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '06_clean_workspace.png'), fullPage: true });
  console.log('Saved 06_clean_workspace.png');

  // Helper to extract left panel content
  async function extractPanelInfo(tabName) {
    return await page.evaluate((name) => {
      // Find the second column (the panel next to navigation tabs)
      // Usually around x: 50 to 350
      const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4, span, div'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 40 && r.left <= 360 && r.width > 0 && r.height > 0 && el.innerText && el.innerText.trim().length > 0;
        })
        .map(el => el.innerText.trim());

      const uniqueHeaders = Array.from(new Set(headers)).slice(0, 50);
      const inputs = Array.from(document.querySelectorAll('input'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 40 && r.left <= 360;
        })
        .map(el => ({ placeholder: el.placeholder, type: el.type, value: el.value }));

      const buttons = Array.from(document.querySelectorAll('button'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 40 && r.left <= 360;
        })
        .map(el => el.innerText.trim() || el.getAttribute('aria-label') || 'icon-button');

      return {
        tab: name,
        headers: uniqueHeaders,
        inputs: inputs,
        buttons: Array.from(new Set(buttons)).slice(0, 30)
      };
    }, tabName);
  }

  // List of left tabs to click:
  // In the navigation bar on the far left (x ~ 20):
  // Let's find the nav items
  const navTabs = [
    { name: 'Media', y: 140 },
    { name: 'Templates', y: 200 },
    { name: 'Elements', y: 260 },
    { name: 'Audio', y: 320 },
    { name: 'Text', y: 375 },
    { name: 'Captions', y: 435 },
    { name: 'Transcript', y: 495 },
    { name: 'Effects', y: 550 },
    { name: 'Transitions', y: 610 },
    { name: 'Filters', y: 670 },
    { name: 'Brand kit', y: 725 },
    { name: 'Plugins', y: 780 }
  ];

  for (let i = 0; i < navTabs.length; i++) {
    const tab = navTabs[i];
    console.log(`Clicking tab ${i + 1}/${navTabs.length}: ${tab.name} at (20, ${tab.y})...`);
    await page.mouse.click(20, tab.y);
    await page.waitForTimeout(2500);

    const shotFile = `tab_${String(i + 1).padStart(2, '0')}_${tab.name.toLowerCase().replace(/\s+/g, '_')}.png`;
    await page.screenshot({ path: path.join(screenshotDir, shotFile), fullPage: true });
    console.log(`Saved screenshot: ${shotFile}`);

    const panelInfo = await extractPanelInfo(tab.name);
    auditData.panels[tab.name] = panelInfo;
  }

  // Inspect Preview Area Ratio Dropdown
  console.log('Inspecting Aspect Ratio dropdown in preview area...');
  try {
    // Ratio button is around x=268, y=135
    await page.mouse.click(268, 135);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'preview_ratio_dropdown.png'), fullPage: true });
    const ratioOptions = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('*')).filter(el => {
        const t = el.innerText || '';
        return (t.includes('16:9') || t.includes('9:16') || t.includes('1:1') || t.includes('Original') || t.includes('Custom')) && el.getBoundingClientRect().width > 0;
      }).map(el => el.innerText.trim());
      return Array.from(new Set(items));
    });
    auditData.previewControls.push({ control: 'Ratio Dropdown', options: ratioOptions });
    // Click outside to close
    await page.mouse.click(500, 300);
  } catch (e) {
    console.log('Ratio dropdown inspect error:', e.message);
  }

  // Inspect Shortcuts button at bottom left
  console.log('Inspecting Shortcuts modal at bottom left (20, 970)...');
  try {
    await page.mouse.click(20, 970);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'shortcuts_modal.png'), fullPage: true });
    const shortcutsText = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"], [class*="modal"], [class*="shortcut"]');
      if (modal) {
        return Array.from(modal.querySelectorAll('div, li, p, span'))
          .map(el => el.innerText ? el.innerText.trim() : '')
          .filter(t => t.length > 0 && (t.includes('+') || t.includes('Ctrl') || t.includes('Command') || t.includes('Delete') || t.includes('Space')));
      }
      return [];
    });
    auditData.shortcuts = Array.from(new Set(shortcutsText));
    // Close shortcuts
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log('Shortcuts inspect error:', e.message);
  }

  // Upload video to timeline and inspect Right Properties Panel & Timeline
  console.log('Uploading sample video to timeline...');
  const fileInputs = await page.$$('input[type="file"]');
  if (fileInputs.length > 0) {
    const videoPath = path.join(__dirname, '../sample_video.mp4');
    await fileInputs[0].setInputFiles(videoPath);
    console.log('File input set, waiting 12s for upload & timeline clip creation...');
    await page.waitForTimeout(12000);
    await page.screenshot({ path: path.join(screenshotDir, 'video_on_timeline.png'), fullPage: true });

    // Click on the clip on the timeline to select it (timeline track is around y=850, x=450)
    console.log('Clicking on timeline clip to select it...');
    await page.mouse.click(450, 850);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'right_panel_selected_clip.png'), fullPage: true });

    // Extract Right Panel Tabs and Controls
    const rightPanelInfo = await page.evaluate(() => {
      const rightArea = Array.from(document.querySelectorAll('*')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 1500 && r.width > 0 && r.height > 0;
      });

      const tabs = Array.from(document.querySelectorAll('[role="tab"], [class*="tab"]'))
        .filter(el => el.getBoundingClientRect().left >= 1500)
        .map(el => el.innerText.trim())
        .filter(t => t.length > 0);

      const labels = Array.from(document.querySelectorAll('label, [class*="title"], [class*="label"], [class*="slider"]'))
        .filter(el => el.getBoundingClientRect().left >= 1500)
        .map(el => el.innerText.trim())
        .filter(t => t.length > 0);

      return {
        tabs: Array.from(new Set(tabs)),
        labels: Array.from(new Set(labels))
      };
    });
    auditData.rightPanel = rightPanelInfo;
  }

  // Inspect Export Dialog (Top right Export button at x=1840, y=70)
  console.log('Clicking Export button at (1840, 70)...');
  try {
    await page.mouse.click(1840, 70);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'export_dialog.png'), fullPage: true });

    const exportOptions = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"], [class*="export"], [class*="modal"]');
      if (modal) {
        return Array.from(modal.querySelectorAll('*'))
          .map(el => el.innerText ? el.innerText.trim() : '')
          .filter(t => t.length > 0 && t.length < 50);
      }
      return [];
    });
    auditData.exportDialog = Array.from(new Set(exportOptions));
  } catch (e) {
    console.log('Export inspect error:', e.message);
  }

  // Save full audit data to JSON
  const dataPath = path.join(__dirname, 'capcut_audit_data.json');
  fs.writeFileSync(dataPath, JSON.stringify(auditData, null, 2), 'utf-8');
  console.log('Full audit data saved to:', dataPath);

  await browser.close();
  console.log('Crawling complete!');
})();
