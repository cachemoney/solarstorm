---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - docs/_bmad_output/planning-artifacts/prd.md
  - docs/_bmad_output/planning-artifacts/architecture.md
---

# solarstorm - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for solarstorm, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Creator can start a live stream to YouTube via a "Go Live" action in the existing UI
FR2: Creator can stop an active live stream via a "Stop Stream" action
FR3: Creator can view the current stream status (offline / connecting / live / error) at all times
FR4: Creator can retry a failed stream connection without reloading the page
FR5: System continues the live stream uninterrupted when the browser tab is backgrounded or minimized
FR6: Creator can configure the RTMP relay service endpoint URL
FR7: Creator can configure the YouTube stream key
FR8: System persists stream configuration (relay endpoint + stream key) across browser sessions
FR9: System disables the "Go Live" action when stream configuration is incomplete
FR10: Creator can update or clear stored stream configuration at any time
FR11: System captures video output from the WebGL canvas exclusively (excluding browser UI elements)
FR12: System captures audio output from the Web Audio API audio context
FR13: System combines captured video and audio into a single combined media stream
FR14: System delivers the combined media stream to the configured RTMP relay service endpoint
FR15: System isolates streaming failures from the 3D rendering pipeline — the visualization continues running regardless of stream state
FR16: System detects stream disconnection and displays an error state to the creator
FR17: System displays a descriptive error message when streaming fails (e.g., connection lost, relay unreachable, authentication failure)
FR18: System maintains the render loop at reduced framerate when the browser tab is hidden, keeping the stream alive
FR19: System preserves all existing visualization capabilities (planet, sparks, spark storm, space dust, space ship, post-processing effects) when streaming is active
FR20: System preserves all existing audio-reactive behaviors (frequency analysis, timeline triggers, progress-driven effects) when streaming is active
FR21: System preserves existing UI controls (Play button, orbit controls) when streaming is active

### NonFunctional Requirements

NFR1: The 3D visualization maintains a minimum of 30fps (target 60fps) while streaming is active, as measured by browser performance APIs
NFR2: Stream video quality maintains a minimum of 720p resolution (target 1080p) throughout the broadcast duration
NFR3: Audio and video remain synchronized with drift under 200ms throughout the full song duration (~3-4 minutes)
NFR4: Stream connection establishes within 10 seconds of the "Go Live" action
NFR5: The 3D scene renders at reduced but acceptable framerate (minimum 15fps) when the browser tab is backgrounded, keeping the stream alive
NFR6: No memory leaks are introduced by the streaming pipeline over a single broadcast session, as measured by browser memory profiler before and after streaming
NFR7: The YouTube stream key is stored in localStorage and is not exposed in URL parameters, console logs, or network requests to third-party endpoints
NFR8: The stream key is transmitted only over HTTPS to the configured relay service endpoint
NFR9: The relay endpoint URL and stream key are not included in client-side error reports or analytics
NFR10: The system integrates with the RTMP relay service via standard WebRTC or WHIP protocol, as supported by the relay provider
NFR11: The system remains operational (3D scene + audio) if the relay service is unreachable — streaming degrades gracefully without affecting the core experience
NFR12: The relay service connection is established using the creator-supplied endpoint URL and stream key with no additional authentication dependencies

### Additional Requirements

- No starter template required — brownfield project adding feature to existing application
- Separate Zustand store (useStreamStore) following existing useMusicStore patterns with createWithEqualityFn + subscribeWithSelector
- Native RTCPeerConnection with manual WHIP SDP exchange — no additional npm dependencies
- Media capture via useThree hook (canvas DOM access) + AudioListener context (audio capture)
- File organization: flat in src/ matching existing convention (useStreamStore.ts, StreamManager.ts, StreamControls.tsx, useBackgroundRender.ts)
- React Error Boundary (StreamErrorBoundary) wrapping streaming UI + async try-catch in StreamManager
- Background tab resilience via setInterval fallback at ~30fps when document.visibilityState is "hidden"
- CSS additions to existing styles.css only — no new CSS files
- Minimal changes to App.tsx (render StreamControls + useBackgroundRender hook) and Music.tsx (expose AudioListener ref)
- No modifications to existing components (useMusicStore, Scene, Planet, Effects, Sparks, SparkStorm, SpaceDust, SpaceShip)
- Cleanup pattern: all useEffect hooks must have cleanup, StreamManager.stop() closes RTCPeerConnection, stops MediaStreamTracks, clears setInterval timers
- Stream key never included in console.log, console.error, or network requests to non-relay endpoints

### UX Design Requirements

No UX Design document available. Streaming UI requirements derived from PRD:
- "Go Live" / "Stop Stream" button in existing UI overlay
- Settings panel for relay endpoint URL and YouTube stream key
- Stream status indicator (offline / connecting / live / error)
- UI follows existing overlay aesthetic (dark background, light text, minimal)

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | Start live stream via "Go Live" action |
| FR2 | Epic 2 | Stop active live stream |
| FR3 | Epic 1 + Epic 2 | View stream status (offline from E1, connecting/live/error from E2) |
| FR4 | Epic 2 | Retry failed stream connection |
| FR5 | Epic 3 | Continue stream when tab backgrounded |
| FR6 | Epic 1 | Configure relay endpoint URL |
| FR7 | Epic 1 | Configure YouTube stream key |
| FR8 | Epic 1 | Persist config across sessions |
| FR9 | Epic 1 | Disable "Go Live" when unconfigured |
| FR10 | Epic 1 | Update/clear stored config |
| FR11 | Epic 2 | Capture WebGL canvas video |
| FR12 | Epic 2 | Capture Web Audio API audio |
| FR13 | Epic 2 | Combine video + audio into single stream |
| FR14 | Epic 2 | Deliver stream to relay endpoint |
| FR15 | Epic 2 | Isolate streaming failures from 3D scene |
| FR16 | Epic 2 | Detect stream disconnection |
| FR17 | Epic 2 | Display descriptive error messages |
| FR18 | Epic 3 | Maintain render loop when tab hidden |
| FR19 | Epic 2 | Preserve existing visualization capabilities |
| FR20 | Epic 2 | Preserve audio-reactive behaviors |
| FR21 | Epic 2 | Preserve existing UI controls |

## Epic List

### Epic 1: Stream Configuration & Setup
The creator can configure and persist their streaming credentials (relay endpoint + stream key), and sees the streaming UI integrated into the existing Solar Storm interface. The "Go Live" button activates once configuration is complete.
**FRs covered:** FR3 (offline status), FR6, FR7, FR8, FR9, FR10

### Epic 2: Live Broadcast
The creator can go live — the system captures the WebGL canvas video, muxes it with the audio output, delivers it to the RTMP relay, and displays real-time stream status. The creator can stop the stream cleanly. The 3D scene continues running normally throughout.
**FRs covered:** FR1, FR2, FR3 (connecting/live/error status), FR4, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR19, FR20, FR21

### Epic 3: Background Tab Resilience
The creator can background or minimize the browser tab during a live stream, and the broadcast continues uninterrupted. The render loop falls back to a reduced framerate to keep the stream alive.
**FRs covered:** FR5, FR18

## Epic 1: Stream Configuration & Setup

The creator can configure and persist their streaming credentials (relay endpoint + stream key), and sees the streaming UI integrated into the existing Solar Storm interface. The "Go Live" button activates once configuration is complete.

### Story 1.1: Streaming State Store

As a developer,
I want a Zustand store for streaming state and configuration,
So that all streaming modules have a single source of truth for config and status.

**Acceptance Criteria:**

**Given** the application starts with no stored configuration
**When** `useStreamStore` initializes
**Then** the store loads any persisted config from `localStorage` and sets `isConfigured` accordingly
**And** status defaults to `'offline'` and `errorMessage` to `null`

**Given** the creator sets a relay URL and stream key
**When** `setConfig` is called
**Then** the config is written to `localStorage` and `isConfigured` becomes `true`

**Given** the creator clears their configuration
**When** `clearConfig` is called
**Then** the config is removed from `localStorage`, `isConfigured` becomes `false`, and status resets to `'offline'`

**Given** the stream key is stored
**When** any store action executes
**Then** the stream key is never included in `console.log` or `console.error` output (NFR7, NFR9)

### Story 1.2: Stream Settings Panel

As a creator,
I want a settings panel to enter my relay endpoint URL and YouTube stream key,
So that I can configure my streaming credentials without leaving the app.

**Acceptance Criteria:**

**Given** the Solar Storm UI is loaded
**When** the creator opens the settings panel
**Then** input fields for relay endpoint URL and stream key are displayed, pre-populated with any saved values

**Given** the creator enters valid values and saves
**When** the save action completes
**Then** configuration is persisted via `useStreamStore` (FR6, FR7, FR8) and the settings panel closes

**Given** the settings panel is open
**When** the creator clicks "Clear" or removes both values
**Then** stored configuration is cleared (FR10) and `isConfigured` becomes `false`

**Given** the stream key input field
**When** the creator types or views it
**Then** the value is masked (password-style input) (NFR7)

### Story 1.3: Stream Status & Go Live Button

As a creator,
I want to see the current stream status and a Go Live button that activates when configured,
So that I know my streaming state and can initiate a broadcast when ready.

**Acceptance Criteria:**

**Given** the stream is not configured
**When** the UI renders
**Then** the "Go Live" button is disabled/grayed out (FR9) and status shows "offline" (FR3)

**Given** the stream is fully configured (relay URL + stream key saved)
**When** the UI renders
**Then** the "Go Live" button is enabled and clickable

**Given** the stream is in any status
**When** the status changes
**Then** a status indicator displays the current state: offline, connecting, live, or error (FR3)

**Given** the streaming UI components render
**When** a rendering error occurs within StreamControls
**Then** a React Error Boundary catches the error and displays a fallback "Streaming error" message without affecting the 3D scene (FR15)

## Epic 2: Live Broadcast

The creator can go live — the system captures the WebGL canvas video, muxes it with the audio output, delivers it to the RTMP relay, and displays real-time stream status. The creator can stop the stream cleanly. The 3D scene continues running normally throughout.

### Story 2.1: Media Capture Pipeline

As a creator,
I want the system to capture the WebGL canvas video and audio output and combine them into a single stream,
So that my visualization's visual and audio content can be broadcast together.

**Acceptance Criteria:**

**Given** the 3D scene is rendering and audio is playing
**When** media capture is initiated
**Then** the WebGL canvas is captured via `captureStream()` at the scene's native resolution (FR11, NFR2) and audio is captured via `createMediaStreamDestination()` (FR12)

**Given** both video and audio tracks are captured
**When** they are combined
**Then** a single `MediaStream` containing both video and audio tracks is created (FR13)

**Given** the combined MediaStream exists
**When** the video track is inspected
**Then** it contains only the WebGL canvas output — no browser UI elements (FR11)

**Given** media capture is active
**When** the 3D scene is rendering
**Then** all existing visualization capabilities continue functioning normally (FR19, FR20, FR21) with no measurable framerate degradation below 30fps (NFR1)

### Story 2.2: WHIP Connection & Stream Delivery

As a creator,
I want the combined media stream delivered to my configured relay service,
So that it can be broadcast to YouTube Live.

**Acceptance Criteria:**

**Given** the creator has valid configuration and a combined MediaStream
**When** "Go Live" is clicked
**Then** an `RTCPeerConnection` is created and a WHIP SDP offer is sent via HTTP POST to the relay endpoint (FR14, NFR10)

**Given** the WHIP SDP exchange begins
**When** the connection is being established
**Then** stream status updates to `"connecting"` (FR3, NFR4)

**Given** the relay service accepts the SDP offer
**When** the SDP answer is received and ICE negotiation completes
**Then** stream status updates to `"live"` and the combined MediaStream is flowing to the relay (FR1, FR3)

**Given** the connection attempt starts
**When** 10 seconds have elapsed without a successful connection
**Then** the connection attempt is treated as failed with an appropriate error (NFR4)

**Given** the WHIP connection is configured
**When** credentials are transmitted
**Then** the stream key is sent only over HTTPS to the relay endpoint (NFR8, NFR12) and never to third-party endpoints (NFR9)

### Story 2.3: Stream Stop & Cleanup

As a creator,
I want to stop my live stream cleanly,
So that the broadcast ends on YouTube and all resources are released.

**Acceptance Criteria:**

**Given** the stream is live
**When** the creator clicks "Stop Stream"
**Then** the `RTCPeerConnection` is closed, all `MediaStreamTrack`s are stopped, and stream status returns to `"offline"` (FR2)

**Given** the stream is stopped
**When** resources are cleaned up
**Then** no media tracks, peer connections, or timers remain active — no memory leaks (NFR6)

**Given** the stream was live
**When** stop completes
**Then** the 3D scene continues rendering normally — stopping the stream has no impact on the visualization (FR15, FR19)

### Story 2.4: Error Handling & Stream Resilience

As a creator,
I want the streaming system to handle failures gracefully and allow retry,
So that I can recover from connection issues without losing my visualization.

**Acceptance Criteria:**

**Given** the stream is live
**When** the relay connection drops (ICE connection state changes to `"failed"` or `"disconnected"`)
**Then** stream status updates to `"error"` with a descriptive message like "Connection lost to relay server" (FR16, FR17)

**Given** the stream is in error state
**When** the creator clicks "Retry"
**Then** the system attempts to reconnect without requiring a page reload (FR4)

**Given** a streaming failure of any kind occurs
**When** the error is caught
**Then** the 3D scene continues rendering without interruption (FR15) and the error message does not contain the stream key (NFR9)

**Given** the relay service is unreachable
**When** "Go Live" is attempted
**Then** the system displays an error and the 3D scene continues running normally (FR15, NFR11)

## Epic 3: Background Tab Resilience

The creator can background or minimize the browser tab during a live stream, and the broadcast continues uninterrupted. The render loop falls back to a reduced framerate to keep the stream alive.

### Story 3.1: Background Tab Render Loop Fallback

As a creator,
I want my live stream to continue when I background or minimize the browser tab,
So that the broadcast stays alive even when I'm not actively viewing the tab.

**Acceptance Criteria:**

**Given** the stream is live and the browser tab is visible
**When** the tab becomes hidden (`visibilityState` changes to `"hidden"`)
**Then** a `setInterval` fallback activates at approximately 33ms intervals (~30fps) to maintain the render loop, keeping the stream alive (FR5, FR18)

**Given** the stream is live and the tab is hidden
**When** the tab becomes visible again
**Then** the `setInterval` fallback is cleared and normal `requestAnimationFrame`-driven rendering resumes (FR5)

**Given** the stream is NOT live
**When** the tab is backgrounded
**Then** no fallback render loop activates — background resilience only engages during active streaming (FR18)

**Given** the tab is hidden and the fallback render loop is active
**When** the framerate is measured
**Then** it maintains a minimum of 15fps to keep the stream alive (NFR5)

**Given** the stream is stopped while the tab is hidden
**When** `StreamManager.stop()` is called
**Then** the `setInterval` fallback timer is cleared along with all other streaming resources (NFR6)
