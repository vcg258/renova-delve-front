import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRunReview, getSummary } from '../api/game';
import { errorMessage } from '../api/client';
import type { GameSummary, RunReview } from '../api/types';
import TypewriterText from '../components/TypewriterText';
import Px from '../components/Px';

/**
 * 게임 종료 화면: 클리어/게임오버 + AI가 요약한 이번 모험의 서사.
 */
export default function ResultPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<RunReview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(true);

  useEffect(() => {
    getSummary().then(setSummary).catch((err) => setError(errorMessage(err)));
    // 회고는 별도 요청으로 받아, 생성이 늦거나 실패해도 결과 화면이 막히지 않게 한다
    getRunReview().then(setReview).catch(() => setReview(null)).finally(() => setReviewLoading(false));
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
          <Px s={summary.cleared ? 'crown' : 'grave'} size={32} /> {summary.cleared ? '마계의 문 앞에서 — 선택의 끝' : '한 인간의 끝'}
        </h1>

        <div className="result-stats">
          <div><span className="dim">최종 점수</span><strong><Px s="star" /> {summary.score}</strong></div>
          <div><span className="dim">도달</span><strong>스테이지 {summary.stage} · 노드 {summary.node}</strong></div>
          <div><span className="dim">레벨</span><strong>Lv.{summary.level}</strong></div>
          <div><span className="dim">골드</span><strong><Px s="coin" /> {summary.gold}</strong></div>
        </div>

        <div className="narrative-box">
          <h3>이번 모험의 기록</h3>
          <TypewriterText text={summary.narrative} speed={25} />
        </div>

        {reviewLoading && <p className="dim small">기록관이 이번 여정을 평가하는 중...</p>}
        {review && (
          <div className="review-box">
            <span className="review-title">「{review.title}」</span>
            {review.epitaph && <p className="review-epitaph">{review.epitaph}</p>}
            <p className="review-analysis">{review.analysis}</p>
            {review.tips.length > 0 && (
              <ul className="review-tips">
                {review.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            )}
            <span className="dim small">AI가 이번 판의 기록을 바탕으로 작성했습니다. 실제 밸런스와 다를 수 있습니다.</span>
          </div>
        )}

        <div className="result-actions">
          <button className="primary" onClick={() => navigate('/setup')}>다시 도전한다</button>
          <button className="ghost" onClick={() => navigate('/ranking')}>랭킹 보기</button>
          <button className="ghost" onClick={() => navigate('/')}>메뉴로</button>
        </div>
      </div>
    </div>
  );
}
