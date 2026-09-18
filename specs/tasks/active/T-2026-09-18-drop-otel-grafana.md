## T-2026-09-18-drop-otel-grafana — remove OpenTelemetry and the local Grafana stack

- Created: 2026-09-18
- Owner: claude
- Goal: the observability nobody reads stops costing a container, three packages and a bootstrap step.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] `telemetry.ts` and its two call sites in `main.ts`
  - [x] `otelEndpoint` out of `AppConfig`, `OTEL_EXPORTER_OTLP_ENDPOINT` out of `.env.example`
  - [x] three `@opentelemetry/*` dependencies and three pnpm overrides
  - [x] the `otel-lgtm` service, its volume, its `depends_on` and `docker/grafana/`
  - [x] the service out of both CI workflows that started it
  - [x] every document that described it as live
- Status: in-progress
- Blockers: —
