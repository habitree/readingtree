# GitHub Push Protection 오류 해결 가이드

**작성일:** 2026년 1월 12일  
**오류:** GitHub Push Protection - 서비스 계정 키가 포함된 커밋 차단

---

## 🔍 오류 원인

GitHub의 Secret Scanning이 문서에 포함된 Google Cloud Service Account Credentials를 감지하여 push를 차단했습니다.

**차단된 파일:**
- `doc/question/cloud-run-ocr-setup-new-key.md:53`
- `doc/question/ocr-setup-checklist.md:17`

---

## ✅ 해결 방법

### 방법 1: 문서 수정 후 재커밋 (권장)

**이미 완료된 작업:**
- ✅ 문서에서 실제 서비스 계정 키 제거
- ✅ 스크립트 실행 방법으로 변경

**다음 단계:**

1. **변경 사항 확인**
   ```bash
   git status
   ```

2. **변경된 파일 스테이징**
   ```bash
   git add doc/question/cloud-run-ocr-setup-new-key.md
   git add doc/question/ocr-setup-checklist.md
   git add .gitignore
   ```

3. **새 커밋 생성**
   ```bash
   git commit -m "fix: remove service account key from documentation"
   ```

4. **Push 시도**
   ```bash
   git push origin main
   ```

---

### 방법 2: 이전 커밋 수정 (필요 시)

만약 방법 1로 해결되지 않는다면, 이전 커밋에서 키를 제거해야 합니다.

**주의:** 이 방법은 Git 히스토리를 변경하므로 팀과 협의가 필요합니다.

1. **이전 커밋 확인**
   ```bash
   git log --oneline -5
   ```

2. **이전 커밋 수정 (interactive rebase)**
   ```bash
   git rebase -i HEAD~3
   ```
   - 키가 포함된 커밋을 `edit`로 변경
   - 문서에서 키 제거
   - `git add` 및 `git commit --amend`
   - `git rebase --continue`

---

## 📋 수정된 파일

### 1. `doc/question/cloud-run-ocr-setup-new-key.md`
- ❌ 실제 서비스 계정 키 JSON 제거
- ✅ 스크립트 실행 방법으로 변경

### 2. `doc/question/ocr-setup-checklist.md`
- ❌ 실제 서비스 계정 키 JSON 제거
- ✅ 스크립트 실행 방법으로 변경

### 3. `.gitignore`
- ✅ 서비스 계정 키 파일 패턴 추가

---

## 🔒 보안 주의 사항

### 절대 하지 말아야 할 것
- ❌ 서비스 계정 키를 Git에 커밋
- ❌ 문서에 실제 키 포함
- ❌ 공개 저장소에 키 노출

### 반드시 해야 할 것
- ✅ `.gitignore`에 키 파일 패턴 추가
- ✅ 문서에는 스크립트 실행 방법만 안내
- ✅ Vercel 환경 변수에만 키 저장

---

## 📝 다음 단계

1. **변경 사항 커밋**
   ```bash
   git add doc/question/cloud-run-ocr-setup-new-key.md
   git add doc/question/ocr-setup-checklist.md
   git add .gitignore
   git commit -m "fix: remove service account key from documentation"
   ```

2. **Push 시도**
   ```bash
   git push origin main
   ```

3. **성공 확인**
   - Push가 성공하면 문제 해결 완료
   - 여전히 오류가 발생하면 방법 2 시도

---

**이 문서는 GitHub Push Protection 오류 해결 가이드입니다.**
