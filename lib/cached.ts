import { cache } from "react";
import { getCurrentUser } from "@/app/actions/auth";
import { getCurrentUserProfile } from "@/app/actions/profile";
import { getPersonaDashboardData } from "@/app/actions/persona";
import { getReadingStats, getStreakAndTodayData } from "@/app/actions/stats";
import { getPointsDashboardData } from "@/app/actions/points";
import { checkHasFirstNote } from "@/app/actions/onboarding";

/**
 * React cache() 래퍼 - 동일 렌더 트리(요청) 내 중복 호출 제거
 *
 * 대시보드에서 GuestBanner, HomeHeroWrapper, TertiaryZoneWrapper가
 * 각각 getCurrentUser()를 호출하므로 cache()로 1회로 통합
 */
export const getCachedCurrentUser = cache(getCurrentUser);

/**
 * getCurrentUserProfile를 cache()로 래핑
 * 동일 요청 내에서 여러 서버 컴포넌트가 프로필을 필요로 할 때 중복 쿼리 방지
 */
export const getCachedCurrentUserProfile = cache(getCurrentUserProfile);

/**
 * getPersonaDashboardData를 cache()로 래핑
 *
 * HomeHeroWrapper와 TertiaryZoneWrapper에서 각각 호출하므로
 * cache()로 1회로 통합
 */
export const getCachedPersonaDashboardData = cache(getPersonaDashboardData);

/** getReadingStats — HomeHeroWrapper + RecentBooksSection에서 중복 호출 제거 */
export const getCachedReadingStats = cache(getReadingStats);

/** getStreakAndTodayData — 동일 요청 내 중복 제거 */
export const getCachedStreakAndTodayData = cache(getStreakAndTodayData);

/** getPointsDashboardData — 동일 요청 내 중복 제거 */
export const getCachedPointsDashboardData = cache(getPointsDashboardData);

/** checkHasFirstNote — 동일 요청 내 중복 제거 */
export const getCachedCheckHasFirstNote = cache(checkHasFirstNote);
