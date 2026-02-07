import { cache } from "react";
import { getCurrentUser } from "@/app/actions/auth";
import { getPersonaDashboardData } from "@/app/actions/persona";

/**
 * React cache() 래퍼 - 동일 렌더 트리(요청) 내 중복 호출 제거
 *
 * 대시보드에서 GuestBanner, HomeHeroWrapper, TertiaryZoneWrapper가
 * 각각 getCurrentUser()를 호출하므로 cache()로 1회로 통합
 */
export const getCachedCurrentUser = cache(getCurrentUser);

/**
 * getPersonaDashboardData를 cache()로 래핑
 *
 * HomeHeroWrapper와 TertiaryZoneWrapper에서 각각 호출하므로
 * cache()로 1회로 통합
 */
export const getCachedPersonaDashboardData = cache(getPersonaDashboardData);
