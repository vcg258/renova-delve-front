import { useEffect, useRef, useState } from 'react';

/**
 * AI 서사를 한 글자씩 출력하는 타자기 효과.
 * LLM 레이턴시 체감을 줄이는 연출 (README 설계 반영).
 */
export default function TypewriterText({ text, speed = 18 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setShown('');
    indexRef.current = 0;
    if (!text) return;
    const timer = setInterval(() => {
      indexRef.current += 1;
      setShown(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <p className="story-text">{shown}<span className="cursor">▍</span></p>;
}
