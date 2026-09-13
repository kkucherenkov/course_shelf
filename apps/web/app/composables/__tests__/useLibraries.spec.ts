/**
 * Unit tests for `useLibraries().register`.
 *
 * The point of interest is what survives a failure: the endpoint answers a bad
 * `rootPath` with an RFC 9457 document naming the rule it broke, and that
 * sentence used to be replaced by a guess about a filesystem check the backend
 * never performs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import type { LibraryListDto } from '@app/api-client-ts';

const mockListLibraries = vi.fn();
const mockRegisterLibrary = vi.fn();

vi.mock('@app/api-client-ts', () => ({
  listLibraries: (...args: unknown[]) => mockListLibraries(...args),
  registerLibrary: (...args: unknown[]) => mockRegisterLibrary(...args),
  getLatestLibraryScan: vi.fn(),
  runLibraryScan: vi.fn(),
  client: {},
}));

const EMPTY_LIST: LibraryListDto = { items: [] };

/** Wires the Nuxt auto-imports `useLibraries` relies on, then imports it. */
async function loadComposable(list: LibraryListDto = EMPTY_LIST) {
  const data = ref<LibraryListDto>(list);
  const refresh = vi.fn().mockResolvedValue(undefined);

  vi.stubGlobal('ref', ref);
  vi.stubGlobal('useAsyncData', () => ({
    data,
    error: ref<Error | null>(null),
    status: ref('success'),
    refresh,
  }));

  const { useLibraries } = await import('../useLibraries');
  return { ...useLibraries(), refresh };
}

describe('useLibraries().register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns the created library on success', async () => {
    const created = {
      id: 'lib-1',
      name: 'CS',
      rootPath: '/srv/cs',
      createdAt: '',
      updatedAt: '',
    };
    mockRegisterLibrary.mockResolvedValueOnce({
      data: created,
      error: null,
      response: { status: 201 },
    });

    const { register, registerErrorDetail } = await loadComposable();

    await expect(register({ name: 'CS', rootPath: '/srv/cs' })).resolves.toEqual(created);
    expect(registerErrorDetail.value).toBeNull();
  });

  it('still resolves a 409 to the already-registered row', async () => {
    const existing = {
      id: 'lib-1',
      name: 'CS',
      rootPath: '/srv/cs',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };
    mockRegisterLibrary.mockResolvedValueOnce({
      data: undefined,
      error: { title: 'Conflict', status: 409, detail: 'A library at this path already exists.' },
      response: { status: 409 },
    });

    const { register, refresh } = await loadComposable({ items: [existing] });

    await expect(register({ name: 'CS', rootPath: '/srv/cs' })).resolves.toEqual(existing);
    expect(refresh).toHaveBeenCalled();
  });

  it("keeps the server's explanation for a rejected path", async () => {
    const detail = String.raw`request/body/rootPath must match pattern "^(?:/|[A-Za-z]:\\)[^\x00]*$"`;
    mockRegisterLibrary.mockResolvedValueOnce({
      data: undefined,
      error: { type: 'about:blank', title: 'Bad Request', status: 400, detail },
      response: { status: 400 },
    });

    const { register, registerErrorDetail } = await loadComposable();

    await expect(register({ name: 'CS', rootPath: 'volume1/cs' })).rejects.toThrow(detail);
    expect(registerErrorDetail.value).toBe(detail);
  });

  it('leaves the detail null when the server explained nothing', async () => {
    mockRegisterLibrary.mockResolvedValueOnce({
      data: undefined,
      error: {},
      response: { status: 502 },
    });

    const { register, registerErrorDetail } = await loadComposable();

    await expect(register({ name: 'CS', rootPath: '/srv/cs' })).rejects.toThrow();
    expect(registerErrorDetail.value).toBeNull();
  });

  it('clears a stale detail before the next attempt', async () => {
    mockRegisterLibrary
      .mockResolvedValueOnce({
        data: undefined,
        error: { title: 'Bad Request', status: 400, detail: 'rootPath must be absolute' },
        response: { status: 400 },
      })
      .mockResolvedValueOnce({
        data: { id: 'lib-1', name: 'CS', rootPath: '/srv/cs', createdAt: '', updatedAt: '' },
        error: null,
        response: { status: 201 },
      });

    const { register, registerErrorDetail } = await loadComposable();

    await expect(register({ name: 'CS', rootPath: 'cs' })).rejects.toThrow();
    await register({ name: 'CS', rootPath: '/srv/cs' });

    expect(registerErrorDetail.value).toBeNull();
  });
});
