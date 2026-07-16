import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRanking } from '../api/game';
import type { Difficulty, RankingRow } from '../api/types';

const TABS: { value: Difficulty; label: string }[] = [
  { value: 'NORMAL', label: '보통' },
  { value: 'HARD', label: '어려움' },
  { value: 'HELL', label: '지옥' },
];

export default function RankingPage() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRanking(difficulty)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [difficulty]);

  return (
    <div className="page ranking-page">
      <header className="setup-header">
        <button className="ghost" onClick={() => navigate('/')}>← 돌아가기</button>
        <h2>🏆 명예의 전당</h2>
        <span />
      </header>

      <div className="auth-tabs ranking-tabs">
        {TABS.map((tab) => (
          <button key={tab.value}
            className={difficulty === tab.value ? 'active' : ''}
            onClick={() => setDifficulty(tab.value)}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="dim page-center">기록을 뒤지는 중...</p>
      ) : rows.length === 0 ? (
        <p className="dim page-center">아직 이 난이도의 생존 기록이 없다.</p>
      ) : (
        <table className="ranking-table">
          <thead>
            <tr><th>#</th><th>모험가</th><th>최고 점수</th><th>클리어 시간</th><th>달성일</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank} className={row.rank <= 3 ? `top-${row.rank}` : ''}>
                <td>{row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}</td>
                <td>{row.loginId}</td>
                <td>✦ {row.bestScore}</td>
                <td>{row.clearTime != null ? formatTime(row.clearTime) : '—'}</td>
                <td>{row.achievedAt?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}분 ${s}초`;
}
