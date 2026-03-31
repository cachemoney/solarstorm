# Story 1.3: Stream Status & Go Live Button

Status: review

## Story

As a creator,
I want to see the current stream status and a Go Live button that activates when configured,
so that I know my streaming state and can initiate a broadcast when ready.

## Acceptance Criteria

1. **Given** the stream is not configured **When** the UI renders **Then** the "Go Live" button is disabled/grayed out (FR9) and status shows "offline" (FR3)

2. **Given** the stream is fully configured (relay URL + stream key saved) **When** the UI renders **Then** the "Go Live" button is enabled and clickable

3. **Given** the stream is in any status **When** the status changes **Then** a status indicator displays the current state: offline, connecting, live, or error (FR3)

4. **Given** the streaming UI components render **When** a rendering error occurs within StreamControls **Then** a React Error Boundary catches the error and displays a fallback "Streaming error" message without affecting the 3D scene (FR15)

## Tasks / Subtasks

- [x] Create `src/StreamControls.tsx` — Go Live button + status indicator component (AC: 1, 2, 3)
  - [x] Subscribe to `isConfigured` and `status` from `useStreamStore` using individual selectors
  - [x] Render "Go Live" button: disabled and visually grayed when `!isConfigured`, enabled when `isConfigured`
  - [x] Render "Stop Stream" button when `status === 'live'` in place of "Go Live" (stub onClick — wired in Epic 2)
  - [x] Render stream status indicator: a colored dot + uppercase text for each status value (`offline`, `connecting`, `live`, `error`)
  - [x] Show `errorMessage` from store below status indicator when `status === 'error'`
  - [x] Go Live button `onClick`: stub no-op with `// TODO: Epic 2 - wire to StreamManager.start()` comment
  - [x] Stop Stream button `onClick`: stub no-op with `// TODO: Epic 2 - wire to StreamManager.stop()` comment
- [x] Create `StreamErrorBoundary` class component in `src/StreamControls.tsx` (AC: 4)
  - [x] `StreamErrorBoundary` MUST be a React class component (functional components cannot be error boundaries)
  - [x] Implement `componentDidCatch` to log errors to console (sanitize stream key — use `useStreamStore.getState().config.streamKey`)
  - [x] Render fallback UI `<div className="stream-error-fallback">Streaming error</div>` on caught error
  - [x] Export `StreamErrorBoundary` from the same file
- [x] Add CSS to `src/styles.css` (AC: 1, 3)
  - [x] `.stream-controls` — container positioned fixed bottom-left (avoid overlap with `.attribution` at bottom), dark translucent background matching overlay aesthetic, flex column, gap
  - [x] `.stream-controls button` — inherits existing `button` styles; add `disabled` visual state: `opacity: 0.4; cursor: not-allowed`
  - [x] `.stream-status` — flex row, align items center, gap, uppercase text, `font-size: 0.75rem`, `letter-spacing: 0.1em`
  - [x] `.stream-status__dot` — 8px circle, `border-radius: 50%`; colored by status modifier classes
  - [x] `.stream-status--offline .stream-status__dot` → `background: #666`
  - [x] `.stream-status--connecting .stream-status__dot` → `background: #f5a623` (orange/amber)
  - [x] `.stream-status--live .stream-status__dot` → `background: #00cc44; box-shadow: 0 0 6px #00cc44` (green glow)
  - [x] `.stream-status--error .stream-status__dot` → `background: #e05252` (red)
  - [x] `.stream-error-message` — small text, `color: #e05252`, `font-size: 0.7rem`, max-width so long messages don't overflow
  - [x] `.stream-error-fallback` — minimal fallback container, matching loader styling
- [x] Integrate into `src/App.tsx` (AC: 4)
  - [x] Import `StreamControls` and `StreamErrorBoundary` from `'./StreamControls'`
  - [x] Render `<StreamErrorBoundary><StreamControls /></StreamErrorBoundary>` inside the main `div` (alongside the existing `<StreamSettings />` render added by Story 1.2)
  - [x] Do NOT remove or modify the existing `<StreamSettings />` render

## Dev Notes

### CRITICAL: StreamSettings Already Exists — Do NOT Duplicate It

Story 1.2 already created `src/StreamSettings.tsx` — a fully functional settings panel with relay URL + stream key inputs. **Do NOT recreate or include a settings form in `StreamControls.tsx`.** `StreamControls` is exclusively for the Go Live button and stream status indicator.

The settings toggle button (gear/Settings) is already rendered in the top-right corner via `<StreamSettings />` in `App.tsx`. The only additions this story makes to the UI are: the Go Live/Stop button and the status indicator, positioned separately (bottom-left recommended).

### Error Boundary: Must Be a Class Component

React Error Boundaries **require** class component syntax. Functional components with hooks CANNOT be error boundaries. Use this exact pattern:

```tsx
import React from 'react';

interface ErrorBoundaryState { hasError: boolean }

export class StreamErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Sanitize: never log stream key
    console.error('StreamControls render error:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return <div className="stream-error-fallback">Streaming error</div>;
    }
    return this.props.children;
  }
}
```

### Zustand Selector Patterns (from Stories 1.1 + 1.2)

Use individual selectors — exactly as established in previous stories and `App.tsx:16-18`:

```tsx
const isConfigured = useStreamStore((s) => s.isConfigured);
const status = useStreamStore((s) => s.status);
const errorMessage = useStreamStore((s) => s.errorMessage);
```

Do NOT call `useStreamStore()` without a selector or use object destructuring in a single call.

### useStreamStore API (from Story 1.1)

The store already exists at `src/useStreamStore.ts` with these fields:
- `config: { relayUrl: string, streamKey: string }` — persisted credentials
- `status: 'offline' | 'connecting' | 'live' | 'error'` — current stream state
- `errorMessage: string | null` — set when status is 'error', already sanitized (stream key stripped)
- `isConfigured: boolean` — true only when both relayUrl AND streamKey are non-empty

Actions available (consume only — do NOT modify useStreamStore.ts):
- `setConfig(config)`, `clearConfig()`, `setStatus(status)`, `setError(message)`, `loadConfig()`

### Go Live Button: Stub onClick for This Story

`StreamManager.ts` does not exist yet — it is created in Epic 2. The Go Live and Stop Stream button `onClick` handlers in this story are **intentional stubs**:

```tsx
<button
  disabled={!isConfigured || status !== 'offline'}
  onClick={() => { /* TODO: Epic 2 - wire to StreamManager.start() */ }}
>
  Go Live
</button>
```

Do NOT attempt to implement streaming logic. Do NOT create a `StreamManager` placeholder. The Epic 2 stories (2.1 and 2.2) will implement and wire up the real logic.

### Disabled Button Pattern

The `disabled` HTML attribute provides the correct behavior. Supplement with CSS for the visual state:

```tsx
<button
  disabled={!isConfigured}
  className="go-live-button"
  onClick={...}
>
  Go Live
</button>
```

CSS: `button:disabled { opacity: 0.4; cursor: not-allowed; }` — add this as a global rule or scoped to `.stream-controls button:disabled`.

### Status Indicator: BEM-style Modifier Classes

Use a status-modifier class on the container to drive dot color via CSS cascade:

```tsx
<div className={`stream-status stream-status--${status}`}>
  <span className="stream-status__dot" />
  <span>{status}</span>
</div>
```

Status label text should be uppercase via CSS, not hardcoded. Display `errorMessage` below the indicator only when `status === 'error'`.

### Position: Avoid Overlapping Attribution and Settings Toggle

From `src/styles.css`:
- `.attribution` is `position: fixed; right: 1rem; bottom: 1rem; left: 1rem`
- `.stream-settings-toggle` is `position: fixed; top: 1rem; right: 1rem`

Recommended position for `.stream-controls`: `position: fixed; bottom: 4rem; left: 1rem` — above the attribution strip, left side.

### App.tsx Integration: Additive Only

`App.tsx` currently renders `<StreamSettings />` (added by Story 1.2, line 70). Add StreamControls alongside it. The final App.tsx render (simplified) should look like:

```tsx
<div onMouseMove={...}>
  <Canvas>...</Canvas>
  {!init && <div className="overlay">...</div>}
  <div className="attribution">...</div>
  <StreamSettings />                                          {/* Story 1.2 */}
  <StreamErrorBoundary><StreamControls /></StreamErrorBoundary>  {/* This story */}
</div>
```

Do NOT remove `<StreamSettings />`. Do NOT modify the Canvas, overlay, or attribution sections.

### CSS: Append to styles.css — Never Modify Existing Rules

Story 1.2 appended styles starting at line 126 (`.stream-settings-toggle`, `.stream-settings-panel`, etc.). This story appends AFTER those. Never modify any rule above line 125.

### File Locations

- `src/StreamControls.tsx` — NEW (contains both `StreamControls` function component and `StreamErrorBoundary` class component)
- `src/styles.css` — MODIFIED (append new classes only)
- `src/App.tsx` — MODIFIED (add import + render StreamErrorBoundary + StreamControls)

Do NOT create additional files. Do NOT create a separate `StreamErrorBoundary.tsx`.

### Project Structure Notes

- Flat `src/` convention — no subdirectories for this story
- Naming: `StreamControls.tsx` (PascalCase, matches `Scene.tsx`, `Music.tsx`, `StreamSettings.tsx`)
- Do NOT modify: `useStreamStore.ts`, `useMusicStore.ts`, `StreamSettings.tsx`, `Music.tsx`, or any 3D scene components

### References

- [Source: src/useStreamStore.ts] — store API (isConfigured, status, errorMessage selectors)
- [Source: src/StreamSettings.tsx] — existing settings component; do NOT duplicate its functionality
- [Source: src/App.tsx:62-71] — integration point; StreamSettings already rendered at line 70
- [Source: src/styles.css:126-184] — existing streaming styles added by Story 1.2; append after these
- [Source: docs/_bmad_output/planning-artifacts/architecture.md#Error Isolation] — StreamErrorBoundary pattern and dual-layer error handling
- [Source: docs/_bmad_output/planning-artifacts/architecture.md#CSS Patterns] — overlay aesthetic, hex colors, positioning
- [Source: docs/_bmad_output/planning-artifacts/architecture.md#State Management Patterns] — Zustand selector patterns
- [Source: docs/_bmad_output/planning-artifacts/epics.md#Story 1.3] — acceptance criteria

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No issues encountered. TypeScript type-check passed clean on first run.

### Completion Notes List

- Created `StreamControls.tsx` with `StreamControls` functional component and `StreamErrorBoundary` class component in the same file
- `StreamControls` uses individual Zustand selectors for `isConfigured`, `status`, and `errorMessage` (AC1-AC3)
- Go Live button: `disabled={!isConfigured}` — grayed via `button:disabled { opacity: 0.4 }` CSS rule (AC1, AC2)
- Stop Stream button shown when `status === 'live'`, Go Live shown otherwise (AC3)
- Status indicator uses BEM modifier classes `stream-status--{status}` to drive colored dot via CSS cascade (AC3)
- Error message rendered below indicator only when `status === 'error'` and `errorMessage` is non-null (AC3)
- `StreamErrorBoundary` is a React class component (required for error boundaries); `componentDidCatch` sanitizes stream key before logging (NFR7/NFR9) (AC4)
- Both button `onClick` handlers are documented stubs with `// TODO: Epic 2` comments — StreamManager not yet implemented
- CSS appended to `styles.css` (`.stream-controls` fixed bottom-left at `bottom: 4rem` to clear `.attribution`) (AC1, AC3)
- `App.tsx` updated: import + render `<StreamErrorBoundary><StreamControls /></StreamErrorBoundary>` alongside existing `<StreamSettings />` (AC4)
- No modifications to `useStreamStore.ts`, `StreamSettings.tsx`, `useMusicStore.ts`, or any 3D components

### File List

- `src/StreamControls.tsx` — NEW
- `src/styles.css` — MODIFIED (appended stream controls CSS)
- `src/App.tsx` — MODIFIED (import + render StreamErrorBoundary + StreamControls)
