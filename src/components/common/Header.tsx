import React, { useState } from 'react';
import { Vote, Lock, UserCheck, LogOut, Award, BarChart3, Home, Menu, X, User } from 'lucide-react';
import { SYSTEM_CONSTANTS } from '../../config/constants';
import { AuthUserProfile } from '../../types';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isConfigured: boolean;
  isEmulator: boolean;
  profile: AuthUserProfile;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  profile,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = profile.role !== 'UNAUTHENTICATED';
  const isAdmin = profile.role === 'ADMIN' && profile.isAdmin;

  const handleNavClick = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div
            id="brand-logo-container"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-base tracking-wider shadow-sm">
              N
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">
                NISC
              </span>
              <span className="text-xs text-slate-400 font-medium block -mt-0.5">
                Election Portal
              </span>
            </div>
          </div>

          {/* Desktop Navigation Items */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              id="nav-link-home"
              onClick={() => handleNavClick('home')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                currentPage === 'home'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              id="nav-link-candidates"
              onClick={() => handleNavClick('candidates')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                currentPage === 'candidates' || currentPage === 'elections'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Candidates</span>
            </button>

            {/* Vote link (Shown for everyone or voters; if not signed in, will guide to sign in) */}
            {!isAdmin && (
              <button
                id="nav-link-vote"
                onClick={() => handleNavClick('voter')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  currentPage === 'voter' || currentPage === 'voter-portal'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Vote className="w-4 h-4" />
                <span>Vote</span>
              </button>
            )}

            <button
              id="nav-link-results"
              onClick={() => handleNavClick('results')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                currentPage === 'results'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Results</span>
            </button>

            {/* Admin navigation: Strictly visible only after verified admin authentication */}
            {isAdmin && (
              <button
                id="nav-link-admin"
                onClick={() => handleNavClick('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  currentPage === 'admin'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-300 hover:text-white hover:bg-amber-500/20'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* User Auth Status / Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium text-slate-200 max-w-[160px] truncate">
                    {profile.displayName || (profile.email ? profile.email.split('@')[0] : 'Voter')}
                  </span>
                </div>

                <button
                  id="header-signout-btn"
                  onClick={onSignOut}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                id="header-signin-btn"
                onClick={() => handleNavClick('login')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-xs"
              >
                <UserCheck className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1.5 animate-in slide-in-from-top-2">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
              currentPage === 'home' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleNavClick('candidates')}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
              currentPage === 'candidates' || currentPage === 'elections'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Candidates</span>
          </button>

          {!isAdmin && (
            <button
              onClick={() => handleNavClick('voter')}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
                currentPage === 'voter' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>Vote</span>
            </button>
          )}

          <button
            onClick={() => handleNavClick('results')}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
              currentPage === 'results' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Results</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
                currentPage === 'admin' ? 'bg-amber-600 text-white' : 'text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Admin</span>
            </button>
          )}

          <div className="pt-3 mt-2 border-t border-slate-800">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-1.5 text-xs text-slate-400 truncate">
                  Signed in as <span className="font-semibold text-white">{profile.email}</span>
                </div>
                <button
                  onClick={() => {
                    onSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white"
              >
                <UserCheck className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
