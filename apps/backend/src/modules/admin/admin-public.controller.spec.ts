import { describe, it, expect, vi } from 'vitest';

import { AdminPublicController } from './admin-public.controller';

import type { AppConfig, AuthInstanceConfig } from '../../common/config/app-config';
import type { DashboardPort } from './domain/dashboard.port';

function makePort(hasAnyUserResult: boolean): DashboardPort {
  return {
    getSnapshot: vi.fn(),
    hasAnyUser: vi.fn().mockResolvedValue(hasAnyUserResult),
    listRecentScans: vi.fn(),
    listAllLibrariesWithCounts: vi.fn(),
    listUsers: vi.fn(),
    updateUser: vi.fn(),
  };
}

function makeAppConfig(instance: AuthInstanceConfig): AppConfig {
  // Only `instance` is read by the new route — everything else stubbed minimally.
  return { instance } as unknown as AppConfig;
}

function makeController(
  port: DashboardPort,
  config: AppConfig = makeAppConfig({
    selfRegistration: true,
    emailVerificationRequired: false,
    ssoProviders: [],
  }),
): AdminPublicController {
  return new (AdminPublicController as unknown as new (
    p: DashboardPort,
    c: AppConfig,
  ) => AdminPublicController)(port, config);
}

describe('AdminPublicController', () => {
  describe('GET /admin/has-users', () => {
    it('returns { hasUsers: false } when port reports no users', async () => {
      const port = makePort(false);
      const controller = makeController(port);

      const result = await controller.hasUsers();

      expect(result).toEqual({ hasUsers: false });
      expect(port.hasAnyUser).toHaveBeenCalledOnce();
    });

    it('returns { hasUsers: true } when port reports at least one user', async () => {
      const port = makePort(true);
      const controller = makeController(port);

      const result = await controller.hasUsers();

      expect(result).toEqual({ hasUsers: true });
      expect(port.hasAnyUser).toHaveBeenCalledOnce();
    });
  });

  describe('GET /admin/instance', () => {
    it('returns the defaults: open self-registration, no email verification, no SSO', () => {
      const port = makePort(false);
      const controller = makeController(port);

      const result = controller.getInstance();

      expect(result).toEqual({
        selfRegistration: true,
        emailVerificationRequired: false,
        ssoProviders: [],
      });
    });

    it('reflects emailVerificationRequired=true when admin enabled the plugin', () => {
      const port = makePort(true);
      const controller = makeController(
        port,
        makeAppConfig({
          selfRegistration: true,
          emailVerificationRequired: true,
          ssoProviders: [],
        }),
      );

      const result = controller.getInstance();

      expect(result.emailVerificationRequired).toBe(true);
    });

    it('reflects selfRegistration=false on a closed instance', () => {
      const port = makePort(true);
      const controller = makeController(
        port,
        makeAppConfig({
          selfRegistration: false,
          emailVerificationRequired: false,
          ssoProviders: [],
        }),
      );

      const result = controller.getInstance();

      expect(result.selfRegistration).toBe(false);
    });

    it('passes through configured SSO providers', () => {
      const port = makePort(true);
      const controller = makeController(
        port,
        makeAppConfig({
          selfRegistration: true,
          emailVerificationRequired: false,
          ssoProviders: [
            { id: 'google', label: 'Continue with Google', iconName: 'mail' },
            { id: 'github', label: 'Continue with GitHub', iconName: 'github' },
          ],
        }),
      );

      const result = controller.getInstance();

      expect(result.ssoProviders).toEqual([
        { id: 'google', label: 'Continue with Google', iconName: 'mail' },
        { id: 'github', label: 'Continue with GitHub', iconName: 'github' },
      ]);
    });
  });
});
