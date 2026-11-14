import { useRef, useState, type PointerEvent, type ReactNode } from 'react';

type Align = 'center' | 'left' | 'right';
type Side = 'bottom' | 'top';

interface Props {
  /** 마우스를 올리면 펼쳐지는 내용 */
  tip: ReactNode;
  children: ReactNode;
  className?: string;
  /** 말풍선이 붙는 쪽 (기본값). 화면 밖으로 넘치면 펼칠 때 자동으로 안쪽으로 옮긴다 */
  align?: Align;
  /** 말풍선이 뜨는 방향 (기본값). 아래가 모자라면 자동으로 위로 띄운다 */
  side?: Side;
  /** 안에 이미 버튼 같은 포커스 가능한 요소가 있으면 false (탭 정지점이 두 번 생기지 않게) */
  focusable?: boolean;
}

/** 화면 가장자리에서 띄울 최소 여백 */
const EDGE = 8;

/**
 * 펼쳐진 말풍선이 화면 밖으로 넘치는지 보고, 넘치면 안쪽으로 옮긴 배치를 돌려준다.
 * (순수 함수: 화면 크기와 말풍선 위치만 받는다)
 */
export function fitPlacement(rect: { left: number; right: number; top: number; bottom: number },
                             viewport: { width: number; height: number },
                             current: { align: Align; side: Side }): { align: Align; side: Side } {
  let { align, side } = current;
  if (rect.right > viewport.width - EDGE) align = 'right';
  else if (rect.left < EDGE) align = 'left';
  if (side === 'bottom' && rect.bottom > viewport.height - EDGE && rect.top > rect.bottom - rect.top + EDGE * 4) side = 'top';
  return { align, side };
}

/**
 * 마우스를 올리면(또는 키보드 포커스·터치로 선택하면) 말풍선이 펼쳐지는 감싸개.
 * 브라우저 기본 툴팁(title)은 뜨기까지 느리고 줄바꿈·서식이 안 되어 쓰지 않는다.
 * 표시 여부는 CSS(:hover / :focus-within)로 정하고, 펼칠 때 한 번 재서 화면 밖으로 넘치면 안쪽으로 옮긴다.
 * 마우스로 누른 것은 포커스를 잡지 않는다(떼면 닫히게). 터치와 키보드는 포커스로 연다.
 */
export default function HoverTip({ tip, children, className = '', align = 'center', side = 'bottom', focusable = true }: Props) {
  const panel = useRef<HTMLSpanElement>(null);
  const [place, setPlace] = useState<{ align: Align; side: Side }>({ align, side });

  const fit = () => {
    requestAnimationFrame(() => {
      const el = panel.current;
      if (!el || typeof window === 'undefined') return;
      const next = fitPlacement(el.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight },
        { align, side });
      if (next.align !== place.align || next.side !== place.side) setPlace(next);
    });
  };

  const reset = () => setPlace({ align, side });

  const keepMouseFromFocusing = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') e.preventDefault();
  };

  return (
    <span className={`hovertip ${className}`} tabIndex={focusable ? 0 : undefined}
      onMouseEnter={fit} onFocus={fit} onMouseLeave={reset} onBlur={reset} onPointerDown={keepMouseFromFocusing}>
      {children}
      <span ref={panel} className={`hovertip-panel align-${place.align} side-${place.side}`} role="tooltip">{tip}</span>
    </span>
  );
}
