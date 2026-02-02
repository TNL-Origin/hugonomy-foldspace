const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const repoRoot = path.resolve(__dirname, '..', '..');
  // Use repository root as extension path (manifest.json + scripts live here)
  const extPath = repoRoot;
  const docsHud = path.join(repoRoot, 'docs', 'hud.html');
  const distPath = path.join(repoRoot, 'dist');
  // Default target URL for extension content script injection - must match manifest hosts
  const targetUrl = process.env.TARGET_URL || 'https://chat.openai.com/';
  const localHudScript = path.join(repoRoot, 'scripts', 'unified-hud.js');

  console.log('Repo root:', repoRoot);
  console.log('Using extension path:', distPath);
  console.log('Using test page:', docsHud);

  const userDataDir = path.join(repoRoot, '.tmp-playwright-profile');

  const extArg = `--disable-extensions-except=${extPath}`;
  const loadArg = `--load-extension=${extPath}`;

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [extArg, loadArg],
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();
  console.log('Navigating to target URL for content-script injection:', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 }).catch(err => {
    console.warn('Navigation to target URL failed or timed out:', err && err.message);
  });

  // Wait for HUD injection (poll)
  const hudSel = '#vibeai-unified-hud';
  let hud = await page.$(hudSel);
  if (!hud) {
    console.log('HUD not found initially, attempting to call injectUnifiedHUD if available');
    try {
      // Try calling the injectable API if present
      await page.evaluate(() => { if (window.injectUnifiedHUD) window.injectUnifiedHUD(); });

      // If still not present, inject the `scripts/unified-hud.js` file directly into the page
      const scriptPath = localHudScript;
      try {
        await page.addScriptTag({ path: scriptPath });
      } catch (innerErr) {
        // Fallback: attempt to fetch and inject text content
        try {
          const fs = require('fs');
          const code = fs.readFileSync(scriptPath, 'utf8');
          await page.addScriptTag({ content: code });
        } catch (fsErr) {
          console.warn('Could not inject local unified-hud script:', fsErr);
        }
      }

      // If the script defines injectUnifiedHUD, call it explicitly to mount the HUD
      try {
        await page.evaluate(() => { if (window.injectUnifiedHUD) window.injectUnifiedHUD(); });
      } catch (callErr) {
        console.warn('injectUnifiedHUD call failed:', callErr);
      }

      // Wait longer for HUD to appear after injection
      await page.waitForSelector(hudSel, { timeout: 10000 });
      hud = await page.$(hudSel);
    } catch (e) {
      console.error('HUD injection failed:', e);
    }
  }

  const results = {
    hudExists: !!hud,
    duplicateCount: 0,
    mountFlag: false,
    isolation: false,
    overflowHidden: false
  };

  if (hud) {
    const count = await page.$$eval(hudSel, els => els.length);
    results.duplicateCount = count;
    results.mountFlag = await page.evaluate(() => {
      try { window.__VIBEAI__ = window.__VIBEAI__ || {}; return !!window.__VIBEAI__.hudMounted; } catch (e) { return false; }
    });

    const styles = await page.$eval(hudSel, el => {
      const s = getComputedStyle(el);
      return { isolation: s.isolation, overflow: s.overflow };
    });
    results.isolation = styles.isolation === 'isolate';
    results.overflowHidden = styles.overflow === 'hidden' || styles.overflow.includes('hidden');

    console.log('HUD count:', results.duplicateCount);
    console.log('mount flag:', results.mountFlag);
    console.log('styles:', styles);

    // Reload and ensure only single HUD remains (best-effort)
    try {
      await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
      const countAfter = await page.$$eval(hudSel, els => els.length);
      results.duplicateAfterReload = countAfter;
      console.log('HUD count after reload:', countAfter);
    } catch (reloadErr) {
      console.warn('Reload check failed (page may have navigated or closed):', reloadErr && reloadErr.message);
      // Fall back to checking current count (if possible)
      try {
        const countAfter = await page.$$eval(hudSel, els => els.length);
        results.duplicateAfterReload = countAfter;
      } catch (e) {
        results.duplicateAfterReload = null;
      }
    }
  }

  console.log('\nSMOKE TEST RESULTS:\n', JSON.stringify(results, null, 2));

  // Close context
  await context.close();

  // Exit with non-zero if failures
  const ok = results.hudExists && results.duplicateCount === 1 && results.duplicateAfterReload === 1 && results.isolation && results.overflowHidden;
  console.log('\nSMOKE TEST OK:', ok);
  process.exit(ok ? 0 : 2);
})();