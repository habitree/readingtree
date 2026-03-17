# habitree_pr GitHub Pages 업데이트 가이드

> **대상:** https://habitree.github.io/habitree_pr/  
> **목적:** readtree-pitch.html과 동일하게 현재 서비스(ReadTree) + 이전 버전(Habitree) 반영

---

## 0. 로컬 배포 폴더에 이미 적용됨

**`c:\Dev\habitree_pr_deploy\index.html`** 에 동일한 업데이트가 적용되어 있습니다.  
이 폴더를 `habitree/habitree_pr` 저장소로 푸시하면 GitHub Pages에 반영됩니다.

```powershell
cd c:\Dev\habitree_pr_deploy
git add index.html
git commit -m "chore: ReadTree 현재 서비스 + Habitree 이전 버전 링크 반영"
git push origin main
```

(원격이 `habitree_pr` 저장소로 설정되어 있다면 위 push로 Pages가 갱신됩니다.)

---

## 1. 적용 방법 (둘 중 하나)

### 방법 A: pitch 파일을 index로 복사 (권장)

habitree_pr 저장소의 **메인 페이지가 readtree-pitch.html과 동일한 구조**라면:

1. **habitree_pr 저장소 클론**
   ```bash
   cd c:\Dev
   git clone https://github.com/habitree/habitree_pr.git
   cd habitree_pr
   ```

2. **현재 프로젝트의 피치 파일을 index로 복사**
   ```bash
   copy c:\Dev\readingtree\doc\vc\readtree-pitch.html c:\Dev\habitree_pr\index.html
   ```
   (또는 habitree_pr에서 사용하는 메인 HTML 파일명이 다르면 해당 파일을 덮어쓰기)

3. **커밋 후 푸시**
   ```bash
   git add index.html
   git commit -m "chore: ReadTree 현재 서비스 + Habitree 이전 버전 링크 반영"
   git push origin main
   ```

GitHub Pages가 해당 브랜치의 루트 또는 `/docs`를 사용 중이면, 위에서 복사한 파일이 사이트 루트에 오도록 맞춰 주세요.

### 방법 B: 기존 index.html에 수정만 적용

habitree_pr를 직접 수정할 때, 아래 **2. 변경 목록**을 보고 해당 문자열을 찾아 교체합니다.

---

## 2. 변경 목록 (방법 B용)

아래는 **찾을 문자열 → 바꿀 문자열**입니다.  
(실제 HTML에서는 공백/줄바꿈이 다를 수 있으니, 비슷한 부분을 찾아 수정하면 됩니다.)

### 2.1 히어로 버튼 영역

| 구분 | 찾을 내용 | 바꿀 내용 |
|------|-----------|----------|
| 메인 버튼 | `Live 서비스 보기 →` (또는 `Live 서비스 보기 &rarr;`) | `ReadTree 라이브 (현재 서비스) &rarr;` |
| 버튼 추가 | `[Git Repo →](https://github.com/habitree/readingtree)` 바로 앞에 | `[이전 버전 Habitree 체험 →](https://habitree-f49e1.web.app/) ` 를 새 버튼/링크로 추가 |

**버튼 HTML 예시 (추가할 링크):**
```html
<a href="https://habitree-f49e1.web.app/" class="btn btn-outline" target="_blank" rel="noopener">이전 버전 Habitree 체험 &rarr;</a>
```

### 2.2 히어로 부제목

| 찾을 내용 | 바꿀 내용 |
|-----------|----------|
| `1인 × Claude Code · 2개월 MVP · 라이브 서비스` | `1인 × Claude Code · 2개월 MVP · ReadTree(현재) + Habitree(이전 버전) 라이브` |

### 2.3 Repository Evolution

| 찾을 내용 | 바꿀 내용 |
|-----------|----------|
| v1 `habitree_book` 설명 | `MVP` → `MVP (Firebase)` |
| 타임라인 **아래** (없으면 새로 추가) | 한 줄 문구: **v1 라이브 체험** → [Habitree (habitree-f49e1.web.app)](https://habitree-f49e1.web.app/) · Firebase 기반 독서 관리 플랫폼, 현재도 체험 가능 |

**추가할 HTML 예시:**
```html
<p class="repo-label" style="margin-top:10px; font-size:0.6rem; letter-spacing:1.5px;">v1 라이브 체험 &rarr; <a href="https://habitree-f49e1.web.app/" target="_blank" rel="noopener" style="color:var(--primary);font-weight:700;">Habitree (habitree-f49e1.web.app)</a> &middot; Firebase 기반 독서 관리 플랫폼, 현재도 체험 가능</p>
```

(클래스명이 `repo-label`이 아니면 habitree_pr에서 쓰는 해당 섹션의 작은 글씨 스타일에 맞춰 넣으면 됩니다.)

### 2.4 Product & Traction 부제목

| 찾을 내용 | 바꿀 내용 |
|-----------|----------|
| `현재는 서비스 오픈 전 단계로, 아래 수치는...` | `ReadTree(현재)는 Vercel 배포 중이며, 이전 버전 Habitree(` + [habitree-f49e1.web.app](https://habitree-f49e1.web.app/) + `)는 Firebase 기반 독서 관리 플랫폼으로 지금도 체험 가능합니다. 아래 수치는 사용자 수나 매출이 아닌 제품·아키텍처 수준의 실행력 지표입니다.` |

**HTML 예시:**
```html
<p class="subtitle">ReadTree(현재)는 Vercel 배포 중이며, 이전 버전 Habitree(<a href="https://habitree-f49e1.web.app/" target="_blank" rel="noopener" style="color:var(--primary);font-weight:600;">habitree-f49e1.web.app</a>)는 Firebase 기반 독서 관리 플랫폼으로 지금도 체험 가능합니다. 아래 수치는 사용자 수나 매출이 아닌 제품·아키텍처 수준의 실행력 지표입니다.</p>
```

---

## 3. 적용 후 확인

- https://habitree.github.io/habitree_pr/ 새로고침
- 다음 확인:
  - 메인 CTA: "ReadTree 라이브 (현재 서비스)" → readingtree-tan.vercel.app
  - "이전 버전 Habitree 체험" 버튼/링크 → habitree-f49e1.web.app
  - 부제목에 "ReadTree(현재) + Habitree(이전 버전) 라이브" 문구
  - v1 옆에 "(Firebase)" 및 v1 라이브 체험 안내 문구
  - Product 섹션에 현재/이전 버전 설명 문단

---

## 4. 요약

| 항목 | 변경 내용 |
|------|-----------|
| 메인 라이브 버튼 | 문구를 "ReadTree 라이브 (현재 서비스)"로, URL 유지 (readingtree-tan.vercel.app) |
| 새 버튼 | "이전 버전 Habitree 체험" → https://habitree-f49e1.web.app/ |
| 부제목 | ReadTree + Habitree 라이브 문구 추가 |
| v1 | habitree_book에 (Firebase) 표기, v1 라이브 체험 문구 및 링크 추가 |
| Product | 현재 서비스(Vercel) + 이전 버전(Firebase) 설명 및 링크 추가 |

---

**작성일:** 2026-03-08
