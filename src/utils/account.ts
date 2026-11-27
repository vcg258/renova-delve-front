/**
 * 계정 입력값 검증과 재설정 링크 처리 (순수 함수).
 * 형식 규칙은 서버(SignupRequest 등)와 같게 유지한다. 최종 판정은 서버가 한다.
 */

export function isValidLoginId(value: string): boolean {
  return /^[a-zA-Z0-9_]{4,20}$/.test(value);
}

/** 영문과 숫자를 포함해 8자 이상 64자 이하 */
export function isValidPassword(value: string): boolean {
  return value.length >= 8 && value.length <= 64 && /[a-zA-Z]/.test(value) && /\d/.test(value);
}

/** 한글·영문, 낱말 사이 공백 하나 허용, 2~30자 */
export function isValidName(value: string): boolean {
  const name = value.trim();
  return name.length >= 2 && name.length <= 30 && /^[가-힣a-zA-Z]+( [가-힣a-zA-Z]+)*$/.test(name);
}

/** 서버의 @Email보다 조금 엄격하게: 도메인에 점이 있어야 한다 (오타로 메일을 못 받는 일을 줄인다) */
export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * 재설정 링크(/reset-password#token=...)의 # 뒤에서 토큰을 꺼낸다.
 * 토큰을 # 뒤에 두는 이유: 그 부분은 서버로 전송되지 않아 접속 로그나 Referer에 남지 않는다.
 */
export function readResetToken(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const token = params.get('token');
  if (!token || token.length > 128 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
  return token;
}

/** 화면에 보여줄 때 이메일 일부를 가린다 (ab***@naver.com) */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  return `${email.slice(0, Math.min(2, at))}***${email.slice(at)}`;
}
