import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  id?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'System Notice',
  message,
  onRetry,
  id = 'error-message-box',
}) => {
  return (
    <div
      id={id}
      className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-rose-900 transition-all"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-rose-900 leading-tight">{title}</h4>
          <p className="mt-1 text-sm text-rose-700 leading-relaxed break-words">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 hover:text-rose-950 bg-rose-100/80 hover:bg-rose-200/80 px-3 py-1.5 rounded-md transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
