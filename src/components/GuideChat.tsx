import { useRef, useState } from 'react';
import { askGuide } from '../api/game';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

/**
 * Spring AI Tools 기반 게임 가이드 챗봇 위젯.
 * 아이템/유물/스킬 정보를 DB 도구 조회 기반으로 답해준다.
 */
export default function GuideChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: '어둠 속 안내자다. 아이템, 유물, 장비… 무엇이든 물어보아라.' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const question = input.trim();
    if (!question || busy) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setBusy(true);
    try {
      const answer = await askGuide(question);
      setMessages((prev) => [...prev, { role: 'ai', text: answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: '...안내자의 목소리가 닿지 않는다. (AI 응답 실패)' }]);
    } finally {
      setBusy(false);
      setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 50);
    }
  };

  return (
    <div className={`guide-chat ${open ? 'open' : ''}`}>
      {open && (
        <div className="guide-panel">
          <div className="guide-header">
            <span>🕯 안내자</span>
            <button className="ghost small" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="guide-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`guide-msg ${m.role}`}>{m.text}</div>
            ))}
            {busy && <div className="guide-msg ai dim">생각 중...</div>}
          </div>
          <div className="guide-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="예: 핏빛 반지랑 시너지 좋은 스킬은?"
              disabled={busy}
            />
            <button onClick={send} disabled={busy}>전송</button>
          </div>
        </div>
      )}
      {!open && (
        <button className="guide-toggle" onClick={() => setOpen(true)} title="게임 가이드 챗봇">🕯</button>
      )}
    </div>
  );
}
