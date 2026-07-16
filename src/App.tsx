import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import SetupPage from './pages/SetupPage';
import GamePage from './pages/GamePage';
import ResultPage from './pages/ResultPage';
import RankingPage from './pages/RankingPage';
import CollectionPage from './pages/CollectionPage';
import ErrorBoundary from './components/ErrorBoundary';
import AtmosphereFX from './components/AtmosphereFX';
import type { ReactNode } from 'react';

function Protected({ children }: { children: ReactNode }) {
  const { member, loading } = useAuth();
  if (loading) return <div className="page-center dim">저장된 여정을 불러오는 중...</div>;
  if (!member) return <Navigate to="/auth" replace />;
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
            <Route path="/" element={<Protected><HomePage /></Protected>} />
            <Route path="/setup" element={<Protected><SetupPage /></Protected>} />
            <Route path="/game" element={<Protected><GamePage /></Protected>} />
            <Route path="/result" element={<Protected><ResultPage /></Protected>} />
            <Route path="/ranking" element={<Protected><RankingPage /></Protected>} />
            <Route path="/collection" element={<Protected><CollectionPage /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
