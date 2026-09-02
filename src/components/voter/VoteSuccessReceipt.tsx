import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, ShieldCheck, Printer, Calendar, FileText, Lock, BarChart3 } from 'lucide-react';
import { Election, ElectionStatus } from '../../types';

interface VoteSuccessReceiptProps {
  receiptId: string;
  timestamp?: string;
  election: Election;
  onNavigateToCandidates?: () => void;
  onNavigateToResults?: () => void;
}

export const VoteSuccessReceipt: React.FC<VoteSuccessReceiptProps> = ({
  receiptId,
  timestamp,
  election,
  onNavigateToCandidates,
  onNavigateToResults,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const formattedDate = timestamp
    ? new Date(timestamp).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
      })
    : new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
      });

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl border border-emerald-200 shadow-md p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Banner: Success Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Vote Successfully Recorded
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                Confirmed
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Thank you for participating in the NISC Election.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            aria-label="Copy receipt ID to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Receipt</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            aria-label="Print vote receipt"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Official Receipt Card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Official Verification Receipt
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-slate-500">
            NISC-LEDGER-2026
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Election
            </span>
            <p className="text-sm font-bold text-slate-900">
              {election.title}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              ID: {election.id}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Status
            </span>
            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Vote Recorded</span>
            </p>
            <p className="text-xs text-slate-500">
              Official Record Confirmed
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1 sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Receipt ID
            </span>
            <p className="font-mono text-lg font-bold text-slate-900 tracking-wider">
              {receiptId}
            </p>
            <p className="text-xs text-slate-500">
              Official verification confirmation
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1 sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Date
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800">
              {formattedDate}
            </p>
            <p className="text-xs text-slate-500">
              Recorded timestamp
            </p>
          </div>
        </div>

        {/* Immutable Notice */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-950">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Your vote cannot be changed.</span>
          </div>
          <p className="text-[11px] leading-relaxed text-emerald-800">
            To preserve ballot privacy, your candidate choice is kept strictly confidential and is not displayed on verification receipts.
          </p>
        </div>

        {/* Official Results Navigation Action if Published */}
        {election.status === ElectionStatus.RESULTS && onNavigateToResults && (
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900">Election Results are Live</p>
              <p className="text-[11px] text-slate-500">Official certified results have been published by the administrator.</p>
            </div>
            <button
              onClick={onNavigateToResults}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>View Official Results</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
