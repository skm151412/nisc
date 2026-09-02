import React, { useState } from 'react';
import { Search, Eye, Filter, Shield, Award } from 'lucide-react';
import { AdminVoteRecord } from '../../services/adminService';

interface VoteRecordsTableProps {
  records: AdminVoteRecord[];
  isLoading: boolean;
}

export const VoteRecordsTable: React.FC<VoteRecordsTableProps> = ({
  records,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [candidateFilter, setCandidateFilter] = useState('ALL');

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.voterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.voterEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.receiptId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCandidate =
      candidateFilter === 'ALL' ||
      rec.candidateId.toLowerCase() === candidateFilter.toLowerCase() ||
      rec.candidateCodename.toLowerCase() === candidateFilter.toLowerCase();

    return matchesSearch && matchesCandidate;
  });

  const formatVoteTime = (iso: string) => {
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
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Vote Details & Audit Ledger</h2>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Admin-Only Visibility
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete voter-to-candidate mapping. Recorded ballots: <strong className="text-slate-800">{records.length}</strong>
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search voter, roll no, receipt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-48 sm:w-56"
            />
          </div>

          <select
            value={candidateFilter}
            onChange={(e) => setCandidateFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">All Candidates</option>
            <option value="zeus">Zeus (Anshul Raj)</option>
            <option value="athena">Athena (Paridhi Gupta)</option>
            <option value="poseidon">Poseidon (Granth Mangukiya)</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <span className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full inline-block animate-spin mr-2 align-middle" />
          Loading authoritative ballot records...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-slate-50 border border-slate-100 p-6">
          <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No vote records match current filter.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {records.length === 0 ? 'No votes have been recorded in the election yet.' : 'Try adjusting your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Voter Name</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Candidate Selected</th>
                <th className="py-3 px-4 font-mono">Receipt ID</th>
                <th className="py-3 px-4">Vote Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record, idx) => (
                <tr key={record.ballotId || idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{record.voterName}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">{record.rollNumber}</td>
                  <td className="py-3 px-4 text-slate-500">{record.voterEmail}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      {record.candidateCodename} — {record.candidateName}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{record.receiptId}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{formatVoteTime(record.voteTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
