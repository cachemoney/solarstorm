---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
status: 'complete'
completedAt: '2026-03-29'
inputDocuments:
  - docs/_bmad_output/planning-artifacts/prd.md
  - .planning/codebase/ARCHITECTURE.md
  - .planning/codebase/STRUCTURE.md
  - .planning/codebase/CONVENTIONS.md
  - .planning/codebase/STACK.md
  - .planning/codebase/INTEGRATIONS.md
  - .planning/codebase/TESTING.md
  - .planning/codebase/CONCERNS.md
workflowType: 'architecture'
project_name: 'solarstorm'
user_name: 'cache'
date: '2026-03-29'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The 21 functional requirements define a self-contained streaming module that overlays onto the existing visualization:

- **Stream Control (FR1-FR5):** Start/stop live stream, display status (offline/connecting/live/error), retry on failure, and maintain stream during tab backgrounding
- **Stream Configuration (FR6-FR10):** Configure relay endpoint URL and YouTube stream key, persist in `localStorage`, disable "Go Live" when unconfigured
- **Media Capture (FR11-FR14):** Capture WebGL canvas video via `captureStream()`, capture audio via `createMediaStreamDestination()`, mux into single `MediaStream`, deliver to relay
- **Stream Resilience (FR15-FR18):** Isolate streaming failures from 3D scene, detect disconnection, display descriptive errors, maintain render loop at reduced framerate when tab hidden
- **Experience Preservation (FR19-FR21):** All existing visual, audio-reactive, and UI capabilities remain intact when streaming

**Non-Functional Requirements:**

- **NFR1:** 30fps minimum (target 60fps) during streaming
- **NFR2:** 720p minimum video quality (target 1080p)
- **NFR3:** AV sync drift under 200ms
- **NFR4:** Stream connection within 10 seconds
- **NFR5:** 15fps minimum when tab backgrounded
- **NFR6:** No memory leaks over single broadcast session
- **NFR7-NFR9:** Stream key security (localStorage only, HTTPS only, no logging)
- **NFR10-NFR12:** Standard WebRTC/WHIP protocol integration with graceful degradation

**Scale & Complexity:**

- Primary domain: Browser-native real-time media pipeline (WebGL + Web Audio + WebRTC/WHIP)
- Complexity level: Medium
- Estimated architectural components: 4-5 new modules (stream manager, media capture, stream config store, UI controls, background resilience)

### Technical Constraints & Dependencies

- **Browser-only:** No server-side component. All media capture, muxing, and relay communication happen client-side
- **External RTMP relay SaaS:** Required bridge between browser MediaStream and YouTube's RTMPS ingest (e.g., livepush.io via WHIP protocol)
- **HTTPS required:** `captureStream()` requires secure context (already satisfied by Netlify)
- **WebGL canvas access:** Must access the existing Three.js renderer's canvas DOM element for `captureStream()`
- **Web Audio API access:** Must access the existing `AudioContext` for `createMediaStreamDestination()`
- **React Three Fiber render loop:** Background tab resilience requires overriding or supplementing R3F's `requestAnimationFrame`-based loop
- **Existing Zustand store:** New streaming state must integrate with or coexist alongside `useMusicStore`

### Cross-Cutting Concerns Identified

- **Performance isolation:** Streaming pipeline must not degrade 3D rendering — requires careful resource management and potential separation of concerns
- **Error isolation:** Streaming failures must not cascade to the visualization — requires circuit breaker pattern between streaming module and core scene
- **State persistence:** Stream configuration (endpoint URL, stream key) persisted via `localStorage` with security considerations
- **Background execution:** Tab visibility changes affect `requestAnimationFrame` — affects 10+ components using `useFrame`
- **AV synchronization:** Combining independently-captured video and audio streams requires careful timing

## Technology Foundation

### Existing Stack (Brownfield)

Solar Storm is an established application with these locked-in technology choices:

- **Language:** TypeScript 5.3 (strict mode enabled)
- **UI Framework:** React 18.2 with functional components and hooks
- **3D Rendering:** React Three Fiber 8.15 + Three.js 0.160
- **State Management:** Zustand 4.4 with `subscribeWithSelector` middleware
- **Build Tool:** Vite 7.3 with GLSL plugin for shader imports
- **Styling:** Plain CSS (`src/styles.css`)
- **Audio:** Three.js AudioLoader + AudioAnalyser (Web Audio API wrapper)
- **Post-Processing:** Three.js EffectComposer with custom passes

### New Dependencies for Streaming

**Browser-native APIs (no library required):**

- `HTMLCanvasElement.captureStream()` — captures WebGL canvas as a video MediaStreamTrack
- `AudioContext.createMediaStreamDestination()` — captures audio output as an audio MediaStreamTrack
- `MediaStream` constructor — combines video + audio tracks into a single stream
- `localStorage` — persists relay endpoint URL and stream key
- `document.visibilitychange` event — detects tab backgrounding for render loop fallback

**WHIP/WebRTC client:**

| Approach | Pros | Cons |
|----------|------|------|
| **Native RTCPeerConnection + WHIP** | No dependencies, full control, vendor-agnostic | More code to write, must implement WHIP SDP exchange |
| **Relay provider SDK** | Fastest integration, provider-optimized | Vendor lock-in, may not follow WHIP standard |
| **Lightweight WHIP library** | Minimal abstraction, standards-based | Additional dependency, may not cover all relay providers |

**Decision: Native `RTCPeerConnection` with manual WHIP SDP exchange.**

Rationale: the WHIP protocol is simple (single HTTP POST with SDP offer, receive SDP answer), the PRD specifies standard WHIP (NFR10), and this avoids both vendor lock-in and unnecessary dependencies. The implementation is ~50-100 lines for the connection logic.

### No Additional npm Dependencies

The streaming feature is achievable entirely with browser-native APIs plus the WHIP connection logic. No new npm packages are needed for the MVP.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- State management approach for streaming module
- Media capture architecture (canvas + audio access pattern)
- Error isolation pattern

**Important Decisions (Shape Architecture):**

- File organization for streaming module
- Background tab resilience strategy

**Deferred to Phase 2:**

- `OffscreenCanvas` + Web Worker migration for full-speed background rendering
- Configurable stream quality (resolution, bitrate)
- Stream health metrics

### State Management

**Decision: Separate Zustand store (`useStreamStore`)**

Rationale: Streaming state (status, configuration, errors) has no relationship to music state (frequency data, progress, effect triggers). A separate store follows the same Zustand patterns already established in the codebase (`createWithEqualityFn` + `subscribeWithSelector`) while keeping the existing `useMusicStore` completely untouched, satisfying FR19-FR21.

**Store shape:**

```
useStreamStore:
  - config: { relayUrl: string, streamKey: string }
  - status: 'offline' | 'connecting' | 'live' | 'error'
  - errorMessage: string | null
  - isConfigured: boolean
  - Actions: setConfig, setStatus, setError, clearConfig, loadConfig
```

**Persistence:** `loadConfig` reads from `localStorage` on store initialization. `setConfig` writes to `localStorage`. Stream key is never logged or included in error reports (NFR7-NFR9).

### File Organization

**Decision: Flat in `src/` (following existing convention)**

Rationale: The existing codebase places all components flat in `src/` with subdirectories only for self-contained subsystems (`MeshLine/`, `post/`, `shaders/`). The streaming module is ~4-5 files and fits this pattern.

**New files:**

- `src/useStreamStore.ts` — Zustand store for streaming state and config persistence
- `src/StreamManager.ts` — Core streaming logic (WHIP connection, media capture, lifecycle)
- `src/StreamControls.tsx` — UI component (Go Live/Stop button, status indicator, settings panel)
- `src/useBackgroundRender.ts` — Hook for background tab render loop fallback

### Media Capture Architecture

**Decision: R3F `useThree` hook + Three.js AudioListener access**

Rationale: `useThree` provides idiomatic access to the Three.js renderer from within R3F's component tree. The canvas DOM element is retrieved via `gl.domElement` for `captureStream()`. The audio context is accessed through Three.js's `AudioListener`, which `Music.tsx` already creates. This avoids fragile DOM queries and prop drilling.

**Capture flow:**

1. `useThree()` → `state.gl.domElement` → `canvas.captureStream(30)` for video track
2. `AudioListener` ref (from `Music.tsx`) → `listener.context` → `context.createMediaStreamDestination()` for audio track
3. `new MediaStream([...videoTracks, ...audioTracks])` combines both

**Connection point:** A new component (e.g., `StreamCapture`) mounts inside the R3F `<Canvas>` tree to access `useThree` and the audio listener, then passes the composed `MediaStream` to `StreamManager`.

### Background Tab Resilience

**Decision: `setInterval` fallback when tab hidden (Phase 1 MVP)**

Rationale: When `document.visibilityState` becomes `"hidden"`, `requestAnimationFrame` throttles to near-zero. The streaming pipeline needs frames to keep flowing. A `setInterval` at ~33ms (30fps) maintains the render loop. This is the PRD's Phase 1 approach.

**Implementation pattern (`useBackgroundRender`):**

- Listen for `visibilitychange` events
- When hidden + streaming active: override R3F's render loop with `setInterval` at reduced framerate
- When visible: restore normal `requestAnimationFrame`-driven loop
- Target: 15fps minimum when backgrounded (NFR5), reduced from 60fps to limit CPU usage

**Phase 2:** Migrate to `OffscreenCanvas` in a Web Worker for full-speed background rendering without impacting main thread.

### Error Isolation

**Decision: React Error Boundary + async try-catch (dual layer)**

Rationale: Streaming failures must never crash the 3D scene (FR15). This requires two layers:

1. **React Error Boundary** wrapping streaming UI components — catches rendering errors in `StreamControls`, displays fallback UI
2. **Async try-catch** in `StreamManager` — all WHIP connection, media capture, and streaming operations wrapped in try-catch. Errors update `useStreamStore` status to `"error"` with descriptive messages (FR17). The 3D scene never encounters streaming exceptions.

**Error flow:**

- WHIP connection fails → caught in try-catch → `setStatus('error')`, `setError('Connection lost to relay server')`
- Media capture fails → caught in try-catch → `setStatus('error')`, `setError('Failed to capture canvas stream')`
- Stream disconnects mid-broadcast → `RTCPeerConnection` `iceConnectionStateChange` event → `setStatus('error')`, `setError(message)`
- UI rendering error → Error Boundary catches → fallback UI displayed

### Decision Impact Analysis

**Implementation Sequence:**

1. `useStreamStore.ts` — foundation for all other modules
2. `StreamManager.ts` — core WHIP + media capture logic
3. `useBackgroundRender.ts` — background tab resilience
4. `StreamControls.tsx` — UI layer, integrates everything

**Cross-Component Dependencies:**

- `StreamControls` depends on `useStreamStore` for status display and `StreamManager` for start/stop actions
- `StreamManager` depends on `useStreamStore` for status updates and config
- `useBackgroundRender` depends on `useStreamStore` to know when streaming is active
- `Music.tsx` must expose its `AudioListener` ref for audio capture (minimal change to existing file)
- `App.tsx` must render `StreamControls` in the overlay UI (minimal change to existing file)

## Implementation Patterns & Consistency Rules

### Naming Patterns

**File naming (follow existing):**
- Components: PascalCase (`StreamControls.tsx`)
- Hooks/stores: camelCase with `use` prefix (`useStreamStore.ts`, `useBackgroundRender.ts`)
- Utilities: PascalCase for classes (`StreamManager.ts`)

**Type/Interface naming:**
- Props: `[Component]Props` pattern (`StreamControlsProps`)
- State: descriptive name (`StreamState`, `StreamConfig`)
- Status: discriminated union type (`type StreamStatus = 'offline' | 'connecting' | 'live' | 'error'`)
- Keep consistent with existing `MusicState`, `SceneProps` patterns

**Variable naming:**
- Store references: `useStreamStore` (matches `useMusicStore`)
- Refs: descriptive camelCase (`peerConnection`, `mediaStream`, `renderInterval`)
- Constants: camelCase or SCREAMING_SNAKE_CASE — match existing codebase convention

### State Management Patterns

**Must match `useMusicStore` patterns exactly:**
- Use `createWithEqualityFn` with `subscribeWithSelector` middleware
- Define a `StreamState` interface at the top of the store file
- Selectors in consuming components use `useStreamStore(selector, shallow)` for multiple fields
- Single subscriptions use `useStreamStore((state) => state.field)` without shallow
- Store subscriptions in `useEffect` must return the cleanup function: `return useStreamStore.subscribe(...)`

**Store structure:**
- State fields and setters in a single `StreamState` interface
- Pure setter functions — no side effects in store actions
- Async operations (WHIP connection) happen in `StreamManager`, not in store actions

### Error Handling Patterns

**Error state shape (in store):**
- `errorMessage: string | null` — `null` when status is not `'error'`, human-readable string when status is `'error'`
- Error messages are user-facing: "Connection lost to relay server", "Failed to capture audio stream"

**Error boundary pattern:**
- `StreamErrorBoundary` wraps `StreamControls` component
- Fallback UI: minimal text "Streaming error" with retry button
- Never catches errors from the 3D scene

**Async error pattern:**
- All async operations in `StreamManager` wrapped in try-catch
- Catch blocks: `setStatus('error')`, `setError(descriptiveMessage)`
- `console.error` for debugging, but error message sanitized (no stream key in logs)

### CSS Patterns

**Follow existing overlay styles:**
- New UI elements use `.overlay` class pattern from `src/styles.css`
- Button styles match existing Play button aesthetic
- Status indicator: small colored dot + text
- Settings panel: overlay panel with form inputs
- All new styles added to `src/styles.css` (no new CSS files)
- Colors: hex strings (e.g., `#de77c7`, `#ff0000` for live indicator)

### React/R3F Integration Patterns

**Component mounting:**
- `StreamControls` renders in `App.tsx` overlay (same layer as Play button)
- `StreamCapture` renders inside `<Canvas>` tree to access `useThree`
- `useBackgroundRender` hook used in `App.tsx` or `Scene.tsx` (wherever render loop is managed)

**Ref patterns:**
- `forwardRef` only if parent needs a ref (follow `Audio` in `Music.tsx` pattern)
- `useRef` for persistent values that don't trigger re-renders (peer connection, media stream)

**Cleanup patterns (critical for NFR6 — no memory leaks):**
- All `useEffect` hooks must have cleanup functions
- `StreamManager.start()` must have a corresponding `stop()` that:
  - Closes `RTCPeerConnection`
  - Stops all `MediaStreamTrack`s
  - Clears any `setInterval` timers
- Event listeners (`visibilitychange`, `iceConnectionStateChange`) removed on unmount

### Enforcement Guidelines

**All AI agents MUST:**

- Follow existing codebase conventions documented in `.planning/codebase/CONVENTIONS.md`
- Use no new npm dependencies (browser-native APIs only for streaming)
- Never import from or modify `useMusicStore` for streaming purposes
- Never access the canvas DOM element via `document.querySelector` — use `useThree` hook
- Never include the stream key in `console.log`, `console.error`, or network requests to non-relay endpoints
- Always wrap async streaming operations in try-catch with store status updates
- Always clean up resources (peer connections, media streams, timers) on unmount

## Project Structure & Boundaries

### Complete Project Tree (New & Modified Files)

```
src/
├── useStreamStore.ts          ← NEW: Zustand store (FR6-FR10, config + status)
├── StreamManager.ts            ← NEW: WHIP connection + media capture (FR1-FR4, FR11-FR14)
├── StreamControls.tsx          ← NEW: UI overlay (FR1-FR3, FR6-FR10, FR17)
├── useBackgroundRender.ts      ← NEW: Background tab resilience (FR5, FR18)
│
├── App.tsx                     ← MODIFIED: Add StreamControls to overlay, useBackgroundRender
├── Music.tsx                   ← MODIFIED: Expose AudioListener ref
├── styles.css                  ← MODIFIED: Add streaming UI styles
│
├── Scene.tsx                   ← UNCHANGED
├── Planet.tsx                  ← UNCHANGED
├── Effects.tsx                 ← UNCHANGED
├── Sparks.tsx                  ← UNCHANGED
├── SparkStorm.tsx              ← UNCHANGED
├── SpaceDust.tsx               ← UNCHANGED
├── SpaceShip.tsx               ← UNCHANGED
├── SilkyMaterial.tsx           ← UNCHANGED
├── useMusicStore.ts            ← UNCHANGED
├── attractor.ts                ← UNCHANGED
├── index.tsx                   ← UNCHANGED
├── shaders/                    ← UNCHANGED
├── post/                       ← UNCHANGED
├── MeshLine/                   ← UNCHANGED
└── vite-env.d.ts               ← UNCHANGED
```

### Requirements Mapping

| Requirement | File(s) | Responsibility |
|-------------|---------|----------------|
| FR1: Start stream | `StreamControls.tsx` → `StreamManager.ts` | Button triggers `manager.start()` |
| FR2: Stop stream | `StreamControls.tsx` → `StreamManager.ts` | Button triggers `manager.stop()` |
| FR3: Stream status display | `StreamControls.tsx` ← `useStreamStore.ts` | Reads `status` from store |
| FR4: Retry failed stream | `StreamControls.tsx` → `StreamManager.ts` | Retry button triggers reconnection |
| FR5: Background tab resilience | `useBackgroundRender.ts` | `setInterval` fallback when hidden |
| FR6-FR7: Configure endpoint/key | `StreamControls.tsx` → `useStreamStore.ts` | Settings form writes to store + localStorage |
| FR8: Persist config | `useStreamStore.ts` | `localStorage` read/write |
| FR9: Disable when unconfigured | `StreamControls.tsx` ← `useStreamStore.ts` | Reads `isConfigured` flag |
| FR10: Update/clear config | `StreamControls.tsx` → `useStreamStore.ts` | Settings form actions |
| FR11-FR13: Media capture | `StreamManager.ts` | `captureStream()` + `createMediaStreamDestination()` + mux |
| FR14: Deliver to relay | `StreamManager.ts` | WHIP SDP exchange via `RTCPeerConnection` |
| FR15-FR17: Error isolation | `StreamManager.ts` + `StreamControls.tsx` | Try-catch + Error Boundary + store status |
| FR18: Maintain render in background | `useBackgroundRender.ts` | Visibility change listener + `setInterval` |
| FR19-FR21: Preserve existing | N/A (no changes to existing components) | Streaming module is additive |

### Component Boundaries

**`StreamManager.ts` — Core streaming engine (no React, no UI)**

- Owns: `RTCPeerConnection`, `MediaStream`, WHIP negotiation logic
- Dependencies: `useStreamStore` (status updates), browser APIs
- Does NOT: Import React, render UI, access DOM directly
- API: `start(canvas, audioContext, config)`, `stop()`, `retry()`

**`useStreamStore.ts` — Streaming state (Zustand, no browser APIs)**

- Owns: Stream status, config, error state
- Dependencies: Zustand, `localStorage` (for persistence only)
- Does NOT: Import Three.js, manage peer connections, capture media
- API: `setConfig`, `setStatus`, `setError`, `clearConfig`, `loadConfig`

**`StreamControls.tsx` — UI layer only (React, no direct browser APIs)**

- Owns: Button rendering, settings form, status display
- Dependencies: `useStreamStore` (reads status/config), `StreamManager` (start/stop actions)
- Does NOT: Directly manage peer connections or media streams
- Wrapped in: Error boundary

**`useBackgroundRender.ts` — Render loop hook (R3F hook)**

- Owns: `visibilitychange` listener, `setInterval` fallback timer
- Dependencies: `useStreamStore` (know when streaming), `useThree` (access renderer)
- Does NOT: Manage streaming connection or UI

### Integration Points (Changes to Existing Files)

**`App.tsx` (minimal change):**
- Import and render `<StreamControls />` in the overlay div (alongside existing Play button)
- Import and use `useBackgroundRender` hook

**`Music.tsx` (minimal change):**
- Export the `AudioListener` ref or expose audio context via a ref that `StreamManager` can access
- Alternative: accept a ref callback prop to expose the listener

**`styles.css` (additive only):**
- Add `.stream-controls`, `.stream-status`, `.stream-settings` classes
- Match existing overlay aesthetic (dark background, light text, minimal UI)

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices are compatible. Browser-native APIs (captureStream, createMediaStreamDestination, RTCPeerConnection, localStorage, visibilitychange) work together in a modern browser with no version conflicts. The existing R3F/Zustand stack requires no modifications for compatibility.

**Pattern Consistency:** Implementation patterns align with existing codebase conventions — Zustand store structure matches useMusicStore, file naming follows established patterns, CSS follows overlay conventions.

**Structure Alignment:** The flat-in-src file organization supports the architectural decisions. Each new file has a clear single responsibility. Integration points to existing files (App.tsx, Music.tsx, styles.css) are minimal and additive.

### Requirements Coverage Validation

**Functional Requirements:** All 21 FRs have a clear implementation path through the 4 new modules + 3 modified files.

**Non-Functional Requirements:** All 12 NFRs are architecturally addressed:
- Performance (NFR1, NFR5): Lightweight capture pipeline + setInterval fallback
- Quality (NFR2): Canvas renders at viewport resolution, captureStream preserves it
- Sync (NFR3): Same-audio-context capture minimizes drift
- Speed (NFR4): WHIP is single HTTP POST
- Memory (NFR6): Cleanup patterns enforced across all modules
- Security (NFR7-NFR9): localStorage-only, HTTPS, no logging

### Gap Analysis

**Minor Gap: AudioListener access mechanism** — Music.tsx does not currently expose its AudioListener ref. Implementation story must specify the approach (ref forwarding, callback prop, or React context). Not a blocker — choose the simplest option during implementation.

**Minor Gap: WHIP relay service specifics** — WHIP implementations vary slightly between relay providers. StreamManager should implement against one provider first (e.g., livepush.io) with the SDP exchange function kept isolated for easy adaptation. Not a blocker for MVP.

**Minor Gap: R3F render loop control** — useBackgroundRender needs to control R3F's frame loop when the tab is hidden. May require switching to demand-based rendering (frameloop="demand") or using R3F's invalidate function. Implementation detail, not an architectural blocker.

### Architecture Completeness Checklist

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped
- [x] Critical decisions documented with rationale
- [x] Technology stack fully specified (no new npm dependencies)
- [x] Integration patterns defined (useThree, AudioListener access)
- [x] Performance considerations addressed
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified (Zustand store, no events)
- [x] Process patterns documented (error handling, cleanup)
- [x] Complete directory structure defined (4 new files, 3 modified)
- [x] Component boundaries established (4 modules with clear responsibilities)
- [x] Integration points mapped (App.tsx, Music.tsx, styles.css)
- [x] Requirements to structure mapping complete (all 33 requirements covered)
- [x] All 33 requirements validated as architecturally supported
- [x] Gaps identified and assessed (3 minor, 0 blocking)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — focused scope, no new dependencies, clear boundaries, minimal changes to existing code.

**Key Strengths:**
- Zero new npm dependencies — entire feature built on browser-native APIs
- Streaming module is fully additive — existing visualization is untouched
- Clear component boundaries with single-responsibility modules
- Consistent patterns matching established codebase conventions

**Areas for Future Enhancement (Phase 2):**
- OffscreenCanvas + Web Worker for full-speed background rendering
- Configurable stream quality (resolution, bitrate)
- Stream health metrics (bitrate, dropped frames, latency)
- Multi-platform streaming (Twitch, custom RTMP endpoints)

### Implementation Handoff

**Implementation Priority:**

1. `useStreamStore.ts` — Foundation; all other modules depend on it
2. `StreamManager.ts` — Core engine; WHIP connection + media capture
3. `useBackgroundRender.ts` — Background resilience hook
4. `StreamControls.tsx` — UI layer; integrates everything
5. Modify `App.tsx`, `Music.tsx`, `styles.css` — Integration points

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect module boundaries — no cross-boundary imports beyond what's defined
- Refer to this document for all architectural questions
- Never modify existing components (useMusicStore, Scene, Planet, etc.) for streaming purposes
