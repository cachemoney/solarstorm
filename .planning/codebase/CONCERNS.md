# Codebase Concerns

**Analysis Date:** 2026-03-10

## Type Safety Issues

**Excessive use of `any` type:**
- Issue: 40+ instances of `any` type bypass TypeScript's type checking, reducing compile-time safety
- Files: `src/App.tsx`, `src/Scene.tsx`, `src/Music.tsx`, `src/Effects.tsx`, `src/Planet.tsx`, `src/SpaceShip.tsx`, `src/SparkStorm.tsx`, `src/SilkyMaterial.tsx`, `src/SpaceDust.tsx`, `src/post/Glitchpass.ts`, `src/post/Waterpass.ts`, `src/vite-env.d.ts`, `src/MeshLine/material.ts`, `src/MeshLine/meshline.ts`, `src/MeshLine/raycast.ts`, `src/MeshLine/utils.ts`, `src/Sparks.tsx`
- Impact: Type errors at runtime that TypeScript should catch. Makes refactoring risky and hides API mismatches.
- Fix approach: Replace `any` with proper type definitions. For Three.js types, use proper Material/Geometry/Pass types from the library. For Zustand state, create full MusicState interface extensions.

## Hard-Coded Audio Timing Values

**Temporal hard-coding in useMusicStore:**
- Issue: Audio effect timings are hard-coded as numeric progress values (e.g., `0.487179487179487`, `0.504273504273504`) with no explanation of what music events they correspond to
- Files: `src/useMusicStore.ts` (lines 33-52 for glitchFactor, lines 42-52 for distortFactor, lines 54-60 for scaleFunc, lines 98-115 for setProgress)
- Impact: If music track changes or is re-exported at different duration/timing, all these values break silently. No way to maintain or update timing without deep understanding. Makes the code unmaintainable if ever used with different audio.
- Fix approach: Create a separate audio timing configuration file with named events (e.g., `GLITCH_START: 0.4871...`) with comments mapping to audio timestamps. Consider loading from audio analysis data instead of hard-coding.

## Fragile Audio/Visual Synchronization

**Direct internal Three.js audio property access:**
- Issue: `src/Music.tsx` line 39-45 accesses internal `_startedAt` property from Three.js Audio object: `audio._startedAt` and `audio.context.currentTime`
- Files: `src/Music.tsx` (lines 38-49)
- Impact: These are private/internal properties. Upgrading Three.js version (currently `^0.160.0`) may break audio progress tracking. No fallback or error handling.
- Fix approach: Create wrapper utility with try-catch. Consider using Audio API's `context.currentTime` directly instead of relying on internal state. Add version checks if updating Three.js.

## Missing Test Coverage

**No test files:**
- Issue: Zero test coverage for entire codebase (search for `*.test.*` and `*.spec.*` files found nothing)
- Files: All files in `src/`
- Impact: Audio reactive effects are unpredictable and untestable. Changes to useMusicStore or audio timing break silently. No regression detection.
- Risk areas: Music synchronization, attractor calculations, particle physics, effect composition order
- Priority: High - Audio synchronization must be tested

## Component Complexity - Particle Physics

**Complex particle simulation with poor readability:**
- Issue: `src/SpaceDust.tsx` performs 10,000+ particle updates per frame with complex trigonometric calculations (lines 44-84)
- Files: `src/SpaceDust.tsx` (95 lines, lines 54-81 contain dense physics)
- Impact: Hard to debug visually. No comments explaining physics logic (mouse following, t-parameter animation). If performance degrades, difficult to optimize.
- Safe modification: Isolate particle update logic to separate utility. Add JSDoc explaining mathematical model.
- Performance concern: With 10,000 particles, each doing cos/sin operations and matrix updates, could hit performance limits on lower-end devices. No performance monitoring.

## Undocumented Custom Shader System

**Custom MeshLine implementation with embedded shader strings:**
- Issue: `src/MeshLine/material.ts` contains 300+ lines of vertex/fragment shaders as string arrays (lines 3-82) with complex matrix math and no inline documentation
- Files: `src/MeshLine/material.ts`, `src/MeshLine/meshline.ts`, `src/MeshLine/raycast.ts`
- Impact: If shader behavior needs changing, understanding the matrix math and mitering logic is difficult. No comments on why specific miter calculations are needed.
- Risk: Browser compatibility issues with GLSL - no version checks or fallbacks
- Safe modification: Move shaders to `.glsl` files. Add detailed comments explaining miter joint calculations and perspective correction.

## React Fiber State Subscription Leaks

**Missing cleanup in useEffect subscriptions:**
- Issue: Multiple components subscribe to Zustand store in useEffect without dependencies on the subscription cleanup (lines like `src/Sparks.tsx` 21-30, `src/Music.tsx` 43-52, `src/Planet.tsx` 20-29)
- Files: `src/Sparks.tsx`, `src/Music.tsx`, `src/Planet.tsx`
- Impact: Subscription cleanup function returned by `useMusicStore.subscribe()` is not assigned, so subscriptions are never cleaned up. Causes memory leaks when components unmount during hot reloads.
- Fix approach: Assign cleanup function and return it from useEffect. Pattern: `return useMusicStore.subscribe(...)` correctly returns cleanup.

## Glitch Pass Randomization Fragility

**Glitch effect stability depends on random seeds:**
- Issue: `src/post/Glitchpass.ts` generates random texture data in `generateHeightmap()` (lines 137-152) every time effect is applied. No seed control or temporal coherence.
- Files: `src/post/Glitchpass.ts`, `src/Effects.tsx`
- Impact: Glitch artifacts appear completely random frame-to-frame, may appear unpredictable or seizure-inducing at high glitchFactor values. No artistic control over glitch pattern evolution.
- Risk: Potential accessibility issue for photosensitive users if glitch frequency is too high
- Fix approach: Implement Perlin-based coherent noise seeding. Use timestamp-based seeds for temporal coherence.

## Scaling Performance Issues

**10,000 particle count with complex updates per frame:**
- Issue: `src/SpaceDust.tsx` creates 10,000 particles, each with per-frame updates including matrix operations (line 71: `count={10000}`)
- Files: `src/SpaceDust.tsx`, `src/Scene.tsx` (line 71)
- Impact: No metrics for frame rate or GPU utilization. May drop below 60fps on mobile or lower-end hardware. No LOD system or particle culling.
- Scaling path: Implement dynamic particle count based on device performance. Add frustum culling. Consider compute shaders for particle updates.

## Hardcoded Asset Paths

**Music files hard-coded with relative paths:**
- Issue: `src/Music.tsx` lines 6-12 hard-code audio file paths: `/quitters-raga/bass.mp3`, `/quitters-raga/drums.mp3`, etc.
- Files: `src/Music.tsx`
- Impact: Cannot easily swap music or change audio structure. Paths assume specific directory layout in public folder. No fallback if files are missing.
- Fix approach: Create audio config module. Make file paths configurable. Add error handling with fallback silence or default tone.

## Type Safety in Vite Environment

**Global type declarations use `any` for custom JSX elements:**
- Issue: `src/vite-env.d.ts` declares custom JSX elements (meshLine, meshLineMaterial, silkyMaterial, etc.) as `any` (lines 37-46)
- Files: `src/vite-env.d.ts`, `src/index.tsx` (extends JSX namespace)
- Impact: No type checking on these custom React Three Fiber components. Props, children, and ref types are unknown. Props can be passed incorrectly.
- Fix approach: Create proper TypeScript interfaces for each custom element based on Three.js Pass/Material/Geometry types.

## Untyped Utility Functions

**Canvas-sketch utilities imported but typed as `any`:**
- Issue: `src/vite-env.d.ts` line 19 declares canvas-sketch Random utility as `any`
- Files: `src/vite-env.d.ts`, used in `src/attractor.ts`, `src/Sparks.tsx`, `src/SpaceDust.tsx`, `src/Planet.tsx`
- Impact: Random number generation functions have no type hints. Impossible to know available methods. Hard to migrate to different random utility.
- Fix approach: Install `@types/canvas-sketch-util` or create type definitions. Strongly type Random methods.

## Input Handling Not Defensive

**Mouse tracking has no bounds checking:**
- Issue: `src/App.tsx` line 23 directly uses mouse coordinates: `mouse.current = [x - window.innerWidth / 2, y - window.innerHeight / 2]` with no clamping
- Files: `src/App.tsx`, used by `src/Scene.tsx`, `src/Sparks.tsx`, `src/SpaceDust.tsx`
- Impact: If mouse moves outside viewport (which happens frequently), values can be large and arbitrary. May cause unpredictable camera/rotation behavior.
- Fix approach: Clamp mouse values to reasonable ranges. Add viewport bounds checking.

## No Error Boundaries

**No React error boundaries or error handling:**
- Issue: Audio loading failures (src/Music.tsx useLoader), WebGL failures, shader compilation errors have no error boundaries
- Files: `src/App.tsx`, `src/Music.tsx`, `src/Effects.tsx`
- Impact: Any error in Three.js rendering or audio loading crashes entire app with no fallback UI. User sees blank screen with console error.
- Fix approach: Add React error boundary. Add try-catch in audio setup. Implement fallback rendering.

## Dependency Version Constraints

**Broad semver ranges with potential breaking changes:**
- Issue: Dependencies use caret ranges (^) in package.json: `@react-three/fiber: ^8.15.0`, `@react-three/drei: ^9.90.0`, `three: ^0.160.0`, `vite: ^7.3.1`
- Files: `package.json`
- Impact: Major version updates in Three.js or React Three Fiber could introduce breaking API changes. Caret allows up to next minor version. No lockfile enforcement mentioned.
- Current status: `package-lock.json` exists (164KB), so versions are pinned in CI
- Mitigation: Regularly test dependency updates. Consider documenting minimum compatible versions.

## Transient State in useFrame Callbacks

**Multiple components directly mutate refs in useFrame loops:**
- Issue: Pattern repeated in `src/Sparks.tsx` (20-40), `src/Planet.tsx` (31-51), `src/Effects.tsx` (43-52): storing Zustand state in refs and reading in useFrame, creating implicit dependencies
- Files: `src/Sparks.tsx`, `src/Planet.tsx`, `src/Effects.tsx`, `src/SpaceShip.tsx`
- Impact: Ref updates are not reactive. If component unmounts during effect, ref persists and causes stale closures in subsequent renders.
- Safe approach: Use direct Zustand selectors in useFrame where possible instead of ref subscriptions.

## Missing Accessibility Considerations

**High-frequency visual effects without accessibility warnings:**
- Issue: Glitch pass and particle effects update rapidly (every frame). Camera shake applies rotation on top of already-moving particles. No reduced-motion support.
- Files: `src/post/Glitchpass.ts`, `src/Scene.tsx` (CameraShake), `src/SpaceDust.tsx`
- Impact: Photosensitive users and users with vestibular disorders may experience discomfort or seizures. No prefers-reduced-motion media query implementation.
- Fix approach: Detect `prefers-reduced-motion`. Disable camera shake, reduce glitch frequency, reduce particle count when detected.

## Documentation Gaps

**No comments or documentation on audio reactive logic:**
- Issue: Progress values in `useMusicStore.ts` have no documentation mapping them to actual audio events. Attractor formulas in `src/attractor.ts` are unexplained. Shader logic is un-documented.
- Files: `src/useMusicStore.ts`, `src/attractor.ts`, `src/MeshLine/material.ts`, `src/post/Glitchpass.ts`, `src/post/Waterpass.ts`
- Impact: Difficult for new developers to understand how audio drives visuals. Physics/math heavy code is opaque.
- Fix approach: Add JSDoc comments. Add inline explanations of mathematical models. Create architecture document explaining audio reactive pipeline.

---

*Concerns audit: 2026-03-10*
