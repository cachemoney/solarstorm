# Story 1.1: Streaming State Store

Status: ready-for-dev

## Story

As a developer,
I want a Zustand store for streaming state and configuration,
so that all streaming modules have a single source of truth for config and status.

## Acceptance Criteria

1. **Given** the application starts with no stored configuration **When** `useStreamStore` initializes **Then** the store loads any persisted config from `localStorage` and sets `isConfigured` accordingly **And** status defaults to `'offline'` and `errorMessage` to `null`

2. **Given** the creator sets a relay URL and stream key **When** `setConfig` is called **Then** the config is written to `localStorage` and `isConfigured` becomes `true`

3. **Given** the creator clears their configuration **When** `clearConfig` is called **Then** the config is removed from `localStorage`, `isConfigured` becomes `false`, and status resets to `'offline'`

4. **Given** the stream key is stored **When** any store action executes **Then** the stream key is never included in `console.log` or `console.error` output (NFR7, NFR9)

## Tasks / Subtasks

- [ ] Create `src/useStreamStore.ts` (AC: 1-4)
  - [ ] Define `StreamConfig` interface with `relayUrl: string` and `streamKey: string`
  - [ ] Define `StreamStatus` type as `'offline' | 'connecting' | 'live' | 'error'`
  - [ ] Define `StreamState` interface with all fields and actions
  - [ ] Implement `loadConfig` — read from `localStorage` key `'solarstorm-stream-config'`, parse JSON, set `isConfigured` derived boolean
  - [ ] Implement `setConfig` — write config to `localStorage`, update state, set `isConfigured = true`
  - [ ] Implement `clearConfig` — remove from `localStorage`, reset config fields, set `isConfigured = false`, reset status to `'offline'`, clear `errorMessage`
  - [ ] Implement `setStatus` — update status string
  - [ ] Implement `setError` — set status to `'error'` and store `errorMessage`, ensure error message never contains stream key value
  - [ ] Export `useStreamStore` using `createWithEqualityFn` + `subscribeWithSelector`
  - [ ] Initialize store by calling `loadConfig` internally on creation

## Dev Notes

### Must Follow: Exact Zustand Pattern from useMusicStore

This store MUST replicate the exact patterns in `src/useMusicStore.ts:1-117`. Copy this structure:

```
import { createWithEqualityFn } from 'zustand/traditional'
import { subscribeWithSelector } from 'zustand/middleware'

interface StreamState {
  // fields...
  // setter actions...
}

export const useStreamStore = createWithEqualityFn<StreamState>()(
  subscribeWithSelector((set) => ({
    // initial values...
    // setter implementations using set(() => { return { ... } }) pattern
  }))
)
```

Key patterns to match exactly:
- `createWithEqualityFn` from `'zustand/traditional'` (NOT from `'zustand'`)
- `subscribeWithSelector` middleware wrapping the `set` callback
- Setters use `set(() => { return { ... } })` pattern (not `set({ ... })`)
- Named interface for state shape (`StreamState`), not inline type

### Store Shape (from Architecture Decision)

```
config: { relayUrl: string, streamKey: string }
status: 'offline' | 'connecting' | 'live' | 'error'
errorMessage: string | null
isConfigured: boolean

Actions: setConfig, setStatus, setError, clearConfig, loadConfig
```

### localStorage Key

Use key `'solarstorm-stream-config'`. Store as JSON: `{ relayUrl: string, streamKey: string }`.

### Security (NFR7, NFR9)

- The `setError` action must sanitize error messages — never include `config.streamKey` in any error string
- Never `console.log` or `console.error` the config object or stream key
- `loadConfig` should silently handle localStorage errors (try-catch, return defaults on failure)

### isConfigured Derivation

`isConfigured` should be `true` only when both `config.relayUrl` and `config.streamKey` are non-empty strings. Set it:
- On `loadConfig` — after reading from localStorage, check both fields
- On `setConfig` — after writing, set to `true` (caller validates)
- On `clearConfig` — set to `false`

### Pure Setters — No Side Effects

Store actions are pure setters. Async operations (WHIP connection, media capture) happen in `StreamManager.ts` (future story), NOT in store actions. Store actions only update state.

### File Location

`src/useStreamStore.ts` — flat in `src/`, matching existing convention.

### Project Structure Notes

- New file only — no modifications to any existing files
- This is the foundation: `StreamManager.ts`, `StreamControls.tsx`, and `useBackgroundRender.ts` (future stories) all depend on this store
- Do NOT import from or modify `useMusicStore.ts`

### References

- [Source: src/useMusicStore.ts] — exact Zustand pattern to replicate
- [Source: docs/_bmad_output/planning-artifacts/architecture.md#State Management] — store shape and decisions
- [Source: docs/_bmad_output/planning-artifacts/epics.md#Story 1.1] — acceptance criteria
- [Source: AGENTS.md#Zustand] — import patterns (`createWithEqualityFn`, `subscribeWithSelector`)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
