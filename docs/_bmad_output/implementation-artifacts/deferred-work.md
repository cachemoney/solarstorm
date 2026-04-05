# Deferred Work

## Deferred from: code review of 2-1-media-capture-pipeline (2026-03-31)

- Status never transitions to 'live' — by design; WHIP connection (Story 2.2) will handle this transition
- AudioContext may be suspended when start() called — pre-existing, depends on user clicking Play first
- Stream capture can start before audio is playing — pre-existing UX issue, not gated by init state
- Audio component cleanup disconnects sound from listener gain during HMR — pre-existing edge case

## Deferred from: code review of 1-1-streaming-state-store (2026-04-04)

- No SSR guard on `localStorage` access at module level — project is client-only SPA, no SSR framework in use
- Plaintext `streamKey` in localStorage without encryption — accepted risk for v1, localStorage is same-origin scoped

## Deferred from: code review of 2-2-whip-connection-stream-delivery (2026-04-04)

- Rapid double-click `start()` causes `connectWhip` races — needs cancellation/AbortController pattern, non-trivial refactor
- No ICE candidate gathering wait (trickle ICE vs complete SDP) — WHIP spec ambiguity on whether trickle is required; most WHIP servers accept offers after ICE gathering completes

## Deferred from: code review of 1-2-stream-settings-panel (2026-04-04)

- No Escape key / click-outside / ARIA dialog attributes on settings panel — accessibility improvement for future iteration
- No URL validation at StreamSettings input level — HTTPS enforcement handled downstream in StreamManager.connectWhip()

## Deferred from: code review of 2-4-error-handling-stream-resilience (2026-04-04)

- `offer.sdp` could be null before being passed as fetch body — pre-existing, rare edge case in WebRTC implementations
- `audioListeners.length === 0` leaves status stuck at `connecting` indefinitely with no timeout or error — pre-existing, requires user interaction (Play button) before Go Live is meaningful
- Error boundary Retry can re-throw if children state caused the original render error — pre-existing, low severity UI issue
