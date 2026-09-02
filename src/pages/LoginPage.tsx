import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2, UserCheck, ShieldAlert, LogOut } from 'lucide-react';
import { AuthUserProfile } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface LoginPageProps {
  profile: AuthUserProfile;
  onSignIn: () => Promise<AuthUserProfile>;
  onSignOut: () => void;
  onNavigate: (page: string) => void;
  authActionLoading: boolean;
  authError: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  profile,
  onSignIn,
  onSignOut,
  onNavigate,
  authActionLoading,
  authError,
}) => {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    try {
      const userProfile = await onSignIn();
      if (userProfile.role === 'ADMIN') {
        onNavigate('admin');
      } else if (userProfile.role === 'VOTER') {
        onNavigate('voter');
      } else {
        onNavigate('access-denied');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication could not be completed.';
      if (!msg.includes('auth/popup-closed-by-user')) {
        setLocalError(msg);
      }
    }
  };

  const displayError = localError || authError;
  const isAuthenticated = profile.role !== 'UNAUTHENTICATED';

  return (
    <div className="max-w-md mx-auto py-8 sm:py-16 px-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Top Emblem */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 shadow-inner">
          <ShieldCheck className="w-7 h-7 text-blue-600" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          NISC Election
        </h1>
        <p className="text-sm font-medium text-slate-500 mb-8">
          Secure Student Election Portal
        </p>

        {/* Error notification */}
        {displayError && (
          <div
            id="login-error-box"
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-left flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-rose-900">Authentication Error</p>
              <p className="text-xs text-rose-700 mt-0.5">{displayError}</p>
            </div>
          </div>
        )}

        {/* Dynamic State: Authenticated vs Unauthenticated */}
        {isAuthenticated ? (
          <div className="space-y-4 text-left p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">
                {profile.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500">Currently Signed In</p>
                <p className="text-sm font-bold text-slate-900 truncate">{profile.email}</p>
                <span
                  className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                    profile.role === 'ADMIN'
                      ? 'bg-amber-100 text-amber-800'
                      : profile.role === 'VOTER'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {profile.role === 'ADMIN'
                    ? 'Election Administrator'
                    : profile.role === 'VOTER'
                    ? 'Verified Allowlisted Voter'
                    : 'Unauthorized Account'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {profile.role === 'ADMIN' && (
                <button
                  id="login-go-admin-btn"
                  onClick={() => onNavigate('admin')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Go to Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {profile.role === 'VOTER' && (
                <button
                  id="login-go-voter-btn"
                  onClick={() => onNavigate('voter')}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <span>Go to Voter Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {profile.role === 'UNAUTHORIZED' && (
                <button
                  id="login-go-denied-btn"
                  onClick={() => onNavigate('access-denied')}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>View Access Restriction Notice</span>
                  <ShieldAlert className="w-4 h-4" />
                </button>
              )}

              <button
                id="login-signout-btn"
                onClick={onSignOut}
                disabled={authActionLoading}
                className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs border border-slate-300 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch / Sign Out Google Account</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Primary Google Login Action */}
            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={authActionLoading}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 shadow-xs flex items-center justify-center gap-3 transition-all hover:border-slate-400 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {authActionLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  {/* Google G Logo SVG */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <p className="text-xs text-slate-500 leading-relaxed pt-2">
              Only registered NISC members can participate.
            </p>
          </div>
        )}

        {/* Official Portal Notice */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-6 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Official Student Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
