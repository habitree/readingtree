# 대시보드와 프로필 동기화 문제 해결

**작성일:** 2025년 1월  
**문제:** 대시보드와 프로필 페이지에서 프로필 정보가 제대로 표시되지 않거나 동기화되지 않음

---

## 발견된 문제

### 1. 프로필 자동 생성 불일치

**문제:**
- `getProfile()` 함수는 프로필이 없을 때 자동 생성하도록 수정됨
- 하지만 `getCurrentUserProfile()` (헤더용)은 프로필이 없을 때 `null`을 반환
- 헤더와 프로필 페이지에서 다른 결과가 나올 수 있음

**해결:**
- ✅ `getCurrentUserProfile()` 함수도 프로필이 없을 때 자동 생성하도록 수정

### 2. 헤더 프로필 정보 업데이트 지연

**문제:**
- 프로필 수정 후 헤더의 프로필 정보가 즉시 업데이트되지 않음
- `revalidatePath("/", "layout")`로 레이아웃 캐시를 무효화했지만, 클라이언트 컴포넌트의 상태는 갱신되지 않음

**해결:**
- ✅ 헤더 컴포넌트의 `useEffect`에서 프로필 조회 실패 시 상태 초기화
- 프로필 업데이트 후 페이지 새로고침 또는 라우터 리프레시 필요

---

## 수정 사항

### 1. `app/actions/profile.ts` - getCurrentUserProfile 자동 생성 추가

**변경 내용:**
```typescript
/**
 * 현재 사용자의 프로필 정보 조회 (헤더용)
 * 클라이언트 컴포넌트에서 사용 가능
 * 프로필이 없으면 자동 생성
 * @returns 사용자 프로필 정보 (id, name, avatar_url) 또는 null
 */
export async function getCurrentUserProfile() {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // 프로필 조회
  let { data, error } = await supabase
    .from("users")
    .select("id, name, avatar_url")
    .eq("id", user.id)
    .single();

  // 프로필이 없으면 자동 생성
  if (error && error.code === "PGRST116") {
    const defaultName = user.user_metadata?.name || user.email?.split("@")[0] || "사용자";
    const { data: newProfile, error: insertError } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        name: defaultName,
        reading_goal: 12, // 기본값
      })
      .select("id, name, avatar_url")
      .single();

    if (insertError || !newProfile) {
      console.error("프로필 자동 생성 실패:", insertError);
      return null;
    }

    return newProfile;
  }

  if (error || !data) {
    return null;
  }

  return data;
}
```

### 2. `components/layout/header.tsx` - 프로필 조회 오류 처리 개선

**변경 내용:**
```typescript
// 사용자 프로필 정보 가져오기
useEffect(() => {
  if (user) {
    getCurrentUserProfile()
      .then((profile) => {
        if (profile) {
          setUserProfile(profile);
        } else {
          // 프로필이 없으면 초기화 (다시 시도)
          setUserProfile(null);
        }
      })
      .catch((error) => {
        console.error("프로필 조회 오류:", error);
        setUserProfile(null);
      });
  } else {
    setUserProfile(null);
  }
}, [user]);
```

---

## 추가 개선 사항

### 프로필 업데이트 후 헤더 새로고침

프로필 수정 후 헤더가 자동으로 업데이트되도록 하려면:

1. **프로필 폼에서 업데이트 후 라우터 리프레시**
   - `router.refresh()` 호출 (이미 구현됨)

2. **헤더 컴포넌트에서 경로 변경 감지**
   - `usePathname()` 훅 사용하여 프로필 페이지에서 돌아올 때 프로필 정보 다시 조회

---

## 검증 방법

### 1. 프로필 자동 생성 테스트

1. 새 사용자로 로그인
2. 헤더의 프로필 이미지 확인
3. 프로필 페이지 접근
4. 프로필이 자동으로 생성되었는지 확인

### 2. 프로필 업데이트 동기화 테스트

1. 프로필 수정 (이름, 독서 목표)
2. 저장 후 대시보드로 이동
3. 헤더의 프로필 정보가 업데이트되었는지 확인
4. 대시보드의 목표 진행률이 업데이트되었는지 확인

### 3. 프로필 이미지 업데이트 테스트

1. 프로필 이미지 업로드
2. 헤더의 프로필 이미지가 업데이트되었는지 확인
3. 프로필 페이지의 이미지가 업데이트되었는지 확인

---

## 완료 체크리스트

- [x] `getCurrentUserProfile()` 함수에 프로필 자동 생성 로직 추가
- [x] 헤더 컴포넌트의 프로필 조회 오류 처리 개선
- [ ] 프로필 자동 생성 테스트
- [ ] 프로필 업데이트 동기화 테스트
- [ ] 프로필 이미지 업데이트 테스트

---

**작성자:** AI Assistant  
**최종 수정일:** 2025년 1월
