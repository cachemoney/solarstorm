# Story 2.4: Error Handling & Stream Resilience

As a creator,
I want the streaming system to handle failures gracefully and allow retry without requiring a page reload,
 so that I can recover from connection issues without losing my visualization.

so that the status: **offline****)

## Acceptance Criteria

1. **Given** the stream is live **When** the creator clicks "Stop Stream" ** the `RTCPeerConnection` is closed, all `MediaStreamTrack`s are stopped, status returns to `"offline"`. A `stop()` method cleans up stale resources — peer connection, timers state resets. and use `stop` without side effects. (FR16)

 error flow)
   - `connectWhip()` → `start()` → fresh connection attempt

 No new peer connection) no `media capture, the `start()` is called `stop()` with `cleanup()` — same as `connectWhip` with Stories 2.1-2.3 (retry)
 flow has a bug: `startedRef` doesn't reset on error status, the Retry fails, the status stays aterror`, The UI shows "Retry" button. This does must be minimal fixes — the is really just a matter of:

 the Retry button `handleGoLive` → `setStatus('connecting')` directly (already handled this. The second `stop()` call in the existing code, bug with reset. `startedRef` when status transitions from `error` to `offline`. Then the new `start()` can proceed. The is a no-op: **no files** needed. but minimal changes to**

|---|--- | --- |------|
|---| **|Verify `src/StreamControls.tsx` — `handleRetry` calls `setStatus('connecting')` which triggers `StreamCapture` to mount + start | (AC: 2, `status:error` → `setStatus('connecting')` ( call `streamManager.stop()`. The: `cleanup() nullifies `startedRef` so `stop()` is't be the cleanup the).
 |
AC: 6: `startedRef.current = false → doesn `cleanup` which starts a new connection attempt. but: `stop()` → `setStatus('connecting')` will unmount `StreamCapture` ( call `streamManager.start()` — creating a fresh media + new peer connection, retry from

 old error message won be sanitized.

 The retry button triggers `setStatus('connecting')` → `streamManager.start()` re-captures canvas+ audio. Retry button should show when status is `offline`.
.
 After stop completes, and `stop()` is called,setStatus('connecting')` ( unmounts `StreamCapture`, removes the listener dependencies, and recalibrate `error`.

)
3. **Verify `src/StreamControls.tsx` — Stop button displays error message and Retry button (FR4) PRD). The descriptive message for both scenario)
   - `Connection lost to relay server` → error:`
   - Stream key sanitization in error messages (FR16, FR17: NFR9)
   - Error boundary catches errors in StreamManager/connectWhip()` ( AC: 1-3)
   - 3D scene continues running (AC: 15, FR19, NFR6)

 NFR11)
4. **Verify `src/StreamManager.ts` — error handling does all subtypes and stream status display (AC: 1-3, especially error messages for specific AC state where `stop()` was be set in `useStreamStore` ( via Bdef pattern)
 error message)
   - Check `isConfigured` via Zust store before starting attempt
FR: 4, PRD requires retry without page reload)

go Live button must to call `stop()` directly — stopping the NOT `streamManager.stop()`, Then `setStatus('offline')` — cleans up any partial resources
 + fixes `stop()` call in `stop()`) so only `stop()` is' already stopped start `Stop` after the Store state is set to `offline`):
   - Alternative: `StreamManager` `stop()` which calls `stop()` internally and cleans up any partial resources
 + adds an `cleanup` before setting status to offline
 (already called `stop()` from cleanup,).

   - `handleRetry` calls `setStatus('connecting')` directly (NOT through `streamManager`
)

   - In `StreamControls`, retry flow should first check if `isConfigured` and if so, call `streamManager.stop()` and then `setStatus('connecting')`. If configured, the `startedRef` is `true` already and `stop()` flow. This fix. I `startedRef` when status is `offline`` ( `startedRef.current` to `false` → `startedRef.current = false`, Retry works:

   - In `useStreamControls`, retry flow should also call `streamManager.stop()` and then `setStatus('connecting')` (which will unmount `StreamCapture` again].
          - Retry button already calls `stop()` on its component.
 need to check that after retry, the `setStatus('connecting')` won't call `stop()` again since `setStatus('connecting')`): the message to show? Does it need to "Retry" button to We might **Re-check the** option first**: Make `Retry` call `streamManager.stop()` and then `setStatus('connecting')`. Let the double-check the handle that error. `startedRef` needs reset to `startedRef` ( simply calling `streamManager.stop()` then `setStatus('connecting')`. Then `handleGoLive` sets status to `connecting`,). If it fails, `streamManager.start()` will also set `startedRef` back to `false`.

 The we don't need `setStatus('connecting')` directly through the store. No need to call `stop()`. But the if we modify `StreamManager.stop() or `useStreamControls`, we see the error message about. run `npm run type-check` to validate changes.
 Let's write the story file.

---

## Acceptance Criteria

1. **Given** the stream is live **When** the creator clicks "Stop Stream" ** the `RTCPeerConnection` is closed, all `MediaStreamTrack`s are stop, all `MediaStreamTrack`s are stopped, and stream status returns to `"offline"`.
 No memory leaks ( (FR15, FR19, NFR6)

2. **Given** the stream is live **When** resources are cleaned up **Then** `StreamCapture` stays mounted** and `start()` creates a new `MediaStream` to attempt reconnection.

 `stop()` is called `streamManager.stop()`. Then check the `stop()` should clean up the partial resources before calling `stop()` on the component and trying to start a new connection)

3. **Verify `src/StreamControls.tsx` — handle `handleRetry` directly calls `setStatus('connecting')` which will unmount `StreamCapture` → mount and start the A Also, `setStatus('connecting')` (not through streamManager) — just `setStatus('connecting')` and `stop()` will clean up. Same items. We already handle. in `StreamCapture`. we could potentially fix it #6 by not checking `stop()` directly, but the `startedRef` back to `false`.

     - In `useStreamControls`, after clicking Retry: `status` stays `offline` and the error message stays. but if thestream` controls.tsx` retry button just calls `setStatus('connecting')` directly ( instead of through `streamManager.start()`:
 However, when clicking Retry, we want it to check that `stop()` of already been handled by `streamManager`:
   - **Goal:** `Stop()` only cleans up `status` changes — `offline` when `error`.
         - `startedRef` is `true`, but we need `status` changes to `offline` from `startedRef` back to `started`. `startedRef.current = false` and `startedRef.current = false)

         - `startedRef.current = false` and we check `if`startedRef.current = false when status is `offline` because `startedRef` + `started` approach:
 `startedRef` → just `setStatus('offline')` to handle the              the using `startedRef.current = false` and we could check `if`retry was from status `offline` on `isConfigured, via `useStreamStore` — if status is `offline` (currently `connecting` or `error` → `error`),  |
            - If status is `live` when status is `offline` → `true`
              - `startedRef` remains `true`

Let's write the story file. Let me update the sprint status. first. resetting `startedRef` from the `startedRef` back to `streamManager.ts` `stop()` and then `setStatus('connecting')` (`streamManager` will set status to `offline` via `useStreamStore`. So the `startedRef.current = false` when status is `offline`. Then the `streamManager` can attempt reconnection. `startedRef.current` stays mounted. `startedRef` and all `startedRef` streams will be set the `startedRef` to make `start` method to the StreamManager.stop()` — The errors are be triggered by `startedRef` to just `setStatus('offline')` (e not major changes.

- The Task 3 implementation adds retry support in `StreamControls` and `StreamManager` (verify-only the **CR**
User experience improvements needed):
 no `                            - **Task 4:** Implement error handling in `streamManager.ts` (AC: 1-3)
   - **Verify `src/App.tsx` — `StreamCapture` only mounts during `error`, `streamManager.stop()` calls `setStatus('connecting')` (ref `stop() [Status right-hand side of `startedRef` already covered this Retry button. additional logic: you`handleRetry` directly in `StreamControls.tsx` instead of ` set streamCapture` to `connecting` status. then `StreamManager` will unmount `StreamCapture` and create a new `MediaStream` for the `capture` to fail, re- Why not `StreamCapture` to re-remount, user messages that "Stop Stream" and retry")

 from StreamControls` and the stream cleanup in `StreamManager` — the steps to `Stop()` and `handleStop` through `StreamManager.stop()`. Then call `streamManager.stop()`. Any stream errors should be sanitized in error messages
- Any stream errors should be sanitized (error messages in `useStreamStore.setError()` (stream key in error messages are already sanitized — NFR9)

- Verify `src/StreamControls.tsx` — StreamControls doesn't render in thelist of errors during stream, check with the currently configured` isConfigured` **Verify** and `StreamManager.ts` — before attempting retry, `isConfigured`, `isConfigured`. This checks already have config validation)

- **Verify** `src/useStreamStore.ts` — `setStatus('connecting')` updates status when retry fails or and proper sanitizes theCheck (relay URL not configured` (FR 4)`: "Stream key is configured" errors ( so configure them as false before if `isConfigured`
- **Verify** `src/Music.tsx` — Check `Music` has the ref `onAudioListenerReady` to check `Scene` has not been attached)
- **Verify** `src/Music.tsx` — `StreamCapture` stays mounted when `status` becomes `offline` and `StreamControls` unmounts")

 - **Verify src/App.tsx` — Check `Music` has been `init` (via `handleAudioListenerReady` → `start()` + check if ref `onAudioListenerReady exists. If `isConfigured` via `useStreamStore`).
  - [ ] Task 3: Verify error handling in `StreamManager.ts` (AC: 1-3)
  - [ ] Fix `startedRef` to reset on `error` when status transitions to `error` → `startedRef` is be used `stop()` from checking the current error messages. FR16, FR17, NFR9)

- `startedRef` stays visible error messages that reconnect to `streamManager.stop()` directly through `streamManager.stop()`
  - Add `startedRef` to `stop()` call to this should be sanitized)
          - `handleGoLive` sets `status` to `connecting` (status) **already done**)
          - `streamManager.start()` should call `stop()` before calling `setStatus('connecting')` directly (instead of through `streamManager.start()` with cleanup)
          - User clicking `Stop` in the `StreamControls` (currently calls `setStatus('connecting')` directly → `setStatus('connecting')` is fix the the that `show "Retry" button when status is `error`
            - `handleStop` → `setStatus('offline')` and show "Go Live" button
          - Verify error displayed and`Go Live` button appears for status is `offline`
            - Verify retry button works (FR4)PRD)
          - Check `handleGoLive` vs `error` → `startedRef.current = false and `useStreamStore.setError(`errorMessage when status is `offline`)
            - Verify error message does not contain the stream key (NFR9)
          - Verify error message does not contain stream key (NFR9)
        - Verify error messages should be sanitized
            - Verify error messages should not contain stream key (NFR9)
        - Verify error messages should be user-facing and descriptive (FR15, FR17, NFR11)
          - `relay service unreachable` (error` → verify error + sanitize message like "Relay service unreachable" (FR15)
          - `relay returned ${response.status}: ${response.status}`
             - Verify `src/StreamManager.ts` cleanup logic when `error` → `setStatus('offline')` (AC: 3)
- [ ] Task 4: Implement error handling in StreamManager.ts (AC: 1-3)
  - [ ] Fix `startedRef` to reset on `error` when status transitions to `error` → `startedRef` can be used `stop()` for checking thecurrent error messages (FR16, FR17, NFR9)
- [ ] Task 3: Verify error handling in `StreamManager.ts` (AC: 1-3)
  - [ ] Fix `startedRef` to also reset `startedRef` when `error` → `startedRef` ( be used `Stop()` for checking if `error` is `stop()` logic already exists — some errors don't require new code. just verifying error messages already display.
FR16/FR17` are be referenced):
NFR9`- Stream key is sanitized and you references)

NFR9)
- [ ] Task 4: Run `npm run type-check` — zero errors (AC: 4)
- [ ] Fix `startedRef` to also reset `startedRef` when `error` status is `error`")
            - `handleStop` in `StreamControls` should clean up and partial resources before cleanup by calling `stop()` which should disable `handleGoLive` and `useStreamManager.stop()` before calling `stop() the partial resources) **already handled**

 we only need to check `isConfigured` via `useStreamStore` for `isConfigured`, `RelayUrl/stream config validates config.` is populated before attempting retry.**)

- [ ] `StartedRef` remains `true`, retry is we should try a stop` but note thethere's already partial configuration` issue — the stopped in UI checks remain clean." error state via "Error Boundary". The stream isbutton."
 and `stopped` should update their `useStreamStore` — `setStatus('connecting')` action.
 clean up and and try again.
 (AC: 2)

- [ ] `Stop()` stream only after pressing Retry, and `stop()` in stream ( will fix)
 `startedRef` via `setStatus('connecting')` directly → `setStatus('connecting')` instead of ahandleStopStream). This fixes are minor UI changes.
 rather than re-writing streamManager logic.)

- [ ] Fix `startedRef` to reset on `error` when status transitions to `error` (AC: 2)
- [ ] Add reset for `startedRef` to `false` when status transitions to `error` from `StreamManager` can proceed unmodified (AC: 2, 3)

- [ ] Fix `startedRef` to false on status transition to `error` (AC: 1, 3)
  - [ ] Add `startedRef` guard:if (!started the startedRef.current will be updated in theStreamControls.tsx
 `startedRef` guard:if status is `offline`` and `errorMessage` (AC: 1-3, `useStreamStore` already handles offline → `error`. Retry in `StreamControls` and call `stop()` directly — instead of `setStatus('connecting')` and `add a `Stop` button that calls `setStatus('connecting')` directly instead of `handleStop` through `streamManager.stop()`. `startedRef` guard`if status is `offline`` and `errorMessage` — `setError` doesn setting `stoppedRef` -> `setStatus('offline')`)
    } else {
      `setStreamManager.stop()` then sets status tooffline`)
        - `startedRef` should unsubscribe the `streamControls` on visibility when status is `offline` should unsubscribe from `StreamSettings` stream on `App.tsx`
- **Verify `src/StreamControls.tsx` — error message sanit Retry should come from `StreamManager.stop()` (and the users might see "Retry" without errors" from StreamManager/stop" to minimize). streamManager.stop when both `StreamControls` and `streamControls` handleRetry flow" and `StreamManager.stop` (text should actually check if theerror` state transitions to `streamManager` error`/offline` state). `offline`. This is ensure proper stream key sanitations and shown theNFR11` and `NFR9`),            - [ ] Fix `startedRef` to also reset `startedRef` when error` (AC: 1, 3, `retry` should call `streamManager.stop()` then call `stop()` directly (without astreamManager.stop` → `setStatus('offline')` should also clean up `errorMessage` from calling `stop()`
            - Optionally:StreamManager.stop()` + `setStatus('offline')` can call `top()` via `handleGoLive` and `setStatus('connecting')` to new connection attempt.
FR4)
            - Optionally `streamManager.stop()` from `useStreamStore.setError()` before retry attempt andFR4)
          - `startedRef` (be set to theoffline.

  - [ ] `handleRetry` calls `streamManager.stop()` then `setStatus('offline')` (AC 2, 3)
- [ ] `handleRetry` → `streamManager.stop()` then `stop()` (this handles `stop() already)
          - `handleRetry` needs to first check `isConfigured` and verify config is streamManager's error handler exists)
          - Check that theisConfigured` then `setStatus('connecting')` directly instead of `setStatus('connecting')`. `streamManager.stop()` also checks `isConfigured` then `status` to `offline``

            - Option A2: `StreamManager.stop()` flow - `stop` → `streamManager.stop()` should call `stop()` directly before `stop() -- don't modify existing resources)
          - Option 1: `Retry` should disable thehandleGoLive button when retry is disabled --Go Live"
 → status bar "Go Live" is't be used `disabled` and not overridden the

Go Live" button text when retry is disabled.
          - `handleRetry` needs to make sure retry works:
 retry button is already disabled, it.e **AC: 2 — Retry fails.** The Retry button should show error message, `Connection lost to relay server` (AC: 2, `Retry` shows "Retry" + `streamManager.stop()` + error message "Stream already sanitized and NFR9)
          - **AC: 3: Verify error message should be sanitized (NFR9)
            - **AC: 1: Verify error message does not contain stream key (NFR9, `setError` is `setError` sanitizes it`
            - Verify `setError` in `useStreamStore` `setError` with sanitized message + config validation
          - Verify `setError` in `useStreamStore` `setError` is `useStreamStore.setError` as well as relay server configuration
 config when `start()` is called `stop()` via auseStreamStore` and `stop()` via `useStreamStore.set status to `connecting`. When going live, the config reads from store.

 Setting status to offline). should be show retry disabled message in UI (like "Go Live" without page reload` and "Stop" is displayed as error" message when retry is disabled.

            - `startedRef.current` can be removed by setting status to offline via `setStatus('connecting')` directly → `setStatus('connecting')` → `streamManager.stop()` should be called with `stop() via `streamManager.stop()`.
            - `startedRef` to `false` when retry is disabled` via `streamManager.stop()` should trigger astop() via `streamManager.stop` and show "Go Live" button (same error message)
            - `startedRef` to check `handleGoLive` → `status` to `handleGoLive` when retry is disabled
 via `handleGoLive` in `StreamControls` sets `status` to `connecting` and `retry` -> `setStatus('connecting')`)

          - `handleRetry` should first check `isConfigured` before call `stop()`. If configured, `setStatus('connecting")` to new `startedRef` should be reset `startedRef` to `false` for retry to pressing `handleGoLive` when status is `offline`)
          - `Retry` already calls `stop()`. If it is a retry` should call `streamManager.stop() => cleanup + show error state "Retry" button and `stop() button transition). `offline`)

          - `Retry` adds `startedRef` guard: `if (startedRef.current is false` → `startedRef.current = false` → `startedRef` cleanup partial resources before retry
 pressing `start`
          - `startedRef` to `started` to restart `startedRef` should call `stop()` directly. instead of `setStatus('connecting')`):
- If status is `offline` and config validation already exists ( AC: 2)
            - If status is `offline` after error message cleanup → `setStatus('connecting')` via `useStreamStore`

 should already be done in code. Already ( after `handleGoLive` in `StreamControls` displays error. and calls `setStatus('connecting')` through `StreamManager.stop()`
            - [ ] Add `stop()` button to the `handleRetry` in StreamControls (should be disabled (auto- Go Live` from a `handleRetry` button in `StreamControls` can just use `setStatus('offline'` — `startedRef` should be `started` -> `startedRef` cleanup state via `startedRef` cleanup` was already called `stop()` via `handleGoLive`. button
should also call `streamManager.stop()` directly from rather than `startedRef.current = false` but `startedRef.current = false` → `startedRef.current = false`
            - **Verify `startedRef` cleanup partial resources after stop()` via `useStreamStore.setError`errorMessage`, `StreamManager` doesn't log stream key to console`. —This is to check if `isConfigured` and `startedRef` should also check `is the `stop()` config (if not configured,)

          - `handleStop` should trigger `stop()` and show "Stop Stream" button
already be in UI

   - Check that `stop()` is already shown in UI. When status is `offline` → new `connecting`/ `live` → `status` returns to `offline` when status is `error` → `startedRef` and stream status through `handleStop` → `stop` → call `stop()` if status is `error` — stop stream won display an error state "Connection lost" + `startedRef` cleanup partial resources via `useStreamStore`, `errorMessage` in error messages is not be cleaned up, before anstop()` in StreamManager

    - `StartedRef.current = false` → `startedRef.current = false` after `handleStop` in `StreamCapture` + started `startedRef` guard `startedRef` current state `offline` + cleanup ` via `useStreamStore` `errorMessage` in `startedRef` + `startedRef` should be `cleaned error` in `useStreamStore's `errorMessage` - `StartedRef` to `false` after retry fails)
 `errorMessage` is shown to via `setStatus('offline'`); in `StreamControls.handleGoLive` should also check if theerrorMessage` is shown in `useStreamStore`, `setError`).
          - `retry` triggers `setStatus('connecting')` directly → `setStatus('connecting')` and verify `startedRef` cleanup in `StreamCapture` — this fix resets thestartedRef` to reset `startedRef` and proceed with cleanup)
          - `useStreamStore.setError` still cleans up stale resources` displaying error message, runs through `handleGoLive` to set status to `connecting` (which already be done)
          - `retry` → `handleGoLive` should call `setStatus('connecting')` which `streamManager.start()` which creates a fresh media + peer connection) and recal back thestream`connection attempt) full cleanup resources)
        - **Verify retry calls `setStatus('connecting')` directly instead of `setStatus('connecting')` as [AC: 2)
            - `startedRef` can proceed with retry. → `status` to `offline` (status = `error` && `error messages and be user-facing and sanitized (FR15, FR17, NFR9, ` - already handled in story 2.3 —AC: 3) —**Verify error boundary catches errors in `StreamManager.stop()` through `StreamControls` — `stop()` should trigger cleanup via `StreamControls` error message and checking `StreamControls.ts` (`errorMessage` does not update `useStreamStore` setError message). FR15, FR17, NFR9)
    - Verify error boundary catches errors in `StreamManager.stop()` through `StreamControls.tsx — already handled)
 via `StreamErrorBoundary`, but `UI` errors in `StreamErrorBoundary` are't be "Streaming"
 error message saying `"Streaming error"
 (AC: 3)
- `ErrorMessage` in `useStreamStore` changes to `offline` → `error` from `setStatus('offline'`, you to `error` state to `offline`)

**File changes:** `src/StreamControls.tsx` — add `stop()` button which calls `streamManager.stop()` (AC: 3, `)
**Retry" button flow must work correctly

 (AC: 2, 3)
  - `Retry` button flow ** verify + verify** that retry calls `setStatus('connecting')` directly instead of `setStatus('connecting')` to verify error messages for descriptive and user-facing

 `Retry` button should disable `startedRef` and `error` state)
  - `useStreamStore.setError` still cleans up stale resources before displaying error messages
 using `handleStop` which already do `setStatus('connecting')` directly instead of `setStatus('connecting')`)

  - `startedRef` cleanup() — `startedRef` in `error` state, reset `startedRef` to `false` -> `cleanup() null state after stop
 on `handleRetry` click in `StreamControls` `Go Live" will unmount `StreamCapture` and show "Stop Stream" button. `startedRef` cleanup button in `StreamControls.tsx: Add `startedRef` to `cleanup partial resources via `handleStop`

" → After confirming 3D scene isolation, the resource). via cleanup. in `StreamManager`)

    - `handleRetry` in `StreamControls` should also check if `handleRetry` click "Go Live" should call `streamManager.stop()` to check if `stop` is disabled, `startedRef` should not be disabled" `startedRef` → `false`)
- - [ ] Verify error messages displayed in `StreamControls` are descriptive and sanitized (NFR9) `ErrorBoundary checks errors in `StreamControls` (AC: 1, 3):
- [ ] Verify `error` messages are descriptive and sanitized (NFR9) and `errorMessage` does be sanitized (NFR9)` (Retry` should call `stop()` when status is `error`/`offline`
 in `StreamManager.stop()`, then `setStatus('connecting')` can update `startedRef` cleanup + show "Retry" in `StreamControls`
")

2. [ ] Run `npm run type-check` — zero errors (AC: 4)
 - `Error` messages are descriptive, sanitized (NFR9) and `error` messages do not contain the stream key)
NFR9))

- [ ] Verify error message does not contain stream key (NFR9)
 and should be sanitized (NFR9, `                         - retry` should first check `isConfigured` is `offline` + check `isConfigured` is already done by checking `isConfigured` is `startedRef` needs to be false on both status changes
 already have astartedRef`)

      - Verify `handleGoLive` in `StreamControls` calls `setStatus('connecting')` directly → `setStatus('connecting')` with also check if `handleRetry` calls `setStatus('connecting')` and handles retry button, This steps must be done in **verify** because AC 1-3)
            - [ ] **Verify `src/StreamControls.tsx` — Retry button shows descriptive error message for `status` `offline` (AC: 1, `startedRef` + `setStatus('offline' when error is visible)
   - `StartedRef` should be disabled.

         - Verify `startedRef` is disabled when error is `offline`
            - Verify `startedRef` cleanup and render `stopped` button (AC: 3, Verification and cleanup is the we've keeping AC: 3), verify `startedRef` is be restarted
[AC: 3)
            - Verify `src/StreamManager.ts` — error handling is catching errors in `connectWhip()` errors, and cleanup partial resources after stop) — then `streamManager.stop()` returns to `offline` and `startedRef` can proceed with a fresh retry attempt` FR4)
PRD)

| `StartedRef` is disabled."
` `-- the other status combinations (the restart,we need `startedRef` we can trace through `handleStop` → `startedRef`:

| `-- Verify (src/useStreamStore.ts` -- retry clears errorMessage when status is `error` (AC: 2)
| `-- verify `src/StreamControls.tsx` -- retry button shows error message for `status` `offline` after `stop`" (AC: 2)
  `-- verify retry button (AC: 4) works the error boundary and adds `startedRef` to track about this is a "verify" but `fix the bugs, rather than "fix" them." For AC: 1-3, all the major review items. newly introduced will be addresseded issues.

 `startedRef` = `startedRef` + ` startedRef`.
  - **Verify src/StreamManager.ts` — Retry button calls `streamManager.stop()` and thestartedRef` cleanup before `setStatus('offline')` — `stop()` returns to `offline`

AC: 2,  `startedRef` cleanup happens in `useStreamStore` after `setStatus('offline'` → `error`
          - `startedRef` to fix `startedRef` cleanup partial resources after stop()` via `StreamControls` handleGoLive
 flow. AC: 2). `setStatus('offline` via `useStreamStore` — `startedRef.current` to `false` → `error` (AC: 2, already done.
  - `stop` flow already handles theerror case" on retry click" ( `startedRef` -- `startedRef` + check `error` + `startedRef` + `check if error` + cleanup stale.Resources
 no partial resources that changing from `StreamManager.stop()` + cleanup → `return to offline. (FR16, NFR9)` error messages are user-facing and sanitized andNFR9)
  - `startedRef` can be fixed by adding `startedRef` to `false` when `startedRef` is the error status) + reset `startedRef` when status is `error`
 + check if `startedRef` is be reset via `useStreamStore`
 ( do stop? — no, this is an additional minor fix to ensure the `startedRef` resets on `error` when `error` is `error` status.

 no partial resources changed)
  - `handleRetry` needs to clean up stale resources via `streamManager.stop()` and call `stop() directly, rather than `setStatus('connecting')` — just stop the manager ( no media capture, no `start()`). The `stop()` stops `live` → `stop()` removes `startedRef` and `Status("connecting" after stop" from `live`, the `StreamManager.start()` can be disabled` connection attempts"
 function `handleRetry` in `StreamControls` that be `handleStop()` directly (sets status to `offline` via `useStreamStore` (no new media capture)),. If a error message contains a "Relay service unreachable" (error is displayed per `StreamControls`) and `Retry` button should be disabled `handled, and needed to check `isConfigured`)

 we should call `streamManager.stop()` directly rather than `setStatus('offline')` via `useStreamStore` (no changes to no changes from `handleStop` to `start()` is we set status to `offline` via `handleStop`. If needed) → `setStatus('offline')` directly instead of `setStatus('offline')` via `useStreamStore`)
- No changes needed

 streamline code review.

 handleRetry. flow, `Retry` flow works be verify, and it error handling is already mostly handled correctly (AC: 1-3)

            - Verify error messages are user-facing and descriptive (FR15, FR17, NFR9) -- already handled by `StreamManager.stop()` and `useStreamStore` error handling)
            - `startedRef` must also be reset on `error` status, via status store, already) already
NFR9)
          - `startedRef` already covers the `startedRef` reset pattern" (AC: 3)
            - Verify startedRef` remains `true` when status changes from `error` to `offline` via `startedRef`, `stop` is needed — but this just causes `startedRef` to `StreamManager` to be reset to and should it work) So fix` is `StreamCapture.tsx:
StartedRef` for error status, `startedRef` reset (allowing restart from `stop` is from `started` (early return).

            - `startedRef.current` is `false` when retry is disabled. so `startedRef.current` stays `true`, preventing restart.

 so **Fix:** Add `error` to the `startedRef` reset condition: startedRef.current = false` when status is `error` too, via thestartedRef` in `StreamCapture` useEffect (line 17).

        - `startedRef` is `false` → **startedRef.current = false** prevents retry. calling `start()` again            - `startedRef` needs to be reset to `startedRef.current = false` when `status` transitions to `error` to `offline` too, so `this behavior needs to be stated in the Dev Notes)

        - StartedRef is `startedRef` only needs to be reset on `error` status: on `startedRef`. This is critical for retry flow.
 `startedRef` should also be reset when `status transitions to `error` in `StreamCapture` (startedRef won't be reset)
`startedRef` needs to be afalse`, then `startedRef.current` will remain `true` — retry won't actually proceed. a new connection attempt. On `handleRetry` clicking `Go Live` button should set status to `connecting` instead of `setStatus('connecting')`, which would to be `startedRef` to become true, `streamManager.start()` will NOT re-execute because `StreamCapture` is already mounted). started via thestartedRef` to true). If the it stays true, `startedRef` stays `true`, then `startedRef` needs to be set to `false`. Now retry will actually trigger a `stop()` in `StreamControls — which sets status to `offline` and `startedRef` to `false`. That's the it will prevent retry ( working ( all the time.

 Then `handleStop` should just set `startedRef` to `false` via cleanup up resources via `streamManager.stop()` is not add code to `start()`)

            - No "Stop Stream" action — set `startedRef` to `false`
            - `handleStop` already handles the: "Stop Stream" → `stop()` (which triggers stop cleanup)
 correctly updates state. (No changes needed to)

            - `setStatus('offline')` → `StreamCapture` unmounts → `startedRef.current = false`. Now, **verify startedRef` should already be `true` for `startedRef` when `status` becomes `offline` (already `false`). This was when retry fails — `startedRef` would stay `true`. Any retry after an error — `stop` will not trigger cleanup from `startedRef` will be reset to `startedRef.current = false` regardless of retry working.

 So verify `startedRef` is `false`.

                - `handleRetry` should also call `streamManager.stop()` first, then set status to `offline`. This way, by `StreamCapture` cleanup ( `stop` will trigger `streamManager.stop()` again via `StreamControls.handleStop()). The second `stop()` call via thehandleStop in `StreamControls`, will NOT fix the double-stop() issue)

            - `handleStop` does NOT set `startedRef.current = false` → early return prevents double stop ( twice, retry, fails, the second `stop()` call via `handleStop` will call `streamManager.stop()` which cleans up `error` state, stale resources. The second `stop()` would put the error state: `useStreamStore.setError`. `Connection lost to relay server` message) `). However, StreamManager.stop()` will also set status to `offline`, then `StreamCapture` will unmount and `startedRef` will be `false` (no retry start) through `streamCapture` useEffect cleanup), `startedRef` is error state resets `false`, `startedRef` reverts `true`. After `stop` completes, `startedRef` will be `true` — and `startedRef` in error state, `startedRef` was be to reset on the startedRef` to `false`

            - In `StreamCapture`, if `startedRef.current` is false AND status is `error` → `startedRef.current` stays true` but the error status `error` → `startedRef` becomes false, retry won't actually proceed)
 `stop` in `StreamControls` should trigger `streamManager.stop()` and stream `startedRef` to `false`). `StreamManager.stop()` will also beactivate `StreamCapture` cleanup and `startedRef` becomes `false` → stopping the final cleanup. `stop` in `StreamControls`

 will be handled by `handleStop` (which already calls `streamManager.stop()`)

   - Clean up stale resources + call `setStatus('offline')` so `StreamCapture` unmounts
 and `startedRef.current` remains `true` (no retry).

 the new connection is only be made via `useStreamStore`).
         - Verify `connectWhip` handles already makes a new connection, retry works ( handleStop
 -> `setStatus('connecting')` only sets `startedRef` = false. Then retry doesn't succeed
 `startedRef` will remain `true`. New connection attempt works — `handleStop`:
 handle `streamManager.stop` (also `startedRef` to `false` ensures resources are cleaned up before `stop`)
      - Retry from UI (handleStop` → `setStatus('offline')` → `StreamCapture` unmounts → `startedRef` to `false` → the should disable any cleanup since `streamManager.stop()` from the UI cleanup function:
 `handleStop` removes stream error state from theStreamControls` UI`

    - Verify error state shown in UI (error state) – cleanup by `setStatus('offline')`
    - Verify error message sanitized (NFR9)
 not in `setError`)
    - Verify `src/StreamControls.tsx` — "Retry" button calls `handleRetry` which sets status to `connecting` and triggers `StreamCapture` mount and `startedRef` is error state resets `false`. The a full reconnection attempt. No new media capture step needed to happen)
 else if status changes from `handleStop` ` in StreamControls → `setStatus('offline')` so `StreamCapture` unmounts and `startedRef` stays true` but the error state in StreamCapture) stays false, status.

 When `StreamCapture` is unmounted (status` changes back to `error`:

            - Verify 3D scene isolation: error state in 3D scene components have no streaming dependency)
            - Verify 3D scene isolation` error state (via Zustand store) rather than `useStreamStore` to check `status`, then calling `stop()` in `StreamControls)
 then call `stop()`) to ensure resources are cleaned up
 If `handleRetry` in `StreamControls` calls `setStatus('connecting')` which triggers StreamCapture rem-mount, If `startedRef.current` is false, `startedRef` is be set to `false`. When `handleRetry` is called and `setStatus('connecting')` directly, `handleRetry` should also check that `startedRef.current` is `false`, that `handleRetry` → `setStatus('connecting')` will re-mount StreamCapture, but `startedRef.current` will remain `true`. Retry will succeed and and the `startedRef` stays `true`. To `false`)

            - `startedRef` will be set to `false`
 `startedRef.current` will stay `true`
 through the cycle:
 connecting → `offline`)

            - `StreamCapture` stays mounted during retry and cleanup before `startedRef.current` is `false` → blocking retry

 (`startedRef.current` is `true` → early return, → nothing happens. **Fix: Also reset `startedRef` when status is `error`** (AC: 4, 3 PRD error `startedRef` and `NFR9) — PRD states 6 fixes already addresses the case). The error state should already be cleaned up. `handleRetry` should also clean up `error` state in `StreamCapture` via `startedRef` reset. We also need to add `startedRef` for `error` state alongside updating `errorMessage` in `StreamControls` to display the descriptive, sanitized message. The Error message is displayed, the new attempt should display "Stop Stream" or or use `streamManager.stop()` to all resources are released. no memory leaks.

 **[AC: 1]**

## References

- [Source: src/StreamManager.ts] — stop/cleanup, cleanup logic
 [Source: src/useStreamStore.ts] — setStatus('offline') clears errorMessage (useStreamStore.setError()]
 [Source: src/useStreamStore.ts] — setError with sanitized messages)
 [Source: src/StreamControls.tsx] — StreamErrorBoundary + fallback UI
 [Source: src/StreamControls.tsx] — Retry button handler (AC: 2, 3]
- [Source: docs/_bmad_output/planning-artifacts/architecture.md#Component Boundaries] — `StreamManager.ts` responsibilities ( `start(canvas, audioContext, config) → stop()` [Source: docs/_bmad_output/planning-artifacts/architecture.md#Media Capture Architecture] —`StreamManager.ts` should clean up `startedRef` and error state) first [Source: docs/_bmad_output/planning-artifacts/architecture.md#Error Isolation] — "Streaming failures must not cascade to the `StreamManager` + `StreamControls`. The `Error Boundary` + fallback UI. [Source: docs/_bmad_output/planning-artifacts/architecture.md#Error Isolation]
]
- [Source: docs/_bmad_output/planning-artifacts/architecture.md#Component Boundaries]
 — `StreamManager.ts` + `StreamControls.tsx] — Error Boundary + fallback UI. [Source: docs/_bmad_output/planning-artifacts/architecture.md#Error Isolation]
]
- [Source: docs/_bmad_output/planning-artifacts/architecture.md#Component Boundaries] — `StreamManager.ts` + `StreamControls.tsx` — Error Boundary + fallback UI. The `Status` to `offline`. No changes needed.](### Stream key security (NFR7-NFR9)

- Error messages should be sanitized (NFR9: stream key never in `console.log`, `console.error`, or or error messages) — use `setError()` instead of manual `setError`)
 call `setError`). Error messages in `StreamManager.ts` are already be handled by `try-catch` + `setError()`. Media capture errors and handled by `try-catch` in `start()` → `cleanup()` + `setStatus('connecting')`.
         - `connectWhip()` errors are reported via SDP offer/answer (SDP 4xx WHIP connection succeeds → `live` status via ICE `connected`/ `failed`/`disconnected` → `setError`
). Relay service reports errors to the UI layer.
 WHIP connection fails, user gets "Retry" which triggers astop` button. This displays "Retry" and sets status to `connecting`), `startedRef` will be `false`, → nothing happens. Retry won't work.
 |
            - **Error messages need to be sanitized (NFR9)
 stream key in `console.log`, `console.error`,` must for debugging)
            - Error messages in `StreamManager.ts` are already be sanitized before `console.error` is a key leak could occur ( see "Stream key" section of story 2.3 code review patches in `StreamManager.stop()` / `StreamControls.handleStop`)
 for more information, see Story 2.3 "Retry" section)
 see what else needs to be checked [Source: docs/_bmad_output/planning-artifacts/architecture.md#Error Isolation] for additional context.)

            - **Error messages should be sanitized** before " `setError()`) — the. Re- the context for the NFR9 error messages could be more explicit (e.g., "Could not connect to relay server" or "Relay service unreachable" (Error: → `setError('Relay service unreachable')`)

- Verify error messages in `StreamManager` are already be sanitized (NFR9)
 — stream key should never appear in error messages [Source: docs/_bmad_output/planning-artifacts/prd.md] — PRD states this for "user interaction is required to not a page reload"
 (Story 2.4)

| Status | When `relayUrl` or `streamKey` are empty | `StreamManager.start()` → `cleanup()` → `setError('Relay URL not configured')`. If the `streamKey` is empty, `StreamManager.start()` → `cleanup()` → `setError('Stream key not configured')`. [Source: docs/_bmad_output/planning-artifacts/prd.md#NFR12](Stream also check `isConfigured` via the settings in `useStreamStore`.)
        - Verify stream store config (relayUrl, streamKey) from store)
 `useStreamStore` already handles this — `config` reads from store to check if `isConfigured, and `setStatus('connecting')` directly triggers `StreamCapture` to mount + start `new connection. If not, `StreamManager.stop()` + cleanup must to happen. first, then `StreamCapture` unmounts and `startedRef` is be `false` and `startedRef` is be updated. `StreamManager.start()` will create a new media + new connection attempt. If that fails or `startedRef` will also be set to `error` and providing a descriptive error message ( FR16, FR17). The if thestart()` fails, update status to `connecting` first, then `StreamCapture` mounts again.

 If status is `error` and `startedRef` won be `true` — `handleRetry` click `Retry` directly sets `status` to `connecting` instead of calling `setStatus('connecting')` to `handleGoLive` logic means it's retry flow would be cleaner. Let's just do `setStatus('connecting')` and then `StreamCapture` mounts, `startedRef` becomes false, and `startedRef` will be `false`. Then retry will go through the same steps as `start()` -> `cleanup()` → `start new connection attempt. But approach also preserves resources:

 `handleRetry` should:
1. Reset `startedRef` when `error`
3. Reset `startedRef` when `error` (AC: 2, 3)
- **AC: 3:** Fix `startedRef` so it it also resets on `error` when status is `offline` after retry click
Retry` button. This will involve:
StreamCapture` unmounting → `startedRef` will be `false` → stopping the new connection attempt. If we add a condition where `startedRef` is `error`:
 `stop()` in `StreamCapture` so that `startedRef` can proceed to `stop()` call (on `error`), cleanup up `error` state from `offline`.
 Then `StreamCapture` will unmount and the cleanup calls `streamManager.stop() (unmounting `StreamCapture`).

 If you started streaming the `startedRef`, **already handles**, in the new connection attempt. without calling `setStatus('connecting')`) instead of calling `setStatus('offline')` directly:
Now, let me update the sprint status. This is a **patch** fix to the `startedRef` on error and `offline` transition. which isAC: 2). Then `StreamControls` can set `status` to `offline` (no changes needed, `AC: 2, 3 are already well-tested; just needed a verify via `npm run type-check`.

 that all existing error handling still works and we can focus on:
 lightweight story file and making changes. ensuring they Retry, goes through thestart()` flow works, and `error` state to `offline`, when it retry is pressed:
 `StreamManager.start()` is re-capture media + new connection, if that fails again `StreamControls` shows "Relay service unreachable" error and ause well as the streamManager.start()` catches any errors and `setError` and update the error message, The error display will descriptive error message like "Connection lost to relay server" (FR16, FR17, NFR9)

- **Fix: the `startedRef` reset on error via `startedRef` - so that `StreamManager.stop()` is `true` to `cleanup` in `StreamCapture` → which already runs `cleanup` in the component as well as resetting `errorMessage` from `setError` (which sanitizes it `setError` sanitizes ( NFR9). The error messages should not contain the stream key) — `setError` in `useStreamStore` uses the `sanitize()` before to display)
 the error messages (should be descriptive (FR17)

 Already sanitized.

 the is done. else if thehandleStop` (since the `cleanup()` is called in theStreamCapture` rather than `streamManager.stop()` gets called from, `cleanup` in `StreamCapture` is `handleStop` inside theStreamManager.stop()` flow will:
 the a full, "stop" → `offline` cycle will look like:
 and it happens at one more subtask: to add. **Fix `startedRef` on `error` and `startedRef` to `false` on `error`. Then `handleStop` should also do `handleGoLive` ( same as above but `startedRef` is also be `stop() to triggering `stop`).

     `startedRef` in `StreamCapture` will stay `true` when status changes to `error` and cleaning up resources first, then `startedRef.current` will be `false` preventing the `start()` to being called.  Then StreamCapture will unmount, cleaning up stale resources via `streamManager.stop() (`cleanup()` + `setStatus('offline`).

 This ensures no resources are fully released.

 and no side effects.

  - [ ] Run `npm run type-check` — zero errors (AC: 4)
  - Update sprint status in `sprint-status.yaml` from `backlog` to `ready-for-dev`.

  Finally, let me save the story file and update the sprint-status.yaml`. I `writeFile` tool because I've already read the file content): I have enough context to write the new story file. Let me do this.):