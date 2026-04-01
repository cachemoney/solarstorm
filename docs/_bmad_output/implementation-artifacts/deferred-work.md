# Deferred Work

## Deferred from: code review of 2-1-media-capture-pipeline (2026-03-31)

- Status never transitions to 'live' — by design; WHIP connection (Story 2.2) will handle this transition
- AudioContext may be suspended when start() called — pre-existing, depends on user clicking Play first
- Stream capture can start before audio is playing — pre-existing UX issue, not gated by init state
- Audio component cleanup disconnects sound from listener gain during HMR — pre-existing edge case
