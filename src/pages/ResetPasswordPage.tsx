import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkResetToken, confirmPasswordReset } from '../api/auth';
import { errorMessage } from '../api/client';
import { isValidPassword, readResetToken } from '../utils/account';

type Stage = 'checking' | 'ready' | 'invalid' | 'done';

/**
 * 메일의 재설정 링크가 여는 화면 (/reset-password#token=...).
 *
 * 토큰은 처음 한 번만 읽어 메모리에 두고, 주소 표시줄에서는 곧바로 지운다.
 * (방문 기록이나 화면 공유로 링크가 새는 것을 줄인다. 토큰은 어차피 1회용·30분짜리다)
 */
export default function ResetPasswordPage() {
  const [token] = useState<string | null>(() => readResetToken(window.location.hash));
  const [stage, setStage] = useState<Stage>(token ? 'checking' : 'invalid');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    if (!token) return;
    let cancelled = false;
    checkResetToken(token)
      .then((valid) => { if (!cancelled) setStage(valid ? 'ready' : 'invalid'); })
      // 확인에 실패했다고 막지는 않는다. 최종 판정은 재설정 요청에서 서버가 한다
      .catch(() => { if (!cancelled) setStage('ready'); });
    return () => { cancelled = true; };
  }, [token]);

  const pwValid = isValidPassword(password);
  const pwMatch = password.length > 0 && password === passwordConfirm;

  const submit = async () => {
    if (!token || !pwValid || !pwMatch || busy) return;
    setBusy(true);
    setError(null);
    try {
      await confirmPasswordReset(token, password);
      setStage('done');
    } catch (err) {
      // 토큰은 서버에서 이미 소비됐을 수 있다 -> 다시 시도하려면 링크를 새로 받아야 한다
      setError(errorMessage(err));
      setStage('invalid');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-center auth-page">
      <div className="auth-card">
        <h1 className="game-title"><span className="t-heaven">Renova</span> <span className="amp">&amp;</span> <span className="t-abyss">Delve</span></h1>
        <h2 className="auth-heading">비밀번호 재설정</h2>

        {stage === 'checking' && <p className="recovery-note">링크를 확인하는 중...</p>}

        {stage === 'invalid' && (
          <>
            <p className="auth-message">{error ?? '재설정 링크가 만료되었거나 이미 사용되었습니다.'}</p>
            <p className="recovery-note">링크는 30분 동안, 한 번만 쓸 수 있습니다. 비밀번호 찾기를 다시 진행해주세요.</p>
            <Link className="primary wide button-link" to="/recover?kind=password">비밀번호 찾기로 가기</Link>
          </>
        )}

        {stage === 'ready' && (
          <>
            <p className="recovery-note">새 비밀번호를 정해주세요. 바꾸면 모든 기기에서 로그아웃됩니다.</p>
            <div className="field">
              <input type="password" placeholder="새 비밀번호 (영문+숫자 8자 이상)" value={password}
                autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
              {password.length > 0 && !pwValid && <span className="field-hint">영문과 숫자를 포함해 8자 이상</span>}
            </div>
            <div className="field">
              <input type="password" placeholder="새 비밀번호 확인" value={passwordConfirm}
                autoComplete="new-password" onChange={(e) => setPasswordConfirm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()} />
              {passwordConfirm.length > 0 && !pwMatch && <span className="field-hint error">비밀번호가 일치하지 않습니다</span>}
            </div>
            <button className="primary wide" disabled={busy || !pwValid || !pwMatch} onClick={submit}>
              {busy ? '...' : '비밀번호 바꾸기'}
            </button>
          </>
        )}

        {stage === 'done' && (
          <>
            <p className="auth-message">비밀번호를 바꿨습니다. 새 비밀번호로 로그인해주세요.</p>
            <Link className="primary wide button-link" to="/auth">로그인하러 가기</Link>
          </>
        )}
      </div>
    </div>
  );
}
