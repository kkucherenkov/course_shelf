/**
 * WHY this file exists:
 * ExternalIdRef is a plain read-only object (not a class instance) that carries
 * a reference to an external identity: the scraper source namespace, the id
 * within that namespace, and an optional canonical URL.
 *
 * A factory `ExternalIdRefVO.from` validates the raw shape — rejecting blank
 * source/externalId and non-URL url values — and returns the plain object.
 * Plain objects (rather than class instances) are used here for ergonomics
 * with Prisma repositories and DTOs that need to spread or serialize the value.
 */
import { ExternalIdRefInvalidError } from './shared.errors';

/** Plain read-only projection of an external identity reference. */
export interface ExternalIdRef {
  readonly source: string;
  readonly externalId: string;
  readonly url?: string;
}

/** Factory class — validates raw input and returns a plain ExternalIdRef. */
export const ExternalIdRefVO = {
  /**
   * Validates and constructs an ExternalIdRef plain object.
   *
   * @param raw Object with unknown-typed fields from e.g. JSON parsing.
   * @throws ExternalIdRefInvalidError when source or externalId are not non-empty strings,
   *   or when url is present but not a valid absolute URL.
   */
  from(raw: { source: unknown; externalId: unknown; url?: unknown }): ExternalIdRef {
    if (typeof raw.source !== 'string' || raw.source.trim().length === 0) {
      throw new ExternalIdRefInvalidError('source must be a non-empty string');
    }
    if (typeof raw.externalId !== 'string' || raw.externalId.trim().length === 0) {
      throw new ExternalIdRefInvalidError('externalId must be a non-empty string');
    }

    const source = raw.source.trim();
    const externalId = raw.externalId.trim();

    let url: string | undefined;
    if (raw.url !== undefined) {
      if (typeof raw.url !== 'string' || raw.url.trim().length === 0) {
        throw new ExternalIdRefInvalidError('url must be a non-empty string when present');
      }
      const rawUrl: string = raw.url.trim();
      // A URI is ASCII by definition (RFC 3986 §2), and the schema declares
      // `format: uri` on this field. `new URL()` is happy to take
      // "https://\u00cf" and IDNA-encode the host, which meant the API accepted
      // input its own contract says is invalid and then stored something the
      // caller never wrote. Enforce the promise instead of papering over it —
      // a caller with a non-ASCII URL sends the percent-encoded form, which is
      // what every HTTP client puts on the wire anyway. Found by the
      // authenticated contract run (#321).
      // eslint-disable-next-line no-control-regex -- the whole point is the non-ASCII range
      if (/[^\u0000-\u007F]/.test(rawUrl)) {
        throw new ExternalIdRefInvalidError(
          `url must be ASCII (RFC 3986); percent-encode non-ASCII characters. Got "${rawUrl}"`,
        );
      }
      try {
        const parsed = new URL(rawUrl);
        // Only absolute HTTP(S) and other common protocol URLs are accepted
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new ExternalIdRefInvalidError(
            `url must use http or https protocol; got "${parsed.protocol}"`,
          );
        }
        // Store the canonical form rather than the raw string, so what the
        // response serves always satisfies the `format: uri` it declares.
        // Ordinary inputs pass through unchanged; a bare host gains its
        // trailing slash.
        url = parsed.href;
      } catch (error) {
        if (error instanceof ExternalIdRefInvalidError) {
          throw error;
        }
        throw new ExternalIdRefInvalidError(`url "${rawUrl}" is not a valid URL`);
      }
    }

    return { source, externalId, ...(url === undefined ? {} : { url }) };
  },
};
