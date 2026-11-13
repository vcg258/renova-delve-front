import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkLoginId, checkNickname, fetchMe, login, signup } from '../api/auth';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

type Availability = 'idle' | 'checking' | 'ok' | 'taken';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [idStatus, setIdStatus] = useState<Availability>('idle');
  const [nickStatus, setNickStatus] = useState<Availability>('idle');
  const [message, setMessage] = useState<string | null>(
    new URLSearchParams(window.location.search).has('expired')
      ? '세션이 만료되었습니다. 다시 로그인해주세요.'
      : null,
  );
  const [busy, setBusy] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const { setMember } = useAuth();
  const navigate = useNavigate();

  // 형식 검증 (서버 규칙과 동일하게 유지)
  const idValid = /^[a-zA-Z0-9_]{4,20}$/.test(loginId);
  const pwValid = password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
  const pwMatch = password.length > 0 && password === passwordConfirm;
  const nickValid = /^[가-힣a-zA-Z0-9]{2,12}$/.test(nickname);
  const consented = agreeTerms && agreePrivacy && ageConfirmed;
  const canSignup = idValid && pwValid && pwMatch && nickValid && consented
    && idStatus !== 'taken' && nickStatus !== 'taken';

  // 아이디 중복 확인 (디바운스)
  useEffect(() => {
    if (mode !== 'signup' || !idValid) { setIdStatus('idle'); return; }
    setIdStatus('checking');
    const timer = setTimeout(() => {
      checkLoginId(loginId)
        .then((available) => setIdStatus(available ? 'ok' : 'taken'))
        .catch(() => setIdStatus('idle'));
    }, 400);
    return () => clearTimeout(timer);
  }, [loginId, idValid, mode]);

  // 닉네임 중복 확인 (디바운스)
  useEffect(() => {
    if (mode !== 'signup' || !nickValid) { setNickStatus('idle'); return; }
    setNickStatus('checking');
    const timer = setTimeout(() => {
      checkNickname(nickname)
        .then((available) => setNickStatus(available ? 'ok' : 'taken'))
        .catch(() => setNickStatus('idle'));
    }, 400);
    return () => clearTimeout(timer);
  }, [nickname, nickValid, mode]);

  const submit = async () => {
    setMessage(null);
    if (mode === 'signup' && !canSignup) {
      setMessage('입력값을 확인해주세요.');
      return;
    }
    if (mode === 'login' && (!loginId.trim() || !password)) {
      setMessage('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        await signup(loginId.trim(), password, nickname.trim(), { agreeTerms, agreePrivacy, ageConfirmed });
        setMessage('등록 완료! 이제 로그인해주세요.');
        setMode('login');
        setPassword('');
        setPasswordConfirm('');
      } else {
        await login(loginId.trim(), password);
        setMember(await fetchMe());
        navigate('/');
      }
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const hint = (status: Availability, valid: boolean, invalidText: string, takenText: string) => {
    if (!valid) return <span className="field-hint">{invalidText}</span>;
    if (status === 'checking') return <span className="field-hint">확인 중...</span>;
    if (status === 'taken') return <span className="field-hint error">{takenText}</span>;
    if (status === 'ok') return <span className="field-hint ok">사용 가능합니다</span>;
    return null;
  };

  return (
    <div className="page-center auth-page">
      <div className="auth-card">
        <h1 className="game-title"><span className="t-heaven">Renova</span> <span className="amp">&amp;</span> <span className="t-abyss">Delve</span></h1>
        <p className="subtitle">천사는 구원을, 악마는 거래를 말한다 — 선택은 인간의 몫</p>
        <p className="tagline">당신의 선택을 AI가 이야기로 이어 쓰는 로그라이크</p>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage(null); }}>
            로그인
          </button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setMessage(null); }}>
            회원가입
          </button>
        </div>

        <div className="field">
          <input placeholder="아이디" value={loginId} autoComplete="username"
            onChange={(e) => setLoginId(e.target.value)} />
          {mode === 'signup' && loginId.length > 0 &&
            hint(idStatus, idValid, '영문·숫자·밑줄 4~20자', '이미 사용 중인 아이디입니다')}
        </div>

        {mode === 'signup' && (
          <div className="field">
            <input placeholder="닉네임 (랭킹에 표시됩니다)" value={nickname} maxLength={12}
              onChange={(e) => setNickname(e.target.value)} />
            {nickname.length > 0 &&
              hint(nickStatus, nickValid, '한글·영문·숫자 2~12자', '이미 사용 중인 닉네임입니다')}
          </div>
        )}

        <div className="field">
          <input type="password" placeholder="비밀번호" value={password}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && mode === 'login' && submit()} />
          {mode === 'signup' && password.length > 0 && !pwValid &&
            <span className="field-hint">영문과 숫자를 포함해 8자 이상</span>}
        </div>

        {mode === 'signup' && (
          <div className="field">
            <input type="password" placeholder="비밀번호 확인" value={passwordConfirm}
              autoComplete="new-password"
              onChange={(e) => setPasswordConfirm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()} />
            {passwordConfirm.length > 0 && !pwMatch &&
              <span className="field-hint error">비밀번호가 일치하지 않습니다</span>}
          </div>
        )}

        {mode === 'signup' && (
          <div className="consent-box">
            <label className="consent-row">
              <input type="checkbox" checked={consented}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  setAgreePrivacy(e.target.checked);
                  setAgeConfirmed(e.target.checked);
                }} />
              <span><strong>아래 내용에 모두 동의합니다</strong></span>
            </label>
            <label className="consent-row">
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
              <span>[필수] <Link to="/terms" target="_blank">이용약관</Link>에 동의합니다</span>
            </label>
            <label className="consent-row">
              <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} />
              <span>
                [필수] <Link to="/privacy" target="_blank">개인정보 수집·이용</Link>에 동의합니다
                <span className="consent-detail">
                  수집 항목: 아이디, 비밀번호, 닉네임 · 목적: 회원 식별과 랭킹 표시 · 보유: 탈퇴 시까지.
                  AI 서사 생성을 위해 게임 진행 정보와 안내자에게 입력한 내용이 OpenAI(미국)로 전송됩니다.
                  동의하지 않을 수 있으나 그 경우 가입할 수 없습니다.
                </span>
              </span>
            </label>
            <label className="consent-row">
              <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} />
              <span>[필수] 만 14세 이상입니다</span>
            </label>
          </div>
        )}

        {message && <p className="auth-message">{message}</p>}

        <button className="primary wide" onClick={submit}
          disabled={busy || (mode === 'signup' && !canSignup)}>
          {busy ? '...' : mode === 'login' ? '왕궁으로 들어가기' : '모험가 등록'}
        </button>

        <p className="legal-links">
          <Link to="/terms">이용약관</Link>
          <span>·</span>
          <Link to="/privacy"><strong>개인정보 처리방침</strong></Link>
        </p>
      </div>
    </div>
  );
}
