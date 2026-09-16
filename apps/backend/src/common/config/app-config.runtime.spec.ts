import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { AppConfig } from './app-config';

function configWith(env: Record<string, string>): AppConfig {
  return new AppConfig(new ConfigService(env));
}

describe('AppConfig.runtime.trustProxy', () => {
  it('defaults to loopback — safe when nothing sets TRUST_PROXY', () => {
    expect(configWith({}).runtime.trustProxy).toBe('loopback');
  });

  it('honours TRUST_PROXY — the docker-network CIDR each compose file pins (#693)', () => {
    expect(configWith({ TRUST_PROXY: '172.31.90.0/24' }).runtime.trustProxy).toBe('172.31.90.0/24');
  });
});
