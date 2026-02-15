# 보도자료(프레스킷) 페이지 수정 가이드

> 대상: https://habitree.github.io/habitree_pr/#press-release  
> 수정 요청: 베타 테스트 삭제, 둘러보기 링크를 현재 서비스 URL로 변경

---

## 1. 수정 요약

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 베타 테스트 | "베타 테스트 신청하기" 버튼/문구 있음 | **삭제** |
| 둘러보기 링크 | `https://readingtree2-0.vercel.app/` | `https://readingtree-tan.vercel.app/` |
| 문구 | "지금 베타 테스트를 신청하고..." | "지금 Readtree를 둘러보세요." 등으로 정리 (베타 문구 제거) |

---

## 2. 적용 위치

**habitree_pr** 저장소(GitHub Pages)의 보도자료 섹션에서 다음 블록을 찾아 수정합니다.

- **찾을 문구**: `2026년 1월, 무료로 시작하세요`, `베타 테스트를 신청하고`, `둘러보기`
- **링크**: `readingtree2-0.vercel.app` → `readingtree-tan.vercel.app` 로 일괄 변경

---

## 3. 교체용 콘텐츠 (복사해서 사용)

### 3.1 마크다운 사용 시

**삭제할 문장**
```text
지금 베타 테스트를 신청하고 가장 먼저 Readtree 독서플랫폼을 만나보세요.
[베타 테스트 신청하기](mailto:...) [둘러보기](https://readingtree2-0.vercel.app/)
```

**교체 문구**
```markdown
지금 Readtree 독서플랫폼을 무료로 이용해 보세요.

[둘러보기](https://readingtree-tan.vercel.app/)
```

### 3.2 HTML 사용 시

**둘러보기 링크만 바꾸는 경우**
```html
<a href="https://readingtree-tan.vercel.app/" target="_blank" rel="noopener">둘러보기</a>
```

**베타 테스트 버튼 제거 후**
- "베타 테스트 신청하기" 버튼/링크 요소 전체 삭제
- "둘러보기" 버튼의 `href`를 `https://readingtree-tan.vercel.app/` 로 변경

---

## 4. habitree_pr 저장소에서 할 일

1. `https://github.com/habitree/habitree_pr` 클론 또는 웹에서 편집
2. 보도자료 섹션(또는 `#press-release` 해당 파일) 열기
3. 위 **3. 교체용 콘텐츠** 적용
4. 커밋 후 푸시 → GitHub Pages 자동 반영

---

## 5. 이 프로젝트(readingtree_v4.0.0) 쪽

- **헤더 "새로운 소식" 링크**: 계속 `https://habitree.github.io/habitree_pr/#press-release` 로 연결되어 있음 (변경 없음).
- 프레스킷 페이지를 수정한 뒤, 방문자가 "둘러보기"를 누르면 **https://readingtree-tan.vercel.app/** 로 이동하게 됨.

---

**작성일**: 2026-02-15
