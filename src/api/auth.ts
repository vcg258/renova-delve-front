import axios from 'axios';
import { api, setAccessToken } from './client';
import type { MemberInfo } from './types';

export interface LoginResult {
  accessToken: string;
  loginId: string;
  nickname: string;
  role: string;
}

export async function login(loginId: string, password: string): Promise<LoginResult> {
  // 로그인 필터는 인터셉터 없이 직접 호출
  const res = await axios.post<LoginResult>('/api/auth/login', { loginId, password }, { withCredentials: true });
  const token = res.data?.accessToken;
  if (!token) throw new Error('로그인 응답에 토큰이 없습니다.');
  setAccessToken(token);
  return res.data;
}

export interface SignupConsent {
  agreeTerms: boolean;
  agreePrivacy: boolean;
  ageConfirmed: boolean;
}

export async function signup(loginId: string, password: string, nickname: string, consent: SignupConsent): Promise<void> {
  await axios.post('/api/auth/signup', { loginId, password, nickname, ...consent });
}

/** 내 정보 내려받기 (서비스가 보관 중인 내 개인정보) */
export async function exportMyData(): Promise<unknown> {
  return (await api.get('/member/me/export')).data;
}

export async function checkLoginId(loginId: string): Promise<boolean> {
  const res = await axios.get<{ available: boolean }>('/api/auth/check-login-id', { params: { loginId } });
  return res.data.available;
}

export async function checkNickname(nickname: string): Promise<boolean> {
  const res = await axios.get<{ available: boolean }>('/api/auth/check-nickname', { params: { nickname } });
  return res.data.available;
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

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.patch('/member/password', { currentPassword, newPassword });
}

export async function changeNickname(nickname: string): Promise<void> {
  await api.patch('/member/nickname', { nickname });
}

export async function withdraw(): Promise<void> {
  await api.delete('/member');
  setAccessToken(null);
}
