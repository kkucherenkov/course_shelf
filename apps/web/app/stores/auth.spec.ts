import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// ---------------------------------------------------------------------------
// Mocks — declared before importing the store so Vitest hoisting works.
// ---------------------------------------------------------------------------

// Nuxt composable shim
vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    public: {
      apiBaseUrl: 'http://localhost:3000/api/v1',
      authBaseUrl: 'http://localhost:3000',
    },
  }),
}));

// Mutable stubs for the three better-auth client methods we exercise.
const mockSignOut = vi.fn().mockResolvedValue({ data: {}, error: null });
const mockGetSession = vi.fn().mockResolvedValue({
  data: { user: { id: 'u1', email: 'a@b.com', name: 'Alice' } },
  error: null,
});
const mockSignInEmail = vi.fn();
const mockSignUpEmail = vi.fn();

vi.mock('better-auth/vue', () => ({
  createAuthClient: vi.fn(() => ({
    signIn: { email: mockSignInEmail },
    signUp: { email: mockSignUpEmail },
    signOut: mockSignOut,
    getSession: mockGetSession,
  })),
}));

// ---------------------------------------------------------------------------
// In-memory localStorage substitute.
// happy-dom@20 requires --localstorage-file to activate Storage; we stub
// the global instead so the store's import.meta.client branch has a real
// Storage-like object to call.
// ---------------------------------------------------------------------------
const localStorageStore = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => localStorageStore.get(k) ?? null,
  setItem: (k: string, v: string) => {
    localStorageStore.set(k, v);
  },
  removeItem: (k: string) => {
    localStorageStore.delete(k);
  },
  clear: () => {
    localStorageStore.clear();
  },
};
vi.stubGlobal('localStorage', localStorageMock);

// ---------------------------------------------------------------------------
// import.meta.client is a Nuxt/Vite define — it's true in the browser build.
// Stub it so the store's `if (import.meta.client)` guards execute.
// ---------------------------------------------------------------------------
vi.stubGlobal('import', { meta: { client: true, env: { PROD: false } } });

// ---------------------------------------------------------------------------
// Import the store AFTER mocks are in place.
// ---------------------------------------------------------------------------
import { useAuthStore } from './auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface OnSuccessCtx {
  response: Response;
}

const DEFAULT_USER_DATA = { id: 'u1', email: 'a@b.com', name: 'Alice' };

function makeResponse(headers: Record<string, string>): Response {
  return new Response(null, { headers });
}

function setupSignInSuccess(
  token: string | null,
  userData: typeof DEFAULT_USER_DATA = DEFAULT_USER_DATA,
) {
  mockSignInEmail.mockImplementation(
    (_creds: unknown, opts?: { onSuccess?: (ctx: OnSuccessCtx) => void }) => {
      if (token && opts?.onSuccess) {
        opts.onSuccess({ response: makeResponse({ 'set-auth-token': token }) });
      }
      return Promise.resolve({ data: { user: userData }, error: null });
    },
  );
}

function setupSignInError(message: string, code?: string) {
  mockSignInEmail.mockImplementation(() =>
    Promise.resolve({ data: null, error: { message, ...(code ? { code } : {}) } }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorageMock.clear();

    // Restore default mock implementations that tests may override.
    mockGetSession.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com', name: 'Alice' } },
      error: null,
    });
    mockSignOut.mockResolvedValue({ data: {}, error: null });
  });

  // -------------------------------------------------------------------------
  // signIn — happy path
  // -------------------------------------------------------------------------

  it('populates user and token after a successful signIn', async () => {
    setupSignInSuccess('tok-abc123');

    const store = useAuthStore();
    const result = await store.signIn('a@b.com', 'password1');

    expect(result.ok).toBe(true);
    expect(store.user).toMatchObject({ id: 'u1', email: 'a@b.com' });
    expect(store.token).toBe('tok-abc123');
    expect(store.error).toBeNull();
  });

  it('persists the token to localStorage after successful signIn', async () => {
    setupSignInSuccess('tok-persist');

    const store = useAuthStore();
    await store.signIn('a@b.com', 'password1');

    expect(localStorageMock.getItem('cs.web.bearer')).toBe('tok-persist');
  });

  it('sets isAuthenticated to true after successful signIn', async () => {
    setupSignInSuccess('tok-auth');

    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);

    await store.signIn('a@b.com', 'password1');

    expect(store.isAuthenticated).toBe(true);
  });

  it('clears isPending after signIn resolves (success)', async () => {
    setupSignInSuccess('tok-x');

    const store = useAuthStore();
    const p = store.signIn('a@b.com', 'password1');
    expect(store.isPending).toBe(true);
    await p;
    expect(store.isPending).toBe(false);
  });

  // -------------------------------------------------------------------------
  // signIn — error path
  // -------------------------------------------------------------------------

  it('sets error and keeps user/token null on failed signIn', async () => {
    setupSignInError('Invalid credentials');

    const store = useAuthStore();
    const result = await store.signIn('a@b.com', 'wrongpassword');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Invalid credentials');
    expect(store.error).toBe('Invalid credentials');
    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
  });

  it('clears isPending after signIn resolves (error)', async () => {
    setupSignInError('Bad creds');

    const store = useAuthStore();
    await store.signIn('x@y.com', 'pw');

    expect(store.isPending).toBe(false);
  });

  it('surfaces the Better Auth error code from a failed signIn', async () => {
    setupSignInError('Invalid email or password', 'INVALID_EMAIL_OR_PASSWORD');

    const store = useAuthStore();
    const result = await store.signIn('a@b.com', 'wrongpassword');

    expect(result.ok).toBe(false);
    expect(result.code).toBe('INVALID_EMAIL_OR_PASSWORD');
  });

  it('leaves code undefined when a failed signIn carries no code', async () => {
    setupSignInError('Something odd');

    const store = useAuthStore();
    const result = await store.signIn('a@b.com', 'pw');

    expect(result.ok).toBe(false);
    expect(result.code).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // signOut
  // -------------------------------------------------------------------------

  it('clears user and token after signOut', async () => {
    setupSignInSuccess('tok-so');
    const store = useAuthStore();
    await store.signIn('a@b.com', 'password1');

    expect(store.isAuthenticated).toBe(true);

    await store.signOut();

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(localStorageMock.getItem('cs.web.bearer')).toBeNull();
  });

  it('clears state even when signOut server call rejects', async () => {
    setupSignInSuccess('tok-err');
    const store = useAuthStore();
    await store.signIn('a@b.com', 'password1');

    mockSignOut.mockRejectedValueOnce(new Error('network error'));

    await store.signOut();

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
  });

  // -------------------------------------------------------------------------
  // clear
  // -------------------------------------------------------------------------

  it('clear() resets state without calling the server', async () => {
    setupSignInSuccess('tok-cl');
    const store = useAuthStore();
    await store.signIn('a@b.com', 'password1');

    store.clear();

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    // signOut must NOT have been called by clear()
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // refresh
  // -------------------------------------------------------------------------

  it('refresh() populates user from getSession response', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { user: { id: 'u2', email: 'b@c.com' } },
      error: null,
    });

    const store = useAuthStore();
    const ok = await store.refresh();

    expect(ok).toBe(true);
    expect(store.user).toMatchObject({ id: 'u2', email: 'b@c.com' });
  });

  it('refresh() returns false and clears user when no session exists', async () => {
    // Seed a user first
    setupSignInSuccess('tok-r');
    const store = useAuthStore();
    await store.signIn('a@b.com', 'pw');

    mockGetSession.mockResolvedValueOnce({ data: null, error: null });

    const ok = await store.refresh();

    expect(ok).toBe(false);
    expect(store.user).toBeNull();
  });

  // -------------------------------------------------------------------------
  // signUp — happy path
  // -------------------------------------------------------------------------

  it('populates user after a successful signUp', async () => {
    mockSignUpEmail.mockImplementation(
      (_creds: unknown, opts?: { onSuccess?: (ctx: OnSuccessCtx) => void }) => {
        opts?.onSuccess?.({ response: makeResponse({ 'set-auth-token': 'tok-signup-123' }) });
        return Promise.resolve({ data: { user: DEFAULT_USER_DATA }, error: null });
      },
    );

    const store = useAuthStore();
    const result = await store.signUp('a@b.com', 'password1', 'Alice');

    expect(result.ok).toBe(true);
    expect(store.user).toMatchObject({ id: 'u1', email: 'a@b.com' });
    expect(store.token).toBe('tok-signup-123');
    expect(store.error).toBeNull();
    expect(store.isPending).toBe(false);
  });

  // -------------------------------------------------------------------------
  // signUp — error path
  // -------------------------------------------------------------------------

  it('sets error and keeps user null when signUp returns an error', async () => {
    mockSignUpEmail.mockResolvedValue({
      data: null,
      error: { message: 'Email taken' },
    });

    const store = useAuthStore();
    const result = await store.signUp('taken@b.com', 'password1');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Email taken');
    expect(store.error).toBe('Email taken');
    expect(store.user).toBeNull();
    expect(store.isPending).toBe(false);
  });

  it('surfaces the Better Auth error code from a failed signUp', async () => {
    mockSignUpEmail.mockResolvedValue({
      data: null,
      error: { message: 'User already exists.', code: 'USER_ALREADY_EXISTS' },
    });

    const store = useAuthStore();
    const result = await store.signUp('taken@b.com', 'password1');

    expect(result.ok).toBe(false);
    expect(result.code).toBe('USER_ALREADY_EXISTS');
  });
});
