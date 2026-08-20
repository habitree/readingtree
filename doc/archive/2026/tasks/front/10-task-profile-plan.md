# TASK-10: 프로필 관리

**작업 ID:** TASK-10  
**우선순위:** P1 (Should Have)  
**예상 소요 시간:** 1일  
**의존성:** TASK-01, TASK-02, TASK-03  
**다음 작업:** 없음

---

## 작업 개요

프로필 조회, 수정, 프로필 이미지 업로드, 독서 목표 수정 기능을 구현합니다.

---

## 작업 범위

### 포함 사항
- ✅ 프로필 조회
- ✅ 프로필 수정
- ✅ 프로필 이미지 업로드
- ✅ 독서 목표 수정

### 제외 사항
- ❌ 인증 로직 (TASK-03)
- ❌ 다른 기능

---

## 상세 작업 목록

### 1. 프로필 페이지

**파일:**
- `app/(main)/profile/page.tsx` - 프로필 페이지

**기능:**
- 프로필 정보 표시
- 프로필 수정 폼
- 프로필 이미지 업로드
- 독서 목표 수정

### 2. 프로필 컴포넌트 (필요시)

**파일:**
- `components/profile/profile-form.tsx` - 프로필 수정 폼

### 3. Server Actions

**파일:**
- `app/actions/profile.ts` - 프로필 관련 Server Actions

**기능:**
- 프로필 조회
- 프로필 수정
- 프로필 이미지 업로드
- 독서 목표 수정

---

## 파일 구조

```
app/
└── (main)/
    └── profile/
        └── page.tsx

components/
└── profile/
    └── profile-form.tsx      # 필요시

app/
└── actions/
    └── profile.ts
```

---

## API 인터페이스

### Server Actions

```typescript
// app/actions/profile.ts
export async function getProfile() {
  // 프로필 조회
}

export async function updateProfile(data: {
  name?: string;
  reading_goal?: number;
}) {
  // 프로필 수정
}

export async function updateProfileImage(imageFile: File) {
  // 프로필 이미지 업로드
  // Supabase Storage에 업로드 후 URL 반환
}
```

---

## 사용자 스토리 매핑

- US-005: 프로필 관리

---

## 검증 체크리스트

- [x] 프로필 조회가 정상 작동함
- [x] 프로필 수정이 정상 작동함
- [x] 프로필 이미지 업로드가 정상 작동함
- [x] 독서 목표 수정이 정상 작동함
- [x] 이미지 파일 크기 제한이 정상 작동함 (최대 2MB)
- [x] 이미지 형식 제한이 정상 작동함 (jpg, png, webp)

---

## 개발 프롬프트

```
다음 문서들을 참고하여 프로필 관리 기능을 구현해주세요.

참고 문서:
- doc/user_stories.md (US-005)
- doc/software_design.md (4.2.1 Users)
- doc/Habitree-Reading-Hub-PRD.md (4.1.1 사용자 인증 및 온보딩)

작업 내용:
1. 프로필 페이지 구현:
   - 프로필 정보 표시
   - 프로필 수정 폼
   - 프로필 이미지 업로드
   - 독서 목표 수정
2. Server Actions 구현:
   - 프로필 조회
   - 프로필 수정
   - 프로필 이미지 업로드 (Supabase Storage)
   - 독서 목표 수정

주의사항:
- 프로필 이미지는 Supabase Storage에 저장
- 파일 크기 제한: 최대 2MB
- 이미지 형식: jpg, png, webp
- 프로필 수정 시 즉시 반영
- 저장 성공 시 알림 메시지 표시

완료 후:
- 각 함수에 JSDoc 주석 추가
- 에러 처리 로직 추가
- 로딩 상태 처리
```

---

## 참고 문서

### 필수 참고
- [user_stories.md](../../user_stories.md) - US-005
- [software_design.md](../../software_design.md) - 4.2.1 Users
- [Habitree-Reading-Hub-PRD.md](../../Habitree-Reading-Hub-PRD.md) - 4.1.1 사용자 인증

### 추가 참고
- [Supabase Storage 문서](https://supabase.com/docs/guides/storage)

---

**문서 끝**

