// http-fetcher.spec.ts
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ScrapeBotChallengeError, ScrapeFetchError } from '../../domain/scraper/scraper.errors';
import { HttpFetcher, isBlockedHostname, isBotChallengeResponse } from './http-fetcher';

const cfg = {
  httpTimeoutMs: 1000,
  maxResponseBytes: 1024,
  userAgent: 'courseShelf-test',
};

describe('isBlockedHostname', () => {
  it('blocks loopback, private, link-local and metadata addresses', async () => {
    expect(await isBlockedHostname('127.0.0.1')).toBe(true);
    expect(await isBlockedHostname('::1')).toBe(true);
    expect(await isBlockedHostname('10.0.0.5')).toBe(true);
    expect(await isBlockedHostname('192.168.1.1')).toBe(true);
    expect(await isBlockedHostname('172.16.4.4')).toBe(true);
    expect(await isBlockedHostname('169.254.169.254')).toBe(true);
    expect(await isBlockedHostname('0.0.0.0')).toBe(true);
  });

  it('allows a public address', async () => {
    expect(await isBlockedHostname('93.184.216.34')).toBe(false); // example.com
  });

  it('blocks IPv4-mapped IPv6 addresses (SSRF bypass vector)', async () => {
    // ::ffff:<private/link-local> must be treated as the embedded IPv4
    expect(await isBlockedHostname('::ffff:169.254.169.254')).toBe(true); // cloud-metadata
    expect(await isBlockedHostname('::ffff:10.0.0.5')).toBe(true); // private class-A
    expect(await isBlockedHostname('::ffff:192.168.1.1')).toBe(true); // private class-C
  });
});

describe('HttpFetcher', () => {
  let server: Server;
  let base: string;

  beforeAll(async () => {
    server = createServer((req, res) => {
      switch (req.url) {
        case '/ok': {
          res.writeHead(200, { 'content-type': 'text/html' }).end('<html>ok</html>');

          break;
        }
        case '/huge': {
          res.writeHead(200).end('x'.repeat(5000));

          break;
        }
        case '/challenge': {
          res
            .writeHead(403, { 'content-type': 'text/html' })
            .end('<html><head><title>Just a moment...</title></head></html>');

          break;
        }
        case '/forbidden': {
          res.writeHead(403).end('<html>plain forbidden, no challenge</html>');

          break;
        }
        default: {
          res.writeHead(404).end('nope');
        }
      }
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => server.close());

  it('rejects non-http(s) schemes', async () => {
    const f = new HttpFetcher(cfg);
    await expect(f.fetchText('file:///etc/passwd')).rejects.toBeInstanceOf(ScrapeFetchError);
  });

  it('rejects loopback by default (SSRF guard)', async () => {
    const f = new HttpFetcher(cfg);
    await expect(f.fetchText(`${base}/ok`)).rejects.toBeInstanceOf(ScrapeFetchError);
  });

  it('fetches text when loopback is explicitly allowed', async () => {
    const f = new HttpFetcher({ ...cfg, allowLoopbackForTests: true });
    const result = await f.fetchText(`${base}/ok`);
    expect(result.status).toBe(200);
    expect(result.body).toContain('ok');
  });

  it('aborts when the response exceeds maxResponseBytes', async () => {
    const f = new HttpFetcher({ ...cfg, allowLoopbackForTests: true });
    await expect(f.fetchText(`${base}/huge`)).rejects.toBeInstanceOf(ScrapeFetchError);
  });

  // tuxedo 92: a Cloudflare (or similar) bot/JS challenge must surface as a
  // distinct error, not a silent 403 the caller would otherwise ignore.
  it('throws ScrapeBotChallengeError (not a generic ScrapeFetchError) on a challenge page', async () => {
    const f = new HttpFetcher({ ...cfg, allowLoopbackForTests: true });
    await expect(f.fetchText(`${base}/challenge`)).rejects.toBeInstanceOf(ScrapeBotChallengeError);
  });

  it('returns an ordinary 403 as a normal result, not a thrown error', async () => {
    const f = new HttpFetcher({ ...cfg, allowLoopbackForTests: true });
    const result = await f.fetchText(`${base}/forbidden`);
    expect(result.status).toBe(403);
  });
});

describe('isBotChallengeResponse', () => {
  it('flags a 403 carrying Cloudflare challenge markers', () => {
    expect(isBotChallengeResponse(403, '<title>Just a moment...</title>')).toBe(true);
    expect(isBotChallengeResponse(403, 'cf-browser-verification')).toBe(true);
    expect(isBotChallengeResponse(403, 'src="/cdn-cgi/challenge-platform/x.js"')).toBe(true);
  });

  it('does not flag an ordinary 403 or a 200 with matching text', () => {
    expect(isBotChallengeResponse(403, '{"error":"forbidden"}')).toBe(false);
    expect(isBotChallengeResponse(200, 'Just a moment...')).toBe(false);
  });
});
