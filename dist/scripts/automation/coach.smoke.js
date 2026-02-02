/*
  Coach V1 smoke test (CI-friendly)

  Usage:
    node scripts/automation/coach.smoke.js
    node scripts/automation/coach.smoke.js --dist

  Exits non-zero on failure.
*/

const fs = require('fs');
const path = require('path');

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function fail(message) {
  console.error(`COACH_SMOKE_FAIL: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`COACH_SMOKE_OK: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function assertIncludes(haystack, needle, message) {
  assert(haystack.includes(needle), message);
}

function assertNotIncludes(haystack, needle, message) {
  assert(!haystack.includes(needle), message);
}

function safeJsonParse(text, label) {
  try {
    return JSON.parse(text);
  } catch (e) {
    fail(`${label}: invalid JSON (${e.message})`);
    return null;
  }
}

function tryParseJs(filePath) {
  const code = readUtf8(filePath);
  try {
    // Parse-only. Do not execute side-effects.
    // eslint-disable-next-line no-new-func
    new Function(code);
    ok(`JS parses: ${filePath}`);
  } catch (e) {
    fail(`JS parse error in ${filePath}: ${e.message}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const useDist = args.includes('--dist');

  const root = path.resolve(__dirname, '..', '..');
  const base = useDist ? path.join(root, 'dist') : root;

  const manifestPath = path.join(base, 'manifest.json');
  assert(fileExists(manifestPath), `Missing manifest at ${manifestPath}`);

  const manifest = safeJsonParse(readUtf8(manifestPath), 'manifest.json');
  if (!manifest) return;

  // Scope: no Gmail.
  const manifestRaw = JSON.stringify(manifest);
  assertNotIncludes(manifestRaw, 'mail.google.com', 'Manifest should not include mail.google.com');
  ok('Manifest excludes Gmail');

  // Scope: supported hosts present.
  const mustHave = [
    'https://chat.openai.com/*',
    'https://chatgpt.com/*',
    'https://www.chatgpt.com/*',
    'https://gemini.google.com/*',
    'https://copilot.microsoft.com/*',
    'https://claude.ai/*'
  ];

  const allMatches = (manifest.content_scripts || []).flatMap(cs => cs.matches || []);
  const allHosts = manifest.host_permissions || [];

  for (const u of mustHave) {
    assert(allMatches.includes(u) || allHosts.includes(u), `Missing required host/match: ${u}`);
  }
  ok('Manifest includes required LLM hosts');

  // Wiring: coach scripts load before unified-hud.
  const contentScripts = manifest.content_scripts || [];
  const firstGroup = contentScripts[0];
  assert(firstGroup && Array.isArray(firstGroup.js), 'Expected primary content_scripts[0].js array');

  const jsList = firstGroup.js;
  const idxHeur = jsList.indexOf('scripts/vibeai-coach/heuristics.js');
  const idxLex = jsList.indexOf('scripts/vibeai-coach/lexicon-data.js');
  const idxPanel = jsList.indexOf('scripts/vibeai-coach/coach-panel.js');
  const idxHud = jsList.indexOf('scripts/unified-hud.js');

  assert(idxHeur !== -1, 'Missing heuristics.js in content scripts');
  assert(idxLex !== -1, 'Missing lexicon-data.js in content scripts');
  assert(idxPanel !== -1, 'Missing coach-panel.js in content scripts');
  assert(idxHud !== -1, 'Missing unified-hud.js in content scripts');
  assert(idxHeur < idxHud && idxLex < idxHud && idxPanel < idxHud, 'Coach scripts must load before unified-hud.js');
  ok('Load order: Coach scripts precede unified-hud');

  // CSS present.
  assert(Array.isArray(firstGroup.css) && firstGroup.css.includes('scripts/vibeai-coach/coach-styles.css'), 'Missing coach-styles.css in manifest content_scripts');
  ok('Coach CSS wired in manifest');

  // Parse-check critical JS (source only; dist is plain files too).
  const heurPath = path.join(base, 'scripts', 'vibeai-coach', 'heuristics.js');
  const lexPath = path.join(base, 'scripts', 'vibeai-coach', 'lexicon-data.js');
  const panelPath = path.join(base, 'scripts', 'vibeai-coach', 'coach-panel.js');
  const hudPath = path.join(base, 'scripts', 'unified-hud.js');

  for (const p of [heurPath, lexPath, panelPath, hudPath]) {
    assert(fileExists(p), `Missing expected file: ${p}`);
    tryParseJs(p);
  }

  // Critical invariants (static string checks)
  const panelCode = readUtf8(panelPath);
  assertIncludes(panelCode, 'cleanupDrag', 'coach-panel.js should include cleanupDrag to avoid drag listener leaks');
  assertIncludes(panelCode, 'window.__VIBEAI_COACH_INSTALLED', 'coach-panel.js should include idempotent init guard');
  ok('Coach panel has drag cleanup + idempotent init guard');

  const cssPath = path.join(base, 'scripts', 'vibeai-coach', 'coach-styles.css');
  assert(fileExists(cssPath), `Missing expected CSS: ${cssPath}`);
  const css = readUtf8(cssPath);

  // Z-index hierarchy
  assertIncludes(css, 'z-index: 2147483648', 'coach-styles.css should set Coach panel z-index to 2147483648');
  assertIncludes(css, 'z-index: 2147483649', 'coach-styles.css should set Lexicon panel z-index to 2147483649');
  ok('Z-index hierarchy present in Coach CSS');

  const hudCode = readUtf8(hudPath);
  assertIncludes(hudCode, "'chatgpt.com'", 'unified-hud.js should include ChatGPT host in coach allowlist');
  assertNotIncludes(hudCode, 'mail.google.com', 'unified-hud.js should not reference mail.google.com in coach logic');
  ok('HUD coach init allowlist looks correct');

  // Dist sanity: ensure dist folder exists if requested.
  if (useDist) {
    ok('Dist mode checks complete');
  } else {
    ok('Source mode checks complete');
  }

  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode);
  }
}

main();
