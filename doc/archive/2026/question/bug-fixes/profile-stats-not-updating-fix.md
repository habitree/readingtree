# 프로필과 통계 기록 반영 문제 해결

**작성일:** 2025년 1월  
**문제:** 프로필 수정 및 통계 기록이 화면에 반영되지 않음

---

## 발견된 문제

### 1. 프로필이 없을 때 자동 생성되지 않음

**문제:**
- 사용자가 로그인했지만 `users` 테이블에 프로필이 없는 경우
- `getProfile()` 함수가 에러를 던져서 프로필 페이지가 표시되지 않음
- 트리거가 실행되지 않았거나, 프로필 생성 로직이 없을 수 있음

**해결:**
- ✅ `getProfile()` 함수에 프로필 자동 생성 로직 추가
- 프로필이 없으면 기본값으로 자동 생성

### 2. 프로필 업데이트 후 캐시 무효화 부족

**문제:**
- 프로필 수정 후 `revalidatePath`로 캐시를 무효화하지만 레이아웃 캐시는 무효화되지 않음
- 헤더의 프로필 정보가 업데이트되지 않을 수 있음

**해결:**
- ✅ `revalidatePath("/", "layout")` 추가하여 레이아웃 캐시도 무효화

### 3. 통계 데이터 조회 오류 처리 부족

**문제:**
- `getMonthlyStats()` 함수에서 쿼리 오류가 발생해도 빈 배열을 반환
- 오류 로그가 없어서 디버깅이 어려움

**해결:**
- ✅ 각 월별 쿼리에 try-catch 추가
- 오류 발생 시 로그 출력 및 0으로 처리

### 4. 월별 통계 빈 데이터 처리 개선

**문제:**
- `MonthlyChart` 컴포넌트가 빈 데이터일 때 `null`을 반환
- 부모 컴포넌트에서 빈 상태 메시지가 표시되어야 하지만, 데이터가 있는데도 count가 0인 경우 처리 부족

**해결:**
- ✅ `dashboard-content.tsx`에서 실제로 count > 0인 항목이 있는지 확인
- 게스트 사용자에게 로그인 유도 메시지 추가

---

## 수정 사항

### 1. `app/actions/profile.ts` - 프로필 자동 생성

**변경 내용:**
```typescript
// 프로필 조회
let { data, error } = await supabase
  .from("users")
  .select("*")
  .eq("id", user.id)
  .single();

// 프로필이 없으면 자동 생성
if (error && error.code === "PGRST116") {
  // 프로필이 없는 경우 자동 생성
  const defaultName = user.user_metadata?.name || user.email?.split("@")[0] || "사용자";
  const { data: newProfile, error: insertError } = await supabase
    .from("users")
    .insert({
      id: user.id,
      email: user.email,
      name: defaultName,
      reading_goal: 12, // 기본값
    })
    .select()
    .single();

  if (insertError || !newProfile) {
    throw new Error(`프로필 생성 실패: ${insertError?.message || "프로필을 생성할 수 없습니다."}`);
  }

  return newProfile;
}
```

### 2. `app/actions/profile.ts` - 캐시 무효화 강화

**변경 내용:**
```typescript
// 프로필 업데이트 후 관련 페이지 캐시 무효화
revalidatePath("/profile");
revalidatePath("/");
revalidatePath("/dashboard");
revalidatePath("/", "layout"); // 레이아웃 캐시도 무효화
```

### 3. `app/actions/stats.ts` - 오류 처리 개선

**변경 내용:**
```typescript
// 모든 쿼리를 병렬 실행
const results = await Promise.all(
  monthQueries.map(async ({ month, query }) => {
    try {
      const { count, error } = await query;
      if (error) {
        console.error(`월별 통계 조회 오류 (${month}):`, error);
        return { month, count: 0 };
      }
      return { month, count: count || 0 };
    } catch (error) {
      console.error(`월별 통계 조회 예외 (${month}):`, error);
      return { month, count: 0 };
    }
  })
);
```

### 4. `components/dashboard/dashboard-content.tsx` - 빈 데이터 처리 개선

**변경 내용:**
```typescript
{(() => {
  // 데이터가 있고 실제로 count > 0인 항목이 있는지 확인
  const hasValidData = monthly.some((item) => item.count > 0);
  
  if (hasValidData) {
    return <MonthlyChart data={monthly} />;
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
      {/* 빈 상태 메시지 */}
      {isGuest && (
        <Button asChild variant="outline" className="mt-4">
          <Link href="/login">로그인하기</Link>
        </Button>
      )}
    </div>
  );
})()}
```

---

## 검증 방법

### 1. 프로필 자동 생성 테스트

1. 새 사용자로 로그인
2. 프로필 페이지 접근
3. 프로필이 자동으로 생성되는지 확인
4. 기본값(name, reading_goal)이 올바르게 설정되었는지 확인

### 2. 프로필 업데이트 반영 테스트

1. 프로필 수정 (이름, 독서 목표)
2. 저장 후 대시보드로 이동
3. 헤더의 프로필 정보가 업데이트되었는지 확인
4. 대시보드의 목표 진행률이 업데이트되었는지 확인

### 3. 통계 데이터 표시 테스트

1. 기록이 있는 사용자로 로그인
2. 대시보드에서 월별 통계 차트 확인
3. 기록이 없는 사용자로 로그인
4. 빈 상태 메시지가 올바르게 표시되는지 확인

---

## 추가 확인 사항

### 1. RLS 정책 확인

프로필 자동 생성이 작동하려면 `users` 테이블에 INSERT 정책이 있어야 합니다:

```sql
-- users 테이블 INSERT 정책 확인
SELECT * FROM pg_policies 
WHERE tablename = 'users' AND policyname = 'Users can insert own profile';
```

### 2. 트리거 확인

`auth.users`에 새 사용자가 생성될 때 `public.users`에 프로필을 자동 생성하는 트리거가 있는지 확인:

```sql
-- 트리거 확인
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

### 3. 데이터베이스 함수 확인

월별 통계 조회에 사용되는 데이터베이스 함수가 올바르게 작동하는지 확인:

```sql
-- 함수 확인
SELECT * FROM pg_proc 
WHERE proname LIKE '%notes_count%' OR proname LIKE '%completed_books%';
```

---

## 완료 체크리스트

- [x] 프로필 자동 생성 로직 추가
- [x] 프로필 업데이트 후 캐시 무효화 강화
- [x] 통계 데이터 조회 오류 처리 개선
- [x] 월별 통계 빈 데이터 처리 개선
- [ ] 프로필 자동 생성 테스트
- [ ] 프로필 업데이트 반영 테스트
- [ ] 통계 데이터 표시 테스트
- [ ] RLS 정책 확인
- [ ] 트리거 확인

---

**작성자:** AI Assistant  
**최종 수정일:** 2025년 1월
