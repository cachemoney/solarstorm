# Story 1.2: Stream Settings Panel

Status: review

## Story

As a creator,
I want a settings panel to enter my relay endpoint URL and YouTube stream key,
so that I can configure my streaming credentials without leaving the app.

## Acceptance Criteria

1. **Given** the Solar Storm UI is loaded **When** the creator opens the settings panel **Then** input fields for relay endpoint URL and stream key are displayed, pre-populated with any saved values

2. **Given** the creator enters valid values and saves **When** the save action completes **Then** configuration is persisted via `useStreamStore` (FR6, FR7, FR8) and the settings panel closes

3. **Given** the settings panel is open **When** the creator clicks "Clear" or removes both values **Then** stored configuration is cleared (FR10) and `isConfigured` becomes `false`

4. **Given** the stream key input field **When** the creator types or views it **Then** the value is masked (password-style input) (NFR7)

## Tasks / Subtasks

- [x] Create `src/StreamSettings.tsx` — React component for the settings panel (AC: 1-4)
  - [x] Create a component that renders a toggle button to open/close the settings panel
  - [x] Render a form with two controlled inputs: relay endpoint URL (text) and stream key (password type for masking)
  - [x] Pre-populate inputs from `useStreamStore` config on mount using `useStreamStore((state) => state.config)`
  - [x] Implement save handler: validate both fields are non-empty, call `useStreamStore.setConfig({ relayUrl, streamKey })`, close the panel
  - [x] Implement clear handler: call `useStreamStore.clearConfig()`, reset local form state, close the panel
  - [x] Use React state (`useState`) for form values and panel open/close toggle
  - [x] Import `useStreamStore` and select `config`, `setConfig`, `clearConfig` — use individual selectors (e.g., `useStreamStore((s) => s.config)`) per project Zustand patterns
- [x] Add CSS styles to `src/styles.css` (AC: 1, 4)
  - [x] Add `.stream-settings-toggle` — small button positioned in the existing overlay area, matching existing `button` style (pink text, dark translucent background, pink border)
  - [x] Add `.stream-settings-panel` — positioned absolute panel with dark translucent background (matching `.overlay` aesthetic), padding, border-radius
  - [x] Add `.stream-settings-panel label` — small uppercase label text matching existing `.loader` typography (`letter-spacing: 0.1em`, `text-transform: uppercase`, `font-size: 0.75rem`)
  - [x] Add `.stream-settings-panel input` — dark background input fields (`background: rgba(12, 15, 19, 0.9)`), light text (`color: #d998ee`), pink border (`1px solid #c06995`), matching the existing button aesthetic
  - [x] Add `.stream-settings-panel input[type="password"]` — ensures password masking
  - [x] Add `.stream-settings-actions` — flex row for Save and Clear buttons, spacing between them
- [x] Integrate `StreamSettings` into `src/App.tsx` (AC: 1)
  - [x] Import `StreamSettings` from `'./StreamSettings'`
  - [x] Render `<StreamSettings />` inside the main container `div` (after the attribution div), positioned so it doesn't overlap the 3D canvas

## Dev Notes

### Previous Story Context (Story 1.1)

Story 1.1 created `src/useStreamStore.ts` with the following exports and API:
- `useStreamStore` — Zustand store using `createWithEqualityFn` + `subscribeWithSelector`
- `config: { relayUrl: string, streamKey: string }` — current stored config
- `isConfigured: boolean` — `true` when both `relayUrl` and `streamKey` are non-empty
- `setConfig(config)` — writes to localStorage, sets `isConfigured = true`
- `clearConfig()` — removes from localStorage, resets all state, sets `isConfigured = false`
- `status: StreamStatus` — current stream status
- `loadConfig()` — reads from localStorage (auto-called on store init)

This story ONLY consumes `useStreamStore` — do NOT modify it.

### Zustand Selector Pattern

Use individual selectors per the existing codebase pattern (see `App.tsx:16-18`):

```tsx
const config = useStreamStore((s) => s.config);
const setConfig = useStreamStore((s) => s.setConfig);
const clearConfig = useStreamStore((s) => s.clearConfig);
```

Do NOT destructure from a single `useStreamStore()` call. For multiple field selectors with shallow comparison, use `useStreamStore(selector, shallow)`.

### UI Pattern: Match Existing Overlay Aesthetic

The existing UI uses:
- Dark translucent backgrounds: `rgba(12, 15, 19, 0.75)`
- Pink/accent colors: `#de77c7` (headings), `#d998ee` (text), `#c06995` (borders)
- Font: system sans-serif stack from `body` rule
- Typography: `text-transform: uppercase`, `letter-spacing: 0.1em`, `font-size: 0.75rem`
- Buttons: full existing `button` styles already in `styles.css` — no need to duplicate, just use `<button>` elements

The settings panel should feel like part of the existing UI, not a separate widget.

### Component Design: StreamSettings

This component is a self-contained settings panel:
- A small gear/settings icon button (or just text "Settings") that toggles the panel open/closed
- When open: shows a form with relay URL input, stream key input (password type), Save button, Clear button
- When closed: just the toggle button visible
- No external state management beyond `useStreamStore` reads/writes

### Security (NFR7)

- Stream key input MUST be `type="password"` — this provides native browser masking
- Do NOT log or display the stream key in plain text anywhere
- `useStreamStore.setError()` already sanitizes the key from error messages (implemented in Story 1.1)

### File Location

- `src/StreamSettings.tsx` — new component file, flat in `src/`
- `src/styles.css` — append new styles (do NOT modify existing styles)
- `src/App.tsx` — add import and render `<StreamSettings />`

### Project Structure Notes

- This story modifies `App.tsx` (add StreamSettings render) and `styles.css` (add new classes)
- Do NOT modify `useStreamStore.ts`, `useMusicStore.ts`, `Music.tsx`, or any 3D components
- Component naming: `StreamSettings.tsx` (PascalCase, matches `Scene.tsx`, `Music.tsx` pattern)

### References

- [Source: src/useStreamStore.ts] — store API to consume (`setConfig`, `clearConfig`, `config`)
- [Source: src/App.tsx:46-57] — existing overlay pattern and button style to match
- [Source: src/styles.css:41-48] — `.overlay` class pattern for panel styling
- [Source: src/styles.css:61-73] — `button` base styles that new buttons inherit
- [Source: docs/_bmad_output/planning-artifacts/architecture.md#File Organization] — flat in `src/` convention
- [Source: docs/_bmad_output/planning-artifacts/architecture.md#CSS Patterns] — overlay aesthetic, hex colors
- [Source: docs/_bmad_output/planning-artifacts/epics.md#Story 1.2] — acceptance criteria
- [Source: AGENTS.md#Zustand] — selector patterns

## Dev Agent Record

### Agent Model Used

GLM-5.1

### Debug Log References

No issues encountered. TypeScript type-check passed clean on first run.

### Completion Notes List

- Created `StreamSettings.tsx` with toggle button, form with relay URL (text) and stream key (password/masked) inputs, Save/Clear/Cancel actions
- Pre-populates from `useStreamStore.config` on open; uses individual Zustand selectors per project pattern
- Save validates both fields non-empty before calling `setConfig`; Clear calls `clearConfig` and resets form
- Stream key input is `type="password"` for native masking (NFR7/AC4)
- CSS appended to `styles.css` — settings toggle fixed top-right, panel centered with dark translucent background matching overlay aesthetic
- `App.tsx` updated: import + render `<StreamSettings />` after attribution div

### File List

- `src/StreamSettings.tsx` — NEW
- `src/styles.css` — MODIFIED (appended streaming UI styles)
- `src/App.tsx` — MODIFIED (import + render StreamSettings)
