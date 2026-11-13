import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * AccessToken은 메모리에만 보관 (XSS 대비, README 설계 그대로).
 * RefreshToken은 httpOnly 쿠키로 서버가 관리한다.
 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 90_000, // AI 서사 생성이 길어질 수 있어 넉넉히 (무한 대기 방지)
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

/**
 * RefreshToken 쿠키로 AccessToken 재발급.
 * 새로고침 직후(메모리 토큰 소실)에도 세션을 복원한다.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = axios
      .post('/api/auth/refresh', { accessToken }, { withCredentials: true })
      .then((res) => {
        const token = (res.data && res.data.accessToken) || null;
        setAccessToken(token);
        return token;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// 401/403 -> 토큰 재발급 후 1회 재시도. 재발급까지 실패하면 세션 만료 -> 로그인 화면으로.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    if (original && !original._retried && (status === 401 || status === 403)) {
      original._retried = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api.request(original);
      }
      // 세션이 완전히 만료됨 -> 로그인 화면으로 (무한 루프 방지)
      if (!['/auth', '/recover', '/reset-password'].some((path) => window.location.pathname.startsWith(path))) {
        window.location.assign('/auth?expired=1');
      }
    }
    return Promise.reject(error);
  },
);

/** 에러 응답에서 사람이 읽을 메시지 추출 */
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    let message = '';
    if (typeof data === 'string' && data.trim()) message = data;
    else if (data && typeof data === 'object' && 'error' in data) message = String((data as { error: string }).error);

    if (message.includes('인증이 필요')) return '세션이 만료되었습니다. 다시 로그인해주세요.';
    if (message) return message;
    if (err.response?.status === 401) return '세션이 만료되었습니다. 다시 로그인해주세요.';
    if (err.response?.status === 404) return '요청한 대상을 찾을 수 없습니다.';
  }
  return '요청 처리 중 오류가 발생했습니다.';
}
