## Build / Lint / Type-Check Commands

```bash
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Type-check with tsc, then build via Vite
npm run preview      # Preview production build locally
npm run type-check   # Run TypeScript type-checking only (no emit)
```

There is **no test suite** in this project.

## Code Style Guidelines

### TypeScript
- **Strict mode is enabled** (`"strict": true` in tsconfig). All strict checks apply (noImplicitAny, strictNullChecks, etc.).
- Always use explicit types for interfaces and function signatures. Avoid `any` except when required for R3F dynamic components (e.g., `<meshLineMaterial ref={material} ...>`).
- Use named interfaces (e.g., `interface SceneProps { ... }`) rather than inline types.
- Use `type` for unions/intersections, `interface` for object shapes.

### Naming Conventions
- **Components**: PascalCase (e.g., `Scene.tsx`, `SpaceDust.tsx`, `SparkStorm.tsx`)
- **Functions / variables / hooks**: camelCase (e.g., `useMusicStore`, `appStateSelector`, `setAudioData`)
- **Constants / module-level vars**: camelCase or SCREAMING_SNAKE_CASE (existing code uses camelCase, be consistent with the surrounding code)
- **File names**: PascalCase for components/classes, camelCase for utilities (e.g., `useMusicStore.ts`, `attractor.ts`, `SilkyMaterial.tsx`)
- **Interfaces**: PascalCase with descriptive names (e.g., `MusicState`, `AnalyzerProps`, `SpaceDustProps`)

### Imports
- **Three.js**: `import * as THREE from 'three'` (barrel import, used in all source files)
- **React**: `import React from 'react'` (explicit, even with React 17+ JSX transform)
- **React hooks**: Named imports (e.g., `useRef, useEffect, useMemo`)
- **React Three Fiber**: `import { useFrame, useThree } from '@react-three/fiber'`
- **Zustand**: `import { createWithEqualityFn } from 'zustand/traditional'` + `import { subscribeWithSelector } from 'zustand/middleware'`
- **canvas-sketch-util**: `import { mapRange, lerp } from 'canvas-sketch-util/math'`; `import Random from 'canvas-sketch-util/random'`
- **Local imports**: Relative paths with `./` prefix (e.g., `import { useMusicStore } from './useMusicStore'`)
- **GLSL shader imports**: Vite-plugin-glsl handles `.vert`, `.frag`, `.glsl` files as string imports (e.g., `import vertexShader from './shaders/silky.vert'`)

Import order (approximate):
1. Node built-ins (`three`)
2. React core
3. React hooks
4. Framework/library imports (R3F, Drei, Three.js examples, Zustand, canvas-sketch-util)
5. Local imports

### Formatting
- **Prettier** is configured (`.prettierrc`):
  - `singleQuote: true`
  - `bracketSpacing: true`
  - `jsxBracketSameLine: true`
- No ESLint config exists. Run `npm run type-check` before committing.
- **No comments in code** (existing codebase does not use inline comments; doc comments only where critical for understanding — e.g., attractor.ts)
- Prefer early returns over deeply nested conditionals.
- Prefer `const` over `let`; never use `var`.

### React / R3F Patterns
- Use `forwardRef` for components that need to expose a ref to the parent (see `Audio` in `Music.tsx`).
- Use `useMemo` for expensive computations that don't need to re-run on every render (e.g., particle arrays, attractor initialization).
- Use `useRef` for values that persist across renders without causing re-renders.
- Use `useFrame` (from R3F) for per-frame updates in 3D components. Use the callback signature `useFrame((state) => { ... })`.
- Use `useEffect` with cleanup functions for subscription management. When subscribing to Zustand stores, use `useMusicStore.subscribe(...)` with a selector and callback (not derived state in render).
- Zustand store subscriptions should use `shallow` comparison when selecting multiple fields (e.g., `useMusicStore(selector, shallow)`).
- R3F components registered with `extend()` must be declared in `global.JSX.IntrinsicElements` using `declare global { namespace JSX { ... } }` (see `SilkyMaterial.tsx`).
- `extend()` calls are placed in `App.tsx` before the component tree renders.
- Use `<Suspense fallback={null}>` wrapping audio loading components.
- Prefer `attach="geometry"` / `attach="material"` over the `args` prop for Three.js children of meshes.

### Error Handling
- No formal error boundaries in the codebase, but `useEffect` cleanups should always disconnect/unsubscribe to avoid memory leaks.
- For audio loading errors, use the `onError` callback in `useLoader`.
- Use `console.error` for truly exceptional conditions (e.g., incorrect BufferArray instantiation in MeshLine).

### CSS
- CSS is in `src/styles.css` (plain CSS, no preprocessors or CSS-in-JS).
- Use `box-sizing: border-box` globally. No Tailwind or CSS modules.
- Color values are hex strings (e.g., `#de77c7`).

### GLSL / Shaders
- Shader files go in `src/shaders/` with extensions `.vert` (vertex) and `.frag` (fragment).
- Import them as default imports: `import vertexShader from './shaders/silky.vert'`.
- Use `#pragma` includes for shared GLSL code (e.g., `#pragma glslify: ...` from `glsl-noise`, which is aliased to `node_modules/glsl-noise` in `vite.config.ts`).
- Shader uniforms use `u_` prefix (e.g., `u_time`, `u_music`, `u_distort`).
- Custom post-processing passes (e.g., `Glitchpass.ts`, `Waterpass.ts`) should extend the Three.js `Pass` class.

### Project Architecture

**Solar Storm** is an audio-reactive 3D scene built with React Three Fiber. The scene visualizes a song split into four stems.

#### Data Flow
`Music.tsx` loads and plays four audio stems using Three.js `AudioLoader` + `AudioAnalyser`. Each frame reads frequency data and writes it into the Zustand store (`useMusicStore.ts`). The store derives boolean flags and numeric factors based on song progress (0–1). Components subscribe to individual slices to avoid unnecessary re-renders.

#### Key Components
- **`App.tsx`** — Root. Extends MeshLine into R3F namespace. Renders Canvas + overlay UI.
- **`Scene.tsx`** — Root 3D scene. Uses `CameraShake` and `OrbitControls`. Passes store flags as props.
- **`Planet.tsx`** — Central planet mesh using `SilkyMaterial` (custom GLSL shader). Distortion updated per-frame.
- **`Sparks.tsx`** / **`SparkStorm.tsx`** — Animated MeshLine trails. Width pulses with drum frequency.
- **`SpaceDust.tsx`** — Particle system (10k instanced points) reacting to mouse and music.
- **`SpaceShip.tsx`** — GLTF model appearing after user clicks Play. Follows a Lorenz attractor path.
- **`Music.tsx`** — Audio loading and frequency analysis. Exports `AudioLayer` and `Music`.
- **`Effects.tsx`** — Post-processing: `UnrealBloomPass`, `FilmPass`, `GlitchPass`.
- **`useMusicStore.ts`** — Single Zustand store. All reactive state derived from audio data and song progress.

#### Subsystems
- **`MeshLine/`** — Custom Three.js geometry/material for thick lines. Must be registered with `extend(meshline)` before use as `<meshLine>` / `<meshLineMaterial>` JSX elements.
- **`attractor.ts`** — Chaotic attractor simulations (Dadras, Aizawa, Lorenz, etc.). `createAttractor` initializes positions; `updateAttractor` advances per-frame.
- **`SilkyMaterial.tsx`** — Custom `ShaderMaterial` subclass. Extends into R3F as `<silkyMaterial>`. Uniforms: `u_time`, `u_music`, `u_distort`, color values, resolution, scale, radius.
- **`post/Glitchpass.ts`** / **`post/Waterpass.ts`** — Custom Three.js post-processing passes extending the `Pass` class.

#### Shader Imports
GLSL files are imported as strings by `vite-plugin-glsl`. The `glsl-noise` package is aliased so it can be `#pragma`-included from shaders. Shader file extensions: `.glsl`, `.wgsl`, `.vert`, `.frag`, `.vs`, `.fs`.

#### Path Aliases
`@/*` maps to `src/*` (configured in both `tsconfig.json` and `vite.config.ts`). Prefer relative imports within `src/` for simplicity.
