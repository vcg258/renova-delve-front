import { useEffect, useState } from 'react';
import LegalLinks from '../components/LegalLinks';
import { useNavigate } from 'react-router-dom';
import { changeContact, changeNickname, changePassword, exportMyData, fetchMe, withdraw } from '../api/auth';
import { isValidEmail, isValidName } from '../utils/account';
import { clearGuideHistory, getAchievements, getHistory } from '../api/game';
import type { Achievement, GameHistory } from '../api/types';
import Px from '../components/Px';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

const RESULT_ICON: Record<string, string> = {
  PLAYING: 'sword', CLEAR: 'crown', DEFEAT: 'grave', ABANDON: 'door', NONE: 'door',
};

const RESULT_LABEL: Record<string, string> = {
  PLAYING: '진행 중',
  CLEAR: '클리어',
  DEFEAT: '전사',
  ABANDON: '포기',
  NONE: '종료',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { member, setMember, signOut } = useAuth();

  const [nickname, setNickname] = useState(member?.nickname ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [contactName, setContactName] = useState(member?.name ?? '');
  const [contactEmail, setContactEmail] = useState(member?.email ?? '');
  const [contactPassword, setContactPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    getAchievements().then(setAchievements).catch(() => setAchievements([]));
    getHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  const nickValid = /^[가-힣a-zA-Z0-9]{2,12}$/.test(nickname);
  const pwValid = newPassword.length >= 8 && /[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword);
  const pwMatch = newPassword.length > 0 && newPassword === newPasswordConfirm;

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitNickname = () => run(async () => {
    await changeNickname(nickname.trim());
    setMember(await fetchMe());
    setMessage('닉네임이 변경되었습니다.');
  });

  const needsPasswordForContact = member?.hasPassword !== false;
  const contactChanged = contactName.trim() !== (member?.name ?? '')
    || contactEmail.trim().toLowerCase() !== (member?.email ?? '');
  const contactValid = isValidName(contactName) && isValidEmail(contactEmail)
    && (!needsPasswordForContact || contactPassword.length > 0);

  const submitContact = () => run(async () => {
    await changeContact(contactName.trim(), contactEmail.trim(), needsPasswordForContact ? contactPassword : null);
    setMember(await fetchMe());
    setContactPassword('');
    setMessage('이름과 이메일을 저장했습니다.');
  });

  const submitPassword = () => run(async () => {
    await changePassword(currentPassword, newPassword);
    setMessage('비밀번호가 변경되었습니다. 보안을 위해 다시 로그인해주세요.');
    setTimeout(() => { signOut().finally(() => navigate('/auth')); }, 1600);
  });

  const downloadMyData = () => run(async () => {
    const data = await exportMyData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'renova-delve-my-data.json';
    link.click();
    URL.revokeObjectURL(url);
    setMessage('내 정보를 파일로 내려받았습니다.');
  });

  const eraseGuideChat = () => {
    if (!confirm('AI 안내자와 나눈 대화 기록을 서버에서 삭제할까요?')) return;
    run(async () => {
      await clearGuideHistory();
      setMessage('AI 안내자 대화 기록을 삭제했습니다.');
    });
  };

  const submitWithdraw = () => {
    if (!confirm('정말 탈퇴하시겠습니까?\n진행 중인 게임은 종료되며, 랭킹 기록은 익명으로 남습니다.')) return;
    if (!confirm('되돌릴 수 없습니다. 계속하시겠습니까?')) return;
    run(async () => {
      await withdraw();
      setMember(null);
      navigate('/auth');
    });
  };

  if (!member) return <div className="page-center dim">불러오는 중...</div>;

  return (
    <div className="page profile-page">
      <header className="setup-header">
        <button className="ghost" onClick={() => navigate('/')}>← 돌아가기</button>
        <h2><Px s="key" /> 내 정보</h2>
        <span />
      </header>

      <section className="setup-section">
        <div className="profile-summary">
          <div className="profile-avatar">{member.nickname.charAt(0)}</div>
          <div className="profile-meta">
            <strong className="profile-name">
              {member.nickname}
              {member.role === 'ADMIN' && <span className="role-chip admin">운영자</span>}
            </strong>
            <span className="dim small">@{member.loginId}</span>
            <span className="dim small">가입 {member.createdAt?.slice(0, 10)}</span>
          </div>
          <div className="profile-stats">
            <div><span className="dim small">최고 점수</span><strong><Px s="star" /> {member.bestScore}</strong></div>
            <div><span className="dim small">도감 수집</span><strong><Px s="book" /> {member.collectionCount}</strong></div>
          </div>
        </div>
      </section>

      {message && <p className="auth-message" style={{ textAlign: 'center' }}>{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <section className="setup-section">
        <h3>닉네임 변경</h3>
        <div className="inline-form">
          <input value={nickname} maxLength={12} onChange={(e) => setNickname(e.target.value)}
            placeholder="한글·영문·숫자 2~12자" />
          <button className="primary" disabled={busy || !nickValid || nickname === member.nickname}
            onClick={submitNickname}>변경</button>
        </div>
        {nickname.length > 0 && !nickValid && <span className="field-hint">한글·영문·숫자 2~12자</span>}
      </section>

      <section className="setup-section">
        <h3>이름과 이메일</h3>
        {!member.email ? (
          <p className="contact-warning">
            이메일이 등록되어 있지 않습니다. 등록하지 않으면 아이디나 비밀번호를 잊었을 때 찾을 방법이 없습니다.
          </p>
        ) : (
          <p className="dim small">아이디 찾기와 비밀번호 재설정 메일이 이 이메일로 갑니다.</p>
        )}
        <div className="stacked-form">
          <input placeholder="이름 (한글·영문 2~30자)" value={contactName} maxLength={30} autoComplete="name"
            onChange={(e) => setContactName(e.target.value)} />
          {contactName.length > 0 && !isValidName(contactName) && <span className="field-hint">한글·영문 2~30자</span>}
          <input type="email" placeholder="이메일" value={contactEmail} maxLength={254} autoComplete="email"
            onChange={(e) => setContactEmail(e.target.value)} />
          {contactEmail.length > 0 && !isValidEmail(contactEmail) && <span className="field-hint">이메일 형식을 확인해주세요</span>}
          {needsPasswordForContact && (
            <input type="password" placeholder="현재 비밀번호 (본인 확인)" value={contactPassword}
              autoComplete="current-password" onChange={(e) => setContactPassword(e.target.value)} />
          )}
          <button className="primary" disabled={busy || !contactValid || !contactChanged} onClick={submitContact}>
            {member.email ? '변경' : '등록'}
          </button>
        </div>
      </section>

      <section className="setup-section">
        <h3>비밀번호 변경</h3>
        <div className="stacked-form">
          <input type="password" placeholder="현재 비밀번호" value={currentPassword}
            autoComplete="current-password" onChange={(e) => setCurrentPassword(e.target.value)} />
          <input type="password" placeholder="새 비밀번호 (영문+숫자 8자 이상)" value={newPassword}
            autoComplete="new-password" onChange={(e) => setNewPassword(e.target.value)} />
          <input type="password" placeholder="새 비밀번호 확인" value={newPasswordConfirm}
            autoComplete="new-password" onChange={(e) => setNewPasswordConfirm(e.target.value)} />
          {newPassword.length > 0 && !pwValid && <span className="field-hint">영문과 숫자를 포함해 8자 이상</span>}
          {newPasswordConfirm.length > 0 && !pwMatch && <span className="field-hint error">비밀번호가 일치하지 않습니다</span>}
          <button className="primary" disabled={busy || !currentPassword || !pwValid || !pwMatch}
            onClick={submitPassword}>비밀번호 변경</button>
        </div>
      </section>

      <section className="setup-section">
        <h3>
          업적 <span className="dim small">{achievements.filter((a) => a.achieved).length} / {achievements.length}</span>
        </h3>
        <div className="achievement-grid">
          {achievements.map((a) => (
            <div key={a.code} className={`achievement ${a.achieved ? 'achieved' : ''}`}>
              <Px s={a.achieved ? 'trophy' : 'question'} size={32} />
              <span className="achievement-text">
                <strong>{a.title}</strong>
                <span className="dim small">{a.description}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h3>최근 모험</h3>
        {history.length === 0 ? (
          <p className="dim small">아직 기록이 없습니다.</p>
        ) : (
          <div className="history-list">
            {history.map((h) => (
              <div key={h.gameStateId} className={`history-row ${(h.result ?? 'none').toLowerCase()}`}>
                <span className="history-result"><Px s={RESULT_ICON[h.result ?? 'NONE']} /> {RESULT_LABEL[h.result ?? 'NONE']}</span>
                <span>{h.difficulty}</span>
                <span>스테이지 {h.stage}-{h.node}</span>
                <span className="history-score"><Px s="star" /> {h.score}</span>
                <span className="dim small">{h.startedAt?.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="setup-section">
        <h3>개인정보 관리</h3>
        <p className="dim small">
          서비스가 보관 중인 내 정보를 확인하거나, AI 안내자와의 대화 기록을 지울 수 있습니다.
          대화 기록은 마지막 이용 후 30일이 지나면 자동으로 삭제됩니다.
        </p>
        <div className="inline-form">
          <button className="mini" disabled={busy} onClick={downloadMyData}>내 정보 내려받기</button>
          <button className="mini" disabled={busy} onClick={eraseGuideChat}>AI 대화 기록 삭제</button>
        </div>
        <LegalLinks className="left" />
      </section>

      <section className="setup-section danger-zone">
        <h3>계정 탈퇴</h3>
        <p className="dim small">
          탈퇴하면 아이디·비밀번호·닉네임·이름·이메일과 AI 대화 기록이 즉시 삭제되며 되돌릴 수 없습니다.
          랭킹 기록은 누구의 것인지 알 수 없는 익명 상태로 남습니다.
        </p>
        <button className="mini danger" disabled={busy} onClick={submitWithdraw}>탈퇴하기</button>
      </section>
    </div>
  );
}
