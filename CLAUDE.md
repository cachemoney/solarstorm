# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Type-check with tsc, then build via Vite
npm run preview      # Preview production build locally
npm run type-check   # Run TypeScript type-checking only (no emit)
```

There is no test suite in this project.

## Architecture

**Solar Storm** is an audio-reactive 3D scene built with React Three Fiber. The scene visualizes a song ("Quitters Raga" by Gold Panda) that is split into four stems (bass, drums, melody, vocals) served from `/public/quitters-raga/`.

### Data flow

`Music.tsx` loads and plays the four audio stems using Three.js `AudioLoader` + `AudioAnalyser`. On each animation frame, it reads average frequency values per stem and writes them into the Zustand store (`useMusicStore.ts`). It also tracks overall song progress (0–1) via the melody stem.

`useMusicStore.ts` is the single source of truth for all audio-reactive state. Based on song progress thresholds, it derives boolean flags (`sparkStorm`, `planetDistortion`, `spaceshipDistortion`, `beep`, `planetDistortionMax`) and numeric factors (`glitchFactor`, `distortFactor`, `scale`) that drive scene behavior. Components subscribe to individual slices to avoid unnecessary re-renders.

### Scene components

- **`Scene.tsx`** — Root 3D scene. Reads store flags and passes them as props to child components. Uses `CameraShake` (intensity driven by `sparkStorm`) and `OrbitControls`.
- **`Planet.tsx`** — Central planet mesh using `SilkyMaterial`, a custom GLSL shader. Distortion uniforms are updated each frame from `planetDistortion`/`planetDistortionMax`.
- **`Sparks.tsx`** / **`SparkStorm.tsx`** — Animated MeshLine trails following chaotic attractor paths. Line width pulses with drum frequency.
- **`SpaceDust.tsx`** — Particle system (10k points) that reacts to mouse and music.
- **`SpaceShip.tsx`** — Appears only after the user clicks Play (`init === true`).
- **`Effects.tsx`** — Post-processing pipeline: `UnrealBloomPass` (bloom strength driven by bass), `FilmPass` (grain), `GlitchPass` (triggered mid-song), `WaterPass` (distortion during the climax).

### Key subsystems

**MeshLine** (`src/MeshLine/`) — Custom Three.js geometry/material for thick lines. Must be registered with R3F via `extend(meshline)` in `App.tsx` before use as JSX elements (`<meshLine>`, `<meshLineMaterial>`).

**Attractor system** (`attractor.ts`) — Provides chaotic attractor simulations (Dadras, Aizawa, Lorenz, etc.) used to generate the curved spark paths. `createAttractor` initializes positions on a sphere; `updateAttractor` advances the simulation each frame.

**SilkyMaterial** (`SilkyMaterial.tsx` + `src/shaders/silky.{vert,frag}`) — Custom `ShaderMaterial` subclass extended into R3F's JSX namespace as `<silkyMaterial>`. Uniforms include `u_time`, `u_music`, `u_distort`, and color values. GLSL files are imported directly via `vite-plugin-glsl`.

### Shader imports

GLSL files (`.glsl`, `.vert`, `.frag`) are imported as strings by `vite-plugin-glsl`. The `glsl-noise` package is aliased in `vite.config.ts` so it can be `#pragma`-included from GLSL shaders.
