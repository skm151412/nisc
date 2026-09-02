import React from 'react';
import { ShieldCheck, History, UserCheck, Key, Lock } from 'lucide-react';
import { AuditLog } from '../../types';

interface AdminAuditLogViewProps {
  logs: AuditLog[];
  isLoading: boolean;
}

export const AdminAuditLogView: React.FC<AdminAuditLogViewProps> = ({
  logs,
  isLoading,
}) => {
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ADMIN_LOGIN':
        return <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">ADMIN_LOGIN</span>;
      case 'ELECTION_OPENED':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold">ELECTION_OPENED</span>;
      case 'ELECTION_CLOSED':
        return <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-mono text-[10px] font-bold">ELECTION_CLOSED</span>;
      case 'RESULTS_PUBLISHED':
        return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-mono text-[10px] font-bold">RESULTS_PUBLISHED</span>;
      case 'VOTE_CAST':
        return <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-mono text-[10px] font-bold">VOTE_CAST</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">{action}</span>;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Admin & System Activity</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official system activity and administration log.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 font-mono">
          {logs.length} logged events
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          Loading audit events...
        </div>
      ) : logs.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          No administrative events recorded yet.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={log.id || idx} className="p-3.5 bg-white hover:bg-slate-50/50 transition-colors flex items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {getActionBadge(log.action)}
                <div className="truncate">
                  <span className="font-semibold text-slate-800">{log.actorEmail}</span>
                  {log.electionId && (
                    <span className="text-slate-400 text-[11px] ml-2">({log.electionId})</span>
                  )}
                </div>
              </div>
              <span className="font-mono text-slate-400 text-[11px] shrink-0">
                {formatTimestamp(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
