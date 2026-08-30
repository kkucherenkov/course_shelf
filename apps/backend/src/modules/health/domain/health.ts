export type DependencyStatus = 'ok' | 'degraded' | 'down';

export type OverallStatus = 'ok' | 'degraded' | 'down';

export interface HealthSnapshot {
  status: OverallStatus;
  version: string;
  uptimeSeconds: number;
  dependencies: {
    db: DependencyStatus;
    centrifugo: DependencyStatus;
  };
}

export interface DependencyChecker {
  check(): Promise<DependencyStatus>;
}

export const DB_CHECKER = Symbol('DB_CHECKER');
export const CENTRIFUGO_CHECKER = Symbol('CENTRIFUGO_CHECKER');

export function rollUp(statuses: readonly DependencyStatus[]): OverallStatus {
  if (statuses.includes('down')) return 'down';
  if (statuses.includes('degraded')) return 'degraded';
  return 'ok';
}
