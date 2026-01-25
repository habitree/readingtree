# Admin Module (관리자)

> **Module Key**: `admin`
> **Layer**: B. 플랫폼/지원 모듈
> **Last Updated**: 2025-01-25

---

## 1. 개요

운영자 기능을 담당하는 플랫폼 모듈입니다. 시스템 통계, OCR 관리, AI 설정 등을 포함합니다.

### 1.1 주요 기능

- 대시보드 통계
- OCR 배치 처리
- AI 설정 관리
- 사용자/콘텐츠 관리 (향후)

---

## 2. 파일 구조

```
app/
├── (main)/
│   └── admin/
│       └── page.tsx
├── actions/
│   └── admin.ts
└── api/
    └── admin/

components/
└── admin/
    ├── admin-dashboard.tsx
    ├── admin-stats-card.tsx
    ├── ai-settings-panel.tsx
    ├── batch-ocr-button.tsx
    └── batch-ocr-progress-dialog.tsx
```

---

## 3. 권한 체계

### 3.1 관리자 판별

```typescript
// 관리자 여부 확인
async function isAdmin(userId: string): Promise<boolean> {
  // 방법 1: users 테이블의 role 필드
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return data?.role === 'admin'
}
```

### 3.2 접근 제어

```typescript
// 관리자 전용 페이지 보호
export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user || !await isAdmin(user.id)) {
    redirect('/') // 또는 403 페이지
  }
  // ...
}
```

---

## 4. 핵심 함수

### 4.1 Server Actions

| 함수 | 파일 | 설명 |
|------|------|------|
| `getAdminStats()` | `app/actions/admin.ts` | 전체 통계 조회 |
| `getAllUsers()` | `app/actions/admin.ts` | 사용자 목록 |
| `getAllNotes()` | `app/actions/admin.ts` | 노트 목록 |
| `runBatchOCR()` | `app/actions/admin.ts` | OCR 배치 처리 |
| `updateAISettings()` | `app/actions/admin.ts` | AI 설정 변경 |

---

## 5. 의존성

### 5.1 이 모듈이 사용하는 것

- `identity`: 관리자 인증
- `library`: 책 통계
- `records`: 노트 통계, OCR 관리
- `groups`: 그룹 통계
- `ai`: AI 설정
- `shared`: UI 컴포넌트, 유틸리티

### 5.2 이 모듈을 사용하는 것

- 없음 (최상위 관리 모듈)

---

## 6. 대시보드 통계

### 6.1 표시 항목

| 항목 | 설명 |
|------|------|
| 총 사용자 | 가입자 수 |
| 총 책 | 등록된 책 수 |
| 총 노트 | 작성된 노트 수 |
| 총 그룹 | 생성된 그룹 수 |
| 일간 활성 사용자 | 당일 로그인 사용자 |
| OCR 사용량 | 월간 OCR 처리 건수 |

### 6.2 통계 쿼리 예시

```typescript
async function getAdminStats() {
  const [users, books, notes, groups] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('books').select('id', { count: 'exact', head: true }),
    supabase.from('notes').select('id', { count: 'exact', head: true }),
    supabase.from('groups').select('id', { count: 'exact', head: true }),
  ])

  return {
    totalUsers: users.count,
    totalBooks: books.count,
    totalNotes: notes.count,
    totalGroups: groups.count,
  }
}
```

---

## 7. OCR 배치 처리

### 7.1 처리 흐름

```
1. 배치 처리 시작
   ↓
2. pending 상태 노트 조회
   ↓
3. 각 노트에 대해 OCR 처리
   ↓
4. 진행률 업데이트
   ↓
5. 완료/실패 결과 저장
```

### 7.2 진행률 UI

```typescript
interface BatchOCRProgress {
  total: number
  processed: number
  succeeded: number
  failed: number
  status: 'idle' | 'running' | 'completed' | 'error'
}
```

---

## 8. RLS 정책

```sql
-- 관리자는 모든 데이터 조회 가능
CREATE POLICY "Admins can view all data" ON notes
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );
```

---

## 9. 보안 고려사항

- 관리자 권한 변경은 DB 직접 수정만 가능
- 모든 관리자 액션 로깅 (향후)
- 민감 데이터 마스킹

---

## 10. 참고 문서

- [migration-202501021500__admin__add_admin_rls_policies.sql](../../database/migration-202501021500__admin__add_admin_rls_policies.sql)
