Write-Host "🧩 Hugonomy Phase VIII.2 – Emotional Sync Bridge Sanity Test"

Set-Location "C:\Users\jting\hugonomy\vibeai-foldspace"

$files = @(
  "src\emotional-sync-bridge.js",
  "src\HUDStreamBridge.js",
  "src\glyphstream-core.js"
)

foreach ($f in $files) {
  if (Test-Path $f) { Write-Host "✅ Found $f" } else { Write-Host "❌ Missing $f" }
}

npm run build
Write-Host "`n⚙️  Build complete — open HUD and watch for live color resonance."