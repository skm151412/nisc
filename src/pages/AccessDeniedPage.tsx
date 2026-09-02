import React from 'react';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { AuthUserProfile } from '../types';

interface AccessDeniedPageProps {
  profile: AuthUserProfile;
  onSignOut: () => void;
  onNavigate: (page: string) => void;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  profile,
  onSignOut,
  onNavigate,
}) => {
  return (
    <div className="max-w-md mx-auto py-12 sm:py-20 px-4">
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 sm:p-8 text-center">
        {/* Shield Alert Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-6 shadow-inner">
          <ShieldAlert className="w-7 h-7 text-rose-600" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">
          Access Denied
        </h1>

        {/* Message adhering strictly to section 13 */}
        <div className="space-y-2 text-slate-600 text-sm leading-relaxed mb-6">
          <p className="font-medium text-slate-800">
            This Google account is not registered for this election.
          </p>
          <p className="text-xs text-slate-500">
            Please sign in using your registered NISC account.
          </p>
        </div>

        {/* Authenticated Account Info (User's own email only) */}
        {profile.email && (
          <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">
              Signed in as
            </span>
            <span className="font-mono font-medium text-slate-800 break-all">
              {profile.email}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            id="access-denied-signout-btn"
            onClick={onSignOut}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>

          <button
            id="access-denied-back-btn"
            onClick={() => onNavigate('login')}
            className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
