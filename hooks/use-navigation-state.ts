import { create } from "zustand";

interface NavigationState {
  /** 현재 네비게이션 진행 중 여부 */
  isNavigating: boolean;
  /** 이동 목표 경로 */
  targetPath: string | null;
  /** 네비게이션 시작 */
  startNavigation: (path: string) => void;
  /** 네비게이션 종료 */
  endNavigation: () => void;
}

/**
 * 전역 네비게이션 상태 관리 훅
 * Zustand를 사용하여 페이지 전환 상태를 전역으로 관리
 */
export const useNavigationState = create<NavigationState>((set) => ({
  isNavigating: false,
  targetPath: null,

  startNavigation: (path: string) => {
    set({ isNavigating: true, targetPath: path });
    // 전역 이벤트 발생 (NavigationProgress 등에서 사용)
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("navigation-start", { detail: { path } })
      );
    }
  },

  endNavigation: () => {
    set({ isNavigating: false, targetPath: null });
  },
}));
