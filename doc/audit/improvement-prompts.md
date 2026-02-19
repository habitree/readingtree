# ReadTree 개선 실행 프롬프트 모음

> 각 카테고리별 Claude Code 실행 프롬프트입니다.
> 필요한 개선 사항을 선택하여 실행하세요.

---

## 1. SEO 개선

### robots.txt 생성
```
app/robots.ts를 생성해주세요:
- Next.js MetadataRoute.robots() 활용
- Allow: / (전체 허용)
- Disallow: /api/, /admin/
- Sitemap: https://readingtree-tan.vercel.app/sitemap.xml
```

### sitemap.xml 생성
```
app/sitemap.ts를 생성해주세요:
- 정적 페이지: /, /about, /terms, /privacy
- 동적 페이지: /share/notes/[id], /share/bookshelves/[id]
- Supabase에서 is_public=true인 노트/책장 ID 조회
- changeFrequency, priority 설정
```

---

## 2. 보안 강화

### Auth 입력 검증
```
app/actions/auth.ts의 signInWithEmail 함수에서:
- Line 115: email.includes("@") → 정규식 검증 /^[^\s@]+@[^\s@]+\.[^\s@]+$/
- Line 119: password.length < 1 → password.length < 6
```

### 에러 바운더리
```
app/(auth)/error.tsx를 생성해주세요:
- "use client" 컴포넌트
- 인증 페이지 전용 에러 UI
- "로그인으로 돌아가기" 버튼 포함
- 에러 메시지 표시
```

---

## 3. UX 안정성

### 공유 다이얼로그 race condition
```
components/share/simple-share-dialog.tsx에서:
- isCapturingRef = useRef(false) 추가
- handleCopyCardImage 시작부: if (isCapturingRef.current) return;
- handleCopyCardImage finally: isCapturingRef.current = false;
```

### useEffect cleanup
```
components/share/simple-share-dialog.tsx의 useEffect에서:
- isMountedRef = useRef(true) 추가
- cleanup return에서 isMountedRef.current = false
- setState 전 isMountedRef.current 체크
```

---

## 4. 성능 최적화

### Canvas 메모리 정리
```
components/share/simple-share-dialog.tsx의 handleCopyCardImage finally에서:
- canvas 참조 null 처리
- trimmedCanvas 참조 null 처리
```

### 프로덕션 console.log 정리
```
components/ 디렉토리에서 console.log/warn/error 호출을 검토하고:
- 디버깅용 console.log는 제거 또는 development 가드 추가
- 에러 핸들링용 console.error는 유지
```

---

## 5. 접근성 개선

### aria 속성 보강
```
components/share/share-note-card.tsx의 ExpandableText에서:
- 더보기/접기 버튼에 aria-expanded={isExpanded} 추가

components/layout/mobile-nav.tsx의 FAB 버튼에서:
- focus:ring-2 focus:ring-primary focus:ring-offset-2 추가
```

### 다크모드 대비 색상
```
다크모드에서 text-slate-600이 사용된 곳을 검토하고
dark:text-slate-400으로 보강
```
