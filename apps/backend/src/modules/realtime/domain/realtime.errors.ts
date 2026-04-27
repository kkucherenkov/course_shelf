import { DomainError } from '../../../shared/domain-error';

// NOTE: The controller no longer throws this error — the global SessionGuard
// handles 401 responses before the controller is reached.
export class RealtimeAuthError extends DomainError {
  constructor() {
    super({
      code: 'realtime-auth-required',
      status: 401,
      title: 'Authentication required',
      detail: 'Sign in to obtain a realtime token.',
    });
  }
}
