import type { AdminUserRole } from '@app/api-client-ts';

export class UpdateAdminUserCommand {
  constructor(
    readonly id: string,
    readonly patch: { role?: AdminUserRole; banned?: boolean },
  ) {}
}
