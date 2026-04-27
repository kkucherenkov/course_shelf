/**
 * Generated client entry point. DO NOT EDIT BY HAND — regenerate with:
 *
 *   pnpm spec:codegen
 *
 * All exports live under `./generated` and are produced by
 * `@hey-api/openapi-ts` from `packages/specs/dist/openapi.json`.
 */

export * from './generated/index.js';
// Re-export the singleton client so consumers can configure interceptors
// without importing from the generated sub-path directly.
export { client } from './generated/client.gen.js';
export * from './realtime/channels.js';
