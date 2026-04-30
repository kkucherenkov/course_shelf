import { describe, beforeEach, it, expect } from 'vitest';

import { PingController } from './ping.controller';
import type { SessionContext } from '../../common/auth/decorators';

describe('PingController', () => {
  let controller: PingController;

  beforeEach(() => {
    controller = new PingController();
  });

  it('returns id, role, and displayName when all fields present', () => {
    const session: SessionContext = {
      user: { id: 'uuid-1234', role: 'USER', displayName: 'Alice' },
      sessionId: 'sess-test',
    };

    const result = controller.ping(session);

    expect(result).toEqual({ id: 'uuid-1234', role: 'USER', displayName: 'Alice' });
  });

  it('omits displayName key when displayName is undefined', () => {
    const session: SessionContext = {
      user: { id: 'uuid-5678', role: 'ADMIN' },
      sessionId: 'sess-test',
    };

    const result = controller.ping(session);

    expect(result).toEqual({ id: 'uuid-5678', role: 'ADMIN' });
    expect(Object.prototype.hasOwnProperty.call(result, 'displayName')).toBe(false);
  });
});
