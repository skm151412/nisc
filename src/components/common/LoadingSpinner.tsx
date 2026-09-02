import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading election data...',
  size = 'md',
  id = 'loading-spinner',
}) => {
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 32 : 24;

  return (
    <div id={id} className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      <Loader2
        size={iconSize}
        className="animate-spin text-slate-700 stroke-[2.2]"
        aria-hidden="true"
      />
      {message && <p className="text-sm font-medium text-slate-600">{message}</p>}
    </div>
  );
};
