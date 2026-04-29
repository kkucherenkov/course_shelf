export class ListAdminUsersQuery {
  constructor(
    readonly search?: string,
    readonly limit?: number,
  ) {}
}
