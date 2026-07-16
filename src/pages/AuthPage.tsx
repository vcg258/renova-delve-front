import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup, fetchMe } from '../api/auth';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(
    new URLSearchParams(window.location.search).has('expired')
      ? '세션이 만료되었습니다. 다시 로그인해주세요.'
      : null,
  );
  const [busy, setBusy] = useState(false);
  const { setMember } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    if (!loginId.trim() || !password) {
      setMessage('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'signup') {
        await signup(loginId.trim(), password);
        setMessage('회원가입 완료! 이제 로그인해주세요.');
        setMode('login');
      } else {
        await login(loginId.trim(), password);
        setMember(await fetchMe());
        navigate('/');
      }
    } catch (err) {
      setMessage(mode === 'login' ? '로그인 실패: 아이디 또는 비밀번호를 확인해주세요.' : errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-center auth-page">
      <div className="auth-card">
        <h1 className="game-title">Renova <span className="amp">&amp;</span> Delve</h1>
        <p className="subtitle">AI가 써 내려가는, 매번 다른 서사의 로그라이크</p>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>로그인</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>회원가입</button>
        </div>

        <input
          placeholder="아이디"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {message && <p className="auth-message">{message}</p>}

        <button className="primary wide" onClick={submit} disabled={busy}>
          {busy ? '...' : mode === 'login' ? '왕궁으로 들어가기' : '모험가 등록'}
        </button>
      </div>
    </div>
  );
}
