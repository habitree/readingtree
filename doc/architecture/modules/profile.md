# Profile Module (프로필)

> **Module Key**: `profile`
> **Layer**: B. 플랫폼/지원 모듈
> **Last Updated**: 2025-01-25

---

## 1. 개요

사용자 프로필 표시 및 설정 관리를 담당하는 플랫폼 모듈입니다.

### 1.1 주요 기능

- 프로필 정보 표시/수정
- 프로필 이미지 관리
- 사용자 설정
- 계정 관리

---

## 2. 파일 구조

```
app/
├── (main)/
│   └── profile/
│       └── page.tsx
└── actions/
    └── profile.ts

components/
└── profile/
    └── profile-content.tsx
```

---

## 3. 데이터 모델

### 3.1 관련 테이블

| 테이블 | 필드 | 설명 |
|--------|------|------|
| `users` | `name` | 표시 이름 |
| `users` | `profile_image` | 프로필 이미지 URL |
| `users` | `bio` | 자기소개 (선택) |
| `users` | `reading_goal` | 독서 목표 (선택) |
| `users` | `preferences` | 사용자 설정 JSON |

### 3.2 주요 타입

```typescript
interface UserProfile {
  id: string
  email: string
  name: string | null
  profile_image: string | null
  bio: string | null
  reading_goal: number | null
  preferences: UserPreferences | null
  created_at: string
  updated_at: string
}

interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  notifications?: {
    email: boolean
    push: boolean
  }
  privacy?: {
    showProfile: boolean
    showReadingStatus: boolean
  }
}
```

---

## 4. 핵심 함수

### 4.1 Server Actions

| 함수 | 파일 | 설명 |
|------|------|------|
| `getProfile()` | `app/actions/profile.ts` | 프로필 조회 |
| `updateProfile()` | `app/actions/profile.ts` | 프로필 수정 |
| `uploadProfileImage()` | `app/actions/profile.ts` | 이미지 업로드 |
| `updatePreferences()` | `app/actions/profile.ts` | 설정 변경 |
| `deleteAccount()` | `app/actions/profile.ts` | 계정 삭제 |

---

## 5. 의존성

### 5.1 이 모듈이 사용하는 것

- `identity`: 사용자 인증 정보
- `shared`: UI 컴포넌트, 유틸리티

### 5.2 이 모듈을 사용하는 것

- `home`: 프로필 요약 표시
- `groups`: 멤버 프로필 표시
- `sharing`: 작성자 프로필 표시

---

## 6. 프로필 이미지 처리

### 6.1 업로드 흐름

```
1. 이미지 선택
   ↓
2. 클라이언트 리사이즈 (최대 500x500)
   ↓
3. Supabase Storage 업로드
   ↓
4. URL 저장
   ↓
5. 기존 이미지 삭제 (있을 경우)
```

### 6.2 Storage 경로

```
profiles/{userId}/avatar.{ext}
```

---

## 7. 설정 카테고리

| 카테고리 | 설정 항목 |
|----------|-----------|
| **외관** | 테마 (라이트/다크/시스템) |
| **알림** | 이메일 알림, 푸시 알림 |
| **개인정보** | 프로필 공개, 독서 상태 공개 |
| **계정** | 비밀번호 변경, 계정 삭제 |

---

## 8. 보안 고려사항

- 프로필 수정은 본인만 가능
- 이메일은 직접 변경 불가 (인증 필요)
- 계정 삭제 시 확인 절차 필수

---

## 9. 참고 문서

- [10-task-profile-plan.md](../../tasks/front/10-task-profile-plan.md)
