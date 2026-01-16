Write-Host ' Hugonomy Phase VIII.0  Glyphstream Sanity Test'

Set-Location 'C:\Users\jting\hugonomy\vibeai-foldspace'

$files = @(
  'src\glyphstream-core.js',
  'src\HUDStreamBridge.js'
)

foreach ($file in $files) {
  if (Test-Path $file) {
    Write-Host " Found $file"
  } else {
    Write-Host " Missing $file"
  }
}

Write-Host '  Running build sanity check...'
npm run build
Write-Host "`nIf you see no errors, Phase VIII.0 Glyphstream layer is ready."
