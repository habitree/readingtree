$ErrorActionPreference = 'Stop'
$all = [System.Collections.Generic.HashSet[string]]::new()
$maxPages = 130
$startPage = 1
for ($p = $startPage; $p -le $maxPages; $p++) {
  $u = 'https://blog.naver.com/PostList.naver?blogId=pillion21&from=postList&categoryNo=0&currentPage=' + $p
  try {
    $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 45
    $matches = [regex]::Matches($r.Content, 'https://blog\.naver\.com/pillion21/(\d+)')
    $before = $all.Count
    foreach ($m in $matches) { [void]$all.Add($m.Groups[1].Value) }
    $added = $all.Count - $before
    Write-Host "page $p : +$added (total $($all.Count))"
    if ($added -eq 0 -and $p -gt 3) { break }
  }
  catch {
    Write-Host "page $p error: $($_.Exception.Message)"
    break
  }
}
$out = Join-Path $PSScriptRoot 'post_lognos.txt'
$all | Sort-Object { [long]$_ } -Descending | Set-Content -Path $out -Encoding UTF8
Write-Host "Wrote $($all.Count) ids to $out"
