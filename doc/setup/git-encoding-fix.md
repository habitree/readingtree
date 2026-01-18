# Git 커밋 메시지 한글 깨짐 해결 가이드

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 🔍 문제 증상

Git 커밋 메시지에 한글이 포함되어 있을 때 깨져서 표시됩니다.

**예시:**
```
90a955d fix: Vercel 鍮뚮뱶 ?ㅻ쪟 ?섏젙 - 鍮뚮뱶 ????붾? ?대씪?댁뼵????
```

**원인:**
- PowerShell의 기본 인코딩이 UTF-8이 아님
- Git은 UTF-8로 저장하지만 PowerShell이 제대로 표시하지 못함

---

## ✅ 해결 방법

### 방법 1: PowerShell 인코딩 설정 (권장)

#### 현재 세션에만 적용

```powershell
# PowerShell 인코딩을 UTF-8로 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
chcp 65001
```

#### 영구적으로 적용

PowerShell 프로필에 다음을 추가:

```powershell
# 프로필 파일 열기
notepad $PROFILE

# 다음 내용 추가
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
chcp 65001 | Out-Null
```

**프로필 파일이 없으면:**
```powershell
# 프로필 파일 생성
New-Item -Path $PROFILE -Type File -Force
notepad $PROFILE
```

---

### 방법 2: Git 설정 확인 및 수정

현재 Git 설정은 올바르게 되어 있습니다:

```bash
# 현재 설정 확인
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
```

**이미 설정되어 있다면 추가 설정 불필요**

---

### 방법 3: 커밋 메시지를 파일로 작성

한글이 포함된 긴 커밋 메시지는 파일로 작성하는 것이 안전합니다:

```powershell
# 1. 커밋 메시지 파일 생성 (UTF-8 인코딩)
@"
fix: Vercel 빌드 오류 수정

- 빌드 타임에 더미 클라이언트 반환
- 런타임에는 환경 변수 필수
"@ | Out-File -FilePath commit-message.txt -Encoding UTF8

# 2. 파일을 사용하여 커밋
git commit -F commit-message.txt

# 3. 파일 삭제 (선택사항)
Remove-Item commit-message.txt
```

---

### 방법 4: Git Bash 사용

PowerShell 대신 Git Bash를 사용하면 인코딩 문제가 발생하지 않습니다:

```bash
# Git Bash에서
git commit -m "fix: Vercel 빌드 오류 수정"
```

---

## 🔧 현재 상태 확인

### Git 설정 확인

```powershell
git config --global --get core.quotepath
git config --global --get i18n.commitencoding
git config --global --get i18n.logoutputencoding
```

**예상 결과:**
```
false
utf-8
utf-8
```

### PowerShell 인코딩 확인

```powershell
[Console]::OutputEncoding.EncodingName
chcp
```

**예상 결과:**
```
Unicode (UTF-8)
활성 코드 페이지: 65001
```

---

## 📋 빠른 해결 체크리스트

- [ ] PowerShell 인코딩을 UTF-8로 설정
- [ ] Git 설정 확인 (이미 올바르게 설정됨)
- [ ] 커밋 메시지가 깨지지 않는지 확인
- [ ] 필요시 Git Bash 사용

---

## 💡 권장 사항

### 커밋 메시지 작성 시

1. **짧은 메시지**: 직접 입력 가능
   ```powershell
   git commit -m "fix: 버그 수정"
   ```

2. **긴 메시지**: 파일로 작성
   ```powershell
   # UTF-8 인코딩으로 파일 생성
   "fix: 버그 수정`n`n상세 설명..." | Out-File -FilePath msg.txt -Encoding UTF8
   git commit -F msg.txt
   ```

3. **Git Bash 사용**: 가장 안전
   ```bash
   git commit -m "fix: 버그 수정"
   ```

---

## 🚨 주의사항

### 이미 커밋된 메시지 수정

이미 커밋된 메시지가 깨져 있다면:

1. **로컬에서만 수정** (아직 푸시하지 않은 경우):
   ```powershell
   git commit --amend -m "올바른 커밋 메시지"
   ```

2. **이미 푸시한 경우**:
   - 커밋 메시지는 변경 가능하지만 히스토리를 다시 작성해야 함
   - 팀과 협의 후 진행 권장

---

## 📚 참고 자료

- [Git 인코딩 설정](https://git-scm.com/book/ko/v2/Git-%EB%A7%9E%EC%B6%A4%EC%9A%A9-Git-%EC%84%A4%EC%A0%95)
- [PowerShell 인코딩](https://learn.microsoft.com/ko-kr/powershell/module/microsoft.powershell.core/about/about_character_encoding)

---

**문서 끝**
