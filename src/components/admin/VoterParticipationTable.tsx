import React, { useState } from 'react';
import { Search, Download, CheckCircle2, CircleDot, Filter, Users } from 'lucide-react';
import { AdminVoterParticipation } from '../../services/adminService';

interface VoterParticipationTableProps {
  voters: AdminVoterParticipation[];
  isLoading: boolean;
  onExportCsv: () => void;
  isExporting: boolean;
}

export const VoterParticipationTable: React.FC<VoterParticipationTableProps> = ({
  voters,
  isLoading,
  onExportCsv,
  isExporting,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VOTED' | 'NOT_VOTED'>('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const filteredVoters = voters.filter((voter) => {
    const matchesSearch =
      voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'VOTED' && voter.hasVoted) ||
      (statusFilter === 'NOT_VOTED' && !voter.hasVoted);

    const matchesBatch =
      batchFilter === 'ALL' || voter.batch.toLowerCase().includes(batchFilter.toLowerCase());

    const matchesDept =
      departmentFilter === 'ALL' ||
      voter.department.toLowerCase().includes(departmentFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesBatch && matchesDept;
  });

  const votedCount = voters.filter((v) => v.hasVoted).length;
  const notVotedCount = voters.length - votedCount;

  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
      {/* Header with Title and CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Voter Participation (All 70 Members)</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {votedCount} Voted • {notVotedCount} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Eligible student population derived from institutional roll allowlist.
          </p>
        </div>

        <button
          type="button"
          id="admin-export-csv-btn"
          onClick={onExportCsv}
          disabled={isExporting}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Exporting CSV...' : 'Export voter participation CSV'}</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, roll no, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200/60 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({voters.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('VOTED')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              statusFilter === 'VOTED'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Voted ({votedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('NOT_VOTED')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              statusFilter === 'NOT_VOTED'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Not Voted ({notVotedCount})
          </button>
        </div>

        {/* Batch Filter */}
        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="ALL">All Batches</option>
          <option value="2024">Batch 2024 (Y24)</option>
          <option value="2025">Batch 2025 (Y25)</option>
          <option value="2026">Batch 2026 (Y26)</option>
        </select>

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="ALL">All Departments</option>
          <option value="Computer Science">CSE</option>
          <option value="AI & Data Science">AI & DS</option>
          <option value="Electronics">ECE</option>
          <option value="Information Technology">IT</option>
        </select>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <span className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full inline-block animate-spin mr-2 align-middle" />
          Loading voter participation records...
        </div>
      ) : filteredVoters.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-slate-50 border border-slate-100 p-6">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No voters found matching criteria.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filters or search terms.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Voter Name</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Vote Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVoters.map((voter, idx) => (
                <tr key={voter.uid || idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{voter.name}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">{voter.rollNumber}</td>
                  <td className="py-3 px-4 text-slate-600">{voter.batch}</td>
                  <td className="py-3 px-4 text-slate-600">{voter.department}</td>
                  <td className="py-3 px-4">
                    {voter.hasVoted ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ✓ Voted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium text-[11px]">
                        <CircleDot className="w-3.5 h-3.5 text-slate-400" />
                        ○ Not Voted
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {voter.hasVoted ? formatTimestamp(voter.votedAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
