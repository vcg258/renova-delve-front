import { api } from './client';
import type { AdminStats, MemberStatus, MemberSummary, PageResponse, Role } from './types';

export async function fetchMembers(params: {
  keyword?: string; status?: string; page?: number; size?: number;
}): Promise<PageResponse<MemberSummary>> {
  const res = await api.get<PageResponse<MemberSummary>>('/admin/members', { params });
  return res.data;
}

export async function changeMemberStatus(
  memberId: number, status: MemberStatus, reason?: string,
): Promise<MemberSummary> {
  const res = await api.patch<MemberSummary>(`/admin/members/${memberId}/status`, { status, reason });
  return res.data;
}

export async function changeMemberRole(memberId: number, role: Role): Promise<MemberSummary> {
  const res = await api.patch<MemberSummary>(`/admin/members/${memberId}/role`, { role });
  return res.data;
}

export async function terminateMemberGame(memberId: number): Promise<void> {
  await api.post(`/admin/members/${memberId}/terminate-game`);
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await api.get<AdminStats>('/admin/stats');
  return res.data;
}

export async function syncVectorStore(force = false): Promise<string> {
  const res = await api.post<string>('/admin/etl/sync', null, { params: { force } });
  return res.data;
}
