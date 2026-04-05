# Story 2.2: WHIP Connection & Stream Delivery

Status: done

## Story

As a creator,
I want the combined media stream delivered to my configured relay service,
so that it can be broadcast to YouTube Live.

## Acceptance Criteria

1. **Given** the creator has valid configuration and a combined MediaStream **When** "Go Live" is clicked **Then** an `RTCPeerConnection` is created and a WHIP SDP offer is sent via HTTP POST to the relay endpoint (FR14, NFR10)

2. **Given** the WHIP SDP exchange begins **When** the connection is being established **Then** stream status updates to `"connecting"` (FR3, NFR4)

3. **Given** the relay service accepts the SDP offer **When** the SDP answer is received and ICE negotiation completes **Then** stream status updates to `"live"` and the combined MediaStream is flowing to the relay (FR1, FR3)

4. **Given** the connection attempt starts **When** 10 seconds have elapsed without a successful connection **Then** the connection attempt is treated as failed with an appropriate error (NFR4)

5. **Given** the WHIP connection is configured **When** credentials are transmitted **Then** the stream key is sent only over HTTPS to the relay endpoint (NFR8, NFR12) and never to third-party endpoints (NFR9)

## Tasks / Subtasks

- [x] Modify `src/StreamManager.ts` — Add WHIP connection logic (AC: 1-5)
  - [x] Add private field `peerConnection: RTCPeerConnection | null`
  - [x] Add private field `connectionTimeout: ReturnType<typeof setTimeout> | null`
  - [x] Add method `connectWhip(relayUrl: string, streamKey: string): Promise<void>` implementing WHIP SDP exchange
  - [x] In `connectWhip`: create `RTCPeerConnection`, add media tracks from `this.mediaStream`
  - [x] In `connectWhip`: create SDP offer via `peerConnection.createOffer()`, set local description
  - [x] In `connectWhip`: HTTP POST the SDP offer to `relayUrl` with `Authorization: Bearer <streamKey>` header and `Content-Type: application/sdp`
  - [x] In `connectWhip`: parse SDP answer from response body, set remote description via `peerConnection.setRemoteDescription()`
  - [x] In `connectWhip`: listen for `peerConnection.oniceconnectionstatechange` — when `"connected"` set status to `"live"`, when `"failed"` or `"disconnected"` call `setError()`
  - [x] Add 10-second timeout — if `connectWhip` hasn't resolved, close the peer connection and call `setError('Connection timed out')`
  - [x] In `start()`: after media capture succeeds, call `connectWhip()` with config from store
  - [x] In `stop()` / `cleanup()`: close `peerConnection`, clear `connectionTimeout`

- [x] Verify `src/StreamControls.tsx` — Go Live button flow triggers full pipeline (AC: 1, 2)
  - [x] Confirm the `setStatus('connecting')` flow from Story 2.1 still correctly triggers `StreamCapture` → `StreamManager.start()` → `connectWhip()`
  - [x] Confirm Stop Stream button calls `streamManager.stop()` which now also closes `RTCPeerConnection`

- [x] Run `npm run type-check` — Zero errors

## Dev Notes

### CRITICAL: WHIP Protocol Overview

WHIP (WebRTC-HTTP Ingestion Protocol) is a simple standard for ingesting WebRTC media into a streaming server. The flow is:

1. Create `RTCPeerConnection`, add local media tracks
2. Create SDP offer: `peerConnection.createOffer()`
3. Set local description: `peerConnection.setLocalDescription(offer)`
4. HTTP POST the SDP offer body to the relay endpoint URL with:
   - `Content-Type: application/sdp`
   - `Authorization: Bearer <streamKey>`
5. Receive SDP answer from the HTTP response body
6. Set remote description: `peerConnection.setRemoteDescription(answer)`
7. ICE negotiation runs automatically — listen for `iceconnectionstatechange` events

### WHIP SDP Exchange Implementation Pattern

```typescript
private async connectWhip(relayUrl: string, streamKey: string): Promise<void> {
  this.peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  // Add tracks from the combined MediaStream
  if (this.mediaStream) {
    this.mediaStream.getTracks().forEach((track) => {
      this.peerConnection!.addTrack(track, this.mediaStream!);
    });
  }

  // Monitor ICE connection state
  this.peerConnection.oniceconnectionstatechange = () => {
    const state = this.peerConnection!.iceConnectionState;
    if (state === 'connected') {
      useStreamStore.getState().setStatus('live');
    } else if (state === 'failed' || state === 'disconnected') {
      this.cleanup();
      useStreamStore.getState().setError('Connection lost to relay server');
    }
  };

  // Create and set local SDP offer
  const offer = await this.peerConnection.createOffer();
  await this.peerConnection.setLocalDescription(offer);

  // POST SDP offer to relay endpoint
  const response = await fetch(relayUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sdp',
      'Authorization': `Bearer ${streamKey}`,
    },
    body: offer.sdp,
  });

  if (!response.ok) {
    throw new Error(`Relay returned ${response.status}: ${response.statusText}`);
  }

  // Parse SDP answer
  const answerSdp = await response.text();
  const answer = new RTCSessionDescription({ type: 'answer', sdp: answerSdp });
  await this.peerConnection.setRemoteDescription(answer);
}
```

### Connection Timeout Pattern

```typescript
// In start(), after calling connectWhip:
this.connectionTimeout = setTimeout(() => {
  if (this.peerConnection) {
    this.cleanup();
    useStreamStore.getState().setError('Connection timed out after 10 seconds');
  }
}, 10_000);

// Clear timeout on successful connection or in cleanup:
clearTimeout(this.connectionTimeout as number);
```

### Stream Key Security (NFR7-NFR9)

- The stream key is sent ONLY in the `Authorization: Bearer` header of the WHIP POST request
- It goes ONLY to the relay endpoint URL (configured by the user, should be HTTPS)
- It is NEVER logged via `console.log` or `console.error`
- The `useStreamStore.setError()` already sanitizes error messages (removes stream key) — use it
- Do NOT include the stream key in any error messages you construct manually

### Error Handling

All WHIP operations must be wrapped in try-catch. Error scenarios:
- `fetch()` throws network error → relay unreachable → `setError('Relay service unreachable')`
- HTTP response non-2xx → relay rejected → `setError('Relay returned ${status}: ${statusText}')`
- ICE connection `failed` → connection lost → `setError('Connection lost to relay server')`
- 10-second timeout → connection too slow → `setError('Connection timed out after 10 seconds')`
- `RTCPeerConnection.createOffer()` or `setRemoteDescription()` throws → `setError(message)`

All errors must call `this.cleanup()` before setting the error state.

### Integration with Existing Story 2.1 Code

The `StreamManager.start()` method from Story 2.1 already:
- Captures video via `canvas.captureStream(30)`
- Captures audio via `createMediaStreamDestination()` connected to `AudioListener.gain`
- Creates combined `MediaStream`
- Sets status to `'connecting'`
- Stores `audioListener` for cleanup

This story extends `start()` to call `connectWhip()` after media capture succeeds. The `stop()` / `cleanup()` methods are extended to close `RTCPeerConnection` and clear the timeout.

**DO NOT rewrite the media capture logic** — extend the existing methods.

### Files Modified in Story 2.1 (Do NOT Modify These)

- `src/Music.tsx` — Already exposes `AudioListener` via `onAudioListenerReady` prop
- `src/StreamCapture.tsx` — Already calls `streamManager.start(canvas, audioListener)` on status `connecting`
- `src/App.tsx` — Already renders `StreamCapture` inside Canvas when connecting
- `src/StreamControls.tsx` — Already wires Go Live/Stop/Retry buttons

The ONLY file that needs modification in this story is `src/StreamManager.ts`.

### STUN Server

Use Google's public STUN server: `stun:stun.l.google.com:19302`. This is required for ICE negotiation and is standard practice for WebRTC applications.

### RTCPeerConnection and TypeScript

`RTCPeerConnection`, `RTCSessionDescription`, `RTCOfferOptions`, and related types are available globally in modern browser environments. The project's `tsconfig.json` includes `"lib": ["dom"]` which provides these types.

### References

- [Source: src/StreamManager.ts] — Existing class to extend with WHIP logic
- [Source: src/useStreamStore.ts] — Store API: `setStatus`, `setError`, `config`
- [Source: docs/_bmad_output/planning-artifacts/architecture.md#Media Capture Architecture] — WHIP decision rationale
- [Source: docs/_bmad_output/planning-artifacts/architecture.md#Component Boundaries] — StreamManager responsibilities
- [Source: docs/_bmad_output/planning-artifacts/epics.md#Story 2.2] — acceptance criteria
- [Source: docs/_bmad_output/planning-artifacts/prd.md] — NFR requirements

## Dev Agent Record

### Agent Model Used

glm-5.1

### Debug Log References

TypeScript type-check passed clean with no errors after all changes.

### Completion Notes List

- Extended `StreamManager.ts` with WHIP protocol implementation. Added `connectWhip()` method that creates `RTCPeerConnection` with Google STUN server, adds media tracks, performs SDP offer/answer exchange via HTTP POST to relay endpoint with `Authorization: Bearer` header, and monitors ICE connection state transitions (`connected` → `live`, `failed`/`disconnected` → error with cleanup).
- Added 10-second connection timeout that triggers cleanup and error if ICE doesn't complete in time. Timeout is cleared on successful `connected` state and during cleanup.
- `cleanup()` extended to close `RTCPeerConnection` (with null guard on `oniceconnectionstatechange`), clear timeout, in addition to existing media cleanup.
- `start()` now calls `connectWhip()` after successful media capture, reading relay config from the Zustand store.
- StreamControls flow verified: Go Live → `connecting` status → StreamCapture mounts → `start()` → media capture + WHIP → `live`/`error`. Stop → `stop()` → cleanup closes peer connection + media.
- No test suite in project — validated via `npm run type-check` (tsc --noEmit) with zero errors.

### File List

- `src/StreamManager.ts` — MODIFIED (added WHIP connection logic)

### Change Log

- 2026-03-31: Implemented Story 2.2 — WHIP Connection & Stream Delivery. Added connectWhip() with RTCPeerConnection, SDP exchange, ICE monitoring, 10s timeout. Extended cleanup to close peer connection. Type-check passes.

### Review Findings

- [x] [Review][Patch] 10-second timeout starts after SDP exchange, not at connection attempt start — fixed: timeout set at top of `connectWhip()` [`src/StreamManager.ts:85-88`]
- [x] [Review][Patch] `fetch()` network error returns native message instead of `'Relay service unreachable'` [`src/StreamManager.ts:133-136`]
- [x] [Review][Patch] No HTTPS enforcement on relayUrl before transmitting stream key [`src/StreamManager.ts:85-87`]
- [x] [Review][Patch] ICE `disconnected` treated as fatal — only `failed` should trigger cleanup [`src/StreamManager.ts:100-103`]
- [x] [Review][Patch] ICE `completed` state never handled — timeout fires and kills healthy connection [`src/StreamManager.ts:97-99`]
- [x] [Review][Defer] Rapid double-click start() causes connectWhip races — deferred, needs cancellation/abort pattern [`src/StreamManager.ts:68`]
- [x] [Review][Defer] No ICE candidate gathering wait (trickle ICE) — deferred, WHIP spec ambiguity [`src/StreamManager.ts:106-107`]
