import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppConfig } from '../../../../common/config/app-config';
import type { DependencyChecker, DependencyStatus } from '../../domain/health';
import { GetHealthHandler } from './get-health.handler';
import { GetHealthQuery } from './get-health.query';

function makeChecker(status: DependencyStatus = 'ok'): DependencyChecker {
  return { check: vi.fn().mockResolvedValue(status) };
}

function makeConfig(version = '1.2.3'): AppConfig {
  return {
    runtime: { version },
  } as unknown as AppConfig;
}

describe('GetHealthHandler', () => {
  let db: DependencyChecker;
  let centrifugo: DependencyChecker;
  let config: AppConfig;
  let handler: GetHealthHandler;

  beforeEach(() => {
    db = makeChecker('ok');
    centrifugo = makeChecker('ok');
    config = makeConfig();
    handler = new GetHealthHandler(db, centrifugo, config);
  });

  it('returns ok status when all dependencies are healthy', async () => {
    const result = await handler.execute(new GetHealthQuery());

    expect(result.status).toBe('ok');
    expect(result.dependencies.db).toBe('ok');
    expect(result.dependencies.centrifugo).toBe('ok');
  });

  it('includes the version from config', async () => {
    const result = await handler.execute(new GetHealthQuery());

    expect(result.version).toBe('1.2.3');
  });

  it('includes a non-negative uptimeSeconds', async () => {
    const result = await handler.execute(new GetHealthQuery());

    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('returns degraded status when a dependency is degraded', async () => {
    vi.mocked(centrifugo.check).mockResolvedValue('degraded');
    handler = new GetHealthHandler(db, centrifugo, config);

    const result = await handler.execute(new GetHealthQuery());

    expect(result.status).toBe('degraded');
    expect(result.dependencies.centrifugo).toBe('degraded');
  });

  it('returns down status when a dependency is down', async () => {
    vi.mocked(db.check).mockResolvedValue('down');
    handler = new GetHealthHandler(db, centrifugo, config);

    const result = await handler.execute(new GetHealthQuery());

    expect(result.status).toBe('down');
    expect(result.dependencies.db).toBe('down');
  });

  it('returns down when any dependency is down even if others are ok', async () => {
    vi.mocked(centrifugo.check).mockResolvedValue('down');
    handler = new GetHealthHandler(db, centrifugo, config);

    const result = await handler.execute(new GetHealthQuery());

    expect(result.status).toBe('down');
  });

  it('calls both checkers in parallel', async () => {
    await handler.execute(new GetHealthQuery());

    expect(db.check).toHaveBeenCalledOnce();
    expect(centrifugo.check).toHaveBeenCalledOnce();
  });

  it('centrifugo degraded yields degraded overall', async () => {
    vi.mocked(centrifugo.check).mockResolvedValue('degraded');
    handler = new GetHealthHandler(db, centrifugo, config);

    const result = await handler.execute(new GetHealthQuery());

    expect(result.status).toBe('degraded');
    expect(result.dependencies.centrifugo).toBe('degraded');
  });
});
