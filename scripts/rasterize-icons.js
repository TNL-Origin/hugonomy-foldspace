/* eslint-env node */
/* eslint-disable no-undef */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const svgPath = path.join(root, 'icons', 'icon-full-square.svg');
const outDir = path.join(root, 'icons');
const sizes = [16, 48, 128, 512];

if (!fs.existsSync(svgPath)) {
  console.error('SVG not found at', svgPath);
  process.exit(2);
}

(async () => {
  const svgBuffer = Buffer.from(fs.readFileSync(svgPath, 'utf8'));
  for (const s of sizes) {
  const out = path.join(outDir, `icon${s}.png`);
  const tmp = out + '.tmp';
    console.log('Rasterizing', svgPath, '->', out, s + 'x' + s);
    try {
      await sharp(svgBuffer, { density: 300 })
        .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(tmp);
      // Try move tmp -> out
      try {
        if (fs.existsSync(out)) fs.unlinkSync(out);
        fs.renameSync(tmp, out);
      } catch (mvErr) {
        // If move fails, leave tmp in place and report both
        console.warn('Could not move tmp to out, tmp is at', tmp, mvErr.message || mvErr);
      }
      console.log('Wrote', out);
    } catch (e) {
      console.error('Failed to rasterize', s, e.message || e);
      process.exit(1);
    }
  }
  console.log('All sizes written.');
})();
