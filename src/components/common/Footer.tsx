import React from 'react';
import { SYSTEM_CONSTANTS } from '../../config/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="font-bold text-slate-800 text-sm">
              NISC Election Portal
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              NISC Executive Council General Election 2026
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 font-medium">
            <a href="/" className="hover:text-blue-600 transition-colors">
              Home
            </a>
            <a href="/candidates" className="hover:text-blue-600 transition-colors">
              Candidates
            </a>
            <a href="/results" className="hover:text-blue-600 transition-colors">
              Results
            </a>
          </div>

          <div className="text-slate-400 text-xs text-center sm:text-right">
            © 2026 NISC. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
