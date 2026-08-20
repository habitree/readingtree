# manifest.json 배포 문제 해결

**작성일:** 2025년 1월  
**문제:** `manifest.json` 파일이 Vercel에 배포되지 않아 404 오류 발생

---

## 문제 원인

### 1. `.gitignore` 설정 문제

**발견된 문제:**
- `.gitignore` 파일에서 `*.json` 패턴이 모든 JSON 파일을 무시하도록 설정됨
- `manifest.json`이 예외 목록에 포함되지 않아 Git에 추적되지 않음
- 결과적으로 Vercel에 배포되어도 파일이 없어서 404 오류 발생

**`.gitignore` 파일 내용:**
```gitignore
*.json
!package.json
!package-lock.json
!tsconfig.json
!tsconfig.*.json
!components.json
# manifest.json이 예외 목록에 없음!
```

### 2. Vercel 캐시 문제

**발견된 문제:**
- Vercel 로그에서 `/manifest.json` 요청이 404로 캐시됨 (Cache: HIT)
- 파일이 배포되어도 캐시된 404 응답이 반환될 수 있음

### 3. 미들웨어 설정 (선택적)

**발견된 문제:**
- 미들웨어 matcher가 `manifest.json`을 명시적으로 제외하지 않음
- Next.js는 `public` 폴더의 파일을 자동으로 제공하지만, 명시적 제외가 더 안전함

---

## 해결 방법

### 1. `.gitignore` 수정 ✅

**수정 내용:**
```gitignore
*.json
!package.json
!package-lock.json
!tsconfig.json
!tsconfig.*.json
!components.json
!public/manifest.json  # 추가됨
```

**작업:**
1. `.gitignore`에 `!public/manifest.json` 예외 추가 완료
2. `public/manifest.json` 파일을 Git에 추가 필요

### 2. 미들웨어 설정 개선 ✅

**수정 내용:**
```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)",
  ],
};
```

**변경 사항:**
- `manifest.json`을 명시적으로 제외
- `.json` 확장자 파일도 제외 패턴에 추가

### 3. Git에 파일 추가 필요

**다음 단계:**
```bash
# manifest.json 파일을 Git에 추가
git add public/manifest.json
git add .gitignore
git commit -m "fix: Add manifest.json to Git tracking and update .gitignore"
git push
```

### 4. Vercel 캐시 초기화

**방법 1: Vercel 대시보드에서**
1. Vercel Dashboard → 프로젝트 선택
2. Settings → Data Cache
3. "Purge Everything" 클릭하여 캐시 초기화

**방법 2: 재배포**
- 새로운 배포를 트리거하면 캐시가 자동으로 갱신됨
- Git push 후 자동 배포 또는 수동 재배포

---

## 검증 방법

### 1. 로컬에서 확인

```bash
# Git 상태 확인
git status public/manifest.json

# 파일이 추적되는지 확인
git ls-files | grep manifest.json
```

### 2. 배포 후 확인

1. **브라우저에서 직접 접근:**
   - `https://readingtree2-0.vercel.app/manifest.json`
   - JSON 형식으로 올바르게 표시되는지 확인

2. **개발자 도구 콘솔:**
   - Network 탭에서 `manifest.json` 요청 확인
   - Status: 200 OK 확인
   - Response에 유효한 JSON이 반환되는지 확인

3. **Vercel 로그:**
   - Functions 탭에서 `/manifest.json` 요청 확인
   - 404 오류가 사라졌는지 확인

---

## 추가 확인 사항

### 1. 다른 JSON 파일도 확인

`.gitignore`에서 무시되는 다른 중요한 JSON 파일이 있는지 확인:
- `public/robots.txt` (필요한 경우)
- 기타 설정 파일

### 2. 빌드 과정 확인

Next.js 빌드 시 `public` 폴더의 파일이 올바르게 복사되는지 확인:
```bash
npm run build
# .next/static 폴더 확인 (필요한 경우)
```

### 3. Vercel 빌드 로그 확인

배포 후 Vercel 빌드 로그에서:
- `public/manifest.json` 파일이 포함되었는지 확인
- 빌드 오류가 없는지 확인

---

## 예상 결과

### 해결 전:
- ❌ `GET /manifest.json 404 (Not Found)`
- ❌ `Manifest: Line: 1, column: 1, Syntax error.`
- ❌ Vercel 캐시에 404 응답 저장됨

### 해결 후:
- ✅ `GET /manifest.json 200 OK`
- ✅ 유효한 JSON 응답 반환
- ✅ 브라우저 콘솔에 manifest 오류 없음
- ✅ PWA 기능 정상 동작

---

## 참고 사항

### Next.js 정적 파일 제공

- Next.js는 `public` 폴더의 파일을 자동으로 루트 경로(`/`)에서 제공
- `public/manifest.json` → `/manifest.json`으로 접근 가능
- 빌드 과정에서 자동으로 포함됨

### Vercel 배포

- Vercel은 Git 저장소의 파일만 배포
- `.gitignore`에 의해 무시된 파일은 배포되지 않음
- 따라서 중요한 파일은 반드시 Git에 추적되어야 함

### 캐시 동작

- Vercel은 정적 파일에 대해 CDN 캐시 사용
- 404 응답도 캐시될 수 있음
- 파일 추가 후 캐시 초기화 또는 재배포 필요

---

## 완료 체크리스트

- [x] `.gitignore`에 `!public/manifest.json` 예외 추가
- [x] 미들웨어 matcher에 `manifest.json` 제외 추가
- [ ] `public/manifest.json` 파일을 Git에 추가
- [ ] 변경사항 커밋 및 푸시
- [ ] Vercel 재배포 또는 캐시 초기화
- [ ] 배포 후 `manifest.json` 접근 확인
- [ ] 브라우저 콘솔에서 오류 사라졌는지 확인

---

**작성자:** AI Assistant  
**최종 수정일:** 2025년 1월
