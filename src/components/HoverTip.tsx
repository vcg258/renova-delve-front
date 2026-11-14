import type { ReactNode } from 'react';

interface Props {
  /** 마우스를 올리면 펼쳐지는 내용 */
  tip: ReactNode;
  children: ReactNode;
  className?: string;
  /** 말풍선이 붙는 쪽. 화면 가장자리에 있는 요소는 안쪽으로 펼친다 */
  align?: 'center' | 'left' | 'right';
  /** 말풍선이 뜨는 방향 */
  side?: 'bottom' | 'top';
  /** 안에 이미 버튼 같은 포커스 가능한 요소가 있으면 false (탭 정지점이 두 번 생기지 않게) */
  focusable?: boolean;
}

/**
 * 마우스를 올리면(또는 키보드 포커스·터치로 선택하면) 말풍선이 펼쳐지는 감싸개.
 * 브라우저 기본 툴팁(title)은 뜨기까지 느리고 줄바꿈·서식이 안 되어 쓰지 않는다.
 * 표시 여부는 CSS(:hover / :focus-within)만으로 정하므로 상태가 없다.
 */
export default function HoverTip({ tip, children, className = '', align = 'center', side = 'bottom', focusable = true }: Props) {
  return (
    <span className={`hovertip ${className}`} tabIndex={focusable ? 0 : undefined}>
      {children}
      <span className={`hovertip-panel align-${align} side-${side}`} role="tooltip">{tip}</span>
    </span>
  );
}
