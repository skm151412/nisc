import { ElectionStatus } from '../types';

export function getStatusLabel(status: ElectionStatus): string {
  switch (status) {
    case ElectionStatus.UPCOMING:
      return 'Upcoming Election';
    case ElectionStatus.OPEN:
      return 'Voting Open';
    case ElectionStatus.CLOSED:
      return 'Voting Closed (Pending Results)';
    case ElectionStatus.RESULTS:
      return 'Official Results Published';
    default:
      return status;
  }
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user}***@${domain}`;
  }
  return `${user.substring(0, 2)}***${user.substring(user.length - 1)}@${domain}`;
}

export function formatTimestamp(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return isoString;
  }
}
