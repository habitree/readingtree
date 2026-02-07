"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { signInWithKakao, signInWithGoogle, signOut as serverSignOut } from "@/app/actions/auth";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (provider: "kakao" | "google") => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: User | null; // 서버에서 받은 초기 사용자 정보
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 인증 Context Provider
 * 성능 최적화: 루트 레이아웃에서 중복 세션 조회를 제거하고, onAuthStateChange로 세션 동기화
 * 
 * 규칙: 서버 중심 세션 관리
 * - 미들웨어에서 이미 세션을 갱신하므로, onAuthStateChange로 세션 정보를 읽음
 * - 초기 사용자 정보는 서버에서 받은 것을 사용 (없으면 null)
 * - 로그인/로그아웃은 서버 액션으로만 처리
 */
export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser); // 초기 사용자 정보가 없으면 로딩 상태
  
  // Supabase 클라이언트를 메모이제이션하여 HMR 시 재생성 방지
  const supabase = useMemo(() => createClient(), []);
  
  // initialUser 변경 추적을 위한 ref
  const initialUserRef = useRef(initialUser);
  
  // initialUser가 변경된 경우에만 상태 업데이트
  useEffect(() => {
    if (initialUserRef.current !== initialUser) {
      initialUserRef.current = initialUser;
      setUser(initialUser);
      setIsLoading(!initialUser);
    }
  }, [initialUser]);

  // 인증 상태 변경 감지 (서버 세션과 동기화)
  // HMR 시 재구독을 방지하기 위해 supabase를 의존성에서 제거하고 ref 사용
  useEffect(() => {
    // 미들웨어에서 이미 세션을 갱신했으므로, onAuthStateChange가 즉시 세션 정보를 제공
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      // 서버 세션과 동기화
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // supabase는 메모이제이션되어 있으므로 의존성에서 제거

  const signIn = useCallback(async (provider: "kakao" | "google") => {
    // 서버 액션 호출
    if (provider === "kakao") {
      await signInWithKakao();
    } else {
      await signInWithGoogle();
    }
    // redirect()가 호출되므로 여기까지 도달하지 않음
  }, []);

  const signOut = useCallback(async () => {
    // 서버 액션 호출
    await serverSignOut();
    // redirect()가 호출되므로 여기까지 도달하지 않음
    // 하지만 안전을 위해 상태도 업데이트
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isLoading, signIn, signOut }), [user, isLoading, signIn, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 인증 Context를 사용하는 커스텀 훅
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

