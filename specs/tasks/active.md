# Active tasks

## T-2026-09-17-storybook-mcp — expose the design system to agents over MCP

- Created: 2026-09-17
- Owner: claude
- Spec: — (infrastructure; no feature spec)
- Goal: an agent asked to build UI finds the existing `@app/ui` component
  before writing a new one, by querying a running Storybook over MCP.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] raise the Storybook toolchain to ^10.6.0 (the floor `@storybook/addon-mcp` requires)
  - [x] add `@storybook/addon-mcp` and register it in `packages/ui/.storybook/main.ts`
  - [x] point `.mcp.json` at the dev server's `/mcp` endpoint
  - [ ] bring the compose `storybook` service up and verify the endpoint answers
  - [ ] re-run the Storybook visual regression suite — a minor bump can move snapshots
  - [x] document the workflow in README, README.ru and `.claude/CLAUDE.md`
- Status: in-progress
- Blockers: —
