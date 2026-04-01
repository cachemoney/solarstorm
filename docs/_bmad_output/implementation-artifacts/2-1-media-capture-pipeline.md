# Story 2.1: Media Capture Pipeline

Status: done

## Story

As a creator,
I want the system to capture the WebGL canvas video and audio output and combine them into a single stream,
so that my visualization's visual and audio content can be broadcast together.

## Acceptance Criteria

1. **Given** the 3D scene is rendering and audio is playing **When** media capture is initiated **Then** the WebGL canvas is captured via `captureStream()` at the scene's native resolution (FR11, NFR2) and audio is captured via `createMediaStreamDestination()` (FR12)

2. **Given** both video and audio tracks are captured **When** they are combined **Then** a single `MediaStream` containing both video and audio tracks is created (FR13)

3. **Given** the combined MediaStream exists **When** the video track is inspected **Then** it contains only the WebGL canvas output — no browser UI elements (FR11)

4. **Given** media capture is active **When** the 3D scene is rendering **Then** all existing visualization capabilities continue functioning normally (FR19, FR20, FR21) with no measurable framerate degradation below 30fps (NFR1)

## Tasks / Subtasks

- [x] Create `src/StreamManager.ts` — Core streaming engine class (AC: 1-4)
  - [x] Define `StreamManager` class with private fields for `mediaStream`, `videoTrack`, `audioTrack`, `audioDestination`, `audioListener`
  - [x] Implement `start(canvas: HTMLCanvasElement, audioListener: AudioListener)` method
  - [x] Implement `stop()` method that stops all tracks and cleans up resources
  - [x] In `start()`: capture video via `canvas.captureStream(30)` — 30fps target
  - [x] In `start()`: capture audio via `audioListener.context.createMediaStreamDestination()` and connect `audioListener.gain` to destination
  - [x] In `start()`: combine tracks via `new MediaStream([videoTrack, audioTrack])`
  - [x] Add error handling with try-catch — on failure, call `useStreamStore.getState().setError()`
  - [x] Export singleton instance `streamManager`

- [x] Modify `src/Music.tsx` — Expose AudioListener for audio capture (AC: 1)
  - [x] Added `onListener` callback prop to `AudioLayerProps` and `AudioProps`
  - [x] Added `onAudioListenerReady` callback prop to `Music` component
  - [x] Backward compatible — no changes to existing behavior when callback not provided

- [x] Create `src/StreamCapture.tsx` — R3F component for media capture (AC: 1-3)
  - [x] Use `useThree()` hook to access `gl.domElement` (canvas)
  - [x] Accept `audioListener` ref as prop from parent
  - [x] Call `StreamManager.start()` with canvas and audioListener
  - [x] Use `useEffect` with cleanup to call `StreamManager.stop()` on unmount
  - [x] Only initiate capture when `useStreamStore.status === 'connecting'`

- [x] Update `src/App.tsx` — Integrate StreamCapture (AC: 1-4)
  - [x] Added `useState<AudioListener | null>` to hold AudioListener from `Music` component
  - [x] Pass `onAudioListenerReady={setAudioListener}` to `<Music />`
  - [x] Render `<StreamCapture audioListener={audioListener} />` inside `<Canvas>` tree when status is `connecting`
  - [x] Wire `StreamControls` Go Live/Stop/Retry buttons to store actions and `streamManager`

## Dev Notes

### CRITICAL: StreamManager is NOT a React Component

`StreamManager.ts` is a plain TypeScript class — no React, no hooks, no JSX. It owns the `RTCPeerConnection`, `MediaStream`, and WHIP negotiation logic (WHIP comes in Story 2.2). This story focuses only on media capture.

```typescript
// StreamManager.ts pattern
export class StreamManager {
  private mediaStream: MediaStream | null = null;
  private videoTrack: MediaStreamTrack | null = null;
  private audioTrack: MediaStreamTrack | null = null;

  start(canvas: HTMLCanvasElement, audioContext: AudioContext, config: StreamConfig): void {
    try {
      // Capture video from canvas
      this.mediaStream = canvas.captureStream(30);
      this.videoTrack = this.mediaStream.getVideoTracks()[0];

      // Capture audio from AudioContext
      const destination = audioContext.createMediaStreamDestination();
      // Connect destination to audio graph (details depend on Music.tsx structure)
      
      // Combine tracks
      const audioTrack = destination.stream.getAudioTracks()[0];
      this.mediaStream.addTrack(audioTrack);

      useStreamStore.getState().setStatus('connecting');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start media capture';
      useStreamStore.getState().setError(message);
    }
  }

  stop(): void {
    this.videoTrack?.stop();
    this.audioTrack?.stop();
    this.mediaStream = null;
    useStreamStore.getState().setStatus('offline');
  }
}

export const streamManager = new StreamManager();
```

### Canvas Access Pattern

Use `useThree` hook from React Three Fiber — NEVER use `document.querySelector`:

```typescript
import { useThree } from '@react-three/fiber';

function StreamCapture({ audioListener }: { audioListener: AudioListener | null }) {
  const { gl } = useThree(); // gl is the Three.js WebGLRenderer
  const canvas = gl.domElement; // This is the HTMLCanvasElement
  
  // ... rest of capture logic
}
```

### AudioListener Access Pattern

`Music.tsx` creates an `AudioListener` and uses it for audio analysis. For streaming, we need access to the same audio context:

**Option A (Recommended): forwardRef on Audio component**
```typescript
// In Music.tsx
export const Audio = forwardRef<AudioListener>(function Audio(props, ref) {
  const [listener] = useState(() => new AudioListener());
  
  useImperativeHandle(ref, () => listener, [listener]);
  
  // ... existing code
});

// In App.tsx
const audioListenerRef = useRef<AudioListener>(null);

// In JSX
<Audio ref={audioListenerRef} />
```

**Option B: Callback prop**
```typescript
// In Music.tsx
<Audio onAudioListenerReady={(listener) => { /* store ref */ }} />
```

Choose the approach that requires minimal changes to `Music.tsx`.

### Audio Capture: Connecting to the Audio Graph

The existing audio graph in `Music.tsx` plays audio through `AudioListener`. To capture the same audio:

1. Get `AudioListener.context` (the `AudioContext`)
2. Create `createMediaStreamDestination()` on that context
3. Connect the destination to capture audio output

**Important:** The existing audio must continue playing normally — capture is a parallel tap, not a replacement.

```typescript
const audioContext = audioListener.context;
const destination = audioContext.createMediaStreamDestination();

// Option: Connect listener output to destination
// This depends on the existing audio graph structure in Music.tsx
```

### MediaStream Track Combination

After capturing both video and audio:

```typescript
// From canvas capture (video only)
const videoStream = canvas.captureStream(30);
const videoTrack = videoStream.getVideoTracks()[0];

// From audio destination
const audioDestination = audioContext.createMediaStreamDestination();
// ... connect audio graph to destination ...
const audioTrack = audioDestination.stream.getAudioTracks()[0];

// Combine into single MediaStream
const combinedStream = new MediaStream([videoTrack, audioTrack]);
```

### Error Handling

All media capture operations must be wrapped in try-catch. Errors should:
1. Update `useStreamStore` status to `'error'`
2. Set a descriptive `errorMessage`
3. Clean up any partially-created resources

```typescript
try {
  // capture operations
} catch (error) {
  // Clean up partial resources
  this.videoTrack?.stop();
  this.audioTrack?.stop();
  
  const message = error instanceof Error ? error.message : 'Media capture failed';
  useStreamStore.getState().setError(message);
}
```

### No WHIP Connection Yet (Story 2.2)

This story only covers media capture. The WHIP connection to the relay server is implemented in Story 2.2. The `StreamManager.start()` method in this story should:
- Capture video and audio
- Create combined MediaStream
- Store the stream for Story 2.2 to use
- Update status to `'connecting'` (WHIP will transition to `'live'` or `'error'`)

### Performance Considerations (NFR1)

- Canvas capture at 30fps (`captureStream(30)`) balances quality vs performance
- Audio capture via `createMediaStreamDestination()` has minimal overhead
- Combined MediaStream should not cause framerate degradation below 30fps
- Test by measuring `performance.now()` delta between frames during capture

### File Locations

- `src/StreamManager.ts` — NEW (core engine class)
- `src/StreamCapture.tsx` — NEW (R3F component)
- `src/Music.tsx` — MODIFIED (expose AudioListener)
- `src/App.tsx` — MODIFIED (integrate StreamCapture)

### References

- [Source: src/useStreamStore.ts] — store API for status updates
- [Source: src/Music.tsx] — AudioListener location, audio graph structure
- [Source: src/App.tsx] — Canvas tree location, integration point
- [Source: docs/_bmad_output/planning-artifacts/architecture.md#Media Capture Architecture] — useThree + AudioListener access pattern
- [Source: docs/_bmad_output/planning-artifacts/architecture.md#Component Boundaries] — StreamManager responsibilities
- [Source: docs/_bmad_output/planning-artifacts/epics.md#Story 2.1] — acceptance criteria

## Dev Agent Record

### Agent Model Used

glm-5.1

### Debug Log References

TypeScript type-check passed clean with no errors after all changes.

### Completion Notes List

- Created `StreamManager.ts` as a plain TypeScript class (no React dependencies). Captures WebGL canvas video via `captureStream(30)` and audio via `createMediaStreamDestination()` connected to `AudioListener.gain`. Produces a combined `MediaStream` with both tracks. Proper cleanup on `stop()` disconnects the gain node and stops all tracks.
- Modified `Music.tsx` using callback prop pattern (`onAudioListenerReady`). Added `onListener` prop to `AudioProps` and `AudioLayerProps`, threaded through from the `Music` component. Fully backward compatible — existing `Music` usage without the prop works unchanged.
- Created `StreamCapture.tsx` as an R3F component using `useThree()` for canvas access. Mounts inside `<Canvas>` tree only when `status === 'connecting'`. Uses `useEffect` cleanup to stop the manager on unmount.
- Updated `App.tsx` to hold `AudioListener` in state via `setAudioListener` callback from `<Music>`. Renders `<StreamCapture>` conditionally inside Canvas. Wired `StreamControls` Go Live/Stop/Retry buttons.
- No test suite in project — validated via `npm run type-check` (tsc --noEmit) with zero errors.

### Change Log

- 2026-03-31: Implemented Story 2.1 — Media Capture Pipeline. Created StreamManager.ts, StreamCapture.tsx. Modified Music.tsx (expose AudioListener), App.tsx (integrate StreamCapture + wire controls), StreamControls.tsx (wire Go Live/Stop/Retry to store and manager). Type-check passes.

### File List

- `src/StreamManager.ts` — NEW
- `src/StreamCapture.tsx` — NEW
- `src/Music.tsx` — MODIFIED
- `src/App.tsx` — MODIFIED
- `src/StreamControls.tsx` — MODIFIED

### Review Findings

- [x] [Review][Decision→Patch] Only bass audio captured in stream — Fixed: onListener now passed to all 4 AudioLayers. StreamManager.start() accepts AudioListener[], connects all gains to a single MediaStreamDestination. Three.js AudioListeners share a common AudioContext so cross-listener routing works. [blind+edge+auditor]

- [x] [Review][Decision→Patch] WebGL canvas may produce blank/black frames — Fixed: added `gl={{ preserveDrawingBuffer: true }}` to Canvas. [edge]

- [x] [Review][Patch][Dismissed] Error handler does not set status to 'error' — False positive: useStreamStore.setError() already sets status to 'error' (line 69). [auditor]

- [x] [Review][Patch] start() has no re-entry guard — Fixed: added cleanup guard at entry. [StreamManager.ts] [blind+edge]

- [x] [Review][Patch] Track array access without bounds check — Fixed: explicit null checks with descriptive errors. [StreamManager.ts] [edge]

- [x] [Review][Patch] Retry does not clear errorMessage — Fixed: setStatus now clears errorMessage when transitioning to non-error states. [useStreamStore.ts] [edge]

- [x] [Review][Patch] stop() does not clear errorMessage — Fixed: setStatus clears errorMessage on non-error transitions. [useStreamStore.ts] [edge]

- [x] [Review][Patch] Duplicate unused StreamConfig interface — Removed from StreamManager.ts (already in useStreamStore.ts). [edge+auditor]

- [x] [Review][Patch] Redundant AudioListener import — Removed from App.tsx, uses THREE.AudioListener. [App.tsx] [blind]

- [x] [Review][Patch] onListener in useEffect deps is fragile — Fixed: uses ref pattern to avoid dependency on callback identity. [Music.tsx] [blind]

- [x] [Review][Defer] Status never transitions to 'live' — by design; WHIP connection (Story 2.2) will handle this transition [blind+edge+auditor]

- [x] [Review][Defer] AudioContext may be suspended when start() called — pre-existing, depends on user clicking Play first [edge]

- [x] [Review][Defer] Stream capture can start before audio is playing — pre-existing UX issue, not gated by init state [edge]

- [x] [Review][Defer] Audio component cleanup disconnects sound from listener gain during HMR — pre-existing edge case [edge]
