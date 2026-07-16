import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSummary } from '../api/game';
import { errorMessage } from '../api/client';
import type { GameSummary } from '../api/types';
import TypewriterText from '../components/TypewriterText';

/**
 * 게임 종료 화면: 클리어/게임오버 + AI가 요약한 이번 모험의 서사.
 */
export default function ResultPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSummary().then(setSummary).catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) {
    return (
      <div className="page-center">
        <p className="dim">{error}</p>
        <button className="primary" onClick={() => navigate('/')}>메뉴로</button>
      </div>
    );
  }

  if (!summary) {
    return <div className="page-center dim">이번 여정을 기록하는 중...</div>;
  }

  return (
    <div className="page-center result-page">
      <div className={`result-card ${summary.cleared ? 'clear' : 'over'}`}>
        <h1 className="result-title">
          {summary.cleared ? '🌅 포탈 봉인 — 왕국에 새벽이' : '🕯 모험의 끝'}
        </h1>

        <div className="result-stats">
          <div><span className="dim">최종 점수</span><strong>✦ {summary.score}</strong></div>
          <div><span className="dim">도달</span><strong>스테이지 {summary.stage} · 노드 {summary.node}</strong></div>
          <div><span className="dim">레벨</span><strong>Lv.{summary.level}</strong></div>
          <div><span className="dim">골드</span><strong>🪙 {summary.gold}</strong></div>
        </div>

        <div className="narrative-box">
          <h3>이번 모험의 기록</h3>
          <TypewriterText text={summary.narrative} speed={25} />
        </div>

        <div className="result-actions">
          <button className="primary" onClick={() => navigate('/setup')}>다시 도전한다</button>
          <button className="ghost" onClick={() => navigate('/ranking')}>랭킹 보기</button>
          <button className="ghost" onClick={() => navigate('/')}>메뉴로</button>
        </div>
      </div>
    </div>
  );
}
