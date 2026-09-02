import React from 'react';
import { ElectionStatus } from '../../types';

interface BadgeProps {
  status?: ElectionStatus;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children?: React.ReactNode;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant = 'neutral', children, id }) => {
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = children;

  if (status) {
    switch (status) {
      case ElectionStatus.UPCOMING:
        styleClasses = 'bg-amber-50 text-amber-800 border-amber-200';
        label = label || 'Upcoming';
        break;
      case ElectionStatus.OPEN:
        styleClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-400/20';
        label = label || 'Voting Active';
        break;
      case ElectionStatus.CLOSED:
        styleClasses = 'bg-slate-100 text-slate-800 border-slate-300';
        label = label || 'Polls Closed';
        break;
      case ElectionStatus.RESULTS:
        styleClasses = 'bg-blue-50 text-blue-800 border-blue-200';
        label = label || 'Results Published';
        break;
    }
  } else {
    switch (variant) {
      case 'success':
        styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'warning':
        styleClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'danger':
        styleClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'info':
        styleClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      case 'neutral':
      default:
        styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
    }
  }

  return (
    <span
      id={id}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border whitespace-nowrap ${styleClasses}`}
    >
      {label}
    </span>
  );
};
