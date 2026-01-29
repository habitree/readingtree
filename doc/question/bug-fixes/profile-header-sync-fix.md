# 프로필 수정 후 헤더 동기화 문제 해결

**작성일:** 2025년 1월  
**문제:** 프로필 수정 후 헤더의 프로필 정보가 즉시 업데이트되지 않음

---

## 발견된 문제

### 1. 프로필 수정 후 헤더 갱신 지연

**문제:**
- 프로필 수정 후 `router.refresh()`만으로는 클라이언트 컴포넌트인 헤더가 갱신되지 않음
- 헤더의 `useEffect`가 `pathname` 변경 시에만 실행되므로, 같은 페이지에서 수정할 때는 갱신되지 않음

**해결:**
- ✅ 프로필 수정 후 `window.location.reload()` 추가하여 강제 새로고침
- ✅ 헤더 컴포넌트에서 프로필 페이지에서 다른 페이지로 이동할 때 프로필 정보 갱신

---

## 수정 사항

### 1. `components/profile/profile-form.tsx` - 프로필 수정 후 강제 새로고침

**변경 내용:**
```typescript
try {
  await updateProfile({
    name: formData.name,
    reading_goal: formData.reading_goal,
  });

  toast.success("프로필이 수정되었습니다.");
  // 프로필 수정 후 페이지 새로고침하여 헤더도 갱신
  router.refresh();
  // 약간의 지연 후 다시 새로고침하여 헤더 컴포넌트의 useEffect가 실행되도록 함
  setTimeout(() => {
    window.location.reload();
  }, 100);
} catch (error) {
  // ...
}
```

### 2. `components/layout/header.tsx` - 프로필 페이지 이동 시 갱신

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
}, [user, pathname]);

// 프로필 페이지에서 돌아올 때 강제로 프로필 정보 갱신
useEffect(() => {
  if (user && pathname !== "/profile") {
    // 프로필 페이지가 아닌 다른 페이지로 이동할 때 프로필 정보 갱신
    getCurrentUserProfile()
      .then((profile) => {
        if (profile) {
          setUserProfile(profile);
        }
      })
      .catch((error) => {
        console.error("프로필 갱신 오류:", error);
      });
  }
}, [pathname, user]); // pathname이 변경될 때마다 실행
```

---

## 검증 방법

### 1. 프로필 수정 후 헤더 갱신 테스트

1. 프로필 페이지에서 이름 수정 (예: "NTL" → "최동혁")
2. 저장 버튼 클릭
3. 페이지 새로고침 확인
4. 헤더의 프로필 이미지/이름이 업데이트되었는지 확인

### 2. 프로필 이미지 업로드 후 헤더 갱신 테스트

1. 프로필 이미지 업로드
2. 저장 후 페이지 새로고침 확인
3. 헤더의 프로필 이미지가 업데이트되었는지 확인

### 3. 대시보드 목표 진행률 갱신 테스트

1. 프로필에서 독서 목표 수정 (예: 100 → 50)
2. 저장 후 대시보드로 이동
3. 목표 진행률이 업데이트되었는지 확인

---

## 완료 체크리스트

- [x] 프로필 수정 후 강제 새로고침 추가
- [x] 프로필 이미지 업로드 후 강제 새로고침 추가
- [x] 헤더 컴포넌트에서 프로필 페이지 이동 시 갱신 로직 추가
- [ ] 프로필 수정 후 헤더 갱신 테스트
- [ ] 프로필 이미지 업로드 후 헤더 갱신 테스트
- [ ] 대시보드 목표 진행률 갱신 테스트

---

**작성자:** AI Assistant  
**최종 수정일:** 2025년 1월
