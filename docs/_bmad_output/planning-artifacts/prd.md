---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - .planning/codebase/ARCHITECTURE.md
  - .planning/codebase/STRUCTURE.md
  - .planning/codebase/CONVENTIONS.md
  - .planning/codebase/STACK.md
  - .planning/codebase/INTEGRATIONS.md
  - .planning/codebase/TESTING.md
  - .planning/codebase/CONCERNS.md
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 7
workflowType: 'prd'
classification:
  projectType: web_app
  domain: general
  complexity: medium
  projectContext: brownfield
  architecturalDependency: External RTMP relay SaaS for browser-to-YouTube streaming
  keyIntegration: Canvas capture via captureStream() + audio muxing via createMediaStreamDestination()
---

# Product Requirements Document - solarstorm

**Author:** cache
**Date:** 2026-03-29

## Executive Summary

Solar Storm is an audio-reactive 3D visualization that renders a WebGL scene driven by four audio stems (bass, drums, melody, vocals). This enhancement adds live YouTube streaming capability — capturing the real-time canvas output and broadcasting it to a remote audience via RTMP relay, entirely from the browser.

**Target user:** The creator/operator running the visualization locally and broadcasting to a YouTube Live audience.

**Problem solved:** Broadcasting a real-time WebGL visualization to YouTube currently requires desktop software (OBS, ffmpeg) or screen capture tools. This feature eliminates that dependency — the stream originates directly from the browser canvas with no external applications.

### What Makes This Special

The entire pipeline stays in the browser. No OBS, no ffmpeg, no desktop software installation. The WebGL canvas is already producing every frame at 60fps — this feature captures and routes those frames to YouTube Live through an external RTMP relay service. The media pipeline is invisible to the user: one click from visualization to live broadcast.

**Core insight:** This is a media routing problem, not a creative one. The 3D scene already generates every frame. The challenge is capturing canvas output, muxing with the Web Audio API audio stream, and delivering to YouTube's RTMPS ingest endpoint — all without impacting rendering performance.

### Project Classification

- **Type:** Web application (SPA, WebGL, Web Audio API)
- **Domain:** Creative / media technology
- **Complexity:** Medium — real-time media pipeline, external service dependency, AV synchronization
- **Context:** Brownfield — additive feature on an existing deployed application (solarstorm.netlify.app)
- **Architectural dependency:** External RTMP relay SaaS (e.g., livepush.io) bridges browser output to YouTube's RTMPS ingest

## Success Criteria

### User Success

The creator can start a YouTube Live stream from Solar Storm with a single action and see the visualization broadcasting on YouTube Live. The stream remains live for the full song duration with audio and video synchronized throughout. The 3D rendering performance is not materially degraded by the streaming pipeline.

### Business Success

The feature validates that browser-native YouTube Live streaming is viable for a real-time WebGL visualization. Success is measured by completing at least one end-to-end live broadcast of the full Quitters Raga track without manual intervention.

### Technical Success

- Canvas capture via `captureStream()` produces a stable video stream at the scene's native framerate
- Audio from the Web Audio API is muxed with the canvas video stream via `createMediaStreamDestination()`
- The combined stream is delivered to YouTube's RTMPS ingest via an external relay service
- The existing 3D scene maintains acceptable framerate (target: 60fps) during streaming
- No memory leaks introduced by the streaming pipeline over the full song duration (~3-4 minutes)

## Project Scoping & Phased Development

### MVP Strategy

**Approach:** Proof-of-concept MVP — validate that browser-native YouTube Live streaming works with a real-time WebGL visualization. The "aha moment" is seeing the Solar Storm visualization broadcasting live on YouTube.

**Resources:** Single developer. No backend infrastructure (relay service is external SaaS).

### Phase 1 — MVP

**Must-Have Capabilities:**
- "Go Live" / "Stop Stream" button in existing UI
- Settings panel for relay endpoint URL and YouTube stream key, persisted in `localStorage`
- Canvas capture via `captureStream()` (video only from WebGL canvas)
- Audio muxing via `createMediaStreamDestination()` combined into single `MediaStream`
- Integration with external RTMP relay service
- Stream status indicator (offline / connecting / live / error)
- Background tab resilience via `setInterval`/`setTimeout` fallback (reduced framerate acceptable)
- Graceful error handling — streaming failures do not impact the 3D scene

### Phase 2 — Growth

- Configurable stream quality (resolution, bitrate)
- Stream health metrics (bitrate, dropped frames, latency indicator)
- Stop and restart stream without page reload
- `OffscreenCanvas` + Web Worker migration for full-speed background rendering

### Phase 3 — Expansion

- Multi-platform streaming (Twitch, custom RTMP endpoints)
- Custom overlay text or camera feed composited onto stream
- Scheduled live events via YouTube API
- Local recording as a fallback

## User Journeys

### Journey 1: The Creator — First-Time Setup

Cache has Solar Storm running locally and wants to broadcast to YouTube Live for the first time.

1. Opens Solar Storm. A "Go Live" button is visible but grayed out — streaming is not configured.
2. Opens the streaming settings panel. Enters the RTMP relay service endpoint URL and pastes the YouTube stream key. Saves.
3. The "Go Live" button activates.
4. Hits "Go Live". Status transitions: offline → connecting → live. Opens YouTube Studio in another tab — the visualization is broadcasting. The 3D scene renders smoothly.
5. Configuration persists. Next session, Cache goes straight to broadcasting.

### Journey 2: The Creator — Live Broadcast

Cache has streaming configured and starts the visualization.

1. Clicks Play — planet appears, audio stems load, everything works as before.
2. Clicks "Go Live". Canvas capture begins, audio is muxed, the combined stream goes to the RTMP relay.
3. Status shows "live". Shares the YouTube Live URL with the audience.
4. The song progresses — spark storm triggers, planet distorts, glitch effects fire. All streamed to YouTube in real-time with audio and video synchronized.
5. Song concludes. Clicks "Stop Stream". Stream ends cleanly on YouTube. 3D scene continues locally.

### Journey 3: The Creator — Stream Failure Recovery

Cache is mid-broadcast when the network hiccups.

1. Relay service disconnects. Status changes to "error" with a descriptive message ("Connection lost to relay server").
2. The 3D scene continues running locally — the streaming failure does not impact the visualization.
3. Cache clicks "Retry". Stream reconnects, status returns to "live".
4. If retry fails, Cache can stop and start a new stream.

### Journey 4: The YouTube Viewer — Watching the Stream

A viewer finds the Solar Storm live stream on YouTube.

1. YouTube player loads with typical live latency (~3-8 seconds).
2. Viewer sees the audio-reactive 3D visualization — glowing planet, sparks, particles, all responding to music. Audio and video are in sync. Quality is 720p-1080p.
3. The visualization reaches peak intensity — planet distortion, spark storm, glitch effects — all visible in real-time on YouTube.

## Web Application Requirements

### Technical Architecture Considerations

**Canvas Capture Scope:** Stream captures only the WebGL canvas via `HTMLCanvasElement.captureStream()`. Browser UI (controls, settings, status indicators) is excluded.

**Background Tab Resilience:** The stream must continue when the browser tab is backgrounded. `requestAnimationFrame` throttles in background tabs, so a `setInterval`/`setTimeout` fallback maintains the render loop at reduced framerate when `document.visibilityState` is `"hidden"`. This impacts all 10+ components currently using R3F's `useFrame`. Phase 2 will migrate to `OffscreenCanvas` in a Web Worker for full-speed background rendering.

**Audio Muxing:** `AudioContext.createMediaStreamDestination()` captures audio output. Combined with canvas video: `new MediaStream([...videoTracks, ...audioTracks])`.

**HTTPS:** `captureStream()` requires a secure context. Already satisfied by Netlify HTTPS.

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Background tab rendering | `setInterval` fallback for MVP; `OffscreenCanvas` in Phase 2 |
| AV sync drift | Under 200ms target; relay service handles most sync |
| Performance impact | Canvas capture is lightweight; measure framerate delta during development |
| `requestAnimationFrame` coupling | Override R3F render loop only, not individual components |
| Relay service unavailability | Stream degrades gracefully; 3D scene unaffected |

## Functional Requirements

### Stream Control

- FR1: Creator can start a live stream to YouTube via a "Go Live" action in the existing UI
- FR2: Creator can stop an active live stream via a "Stop Stream" action
- FR3: Creator can view the current stream status (offline / connecting / live / error) at all times
- FR4: Creator can retry a failed stream connection without reloading the page
- FR5: System continues the live stream uninterrupted when the browser tab is backgrounded or minimized

### Stream Configuration

- FR6: Creator can configure the RTMP relay service endpoint URL
- FR7: Creator can configure the YouTube stream key
- FR8: System persists stream configuration (relay endpoint + stream key) across browser sessions
- FR9: System disables the "Go Live" action when stream configuration is incomplete
- FR10: Creator can update or clear stored stream configuration at any time

### Media Capture

- FR11: System captures video output from the WebGL canvas exclusively (excluding browser UI elements)
- FR12: System captures audio output from the Web Audio API audio context
- FR13: System combines captured video and audio into a single combined media stream
- FR14: System delivers the combined media stream to the configured RTMP relay service endpoint

### Stream Resilience

- FR15: System isolates streaming failures from the 3D rendering pipeline — the visualization continues running regardless of stream state
- FR16: System detects stream disconnection and displays an error state to the creator
- FR17: System displays a descriptive error message when streaming fails (e.g., connection lost, relay unreachable, authentication failure)
- FR18: System maintains the render loop at reduced framerate when the browser tab is hidden, keeping the stream alive

### Existing Experience Preservation

- FR19: System preserves all existing visualization capabilities (planet, sparks, spark storm, space dust, space ship, post-processing effects) when streaming is active
- FR20: System preserves all existing audio-reactive behaviors (frequency analysis, timeline triggers, progress-driven effects) when streaming is active
- FR21: System preserves existing UI controls (Play button, orbit controls) when streaming is active

## Non-Functional Requirements

### Performance

- NFR1: The 3D visualization maintains a minimum of 30fps (target 60fps) while streaming is active, as measured by browser performance APIs
- NFR2: Stream video quality maintains a minimum of 720p resolution (target 1080p) throughout the broadcast duration
- NFR3: Audio and video remain synchronized with drift under 200ms throughout the full song duration (~3-4 minutes)
- NFR4: Stream connection establishes within 10 seconds of the "Go Live" action
- NFR5: The 3D scene renders at reduced but acceptable framerate (minimum 15fps) when the browser tab is backgrounded, keeping the stream alive
- NFR6: No memory leaks are introduced by the streaming pipeline over a single broadcast session, as measured by browser memory profiler before and after streaming

### Security

- NFR7: The YouTube stream key is stored in `localStorage` and is not exposed in URL parameters, console logs, or network requests to third-party endpoints
- NFR8: The stream key is transmitted only over HTTPS to the configured relay service endpoint
- NFR9: The relay endpoint URL and stream key are not included in client-side error reports or analytics

### Integration

- NFR10: The system integrates with the RTMP relay service via standard WebRTC or WHIP protocol, as supported by the relay provider
- NFR11: The system remains operational (3D scene + audio) if the relay service is unreachable — streaming degrades gracefully without affecting the core experience
- NFR12: The relay service connection is established using the creator-supplied endpoint URL and stream key with no additional authentication dependencies
