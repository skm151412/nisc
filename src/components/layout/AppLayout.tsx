import React from 'react';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { useFirebase } from '../../hooks/useFirebase';
import { AuthUserProfile } from '../../types';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  profile: AuthUserProfile;
  onSignOut: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentPage,
  onNavigate,
  profile,
  onSignOut,
}) => {
  const { isConfigured, configStatus } = useFirebase();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      <Header
        currentPage={currentPage}
        onNavigate={onNavigate}
        isConfigured={isConfigured}
        isEmulator={configStatus.isEmulator}
        profile={profile}
        onSignOut={onSignOut}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Footer />
    </div>
  );
};
