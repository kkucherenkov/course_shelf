import { DomainError } from '../../../shared/domain-error';

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
