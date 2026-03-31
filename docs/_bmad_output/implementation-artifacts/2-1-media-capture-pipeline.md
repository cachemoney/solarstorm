# Story 2.1: Media Capture Pipeline

Status: ready-for-dev

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

- [ ] Create `src/StreamManager.ts` — Core streaming engine class (AC: 1-4)
  - [ ] Define `StreamManager` class with private fields for `peerConnection`, `mediaStream`, `videoTrack`, `audioTrack`
  - [ ] Implement `start(canvas: HTMLCanvasElement, audioContext: AudioContext, config: StreamConfig)` method
  - [ ] Implement `stop()` method that stops all tracks and cleans up resources
  - [ ] In `start()`: capture video via `canvas.captureStream(30)` — 30fps target
  - [ ] In `start()`: capture audio via `audioContext.createMediaStreamDestination()` and connect to existing audio graph
  - [ ] In `start()`: combine tracks via `new MediaStream([...videoTracks, ...audioTracks])`
  - [ ] Add error handling with try-catch — on failure, call `useStreamStore.getState().setError()`
  - [ ] Export singleton instance or factory function

- [ ] Modify `src/Music.tsx` — Expose AudioListener for audio capture (AC: 1)
  - [ ] Add `forwardRef` to `Audio` component to expose the `AudioListener` ref
  - [ ] Alternative: Add a ref callback prop `onAudioListenerReady?: (listener: AudioListener) => void`
  - [ ] Ensure backward compatibility — no changes to existing behavior when ref not used

- [ ] Create `src/StreamCapture.tsx` — R3F component for media capture (AC: 1-3)
  - [ ] Use `useThree()` hook to access `gl.domElement` (canvas)
  - [ ] Accept `audioListener` ref as prop from parent
  - [ ] Access audio context via `audioListener.context`
  - [ ] Call `StreamManager.start()` with canvas and audio context
  - [ ] Use `useEffect` with cleanup to call `StreamManager.stop()` on unmount
  - [ ] Only initiate capture when `useStreamStore.status === 'connecting'`

- [ ] Update `src/App.tsx` — Integrate StreamCapture (AC: 1-4)
  - [ ] Add state or ref to hold `AudioListener` from `Music` component
  - [ ] Render `<StreamCapture audioListener={audioListenerRef} />` inside `<Canvas>` tree
  - [ ] Ensure StreamCapture only renders when streaming is being initiated

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

(To be filled by dev agent)

### Debug Log References

(To be filled by dev agent)

### Completion Notes List

(To be filled by dev agent)

### File List

(To be filled by dev agent)
