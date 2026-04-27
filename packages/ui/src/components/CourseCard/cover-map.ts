import type { CourseAccent } from './types';

export const COVER: Record<CourseAccent, string> = {
  teal: '#3F8C84',
  amber: '#C8821C',
  indigo: '#6B72B8',
  warm: '#5C5644',
  coral: '#D26B5C',
  neutral: '#454952',
};

export function initials(title: string): string {
  return title
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export function fmtTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${String(hours)}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes)}:${String(secs).padStart(2, '0')}`;
}
