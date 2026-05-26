$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$distDir = Join-Path $repoRoot 'dist'
$docsDir = Join-Path $repoRoot 'docs'
$commitMessage = if ($args.Count -gt 0 -and -not [string]::IsNullOrWhiteSpace($args[0])) { $args[0] } else { 'Deploy dist to docs' }

Set-Location $repoRoot

Write-Host 'Building project...'
npm run build

if (-not (Test-Path $distDir)) {
  throw "Build output not found: $distDir"
}

if (-not (Test-Path $docsDir)) {
  New-Item -ItemType Directory -Path $docsDir | Out-Null
}

Write-Host 'Cleaning old generated files in docs...'
Get-ChildItem -LiteralPath $docsDir -Force | ForEach-Object {
  if ($_.PSIsContainer -or $_.Extension -ne '.md') {
    Remove-Item -LiteralPath $_.FullName -Recurse -Force
  }
}

Write-Host 'Copying dist files to docs...'
Copy-Item -Path (Join-Path $distDir '*') -Destination $docsDir -Recurse -Force
New-Item -ItemType File -Path (Join-Path $docsDir '.nojekyll') -Force | Out-Null

Write-Host 'Removing nonessential copied public artifacts from docs...'
Get-ChildItem -LiteralPath $docsDir -Force -Directory | Where-Object {
  $_.Name -like 'project-proj_*' -or $_.Name -eq 'trickle-sentiment'
} | ForEach-Object {
  Remove-Item -LiteralPath $_.FullName -Recurse -Force
}
Get-ChildItem -LiteralPath $docsDir -Force -File | Where-Object {
  $_.Name -like '* - 副本.html'
} | ForEach-Object {
  Remove-Item -LiteralPath $_.FullName -Force
}

Write-Host 'Committing docs deployment...'
git add docs package.json scripts/deploy-docs.ps1

$changes = git status --porcelain
if ([string]::IsNullOrWhiteSpace($changes)) {
  Write-Host 'No changes to commit.'
} else {
  git commit -m $commitMessage
}

Write-Host 'Pushing to GitHub...'
git push

Write-Host 'Done.'
