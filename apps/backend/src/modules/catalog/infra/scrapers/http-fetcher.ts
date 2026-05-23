/**
 * WHY this file exists:
 * The single outbound-HTTP egress point for the scraping subsystem. Wraps the
 * Node-native fetch with a timeout, a response-size cap, a fixed User-Agent,
 * a bounded redirect chain, and an SSRF guard that resolves the hostname and
 * rejects loopback / private / link-local / cloud-metadata addresses on every
 * hop. Self-hosted single-admin threat model — the guard is defence-in-depth.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import { ScrapeFetchError } from '../../domain/scraper/scraper.errors';

export interface HttpFetcherConfig {
  readonly httpTimeoutMs: number;
  readonly maxResponseBytes: number;
  readonly userAgent: string;
  /** Test-only: permit loopback targets so the spec can hit a local server. Never set in prod. */
  readonly allowLoopbackForTests?: boolean;
}

export interface FetchResult {
  readonly status: number;
  readonly headers: Headers;
  readonly body: string;
}

const MAX_REDIRECTS = 5;

function ipIsBlocked(ip: string, allowLoopback: boolean): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const parts = ip.split('.').map(Number);
    const a = parts[0] ?? 0;
    const b = parts[1] ?? 0;
    if (a === 0) return true;
    if (a === 127) return !allowLoopback; // loopback
    if (a === 10) return true; // private
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 169 && b === 254) return true; // link-local + metadata
    return false;
  }
  if (v === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1') return !allowLoopback; // loopback
    if (lower === '::') return true;
    // IPv4-mapped IPv6 (::ffff:a.b.c.d) — delegate to IPv4 rules so that
    // ::ffff:169.254.169.254, ::ffff:10.x.x.x, ::ffff:192.168.x.x etc. are blocked.
    if (lower.startsWith('::ffff:')) {
      const embedded = lower.slice(7); // e.g. "169.254.169.254"
      if (isIP(embedded) === 4) return ipIsBlocked(embedded, allowLoopback);
    }
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique-local fc00::/7
    if (lower.startsWith('fe80')) return true; // link-local
    return false;
  }
  return true; // not a literal IP — caller resolves DNS first
}

/** Resolve hostname (or accept literal IP) and decide whether it must be blocked. */
export async function isBlockedHostname(hostname: string, allowLoopback = false): Promise<boolean> {
  if (isIP(hostname) !== 0) {
    return ipIsBlocked(hostname, allowLoopback);
  }
  try {
    const records = await lookup(hostname, { all: true });
    if (records.length === 0) return true;
    return records.some((r) => ipIsBlocked(r.address, allowLoopback));
  } catch {
    return true; // unresolvable → block
  }
}

export class HttpFetcher {
  constructor(private readonly config: HttpFetcherConfig) {}

  async fetchText(rawUrl: string): Promise<FetchResult> {
    let currentUrl = rawUrl;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const url = this.parseAndGuard(currentUrl);

      const guardBlocked = await isBlockedHostname(
        url.hostname,
        this.config.allowLoopbackForTests ?? false,
      );
      if (guardBlocked) {
        throw new ScrapeFetchError(rawUrl, new Error(`Blocked address for host ${url.hostname}`));
      }

      const res = await this.doFetch(url, rawUrl);
      const location = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && location) {
        currentUrl = new URL(location, url).toString();
        continue;
      }
      return res;
    }
    throw new ScrapeFetchError(rawUrl, new Error('Too many redirects'));
  }

  private parseAndGuard(rawUrl: string): URL {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new ScrapeFetchError(rawUrl, new Error('Malformed URL'));
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new ScrapeFetchError(rawUrl, new Error(`Unsupported scheme ${url.protocol}`));
    }
    return url;
  }

  private async doFetch(url: URL, rawUrl: string): Promise<FetchResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.config.httpTimeoutMs);
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'user-agent': this.config.userAgent, accept: 'text/html,application/json' },
      });
      if (res.status >= 300 && res.status < 400) {
        return { status: res.status, headers: res.headers, body: '' };
      }
      const body = await this.readCapped(res, rawUrl);
      return { status: res.status, headers: res.headers, body };
    } catch (error) {
      if (error instanceof ScrapeFetchError) throw error;
      throw new ScrapeFetchError(rawUrl, error);
    } finally {
      clearTimeout(timer);
    }
  }

  private async readCapped(res: Response, rawUrl: string): Promise<string> {
    if (!res.body) return '';
    // Cast to well-typed reader — undici's ReadableStream<Uint8Array> is compatible
    // at runtime but the @types/node declaration loses the generic under CommonJS.
    const reader = res.body.getReader() as ReadableStreamDefaultReader<Uint8Array>;
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > this.config.maxResponseBytes) {
        await reader.cancel();
        throw new ScrapeFetchError(rawUrl, new Error('Response exceeds max size'));
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString('utf8');
  }
}
