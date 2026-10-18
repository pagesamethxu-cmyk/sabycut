const { chromium } = require('../frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, '../docs/audit-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const url = 'https://www.capcut.com/editor?__from_page=video_editor&__enter_from=create_new&scenario=custom';

  console.log('Navigating to CapCut editor...');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);

  // Look for modal close button
  console.log('Looking for modal close button...');
  // Check modal svg or close buttons
  const closeSelectors = [
    'button:has(svg)',
    '[aria-label="close"]',
    '[aria-label="Close"]',
    'svg[viewBox*="12"]',
    '.semi-modal-close',
    '.close-btn',
    'div[role="dialog"] button'
  ];

  let dismissed = false;
  // Let's find all buttons inside or near the dialog
  const buttons = await page.$$('button');
  console.log('Found buttons count:', buttons.length);
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].innerText().catch(() => '');
    const html = await buttons[i].innerHTML().catch(() => '');
    if (html.includes('svg') && !text) {
      console.log(`Button ${i} has SVG icon, checking if close button...`);
      // Try clicking it if it is near the modal top right
      const box = await buttons[i].boundingBox();
      if (box && box.x > 800 && box.x < 1200 && box.y > 200 && box.y < 450) {
        console.log(`Clicking modal close button at (${box.x}, ${box.y})...`);
        await buttons[i].click();
        dismissed = true;
        break;
      }
    }
  }

  await page.waitForTimeout(3000);
  const screenshotPath = path.join(screenshotDir, '02_after_modal_dismiss.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Screenshot saved to:', screenshotPath);

  // Check if file input is available
  const fileInputs = await page.$$('input[type="file"]');
  console.log('File inputs found:', fileInputs.length);

  if (fileInputs.length > 0) {
    const sampleVideoPath = path.join(__dirname, '../sample_video.mp4');
    console.log('Uploading sample video:', sampleVideoPath);
    await fileInputs[0].setInputFiles(sampleVideoPath);
    console.log('Upload input set. Waiting 10s for upload and timeline population...');
    await page.waitForTimeout(10000);

    const videoLoadedPath = path.join(screenshotDir, '03_sample_video_loaded.png');
    await page.screenshot({ path: videoLoadedPath, fullPage: true });
    console.log('Video loaded screenshot saved to:', videoLoadedPath);
  }

  await browser.close();
  console.log('Inspection step 1 complete.');
})();
