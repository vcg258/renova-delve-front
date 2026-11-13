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

export interface SignupProfile {
  loginId: string;
  password: string;
  nickname: string;
  name: string;
  email: string;
}

export async function signup(profile: SignupProfile, consent: SignupConsent): Promise<void> {
  await axios.post('/api/auth/signup', { ...profile, ...consent });
}

/* ===== 아이디 찾기 / 비밀번호 재설정 (로그인 전) ===== */
// 서버는 계정이 있든 없든 같은 안내 문구를 돌려준다.

export async function findLoginId(name: string, email: string): Promise<string> {
  return (await axios.post<{ message: string }>('/api/auth/find-id', { name, email })).data.message;
}

export async function requestPasswordReset(loginId: string, email: string): Promise<string> {
  return (await axios.post<{ message: string }>('/api/auth/password-reset/request', { loginId, email })).data.message;
}

/** 재설정 링크가 아직 유효한지 (토큰을 소비하지 않는다). 토큰은 주소가 아니라 본문으로 보낸다 */
export async function checkResetToken(token: string): Promise<boolean> {
  return (await axios.post<{ valid: boolean }>('/api/auth/password-reset/check', { token })).data.valid;
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  await axios.post('/api/auth/password-reset/confirm', { token, newPassword });
}

/** 이름·이메일 등록 / 변경. 비밀번호가 있는 계정은 현재 비밀번호를 함께 보낸다 */
export async function changeContact(name: string, email: string, currentPassword: string | null): Promise<void> {
  await api.patch('/member/contact', { name, email, currentPassword });
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
