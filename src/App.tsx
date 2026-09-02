/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { VoterPortalPage } from './pages/VoterPortalPage';
import { AdminPage } from './pages/AdminPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { SecurityTestsPage } from './pages/SecurityTestsPage';
import { ElectionPage } from './pages/ElectionPage';
import { ResultsPage } from './pages/ResultsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminReadinessPage } from './pages/AdminReadinessPage';
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/common/LoadingSpinner';

function getPageFromPath(pathname: string): string {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!cleanPath || cleanPath === 'home') return 'home';
  if (cleanPath === 'login') return 'login';
  if (cleanPath === 'voter') return 'voter';
  if (cleanPath === 'candidates' || cleanPath.startsWith('candidate/') || cleanPath === 'elections') return 'candidates';
  if (cleanPath === 'results') return 'results';
  if (cleanPath === 'admin/readiness' || cleanPath === 'admin-readiness') return 'admin-readiness';
  if (cleanPath === 'admin') return 'admin';
  if (cleanPath === 'access-denied') return 'access-denied';
  if (cleanPath === 'tests') return 'tests';
  return '404';
}

function getPathFromPage(page: string): string {
  if (page === 'home') return '/';
  if (page === 'candidates' || page === 'elections') return '/candidates';
  if (page === 'admin-readiness') return '/admin/readiness';
  return `/${page}`;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    return getPageFromPath(window.location.pathname);
  });

  const {
    profile,
    loading,
    authActionLoading,
    error,
    signIn,
    signOut,
  } = useAuth();

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route protection rules enforcement
  useEffect(() => {
    if (loading) return;

    if (currentPage === 'voter') {
      if (profile.role === 'UNAUTHENTICATED') {
        setCurrentPage('login');
      } else if (profile.role === 'UNAUTHORIZED') {
        setCurrentPage('access-denied');
      }
    } else if (currentPage === 'admin' || currentPage === 'admin-readiness') {
      if (profile.role === 'UNAUTHENTICATED') {
        setCurrentPage('login');
      } else if (profile.role !== 'ADMIN') {
        setCurrentPage('access-denied');
      }
    }
  }, [currentPage, profile.role, loading]);

  const handleNavigate = (page: string) => {
    let targetPage = page;
    if (targetPage === 'elections') targetPage = 'candidates';

    // Intercept protected routes before navigating
    if (targetPage === 'voter') {
      if (profile.role === 'UNAUTHENTICATED') {
        targetPage = 'login';
      } else if (profile.role === 'UNAUTHORIZED') {
        targetPage = 'access-denied';
      }
    } else if (targetPage === 'admin' || targetPage === 'admin-readiness') {
      if (profile.role === 'UNAUTHENTICATED') {
        targetPage = 'login';
      } else if (profile.role !== 'ADMIN') {
        targetPage = 'access-denied';
      }
    }

    setCurrentPage(targetPage);
    const newPath = getPathFromPage(targetPage);
    if (window.location.pathname !== newPath && targetPage !== '404') {
      window.history.pushState({}, '', newPath);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    handleNavigate('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-slate-400">Loading Election Portal...</p>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <LoginPage
            profile={profile}
            onSignIn={signIn}
            onSignOut={handleSignOut}
            onNavigate={handleNavigate}
            authActionLoading={authActionLoading}
            authError={error}
          />
        );
      case 'voter':
        return (
          <VoterPortalPage
            profile={profile}
            onSignOut={handleSignOut}
            onNavigate={handleNavigate}
          />
        );
      case 'candidates':
      case 'elections':
        return <ElectionPage />;
      case 'results':
        return <ResultsPage profile={profile} onNavigate={handleNavigate} />;
      case 'admin':
        return (
          <AdminPage
            profile={profile}
            onSignOut={handleSignOut}
            onNavigate={handleNavigate}
          />
        );
      case 'admin-readiness':
        return (
          <AdminReadinessPage
            profile={profile}
            onNavigate={handleNavigate}
          />
        );
      case 'access-denied':
        return (
          <AccessDeniedPage
            profile={profile}
            onSignOut={handleSignOut}
            onNavigate={handleNavigate}
          />
        );
      case 'tests':
        return <SecurityTestsPage />;
      case 'home':
        return (
          <HomePage
            profile={profile}
            onNavigate={handleNavigate}
            onSignIn={signIn}
            authActionLoading={authActionLoading}
          />
        );
      case '404':
      default:
        return <NotFoundPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      profile={profile}
      onSignOut={handleSignOut}
    >
      {renderCurrentPage()}
    </AppLayout>
  );
}
