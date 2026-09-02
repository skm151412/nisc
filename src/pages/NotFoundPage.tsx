/**
 * 404 - Page Not Found Fallback
 */

import React from 'react';
import { FileQuestion, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (page: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <div className="p-8 sm:p-10 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            The page you're looking for doesn't exist.
          </p>
        </div>

        <div className="pt-2">
          <button
            id="return-home-btn"
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
