import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        privacy: 'src/privacy.html',
        foldspace: 'src/foldspace.html'
      }
    }
  },
  plugins: [
    {
      name: 'copy-resources-to-dist',
      closeBundle() {
        try {
          const distDir = path.resolve(__dirname, 'dist');
          if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

          // Copy manifest.json
          fs.copyFileSync(
            path.resolve(__dirname, 'manifest.json'),
            path.resolve(distDir, 'manifest.json')
          );
          console.log('✅ manifest.json copied to dist');

          // Copy background.js
          fs.copyFileSync(
            path.resolve(__dirname, 'background.js'),
            path.resolve(distDir, 'background.js')
          );
          console.log('✅ background.js copied to dist');

          // Copy content-parser.js
          fs.copyFileSync(
            path.resolve(__dirname, 'content-parser.js'),
            path.resolve(distDir, 'content-parser.js')
          );
          console.log('✅ content-parser.js copied to dist');

          // Copy icons directory
          const iconsDir = path.resolve(__dirname, 'icons');
          const distIconsDir = path.resolve(distDir, 'icons');
          if (!fs.existsSync(distIconsDir)) fs.mkdirSync(distIconsDir);
          const iconFiles = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png') || f.endsWith('.svg'));
          iconFiles.forEach(file => {
            fs.copyFileSync(
              path.resolve(iconsDir, file),
              path.resolve(distIconsDir, file)
            );
          });
          console.log('✅ icons copied to dist');

          // Copy scripts directory (Phase IV-Δ: Claude CSP bypass)
          const scriptsDir = path.resolve(__dirname, 'scripts');
          const distScriptsDir = path.resolve(distDir, 'scripts');
          if (!fs.existsSync(distScriptsDir)) fs.mkdirSync(distScriptsDir);
          const scriptFiles = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
          scriptFiles.forEach(file => {
            fs.copyFileSync(
              path.resolve(scriptsDir, file),
              path.resolve(distScriptsDir, file)
            );
          });
          console.log('✅ scripts copied to dist');

          // Phase Δ.9.1: Copy data directory (tone map lexicons)
          const dataDir = path.resolve(__dirname, 'src/data');
          const distSrcDir = path.resolve(distDir, 'src');
          const distDataDir = path.resolve(distSrcDir, 'data');
          if (!fs.existsSync(distSrcDir)) fs.mkdirSync(distSrcDir);
          if (!fs.existsSync(distDataDir)) fs.mkdirSync(distDataDir);
          if (fs.existsSync(dataDir)) {
            const dataFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
            dataFiles.forEach(file => {
              fs.copyFileSync(
                path.resolve(dataDir, file),
                path.resolve(distDataDir, file)
              );
            });
            console.log('✅ data lexicons copied to dist');
          }

          // Copy HTML and JS resources
          fs.copyFileSync(
            path.resolve(__dirname, 'src/privacy.html'),
            path.resolve(distDir, 'privacy.html')
          );
          fs.copyFileSync(
            path.resolve(__dirname, 'src/foldspace.html'),
            path.resolve(distDir, 'foldspace.html')
          );
          fs.copyFileSync(
            path.resolve(__dirname, 'src/foldspace.js'),
            path.resolve(distDir, 'foldspace.js')
          );
          fs.copyFileSync(
            path.resolve(__dirname, 'src/foldspace-client.js'),
            path.resolve(distDir, 'foldspace-client.js')
          );
          fs.copyFileSync(
            path.resolve(__dirname, 'src/trailEngine.js'),
            path.resolve(distDir, 'trailEngine.js')
          );
          fs.copyFileSync(
            path.resolve(__dirname, 'src/emotion-core.js'),
            path.resolve(distDir, 'emotion-core.js')
          );
          fs.copyFileSync(
            path.resolve(__dirname, 'src/foldspace-canvas.js'),
            path.resolve(distDir, 'foldspace-canvas.js')
          );
          fs.copyFileSync(
            path.resolve(__dirname, 'src/perf-monitor.js'),
            path.resolve(distDir, 'perf-monitor.js')
          );
          console.log('✅ HTML and JS resources copied to dist');
        } catch (err) {
          console.error('❌ Failed to copy resources:', err);
        }
      }
    }
  ]
});
