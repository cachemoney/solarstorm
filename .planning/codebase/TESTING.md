# Testing Patterns

**Analysis Date:** 2026-03-10

## Test Framework

**Runner:**
- Not detected - No test framework configured
- No test files found in codebase

**Assertion Library:**
- Not detected

**Package Manager Scripts:**
```bash
npm run dev              # Run dev server with Vite
npm run build           # Type check with tsc, build with Vite
npm run preview         # Preview production build
npm run type-check      # TypeScript type checking without emit
```

**Testing Commands:**
- Not configured - No test runner scripts available

## Test File Organization

**Status:**
- No test files found
- No test directories identified
- No testing configuration files (.test.ts, .spec.ts, jest.config.*, vitest.config.*, etc.)

**Recommended Pattern (if tests were to be added):**
- Co-located testing likely (test files adjacent to source files)
- Pattern would follow: `ComponentName.tsx` → `ComponentName.test.tsx` or `ComponentName.spec.tsx`
- Example locations would be:
  - `src/App.test.tsx`
  - `src/attractor.test.ts`
  - `src/useMusicStore.test.ts`

## Code Quality Assurance

**TypeScript:**
- TypeScript compiler configured with strict mode: `"strict": true`
- Type checking runs via `npm run type-check` (tsc --noEmit)
- All files must pass type checking before build
- Errors prevent production build: `npm run build` runs `tsc && vite build`

**Type Safety:**
- Interfaces defined for all props: `interface SceneProps { ... }`
- Function parameters typed: `(state: any)` (some use `any`, most are typed)
- Return types annotated: `(): [number, number, number]`
- Strict null checking enforced

**Runtime Validation:**
- Defensive null checks: `if (mesh.current) { ... }`
- Optional chaining: `sound.current?.play()`
- Null coalescing with defaults: `radius = 10`
- No schema validation libraries (Zod, Yup) detected

## Testing Gaps

**Untested Areas:**
- All Components: `App.tsx`, `Scene.tsx`, `Effects.tsx`, `Music.tsx`, `Planet.tsx`, `SpaceShip.tsx`, `Sparks.tsx`, `SparkStorm.tsx`, `SpaceDust.tsx`
- All Utilities: `attractor.ts` (7 exported functions), `useMusicStore.ts` (Zustand store)
- All Post-Processing: `Glitchpass.ts`, `Waterpass.ts`
- All Mesh Utilities: `MeshLine/meshline.ts`, `MeshLine/material.ts`, `MeshLine/raycast.ts`, `MeshLine/utils.ts`
- Material: `SilkyMaterial.tsx`

**High-Value Test Targets (if tests were implemented):**
- **`attractor.ts`:** 7 mathematical attractor functions that compute differential equations - ideal for snapshot/numerical tests
  - `dadrasAttractor([x, y, z], timestep)` → should return `[dx, dy, dz]`
  - `lorenzAttractor([x, y, z], timestep)` → should return `[dx, dy, dz]`
  - etc.
- **`useMusicStore.ts`:** Zustand store state mutations - good for reducer-style tests
  - `setInit(true)` → should update init state
  - `setAudioData('bass', 200)` → should normalize and store value
  - `setProgress(0.5)` → should compute derived state (glitchFactor, distortFactor, scale, etc.)
- **`Music.tsx`:** Audio loading and analysis - integration tests with mocked AudioLoader
- **`MeshLine/meshline.ts`:** Geometry computation and attribute management - unit tests for process(), advance()

## Testing Approach (Current State)

**Type-Driven Development:**
- TypeScript strict mode acts as primary quality gate
- Type errors prevent runtime errors
- Compiler catches most issues before execution

**Manual Testing:**
- Development server (`npm run dev`) for interactive testing
- Visual verification in browser for Three.js/React Three Fiber components
- Audio playback tested manually via Music components

**No Automated Testing Infrastructure:**
- Suggested additions for quality improvement:
  - Jest or Vitest for unit/component testing
  - React Testing Library for component testing
  - React Three Fiber testing utilities
  - Puppeteer already in devDependencies (no tests using it currently)

## Dependencies for Testing (if implemented)

**Already Available:**
- `puppeteer` ^24.37.5 - For E2E/screenshot testing
- TypeScript ^5.3.0 - Type checking
- Vite ^7.3.1 - Could run test runner

**Would Need Addition:**
- Jest or Vitest (test runner)
- React Testing Library (React component testing)
- @testing-library/react
- Three.js/React Three Fiber test utilities
- ts-jest or similar TypeScript support for test runner

## Development Workflow

**Type Checking:**
```bash
npm run type-check      # Run without build
npm run build           # Type check + build (fails if types error)
```

**Development Loop:**
1. Write code with TypeScript types
2. Run `npm run dev` for hot reload
3. Test visually in browser
4. Run `npm run type-check` to verify types
5. `npm run build` before production

## Manual Test Scenarios (if tests were written)

**Audio System:**
- Loading bass/drums/melody/vocals tracks
- Tracking progress through song
- Glitch factor computation at specific progress points
- Distortion factor computation
- Scale factor computation

**Attractor Algorithms:**
- Each attractor function produces valid [dx, dy, dz] values
- Integration produces continuous paths
- createAttractor initializes correct position count
- updateAttractor normalizes to specified radius

**Scene Components:**
- Scene renders without errors
- Effects compose passes correctly
- Music loads all audio before playing
- SpaceShip follows attractor path
- Sparks respond to mouse input
- SpaceDust particles animate correctly

**State Management:**
- Initial state sets all values correctly
- Audio data normalized to 0-1 range
- Progress drives all dependent state correctly
- Multiple subscribers don't conflict

---

*Testing analysis: 2026-03-10*

**Status Summary:**
- Testing infrastructure: Not implemented
- Code quality approach: TypeScript strict mode + manual testing
- Test coverage: 0%
- Priority for implementation: Medium-High (mathematical functions + state mutations are testable)
