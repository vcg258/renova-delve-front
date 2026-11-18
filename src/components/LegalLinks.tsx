import { Link } from 'react-router-dom';

/**
 * 플레이어 문의·피드백 주소. 소스에 적지 않고 빌드 환경변수(VITE_OPERATOR_CONTACT)로 받는다.
 * 약관·처리방침의 문의처와 같은 값이다. 비어 있으면 문의 링크를 그리지 않는다.
 */
export const CONTACT_EMAIL: string = import.meta.env.VITE_OPERATOR_CONTACT ?? '';

/** 메일 앱을 열 때 미리 채울 제목 (어떤 메일인지 운영자가 바로 알아볼 수 있게) */
const FEEDBACK_SUBJECT = '[Renova & Delve] 피드백';

/**
 * 화면 아래의 약관 · 처리방침 · 문의 링크.
 *
 * @param className 정렬 등 추가 클래스 (예: "left")
 */
export default function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <p className={`legal-links ${className}`.trim()}>
      <Link to="/terms">이용약관</Link>
      <span>·</span>
      <Link to="/privacy"><strong>개인정보 처리방침</strong></Link>
      {CONTACT_EMAIL && (
        <>
          <span>·</span>
          <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(FEEDBACK_SUBJECT)}`}
            title={`버그 제보, 밸런스 의견, 바라는 기능을 보내 주세요 (${CONTACT_EMAIL})`}>
            문의와 피드백
          </a>
        </>
      )}
    </p>
  );
}
