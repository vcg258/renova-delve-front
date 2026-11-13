import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import SetupPage from './pages/SetupPage';
import GamePage from './pages/GamePage';
import ResultPage from './pages/ResultPage';
import RankingPage from './pages/RankingPage';
import CollectionPage from './pages/CollectionPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import LegalPage from './pages/LegalPage';
import ErrorBoundary from './components/ErrorBoundary';
import AtmosphereFX from './components/AtmosphereFX';
import type { ReactNode } from 'react';

function Protected({ children }: { children: ReactNode }) {
  const { member, loading } = useAuth();
  if (loading) return <div className="page-center dim">저장된 여정을 불러오는 중...</div>;
  if (!member) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

/** 관리자 전용 라우트 (서버에서도 ROLE_ADMIN으로 재검증됨) */
function AdminOnly({ children }: { children: ReactNode }) {
  const { member, loading } = useAuth();
  if (loading) return <div className="page-center dim">권한을 확인하는 중...</div>;
  if (!member) return <Navigate to="/auth" replace />;
  if (member.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AtmosphereFX />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            {/* 약관·처리방침은 가입 전에도 볼 수 있어야 하므로 로그인 없이 공개 */}
            <Route path="/terms" element={<LegalPage kind="terms" />} />
            <Route path="/privacy" element={<LegalPage kind="privacy" />} />
            <Route path="/" element={<Protected><HomePage /></Protected>} />
            <Route path="/setup" element={<Protected><SetupPage /></Protected>} />
            <Route path="/game" element={<Protected><GamePage /></Protected>} />
            <Route path="/result" element={<Protected><ResultPage /></Protected>} />
            <Route path="/ranking" element={<Protected><RankingPage /></Protected>} />
            <Route path="/collection" element={<Protected><CollectionPage /></Protected>} />
            <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
            <Route path="/admin" element={<AdminOnly><AdminPage /></AdminOnly>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
