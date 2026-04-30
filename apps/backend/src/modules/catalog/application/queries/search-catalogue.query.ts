import type { AuthorizationActor } from '../../../../common/access/authorization.service';

export class SearchCatalogueQuery {
  constructor(
    /** Raw query string — handler will trim and validate length. */
    public readonly q: string,
    /** Maximum hits per result list (courses / lessons). Clamped 1–100, default 20. */
    public readonly limit: number,
    public readonly actor: AuthorizationActor,
  ) {}
}
