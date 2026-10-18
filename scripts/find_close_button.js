const { chromium } = require('../frontend/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('https://www.capcut.com/editor?__from_page=video_editor&__enter_from=create_new&scenario=custom', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);

  const info = await page.evaluate(() => {
    // Search for all elements that have click listeners or are close icons
    const all = Array.from(document.querySelectorAll('*'));
    const matches = [];
    for (const el of all) {
      const text = el.innerText || '';
      if (text.includes('Welcome to CapCut')) {
        // Find children of this container
        const svgs = el.querySelectorAll('svg, button, div, span');
        for (const s of svgs) {
          const r = s.getBoundingClientRect();
          if (r.width > 10 && r.width < 50 && r.height > 10 && r.height < 50 && r.top > 250 && r.top < 380 && r.left > 1000) {
            matches.push({
              tag: s.tagName,
              class: s.className,
              rect: { x: r.x, y: r.y, width: r.width, height: r.height },
              outer: s.outerHTML.substring(0, 100)
            });
          }
        }
      }
    }
    return matches;
  });

  console.log('Matches:', JSON.stringify(info, null, 2));
  await browser.close();
})();
