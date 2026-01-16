/* eslint-env node */
/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');
const APP_ROOT = path.join(__dirname, '..');
const root = path.resolve(__dirname, '..');
const cssPath = path.join(root, 'sidebar.css');
const srcPath = path.join(root, 'content.js');
const outPath = path.join(root, 'content.inlined.js');

if (!fs.existsSync(cssPath)) { console.error('sidebar.css not found'); process.exit(2); }
if (!fs.existsSync(srcPath)) { console.error('content.js not found'); process.exit(2); }

const css = fs.readFileSync(cssPath, 'utf8');
let src = fs.readFileSync(srcPath, 'utf8');

// Replace the fetch(cssUrl).then... block with inline insertion
const fetchPattern = /fetch\(cssUrl\)\.then\(r => r.text\(\)\)\.then\(\(cssText\) => \{[\s\S]*?shadow\.appendChild\(sidebar\);\}\)\.catch\(\(\) => \{[\s\S]*?shadow\.appendChild\(sidebar\);\}\);/m;

const inlined = `try { const styleEl = document.createElement('style'); styleEl.textContent = ${JSON.stringify(css)}; shadow.appendChild(styleEl); shadow.appendChild(sidebar); } catch(e) { shadow.appendChild(sidebar); }`;

if (fetchPattern.test(src)) {
  src = src.replace(fetchPattern, inlined);
  fs.writeFileSync(outPath, src, 'utf8');
  console.log('Wrote', outPath);
} else {
  console.error('fetch pattern not found in content.js; please update the script if content.js changed.');
  process.exit(3);
}
