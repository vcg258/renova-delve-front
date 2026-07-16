import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { abandonGame, getCurrentGame } from '../api/game';
import { useAuth } from '../context/AuthContext';
import type { GameView } from '../api/types';
import GuideChat from '../components/GuideChat';

export default function HomePage() {
  const { member, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<GameView | null>(null);
  const [loading, setLoading] = useState(true);

  const hasActiveGame = view && view.phase !== 'NONE' && view.phase !== 'GAMEOVER' && view.phase !== 'CLEAR';

  useEffect(() => {
    getCurrentGame()
      .then(setView)
      .catch(() => setView(null))
      .finally(() => setLoading(false));
  }, []);

  const startNew = async () => {
    if (hasActiveGame && !confirm('진행 중인 모험이 있습니다. 포기하고 새로 시작할까요?')) return;
    if (hasActiveGame) await abandonGame().catch(() => {});
    navigate('/setup');
  };

  return (
    <div className="page home-page">
      <header className="home-header">
        <h1 className="game-title">Renova <span className="amp">&amp;</span> Delve</h1>
        <p className="subtitle">멸망한 왕국의 심연으로 — AI가 매번 새로 쓰는 이야기</p>
        <p className="dim">모험가: {member?.loginId}</p>
      </header>

      <main className="home-menu">
        {hasActiveGame && (
          <button className="menu-btn continue" onClick={() => navigate('/game')}>
            <span className="menu-title">⚔ 이어하기</span>
            <span className="menu-desc">
              스테이지 {view?.status?.stateDTO.currentStage} · 노드 {view?.status?.stateDTO.currentNodeId ?? 0} 에서 계속
            </span>
          </button>
        )}

        <button className="menu-btn" onClick={startNew} disabled={loading}>
          <span className="menu-title">🕯 새로운 잠입</span>
          <span className="menu-desc">장비를 꾸리고 왕궁의 어둠 속으로</span>
        </button>

        <button className="menu-btn" onClick={() => navigate('/ranking')}>
          <span className="menu-title">🏆 랭킹</span>
          <span className="menu-desc">난이도별 최고 기록</span>
        </button>

        <button className="menu-btn" onClick={() => navigate('/collection')}>
          <span className="menu-title">📖 도감</span>
          <span className="menu-desc">지금까지 손에 넣은 것들</span>
        </button>

        <button className="menu-btn ghost" onClick={() => signOut()}>
          <span className="menu-title">로그아웃</span>
        </button>
      </main>

      <GuideChat />
    </div>
  );
}
