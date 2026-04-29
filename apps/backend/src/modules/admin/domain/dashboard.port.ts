import type {
  AdminDashboardLatestScan,
  AdminLibraryListItem,
  AdminScanListItem,
  AdminUserListItem,
  AdminUserRole,
} from '@app/api-client-ts';

export const DASHBOARD_PORT = Symbol('DASHBOARD_PORT');

export interface DashboardSnapshot {
  counts: {
    libraries: number;
    users: number;
    courses: number;
    lessons: number;
  };
  latestScan: AdminDashboardLatestScan | null;
  errorsLast24h: number;
}

export interface DashboardPort {
  getSnapshot(): Promise<DashboardSnapshot>;
  hasAnyUser(): Promise<boolean>;
  listRecentScans(limit: number, libraryId?: string): Promise<AdminScanListItem[]>;
  listAllLibrariesWithCounts(): Promise<AdminLibraryListItem[]>;
  listUsers(filter: { search?: string; limit: number }): Promise<AdminUserListItem[]>;
  findUserById(id: string): Promise<AdminUserListItem | null>;
  updateUser(
    id: string,
    patch: { role?: AdminUserRole; banned?: boolean },
  ): Promise<AdminUserListItem | null>;
}
