/**
 * WHY this file exists:
 * Query payload for the recently-completed home-row endpoint. The actor carries
 * id + role so the handler can apply AuthorizationService.canSee filtering.
 * The limit defaults to 10 at the controller layer; the handler caps it.
 */
export class GetRecentlyCompletedQuery {
  constructor(
    public readonly actor: { id: string; role: string },
    public readonly limit: number,
  ) {}
}
