const { chromium } = require('../frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, '../docs/audit-screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runAudit() {
  console.log('Starting CapCut Web Editor Full Audit...');

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const url = 'https://www.capcut.com/editor?__from_page=video_editor&__enter_from=create_new&scenario=custom';

  console.log('Loading page:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);

  // Helper to remove any obstructive overlays
  async function cleanOverlays() {
    return await page.evaluate(() => {
      let count = 0;
      const selectors = [
        '.lv-modal-wrapper',
        '.lv-modal-mask',
        '.semi-modal-wrapper',
        '.semi-modal-mask',
        '[class*="guide-placeholder"]',
        '[class*="tour"]',
        '[class*="overlay-mask"]',
        '[class*="driver-popover"]'
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.remove();
          count++;
        });
      });
      return count;
    });
  }

  await cleanOverlays();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, '00_audit_clean_workspace.png'), fullPage: true });

  const auditData = {
    pass1_forward: [],
    pass2_reverse: [],
    pass3_hidden: [],
    tabs: {},
    previewControls: {},
    timelineControls: {},
    rightPanelProperties: {},
    topBarControls: {},
    exportModal: {},
    shortcuts: [],
    contextMenus: {}
  };

  // ==========================================
  // SECTION 1: LEFT PANEL TABS (PASS 1)
  // ==========================================
  const leftTabs = [
    { id: 'media', name: 'Media', selector: '.siderMenuMedia-menu' },
    { id: 'templates', name: 'Templates', selector: '.siderTabTemplate-menu' },
    { id: 'elements', name: 'Elements', selector: '.siderMenuElement-menu' },
    { id: 'audio', name: 'Audio', selector: '.siderMenuAudio-menu' },
    { id: 'text', name: 'Text', selector: '.siderMenuText-menu' },
    { id: 'captions', name: 'Captions', selector: '.siderMenuCaption-menu' },
    { id: 'transcript', name: 'Transcript', selector: '.siderMenuTextEditMedia-menu' },
    { id: 'effects', name: 'Effects', selector: '.siderMenuEffect-menu' },
    { id: 'transitions', name: 'Transitions', selector: '.siderMenuTransition-menu' },
    { id: 'filters', name: 'Filters', selector: '.siderMenuFilter-menu' },
    { id: 'brandkit', name: 'Brand Kit', selector: '.siderMenuBrandKit-menu' },
    { id: 'plugins', name: 'Plugins', selector: '.siderMenuPlugin-menu' }
  ];

  console.log('Inspecting Left Panel Tabs...');
  for (let i = 0; i < leftTabs.length; i++) {
    const tab = leftTabs[i];
    console.log(`Checking Tab [${i + 1}/${leftTabs.length}]: ${tab.name}`);

    await cleanOverlays();

    const clicked = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.click();
        return true;
      }
      return false;
    }, tab.selector);

    await page.waitForTimeout(2500);
    await cleanOverlays();

    const shotName = `tab_${String(i + 1).padStart(2, '0')}_${tab.id}.png`;
    await page.screenshot({ path: path.join(screenshotDir, shotName) });

    const tabInfo = await page.evaluate((tabName) => {
      // Find elements strictly in the sub-panel (between left 60px and 450px, top > 40px, bottom < 1000px)
      const subPanelEls = Array.from(document.querySelectorAll('*')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 60 && r.right <= 450 && r.top >= 40 && r.bottom <= 1020 && r.width > 0 && r.height > 0;
      });

      // Sub-tabs / navigation buttons
      const subtabs = Array.from(document.querySelectorAll('[role="tab"], [class*="tab-item"], [class*="subtab"], [class*="semi-tabs-tab"]'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 60 && r.right <= 450 && r.top >= 40 && r.top <= 200;
        })
        .map(el => el.innerText.trim())
        .filter(t => t.length > 0 && t.length < 40);

      // Search inputs
      const searchInputs = Array.from(document.querySelectorAll('input'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 60 && r.right <= 450;
        })
        .map(el => ({
          placeholder: el.placeholder || '',
          value: el.value || '',
          type: el.type
        }));

      // Action buttons
      const actionButtons = Array.from(document.querySelectorAll('button'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 60 && r.right <= 450 && r.top >= 40 && r.bottom <= 1020;
        })
        .map(el => el.innerText.trim() || el.getAttribute('aria-label') || 'icon-button')
        .filter(t => t.length > 0 && t.length < 50);

      // Category headers / sections
      const categories = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, [class*="category"], [class*="title"], [class*="section"]'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 60 && r.right <= 450 && r.top >= 40 && r.bottom <= 1020;
        })
        .map(el => el.innerText.trim())
        .filter(t => t.length > 0 && t.length < 60);

      // Distinct visible texts (leaf or small nodes)
      const allTexts = Array.from(new Set(
        subPanelEls
          .filter(el => el.children.length === 0 && el.innerText && el.innerText.trim().length > 0)
          .map(el => el.innerText.trim())
          .filter(t => t.length < 60)
      ));

      return {
        tabName,
        subtabs: Array.from(new Set(subtabs)),
        searchInputs,
        actionButtons: Array.from(new Set(actionButtons)),
        categories: Array.from(new Set(categories)),
        allTexts: allTexts.slice(0, 40)
      };
    }, tab.name);

    auditData.tabs[tab.id] = { ...tabInfo, clicked, screenshot: shotName };
    console.log(`Tab ${tab.name}: ${tabInfo.subtabs.length} subtabs, ${tabInfo.categories.length} categories, ${tabInfo.actionButtons.length} buttons.`);
  }

  // ==========================================
  // SECTION 2: PREVIEW AREA CONTROLS
  // ==========================================
  console.log('Inspecting Preview Area Controls...');
  const previewInfo = await page.evaluate(() => {
    // Preview area roughly between x: 420 and 1500, top: 40 to 650
    const previewEls = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 420 && r.right <= 1500 && r.top >= 40 && r.bottom <= 680 && r.width > 0 && r.height > 0;
    });

    const buttons = Array.from(document.querySelectorAll('button, [role="button"], [class*="btn"]'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 420 && r.right <= 1500 && r.top >= 520 && r.bottom <= 680;
      })
      .map(el => ({
        text: el.innerText.trim() || el.getAttribute('aria-label') || el.getAttribute('title') || 'icon-btn',
        tag: el.tagName,
        ariaLabel: el.getAttribute('aria-label'),
        title: el.getAttribute('title'),
        rect: { x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y }
      }));

    // Ratio selector or zoom dropdowns
    const dropdowns = Array.from(document.querySelectorAll('[class*="ratio"], [class*="zoom"], [class*="select"], [role="combobox"]'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 420 && r.right <= 1500 && r.top >= 500 && r.bottom <= 680;
      })
      .map(el => el.innerText.trim())
      .filter(t => t.length > 0 && t.length < 40);

    // Timecode displays
    const timecodes = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 420 && r.right <= 1500 && r.top >= 500 && r.bottom <= 680 &&
          el.children.length === 0 && /\d\d:\d\d/.test(el.innerText || '');
      })
      .map(el => el.innerText.trim());

    return {
      buttons,
      dropdowns: Array.from(new Set(dropdowns)),
      timecodes: Array.from(new Set(timecodes))
    };
  });

  auditData.previewControls = previewInfo;
  await page.screenshot({ path: path.join(screenshotDir, '07_preview_area.png') });
  console.log('Preview controls found:', previewInfo.buttons.length, 'buttons,', previewInfo.dropdowns.length, 'dropdowns.');

  // ==========================================
  // SECTION 3: TIMELINE AREA CONTROLS
  // ==========================================
  console.log('Inspecting Timeline Area Controls...');
  const timelineInfo = await page.evaluate(() => {
    // Timeline area roughly below y: 640
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], [class*="btn"], [class*="toolbar-item"], [class*="tool"]'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.top >= 630 && r.bottom <= 730 && r.width > 10 && r.height > 10;
      })
      .map(el => ({
        label: el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText.trim() || 'icon',
        title: el.getAttribute('title'),
        ariaLabel: el.getAttribute('aria-label'),
        rect: { x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y) }
      }));

    // Sliders in timeline (zoom slider)
    const sliders = Array.from(document.querySelectorAll('input[type="range"], [role="slider"], [class*="slider"]'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.top >= 630;
      })
      .map(el => ({
        tag: el.tagName,
        ariaLabel: el.getAttribute('aria-label'),
        min: el.min,
        max: el.max,
        value: el.value
      }));

    // Track headers / track controls (left side of timeline, x < 250, y > 700)
    const trackControls = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 0 && r.right <= 250 && r.top >= 700 && el.children.length === 0 && el.innerText && el.innerText.trim().length > 0;
      })
      .map(el => el.innerText.trim());

    return {
      buttons,
      sliders,
      trackControls: Array.from(new Set(trackControls))
    };
  });

  auditData.timelineControls = timelineInfo;
  await page.screenshot({ path: path.join(screenshotDir, '08_timeline_area.png') });
  console.log('Timeline controls found:', timelineInfo.buttons.length, 'toolbar buttons,', timelineInfo.sliders.length, 'sliders.');

  // ==========================================
  // SECTION 4: TOP BAR & EXPORT MODAL
  // ==========================================
  console.log('Inspecting Top Bar...');
  const topBarInfo = await page.evaluate(() => {
    // Top bar y: 0 to 55
    const items = Array.from(document.querySelectorAll('button, input, [role="button"], a, [class*="item"]'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= 55 && r.width > 0 && r.height > 0;
      })
      .map(el => ({
        text: el.innerText.trim() || el.getAttribute('aria-label') || el.getAttribute('title') || 'top-item',
        tag: el.tagName,
        placeholder: el.placeholder || '',
        title: el.getAttribute('title')
      }));

    return Array.from(new Set(items.map(it => JSON.stringify(it)))).map(s => JSON.parse(s));
  });

  auditData.topBarControls = topBarInfo;
  console.log('Top bar controls found:', topBarInfo.length);

  // Try opening Export modal
  console.log('Attempting to open Export modal...');
  const exportBtnClicked = await page.evaluate(() => {
    const exportBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Export'));
    if (exportBtn) {
      exportBtn.click();
      return true;
    }
    return false;
  });

  if (exportBtnClicked) {
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '09_export_modal_opened.png') });

    const exportDetails = await page.evaluate(() => {
      // Find modal texts and inputs
      const modalEls = Array.from(document.querySelectorAll('[role="dialog"], .semi-modal, .lv-modal, [class*="export-modal"], [class*="modal"]'))
        .filter(el => el.getBoundingClientRect().width > 200 && el.getBoundingClientRect().height > 200);

      const texts = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 400 && r.right <= 1500 && r.top >= 100 && r.bottom <= 900 && el.children.length === 0 && el.innerText;
        })
        .map(el => el.innerText.trim())
        .filter(t => t.length > 0 && t.length < 60);

      const selects = Array.from(document.querySelectorAll('select, [role="combobox"], [class*="select"]'))
        .map(el => el.innerText.trim() || el.value || 'select');

      const buttons = Array.from(document.querySelectorAll('button'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.top >= 200 && r.bottom <= 800;
        })
        .map(el => el.innerText.trim())
        .filter(t => t.length > 0);

      return {
        modalPresent: modalEls.length > 0,
        texts: Array.from(new Set(texts)).slice(0, 30),
        selects: Array.from(new Set(selects)),
        buttons: Array.from(new Set(buttons))
      };
    });

    auditData.exportModal = exportDetails;
    console.log('Export modal details:', exportDetails);

    // Close export modal
    await cleanOverlays();
  }

  // ==========================================
  // SECTION 5: SHORTCUTS MODAL
  // ==========================================
  console.log('Inspecting Keyboard Shortcuts...');
  // Find shortcut button at bottom-left or press '?'
  await page.keyboard.press('Shift+?');
  await page.waitForTimeout(2000);
  const shortcutShot = path.join(screenshotDir, '10_shortcuts_opened.png');
  await page.screenshot({ path: shortcutShot });

  const shortcutData = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('*')).filter(el => {
      return el.children.length === 0 && el.innerText && (
        el.innerText.includes('Ctrl') || el.innerText.includes('Shift') ||
        el.innerText.includes('Alt') || el.innerText.includes('Space') ||
        el.innerText.includes('Delete') || el.innerText.includes('Backspace') ||
        el.innerText.includes('Cmd')
      );
    }).map(el => ({
      key: el.innerText.trim(),
      parentText: el.parentElement ? el.parentElement.innerText.trim() : ''
    }));

    return rows.slice(0, 50);
  });
  auditData.shortcuts = shortcutData;
  console.log('Shortcuts extracted count:', shortcutData.length);
  await cleanOverlays();

  // ==========================================
  // SECTION 6: SAMPLE MEDIA UPLOAD & RIGHT PROPERTIES PANEL
  // ==========================================
  console.log('Uploading sample media to inspect Right Properties Panel...');
  // Click media tab first
  await page.evaluate(() => {
    const el = document.querySelector('.siderMenuMedia-menu');
    if (el) el.click();
  });
  await page.waitForTimeout(2000);

  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    const samplePath = path.join(__dirname, '../sample_video.mp4');
    console.log('Setting file input to:', samplePath);
    await fileInput.setInputFiles(samplePath);
    await page.waitForTimeout(6000);
    await cleanOverlays();

    await page.screenshot({ path: path.join(screenshotDir, '11_media_uploaded.png') });

    // Look for media item and click to add to timeline or click "+"
    const added = await page.evaluate(() => {
      // Find card or thumbnail in media panel
      const cards = Array.from(document.querySelectorAll('[class*="card"], [class*="item"], [class*="thumb"], [class*="media-item"]'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 60 && r.right <= 450 && r.top >= 150 && r.width > 50 && r.height > 30;
        });

      if (cards.length > 0) {
        cards[0].click();
        return true;
      }
      return false;
    });

    console.log('Media card clicked:', added);
    await page.waitForTimeout(3000);
    await cleanOverlays();
    await page.screenshot({ path: path.join(screenshotDir, '12_clip_selected.png') });

    // Inspect Right Properties Panel (x > 1400, top: 40 to 1000)
    const rightPanelInfo = await page.evaluate(() => {
      const panelEls = Array.from(document.querySelectorAll('*')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.left >= 1400 && r.top >= 40 && r.bottom <= 1000 && r.width > 0 && r.height > 0;
      });

      // Tabs in right panel
      const tabs = Array.from(document.querySelectorAll('[role="tab"], [class*="tab-item"], [class*="semi-tabs-tab"]'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 1400 && r.top >= 40 && r.top <= 120;
        })
        .map(el => el.innerText.trim())
        .filter(t => t.length > 0 && t.length < 30);

      // Section titles
      const sections = Array.from(document.querySelectorAll('h3, h4, h5, [class*="title"], [class*="header"], [class*="section"]'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 1400 && r.top >= 40 && r.bottom <= 1000;
        })
        .map(el => el.innerText.trim())
        .filter(t => t.length > 0 && t.length < 40);

      // Sliders / inputs
      const inputs = Array.from(document.querySelectorAll('input, select'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 1400;
        })
        .map(el => ({
          type: el.type || el.tagName,
          ariaLabel: el.getAttribute('aria-label') || '',
          value: el.value || '',
          min: el.min || '',
          max: el.max || ''
        }));

      // Toggles / switches
      const toggles = Array.from(document.querySelectorAll('[role="switch"], [class*="switch"], [class*="checkbox"]'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 1400;
        })
        .map(el => el.getAttribute('aria-label') || el.innerText.trim() || 'toggle');

      // Distinct text items in right panel
      const leafTexts = Array.from(new Set(
        panelEls
          .filter(el => el.children.length === 0 && el.innerText && el.innerText.trim().length > 0)
          .map(el => el.innerText.trim())
          .filter(t => t.length < 50)
      ));

      return {
        tabs: Array.from(new Set(tabs)),
        sections: Array.from(new Set(sections)),
        inputs: inputs.slice(0, 30),
        toggles: Array.from(new Set(toggles)),
        leafTexts: leafTexts.slice(0, 60)
      };
    });

    auditData.rightPanelProperties = rightPanelInfo;
    console.log('Right panel info:', rightPanelInfo.tabs.length, 'tabs,', rightPanelInfo.sections.length, 'sections,', rightPanelInfo.inputs.length, 'inputs.');
  }

  // Save audit data to JSON
  const resultJsonPath = path.join(__dirname, '../docs/audit-screenshots/capcut_deep_audit_results.json');
  fs.writeFileSync(resultJsonPath, JSON.stringify(auditData, null, 2), 'utf-8');
  console.log('Full audit raw data written to:', resultJsonPath);

  await browser.close();
  console.log('Full audit script completed successfully.');
}

runAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
