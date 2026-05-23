// http-fetcher.spec.ts
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ScrapeFetchError } from '../../domain/scraper/scraper.errors';
import { HttpFetcher, isBlockedHostname } from './http-fetcher';

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
      if (req.url === '/ok') {
        res.writeHead(200, { 'content-type': 'text/html' }).end('<html>ok</html>');
      } else if (req.url === '/huge') {
        res.writeHead(200).end('x'.repeat(5000));
      } else {
        res.writeHead(404).end('nope');
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
});
