import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { refreshAccessToken } from '../api/client';
import { fetchMe, logout as apiLogout } from '../api/auth';
import type { MemberInfo } from '../api/types';

interface AuthContextValue {
  member: MemberInfo | null;
  loading: boolean;
  setMember: (member: MemberInfo | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  member: null,
  loading: true,
  setMember: () => {},
  signOut: async () => {},
});

/**
 * 앱 시작 시 RefreshToken 쿠키로 세션 복원을 시도한다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await refreshAccessToken();
        if (token) {
          setMember(await fetchMe());
        }
      } catch {
        setMember(null);
      } finally {
        setLoading(false);
      }
    })();

    // AccessToken 만료(30분) 전에 선제 재발급 -> 게임 도중 "인증 필요" 끊김 방지
    const timer = setInterval(() => {
      refreshAccessToken().catch(() => {});
    }, 20 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const signOut = async () => {
    await apiLogout();
    setMember(null);
  };

  return (
    <AuthContext.Provider value={{ member, loading, setMember, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
