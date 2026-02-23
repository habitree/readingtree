# PR 정보 검토 요약 (doc/vc/pr)

**검토일:** 2026-02-19  
**대상:** `doc/vc/pr` 전반

---

## 잘 반영된 부분

| 항목 | 상태 | 비고 |
|------|------|------|
| **브랜딩** | ✅ | `index.html`에서 "Readtree by Habitree", "Readtree 독서플랫폼"으로 통일 |
| **보도자료 본문** | ✅ | 문제/솔루션/리더십/고객 이야기/CTA 구조 명확 |
| **FAQ** | ✅ | 고객 FAQ / 이해관계자 FAQ 분리, 아코디언 동작 |
| **네비게이션** | ✅ | 보도자료 · FAQ · 문의하기, 모바일 메뉴 포함 |
| **CTA** | ✅ | 베타 테스트 신청(mailto), 둘러보기 버튼 배치 |
| **푸터** | ✅ | 미디어 문의 이메일, © 2026 Readtree by Habitree |
| **Problem Statement** | ✅ | Customer / Core Problem / Opportunity + 가설 세트 정리 |

---

## 수정 권장 사항

### 1. "둘러보기" 링크 URL

- **현재:** `https://readingtree2-0.vercel.app/`
- **피치/실서비스:** `https://readingtree-tan.vercel.app` 등 다른 URL 사용 가능성
- **권장:** 실제 운영 중인 서비스 URL 하나로 통일 후 `index.html`의 "둘러보기" 링크 수정

**위치:** `doc/vc/pr/index.html` 161번째 줄 근처

```html
<a href="https://readingtree2-0.vercel.app/" ...>둘러보기</a>
```

### 2. 기술 스택 표현 (FAQ)

- **현재:** 이해관계자 FAQ에 "React, **Firebase(Auth, Firestore)**", "**Firestore** 보안 규칙" 명시
- **실제 프로젝트:** Next.js + **Supabase** (DB/RLS)
- **권장:**  
  - 옵션 A: "Supabase(Auth, DB), RLS로 사용자별 접근 분리" 등 실제 스택에 맞게 수정  
  - 옵션 B: 기술 구현보다는 "서버 기반 보안·암호화로 개인 기록 보호"처럼 정책만 적어 구현 디테일 축소

**위치:** `doc/vc/pr/index.html` 내 `stakeholderFaqData` (기술 구현 가능 여부, 프라이버시 문항)

### 3. 제품명 통일 (선택)

- **02-Press-Release.md:** "**Habitree Reading Hub**" 사용
- **index.html / 외부 노출:** "**Readtree** (by Habitree)" 사용
- **권장:** 대외용은 "Readtree"로 통일하는 경우, `02-Press-Release.md` 제품명·요약도 "Readtree" 또는 "Readtree 독서플랫폼"으로 맞추면 일관성 있음

---

## 참고 (변경 불필요)

- **README.md**  
  - 배포 URL, 로컬 테스트 방법 적절함.  
  - 파일 구조는 `doc/workingbackward/` 등이 추가되어 있어 현재 폴더 구조와 완전히 일치하지는 않음. 필요 시 나중에 "문서 구조" 섹션만 보완하면 됨.
- **03-FAQ.md**  
  - 본문은 "Habitree" 기준으로 작성되어 있으나, `index.html` FAQ 데이터는 이미 "Readtree 독서플랫폼"으로 반영됨.  
  - 원본 MD는 내부 문서로 두고, 대외용은 `index.html` 기준으로 유지해도 무방.

---

## 요약

- PR용 랜딩(`index.html`)은 브랜딩·구성·CTA·문의처까지 잘 정리되어 있음.
- 반영을 권장하는 부분은 **둘러보기 URL**과 **FAQ 내 기술 스택(Firebase/Firestore → Supabase 또는 정책 위주)** 이며, 제품명 통일은 선택 사항입니다.

원하시면 "둘러보기" URL과 FAQ 문구 수정용 패치 예시도 만들어 드리겠습니다.
