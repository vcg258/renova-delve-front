import axios from 'axios';
import { api, setAccessToken } from './client';
import type { MemberInfo } from './types';

export async function login(loginId: string, password: string): Promise<void> {
  // 로그인 필터는 인터셉터 없이 직접 호출
  const res = await axios.post('/api/auth/login', { loginId, password }, { withCredentials: true });
  const token = res.data?.accessToken;
  if (!token) throw new Error('로그인 응답에 토큰이 없습니다.');
  setAccessToken(token);
}

export async function signup(loginId: string, password: string): Promise<void> {
  await axios.post('/api/auth/signup', { loginId, password });
}

export async function logout(): Promise<void> {
  try {
    await axios.post('/api/auth/logout', {}, { withCredentials: true });
  } finally {
    setAccessToken(null);
  }
}

export async function fetchMe(): Promise<MemberInfo> {
  const res = await api.get<MemberInfo>('/member/me');
  return res.data;
}
