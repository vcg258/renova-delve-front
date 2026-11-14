import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  changeMemberRole, changeMemberStatus, fetchAdminStats, fetchMembers,
  syncVectorStore, terminateMemberGame,
} from '../api/admin';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { AdminStats, MemberSummary, PageResponse } from '../api/types';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '정상', SUSPENDED: '정지', WITHDRAWN: '탈퇴',
};

export default function AdminPage() {
  const navigate = useNavigate();
  const { member } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [page, setPage] = useState<PageResponse<MemberSummary> | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageNum, setPageNum] = useState(0);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3500);
  };

  const loadMembers = useCallback(async (nextPage = pageNum) => {
    try {
      setPage(await fetchMembers({ keyword, status: statusFilter, page: nextPage, size: 15 }));
      setPageNum(nextPage);
    } catch (err) {
      notify(errorMessage(err));
    }
  }, [keyword, statusFilter, pageNum]);

  useEffect(() => {
    fetchAdminStats().then(setStats).catch((err) => notify(errorMessage(err)));
    loadMembers(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      await loadMembers();
      setStats(await fetchAdminStats());
    } catch (err) {
      notify(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const suspend = (m: MemberSummary) => {
    const reason = prompt(`'${m.nickname}' 계정을 정지합니다.\n사유를 입력하세요:`, '운영 정책 위반');
    if (reason === null) return;
    act(async () => {
      await changeMemberStatus(m.memberId, 'SUSPENDED', reason);
      notify(`${m.nickname} 계정을 정지했습니다.`);
    });
  };

  const unsuspend = (m: MemberSummary) => act(async () => {
    await changeMemberStatus(m.memberId, 'ACTIVE');
    notify(`${m.nickname} 계정의 정지를 해제했습니다.`);
  });

  const toggleRole = (m: MemberSummary) => {
    const next = m.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`'${m.nickname}'의 권한을 ${next}로 변경할까요?\n해당 회원은 재로그인이 필요합니다.`)) return;
    act(async () => {
      await changeMemberRole(m.memberId, next);
      notify(`${m.nickname}의 권한을 ${next}로 변경했습니다.`);
    });
  };

  const forceEnd = (m: MemberSummary) => {
    if (!confirm(`'${m.nickname}'의 진행 중인 게임을 강제 종료할까요?`)) return;
    act(async () => {
      await terminateMemberGame(m.memberId);
      notify('게임을 강제 종료했습니다.');
    });
  };

  const runSync = (force: boolean) => act(async () => {
    notify('동기화 중...');
    notify(await syncVectorStore(force));
  });

  return (
    <div className="page admin-page">
      <header className="setup-header">
        <button className="ghost" onClick={() => navigate('/')}>← 돌아가기</button>
        <h2>운영 콘솔</h2>
        <span className="dim small">{member?.nickname}</span>
      </header>

      {toast && <div className="admin-toast">{toast}</div>}

      {/* ===== 통계 ===== */}
      {stats && (
        <section className="setup-section">
          <h3>현황</h3>
          <div className="stat-grid">
            <StatCard label="전체 회원" value={stats.totalMembers} sub={`최근 7일 +${stats.newMembersLast7Days}`} />
            <StatCard label="정상" value={stats.activeMembers} tone="ok" />
            <StatCard label="정지" value={stats.suspendedMembers} tone="warn" />
            <StatCard label="탈퇴" value={stats.withdrawnMembers} />
            <StatCard label="진행 중 게임" value={stats.activeGames} tone="ok" />
            <StatCard label="총 플레이" value={stats.totalGamesPlayed} />
            <StatCard label="클리어" value={stats.clearedGames} tone="gold" />
          </div>

          <div className="difficulty-bar">
            {Object.entries(stats.gamesByDifficulty).map(([difficulty, count]) => (
              <span key={difficulty} className="chip">{difficulty} {count}</span>
            ))}
          </div>
        </section>
      )}

      {/* ===== ETL ===== */}
      <section className="setup-section">
        <h3>VectorStore</h3>
        <p className="dim small" style={{ marginBottom: 10 }}>
          RDB의 몬스터·장비·스킬·유물을 임베딩해 RAG 검색에 사용합니다. 변경된 항목만 다시 임베딩됩니다.
        </p>
        <div className="option-row">
          <button disabled={busy} onClick={() => runSync(false)}>증분 동기화</button>
          <button className="ghost" disabled={busy}
            onClick={() => confirm('전량 재임베딩은 OpenAI 비용이 발생합니다. 계속할까요?') && runSync(true)}>
            전량 재동기화
          </button>
        </div>
      </section>

      {/* ===== 회원 관리 ===== */}
      <section className="setup-section">
        <h3>회원 관리</h3>
        <div className="admin-filters">
          <input placeholder="아이디 또는 닉네임 검색" value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadMembers(0)} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">전체 상태</option>
            <option value="ACTIVE">정상</option>
            <option value="SUSPENDED">정지</option>
            <option value="WITHDRAWN">탈퇴</option>
          </select>
          <button className="primary" onClick={() => loadMembers(0)}>검색</button>
        </div>

        <div className="admin-table-wrap">
          <table className="ranking-table admin-table">
            <thead>
              <tr>
                <th>회원</th><th>권한</th><th>상태</th><th>가입일</th><th>최근 접속</th><th>관리</th>
              </tr>
            </thead>
            <tbody>
              {page?.content.map((m) => (
                <tr key={m.memberId} className={m.status === 'SUSPENDED' ? 'row-suspended' : ''}>
                  <td>
                    <strong>{m.nickname}</strong>
                    <span className="dim small"> @{m.loginId}</span>
                    {m.memberId === member?.memberId && <span className="badge self">나</span>}
                    {m.playing && <span className="badge playing">플레이 중</span>}
                  </td>
                  <td>
                    <span className={`role-chip ${m.role.toLowerCase()}`}>{m.role}</span>
                  </td>
                  <td>
                    <span className={`status-chip ${m.status.toLowerCase()}`}>{STATUS_LABEL[m.status]}</span>
                    {m.statusReason && <div className="dim small">{m.statusReason}</div>}
                  </td>
                  <td className="dim small">{m.createdAt?.slice(0, 10)}</td>
                  <td className="dim small">{m.lastLoginAt ? m.lastLoginAt.slice(0, 10) : '—'}</td>
                  <td>
                    <div className="admin-actions">
                      {m.status === 'WITHDRAWN' ? (
                        <span className="dim small">—</span>
                      ) : m.memberId === member?.memberId ? (
                        // 본인 계정의 정지·권한 회수는 서버가 거부한다. 누를 수 있는 버튼을 두지 않는다
                        <span className="dim small">본인 계정</span>
                      ) : (
                        <>
                          {m.status === 'ACTIVE'
                            ? <button className="mini danger" disabled={busy} onClick={() => suspend(m)}>정지</button>
                            : <button className="mini" disabled={busy} onClick={() => unsuspend(m)}>해제</button>}
                          <button className="mini" disabled={busy} onClick={() => toggleRole(m)}>
                            {m.role === 'ADMIN' ? '권한 회수' : '관리자 지정'}
                          </button>
                          {m.playing &&
                            <button className="mini" disabled={busy} onClick={() => forceEnd(m)}>게임 종료</button>}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {page && page.content.length === 0 && (
                <tr><td colSpan={6} className="dim" style={{ textAlign: 'center', padding: 30 }}>
                  검색 결과가 없습니다.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {page && page.totalPages > 1 && (
          <div className="pagination">
            <button className="mini" disabled={page.first} onClick={() => loadMembers(pageNum - 1)}>‹ 이전</button>
            <span className="dim small">{page.page + 1} / {page.totalPages} · 총 {page.totalElements}명</span>
            <button className="mini" disabled={page.last} onClick={() => loadMembers(pageNum + 1)}>다음 ›</button>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, sub, tone }: { label: string; value: number; sub?: string; tone?: string }) {
  return (
    <div className={`stat-card ${tone ?? ''}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}
