import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { askGuide } from '../api/game';
import { errorMessage } from '../api/client';
import Px from './Px';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

/** 현재 게임 단계별 추천 질문 (Tools 기능을 자연스럽게 노출) */
const SUGGESTIONS: Record<string, string[]> = {
  BATTLE: ['이 몬스터 어떻게 잡아?', '지금 어떤 스킬을 써야 해?', '출혈이랑 독 뭐가 더 좋아?'],
  ENCOUNTER: ['천상·마계·인간 선택지는 뭐가 달라?', '가호는 어떻게 얻어?', '내 성향 알려줘'],
  REWARD: ['뭘 고르는 게 좋을까?', '유물 조합 시너지 알려줘'],
  SHOP: ['지금 뭘 사야 해?', '내 골드로 살 만한 거 있어?'],
  EXPLORE: ['내 상태 알려줘', '전투 규칙 설명해줘', '내 랭킹 몇 등이야?'],
  DEFAULT: ['이 게임 어떻게 하는 거야?', '유물 조합 시너지 알려줘', '어떤 무기들이 있어?'],
};

interface Props {
  /** 현재 게임 단계 (추천 질문을 상황에 맞게 바꾸기 위함) */
  phase?: string;
}

/**
 * Spring AI Tools 기반 게임 안내자 챗봇.
 * 아이템 사전 조회 + 현재 플레이어 상태/전투 상황까지 읽어 맥락 있는 조언을 제공한다.
 */
export default function GuideChat({ phase }: Props) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false); // 첫 힌트 노출 여부
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: '나는 천상에도 마계에도 속하지 않는 경계의 기록자다.\n네 상태도, 눈앞의 적도 들여다볼 수 있으니 무엇이든 묻거라.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = SUGGESTIONS[phase ?? 'DEFAULT'] ?? SUGGESTIONS.DEFAULT;

  // 처음 방문한 사용자에게 잠시 후 말풍선 힌트 노출
  useEffect(() => {
    const timer = setTimeout(() => setSeen(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || busy) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setBusy(true);
    setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 50);
    try {
      const answer = await askGuide(question);
      setMessages((prev) => [...prev, { role: 'ai', text: answer }]);
    } catch (err) {
      // 요청 제한(429) 등 서버가 사유를 알려준 경우 그 문구를 그대로 보여준다
      const reason = axios.isAxiosError(err) && err.response?.status === 429 ? errorMessage(err) : null;
      setMessages((prev) => [...prev, {
        role: 'ai',
        text: reason ?? '...기록자의 목소리가 닿지 않는다. (AI 응답에 실패했습니다. 잠시 후 다시 시도해주세요)',
      }]);
    } finally {
      setBusy(false);
      setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 60);
    }
  };

  return (
    <div className={`guide-chat ${open ? 'open' : ''}`}>
      {open && (
        <div className="guide-panel">
          <div className="guide-header">
            <span className="guide-title"><Px s="candle" /> 경계의 기록자</span>
            <button className="ghost small" onClick={() => setOpen(false)} title="닫기">X</button>
          </div>

          <div className="guide-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`guide-msg ${m.role}`}>{m.text}</div>
            ))}
            {busy && (
              <div className="guide-msg ai thinking">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            )}
          </div>

          {/* 상황별 추천 질문 */}
          <div className="guide-suggestions">
            {suggestions.map((s) => (
              <button key={s} className="suggestion-chip" disabled={busy} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>

          <p className="guide-notice">
            입력한 내용은 답변 생성을 위해 외부 AI(OpenAI)로 전송됩니다. 개인정보는 입력하지 마세요.
          </p>

          <div className="guide-input">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="무엇이든 물어보세요..."
              maxLength={300}
              disabled={busy}
            />
            <button className="primary" onClick={() => send()} disabled={busy}>▶</button>
          </div>
        </div>
      )}

      {!open && (
        <div className="guide-launcher">
          {!seen ? null : (
            <button type="button" className="guide-hint" onClick={() => setOpen(true)}>
              도움이 필요한가, 모험가여?
            </button>
          )}
          <button className="guide-toggle" onClick={() => setOpen(true)} title="AI 안내자에게 물어보기">
            <Px s="candle" size={32} />
            <span className="guide-toggle-label">안내자</span>
          </button>
        </div>
      )}
    </div>
  );
}
