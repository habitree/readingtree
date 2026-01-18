# PowerShell UTF-8 인코딩 설정 스크립트
# Git 커밋 메시지 한글 깨짐 방지

$profilePath = $PROFILE
$profileDir = Split-Path $profilePath -Parent

# 프로필 디렉토리 생성
if (-not (Test-Path $profileDir)) {
    New-Item -Path $profileDir -Type Directory -Force | Out-Null
    Write-Host "프로필 디렉토리 생성 완료: $profileDir" -ForegroundColor Green
}

# 설정 내용
$encodingConfig = @"
# Git 커밋 메시지 한글 깨짐 방지 - UTF-8 인코딩 설정
# 자동 생성됨: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
`$PSDefaultParameterValues['*:Encoding'] = 'utf8'
chcp 65001 | Out-Null
"@

# 프로필 파일이 없으면 생성
if (-not (Test-Path $profilePath)) {
    $encodingConfig | Out-File -FilePath $profilePath -Encoding UTF8
    Write-Host "프로필 파일 생성 완료: $profilePath" -ForegroundColor Green
} else {
    # 이미 설정이 있는지 확인
    $existingContent = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
    if ($existingContent -and $existingContent -match "Git 커밋 메시지 한글 깨짐 방지") {
        Write-Host "이미 UTF-8 인코딩 설정이 추가되어 있습니다." -ForegroundColor Yellow
    } else {
        # 기존 내용에 추가
        Add-Content -Path $profilePath -Value "`n$encodingConfig" -Encoding UTF8
        Write-Host "UTF-8 인코딩 설정이 추가되었습니다." -ForegroundColor Green
    }
}

Write-Host "`n설정 완료! 다음 중 하나를 실행하세요:" -ForegroundColor Cyan
Write-Host "1. PowerShell 재시작" -ForegroundColor White
Write-Host "2. 또는 다음 명령 실행: . `$PROFILE" -ForegroundColor White
Write-Host "`n프로필 파일 위치: $profilePath" -ForegroundColor Gray
