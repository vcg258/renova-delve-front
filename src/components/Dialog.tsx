import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  /** 화면 낭독기에 읽히는 이름 */
  label: string;
  /** Esc나 바깥을 눌렀을 때 */
  onClose: () => void;
  /** 되돌릴 수 없는 행동의 확인 창이면 alertdialog */
  alert?: boolean;
  className?: string;
  children: ReactNode;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * 게임 화면의 모달 창. 열리면 첫 버튼에 포커스를 두고, Tab은 창 안에서만 돌고, Esc로 닫히며,
 * 닫히면 열기 전에 포커스가 있던 곳으로 돌려준다.
 */
export default function Dialog({ label, onClose, alert = false, className = '', children }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const el = box.current;
    const preferred = el?.querySelector<HTMLElement>('[autofocus], [data-autofocus]');
    (preferred ?? el?.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close.current();
        return;
      }
      if (e.key !== 'Tab' || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el?.addEventListener('keydown', onKey);
    return () => {
      el?.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return (
    <div className={`swap-overlay ${className}`} role={alert ? 'alertdialog' : 'dialog'} aria-modal="true" aria-label={label}
      ref={box}>
      {children}
    </div>
  );
}
