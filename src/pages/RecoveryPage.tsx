import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { findLoginId, requestPasswordReset } from '../api/auth';
import { errorMessage } from '../api/client';
import { isValidEmail, isValidName } from '../utils/account';

type Kind = 'id' | 'password';

/**
 * 아이디 찾기 / 비밀번호 찾기.
 * 서버는 입력이 맞든 아니든 같은 응답을 준다(계정 존재 여부를 알려주지 않는다).
 * 그래서 이 화면도 "보냈다"가 아니라 "일치하는 계정이 있으면 보냈다"고만 안내한다.
 */
export default function RecoveryPage() {
  const [params, setParams] = useSearchParams();
  const kind: Kind = params.get('kind') === 'password' ? 'password' : 'id';

  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailValid = isValidEmail(email);
  const canSubmit = emailValid && (kind === 'id' ? isValidName(name) : loginId.trim().length > 0);

  const switchKind = (next: Kind) => {
    setParams(next === 'password' ? { kind: 'password' } : {}, { replace: true });
    setDone(null);
    setError(null);
  };

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      const message = kind === 'id'
        ? await findLoginId(name.trim(), email.trim())
        : await requestPasswordReset(loginId.trim(), email.trim());
      setDone(message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-center auth-page">
      <div className="auth-card">
        <h1 className="game-title"><span className="t-heaven">Renova</span> <span className="amp">&amp;</span> <span className="t-abyss">Delve</span></h1>
        <h2 className="auth-heading">{kind === 'id' ? '아이디 찾기' : '비밀번호 찾기'}</h2>

        {done ? (
          <>
            <p className="auth-message">{done}</p>
            <p className="recovery-note">
              메일이 오지 않으면 스팸함을 확인하고, 입력한 정보가 가입할 때와 같은지 살펴보세요.
              {kind === 'password' && ' 재설정 링크는 30분 동안, 한 번만 쓸 수 있습니다.'}
            </p>
            <Link className="primary wide button-link" to="/auth">로그인으로 돌아가기</Link>
          </>
        ) : (
          <>
            <p className="recovery-note">
              {kind === 'id'
                ? '가입할 때 적은 이름과 이메일을 입력하면, 그 이메일로 아이디를 보내드립니다.'
                : '아이디와 가입할 때 적은 이메일을 입력하면, 그 이메일로 비밀번호를 다시 정할 수 있는 링크를 보내드립니다.'}
            </p>

            {kind === 'id' ? (
              <div className="field">
                <input placeholder="이름" value={name} maxLength={30} autoComplete="name"
                  onChange={(e) => setName(e.target.value)} />
                {name.length > 0 && !isValidName(name) && <span className="field-hint">한글·영문 2~30자</span>}
              </div>
            ) : (
              <div className="field">
                <input placeholder="아이디" value={loginId} maxLength={20} autoComplete="username"
                  onChange={(e) => setLoginId(e.target.value)} />
              </div>
            )}

            <div className="field">
              <input type="email" placeholder="이메일" value={email} maxLength={254} autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()} />
              {email.length > 0 && !emailValid && <span className="field-hint">이메일 형식을 확인해주세요</span>}
            </div>

            {error && <p className="auth-message">{error}</p>}

            <button className="primary wide" disabled={busy || !canSubmit} onClick={submit}>
              {busy ? '...' : kind === 'id' ? '아이디를 메일로 받기' : '재설정 링크 받기'}
            </button>

            <p className="auth-switch">
              {kind === 'id' ? '비밀번호를 잊으셨나요?' : '아이디를 잊으셨나요?'}
              <button type="button" className="link-btn" onClick={() => switchKind(kind === 'id' ? 'password' : 'id')}>
                {kind === 'id' ? '비밀번호 찾기' : '아이디 찾기'}
              </button>
            </p>
            <p className="auth-switch">
              <Link className="link-btn" to="/auth">로그인으로 돌아가기</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
