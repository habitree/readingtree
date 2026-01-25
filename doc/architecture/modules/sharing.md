# Sharing Module (공유/발행)

> **Module Key**: `sharing`
> **Layer**: A. 도메인 모듈
> **Last Updated**: 2025-01-25

---

## 1. 개요

노트, 책 등의 콘텐츠를 외부에 공유하는 기능을 담당하는 도메인 모듈입니다.

### 1.1 주요 기능

- 공유 링크 생성
- 공개 범위 설정 (공개/비공개)
- 공유 페이지 렌더링
- 공유 권한 관리

---

## 2. 파일 구조

```
app/
├── share/
│   └── notes/
│       └── [id]/page.tsx
└── actions/
    └── share.ts

components/
└── share/
    └── share-note-card.tsx
```

---

## 3. 데이터 모델

### 3.1 관련 필드

공유 기능은 별도 테이블 없이 기존 테이블의 필드를 활용합니다:

| 테이블 | 필드 | 설명 |
|--------|------|------|
| `notes` | `is_public` | 공개 여부 |
| `notes` | `share_token` | 공유 토큰 (선택) |

### 3.2 주요 타입

```typescript
interface ShareSettings {
  isPublic: boolean
  shareToken?: string
  expiresAt?: string
}

interface SharedNote {
  id: string
  title: string | null
  content: string
  note_type: string
  book?: {
    id: string
    title: string
    author: string | null
    cover_image: string | null
  }
  user: {
    name: string | null
    profile_image: string | null
  }
  created_at: string
}
```

---

## 4. 핵심 함수

### 4.1 Server Actions

| 함수 | 파일 | 설명 |
|------|------|------|
| `getSharedNote()` | `app/actions/share.ts` | 공유된 노트 조회 |
| `toggleNotePublic()` | `app/actions/share.ts` | 노트 공개 토글 |
| `generateShareLink()` | `app/actions/share.ts` | 공유 링크 생성 |

---

## 5. 의존성

### 5.1 이 모듈이 사용하는 것

- `identity`: 사용자 확인 (작성자 정보)
- `library`: 책 정보 표시
- `records`: 노트 정보 참조
- `groups`: 그룹 정보 (그룹 공유 시)
- `shared`: UI 컴포넌트, 유틸리티

### 5.2 이 모듈을 사용하는 것

- `home`: 공유 활동 표시 (선택적)

---

## 6. 공유 URL 구조

```
/share/notes/{noteId}
```

### 6.1 공개 노트 접근 흐름

```
1. 공유 URL 접근
   ↓
2. is_public 확인
   ↓
3. 공개 노트: 내용 표시
   비공개 노트: 접근 거부
```

---

## 7. 보안 고려사항

### 7.1 RLS 정책

```sql
-- 공개 노트는 누구나 조회 가능
CREATE POLICY "Public notes viewable by anyone" ON notes
  FOR SELECT
  USING (is_public = true);

-- 본인 노트는 항상 조회 가능
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT
  USING (auth.uid() = user_id);
```

### 7.2 정보 노출 제한

- 작성자 이름/프로필만 표시 (이메일 제외)
- 민감 정보 필터링

---

## 8. 참고 문서

- [07-task-share-plan.md](../../tasks/front/07-task-share-plan.md)
