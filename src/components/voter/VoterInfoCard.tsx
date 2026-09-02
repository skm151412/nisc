import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Building,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Vote,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { AuthUserProfile, Member } from '../../types';

interface VoterInfoCardProps {
  profile: AuthUserProfile;
  member: Member | null;
  hasVoted: boolean;
  onSignOut: () => void;
}

export const VoterInfoCard: React.FC<VoterInfoCardProps> = ({
  profile,
  member,
  hasVoted,
  onSignOut,
}) => {
  const [showFullEmail, setShowFullEmail] = useState<boolean>(false);

  const displayName =
    member?.name ||
    profile.displayName ||
    (profile.email.includes('@') ? profile.email.split('@')[0] : 'Allowlisted Voter');

  const rollNumber = member?.rollNumber || (profile.email.includes('@') ? profile.email.split('@')[0] : 'Verified');
  const batch = member?.batch || 'Batch 2024 (Y24)';
  const department = member?.department || 'Computer Science & Engineering';
  const state = member?.state || 'ACTIVE';

  // Masked email utility
  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    if (name.length <= 3) {
      return `${name.slice(0, 1)}***@${domain}`;
    }
    return `${name.slice(0, 3)}***${name.slice(-2)}@${domain}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
      {/* Header with Welcome & Logout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shadow-xs">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Verified Voter Profile
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono">1 Person • 1 Vote</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Welcome, {displayName}
            </h2>
          </div>
        </div>

        <button
          id="voter-card-logout-btn"
          onClick={onSignOut}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors self-start sm:self-auto focus:outline-hidden focus:ring-2 focus:ring-slate-400"
          aria-label="Sign out of voter session"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-600" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Grid of Verified Credentials */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Roll Number */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Roll Number
          </span>
          <p className="font-mono text-sm font-bold text-slate-900 truncate">
            {rollNumber}
          </p>
        </div>

        {/* Batch */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Batch
          </span>
          <p className="text-xs font-bold text-slate-900 truncate">
            {batch}
          </p>
        </div>

        {/* Department */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 sm:col-span-2 lg:col-span-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Department
          </span>
          <p className="text-xs font-bold text-slate-900 truncate">
            {department}
          </p>
        </div>

        {/* State */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            State / Status
          </span>
          <p className="text-xs font-bold text-slate-900 truncate">
            {state}
          </p>
        </div>

        {/* Voting Status */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Voting Status
          </span>
          {hasVoted ? (
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Recorded
            </p>
          ) : (
            <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
              <Vote className="w-3.5 h-3.5" />
              Eligible
            </p>
          )}
        </div>
      </div>

      {/* Account Email (Masked / Toggleable) */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Authenticated Account:</span>
          <span className="font-mono font-medium text-slate-700">
            {showFullEmail ? profile.email : maskEmail(profile.email)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowFullEmail(!showFullEmail)}
          className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
        >
          {showFullEmail ? (
            <>
              <EyeOff className="w-3 h-3" />
              <span>Mask</span>
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" />
              <span>Reveal Email</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
