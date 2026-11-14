import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { abandonGame, getCurrentGame, getKingdom } from '../api/game';
import { useAuth } from '../context/AuthContext';
import type { GameView, KingdomInfo } from '../api/types';
import KingdomScale from '../components/KingdomScale';
import LegalLinks from '../components/LegalLinks';
import GuideChat from '../components/GuideChat';
import Px from '../components/Px';

export default function HomePage() {
  const { member, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<GameView | null>(null);
  const [loading, setLoading] = useState(true);
  const [kingdom, setKingdom] = useState<KingdomInfo | null>(null);

  const hasActiveGame = view && view.phase !== 'NONE' && view.phase !== 'GAMEOVER' && view.phase !== 'CLEAR';

  useEffect(() => {
    getCurrentGame()
      .then(setView)
      .catch(() => setView(null))
      .finally(() => setLoading(false));
    // 부가 정보: 실패하면 저울만 숨긴다
    getKingdom().then(setKingdom).catch(() => setKingdom(null));
  }, []);

  const startNew = async () => {
    if (hasActiveGame && !confirm('진행 중인 모험이 있습니다. 포기하고 새로 시작할까요?')) return;
    if (hasActiveGame) await abandonGame().catch(() => {});
    navigate('/setup');
  };

  return (
    <div className="page home-page">
      <header className="home-header">
        <h1 className="game-title"><span className="t-heaven">Renova</span> <span className="amp">&amp;</span> <span className="t-abyss">Delve</span></h1>
        <p className="subtitle">천상과 마계 사이, 멸망한 왕국 레노바 — 당신의 선택이 이야기가 된다</p>
        <p className="dim">
          모험가: {member?.nickname}
          {member?.role === 'ADMIN' && <span className="role-chip admin">운영자</span>}
        </p>
      </header>

      {kingdom && <KingdomScale kingdom={kingdom} />}

      <main className="home-menu">
        {hasActiveGame && (
          <button className="menu-btn continue" onClick={() => navigate('/game')}>
            <span className="menu-title"><Px s="sword" /> 이어하기</span>
            <span className="menu-desc">
              스테이지 {view?.status?.stateDTO.currentStage} · 노드 {view?.status?.stateDTO.currentNodeId ?? 0} 에서 계속
            </span>
          </button>
        )}

        <button className="menu-btn" onClick={startNew} disabled={loading}>
          <span className="menu-title"><Px s="candle" /> 새로운 잠입</span>
          <span className="menu-desc">장비를 꾸리고 마계의 문이 열린 왕궁으로</span>
        </button>

        <button className="menu-btn" onClick={() => navigate('/ranking')}>
          <span className="menu-title"><Px s="trophy" /> 랭킹</span>
          <span className="menu-desc">난이도별 최고 기록</span>
        </button>

        <button className="menu-btn" onClick={() => navigate('/chronicle')}>
          <span className="menu-title"><Px s="scroll" /> 레노바 연대기</span>
          <span className="menu-desc">원정마다 한 장씩 쌓이는 나의 이야기</span>
        </button>

        <button className="menu-btn" onClick={() => navigate('/collection')}>
          <span className="menu-title"><Px s="book" /> 도감</span>
          <span className="menu-desc">지금까지 손에 넣은 것들</span>
        </button>

        <button className="menu-btn" onClick={() => navigate('/profile')}>
          <span className="menu-title"><Px s="key" /> 내 정보</span>
          <span className="menu-desc">전적 · 업적 · 닉네임·비밀번호 변경</span>
        </button>

        {member?.role === 'ADMIN' && (
          <button className="menu-btn admin-menu" onClick={() => navigate('/admin')}>
            <span className="menu-title"><Px s="gear" /> 운영 콘솔</span>
            <span className="menu-desc">회원 관리 · 통계 · VectorStore</span>
          </button>
        )}

        <button className="menu-btn ghost" onClick={() => signOut()}>
          <span className="menu-title">로그아웃</span>
        </button>
      </main>

      <LegalLinks />

      <GuideChat />
    </div>
  );
}
