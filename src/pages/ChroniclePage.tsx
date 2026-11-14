import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Px from '../components/Px';
import { getChronicle } from '../api/game';
import type { ChronicleChapter, Difficulty } from '../api/types';

const DIFFICULTY_LABEL: Record<Difficulty, string> = { EASY: '쉬움', NORMAL: '보통', HARD: '어려움', HELL: '지옥' };
const FACTION_LABEL: Record<string, string> = { HEAVEN: '천상', ABYSS: '마계', HUMAN: '인간' };

/** 장 하나. 결과·도달 지점·세력은 서버의 사실, 제목과 본문은 AI가 앞선 장을 이어 쓴 글 */
export function ChapterView({ chapter }: { chapter: ChronicleChapter }) {
  const date = chapter.createdAt ? chapter.createdAt.slice(0, 10) : '';
  const outcome = chapter.cleared ? '왕을 쓰러뜨렸다' : `스테이지 ${chapter.stage}-${chapter.node}에서 쓰러졌다`;
  return (
    <article className={`chronicle-chapter ${chapter.cleared ? 'cleared' : ''}`}>
      <header>
        <span className="chapter-no">제{chapter.chapterNo}장</span>
        <h3>{chapter.title}</h3>
      </header>
      <p className="chapter-body">{chapter.body}</p>
      <footer className="dim small">
        {date} · {DIFFICULTY_LABEL[chapter.difficulty] ?? chapter.difficulty} · {outcome}
        {chapter.faction && ` · ${FACTION_LABEL[chapter.faction] ?? chapter.faction}에 기울었다`}
      </footer>
    </article>
  );
}

/**
 * 레노바 연대기: 끝난 원정마다 한 장씩 쌓이는 이야기책.
 */
export default function ChroniclePage() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<ChronicleChapter[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getChronicle().then(setChapters).catch(() => setError(true));
  }, []);

  return (
    <div className="page chronicle-page">
      <header className="setup-header">
        <button className="ghost" onClick={() => navigate('/')}>← 돌아가기</button>
        <h2><Px s="book" /> 레노바 연대기</h2>
        <span />
      </header>

      <p className="dim chronicle-intro">
        원정이 끝날 때마다 기록관이 한 장을 덧붙인다. 앞선 원정자의 발자취는 다음 장으로 이어진다.
      </p>

      {error && <p className="dim">연대기를 불러오지 못했다.</p>}
      {!error && chapters === null && <p className="dim">책장을 넘기는 중...</p>}
      {chapters !== null && chapters.length === 0 && (
        <p className="dim chronicle-empty">아직 빈 책이다. 첫 원정이 끝나면 첫 장이 쓰인다.</p>
      )}
      {chapters !== null && chapters.length > 0 && (
        <div className="chronicle-book">
          {chapters.map((chapter) => <ChapterView key={chapter.chapterNo} chapter={chapter} />)}
        </div>
      )}
    </div>
  );
}
