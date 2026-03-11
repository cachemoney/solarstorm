# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** React Three Fiber (R3F) application with audio-reactive three.js visualization, component-based React architecture with centralized state management via Zustand.

**Key Characteristics:**
- Audio-driven state management where music analysis drives visual effects
- Real-time 3D scene rendering with post-processing effects
- Modular component design with clear separation between visual elements
- Timeline-based music synchronization using progress tracking
- Declarative scene graph using React Three Fiber

## Layers

**UI/React Layer:**
- Purpose: Root React application and UI overlays
- Location: `src/index.tsx`, `src/App.tsx`
- Contains: React DOM root setup, canvas container, loading overlay, attribution links
- Depends on: React, React DOM, Three.js via R3F
- Used by: Browser DOM

**State Management Layer:**
- Purpose: Centralized audio and visualization state using Zustand
- Location: `src/useMusicStore.ts`
- Contains: Zustand store for audio data (bass, drums, melody, vocals), progress tracking, visual effect triggers
- Depends on: Zustand, canvas-sketch-util (mapRange), Three.js math utilities
- Used by: All components that need audio data or synchronized effects

**Three.js Scene Layer:**
- Purpose: 3D scene composition and camera setup
- Location: `src/Scene.tsx`, `src/App.tsx` (Canvas wrapper)
- Contains: OrbitControls, CameraShake, point light, grouped visual elements
- Depends on: @react-three/drei (controls), useMusicStore for scale/distortion values
- Used by: Post-processing effects, all visual components

**Visual Components Layer:**
- Purpose: Individual 3D objects and visual effects
- Location: `src/Planet.tsx`, `src/SpaceDust.tsx`, `src/Sparks.tsx`, `src/SparkStorm.tsx`, `src/SpaceShip.tsx`
- Contains: Mesh components, geometries, materials, particle systems
- Depends on: Three.js, R3F hooks, useMusicStore for audio-reactive values
- Used by: Scene component

**Audio Layer:**
- Purpose: Audio loading, playback, and frequency analysis
- Location: `src/Music.tsx`, `src/Music.tsx` (AudioLayer and Analyzer subcomponents)
- Contains: Three.js Audio objects, AudioListener, AudioAnalyser, track loading via useLoader
- Depends on: Three.js audio APIs, useMusicStore for state updates
- Used by: Scene updates

**Post-Processing Layer:**
- Purpose: Screen-space effects and final render composition
- Location: `src/Effects.tsx`, `src/post/Glitchpass.ts`, `src/post/Waterpass.ts`
- Contains: EffectComposer, shader passes (bloom, film grain, glitch, water distortion)
- Depends on: Three.js postprocessing, custom shader implementations
- Used by: Final render pipeline

**Utility/Algorithm Layer:**
- Purpose: Mathematical simulations and helpers
- Location: `src/attractor.ts`, `src/MeshLine/`
- Contains: Strange attractor simulations (Lorenz, Dadras, Aizawa, etc.), custom MeshLine geometry implementation
- Depends on: Three.js core, canvas-sketch-util for random and math utilities
- Used by: SpaceShip, SparkStorm, Sparks components

**Material Layer:**
- Purpose: Custom shaders and materials
- Location: `src/SilkyMaterial.tsx`, `src/shaders/`
- Contains: ShaderMaterial subclass with custom vertex/fragment shaders, GLSL shader files
- Depends on: Three.js ShaderMaterial, glslify for shader imports
- Used by: Planet component

## Data Flow

**Audio Playback to Visual Update:**

1. User clicks "Play" button → `setInit(true)` in useMusicStore
2. Music component renders, loads four audio tracks via Three.js AudioLoader
3. Audio component instances receive buffers and start playback
4. Analyzer component runs in useFrame hook, calls AudioAnalyser.getAverageFrequency()
5. setAudioData updates store with normalized frequency data (bass, drums, melody, vocals)
6. setProgress updates store with song progress (only for melody track)
7. Components subscribe to store changes and update uniforms/properties
8. Scene re-renders with updated values each frame

**Music Synchronization Flow:**

1. Progress value (0-1) calculated from audio.context.currentTime in Analyzer
2. Progress triggers conditional state updates in store:
   - sparkStorm flag enabled between 0.21-0.95
   - planetDistortion flag enabled between 0.27-0.95
   - glitchFactor set to 1 or 0.5 at specific ranges
   - distortFactor set to 0.4-0.8 at specific ranges
   - scale adjusted from 1 to 1.5 between 0.52-0.60
3. Components read these flags and adjust visual parameters accordingly
4. Effects and materials respond to both real-time audio and timeline triggers

**State Management:**

- Zustand store with `createWithEqualityFn` and `subscribeWithSelector` for performance
- Selective subscriptions in useEffect hooks (e.g., Effects.tsx subscribes only to `bass` value)
- Store values updated at 60fps via useFrame hooks in Analyzer
- Components use shallow comparison to prevent unnecessary re-renders

## Key Abstractions

**AudioLayer Component:**
- Purpose: Wrapper for audio playback and analysis of a single track
- Examples: `src/Music.tsx` (used 4 times for bass, drums, melody, vocals)
- Pattern: Compound component with Audio (forwardRef) and Analyzer sub-components

**FatLine Component:**
- Purpose: Visual representation of curves using MeshLine with width and color parameters
- Examples: Used in `src/Sparks.tsx` and `src/SparkStorm.tsx`
- Pattern: Generic curve renderer responding to audio frequency (drums) in Sparks, responding to attractor simulation in SparkStorm

**Particle System Pattern:**
- Purpose: Efficient rendering of many objects using InstancedMesh
- Examples: `src/SpaceDust.tsx` (10,000 dodecahedrons with per-instance transforms)
- Pattern: Precalculated particles array updated per-frame using dummy Object3D for matrix transformations

**Attractor Simulation:**
- Purpose: Generate smooth 3D trajectories following strange attractor equations
- Examples: `src/attractor.ts` contains 6 different attractor types
- Pattern: `Simulation` type accepts point and timestep, returns delta position; used by SpaceShip and SparkStorm

**Shader Material:**
- Purpose: Encapsulate custom GLSL shaders as reusable Three.js materials
- Examples: `src/SilkyMaterial.tsx` (Planet material), custom passes in Effects
- Pattern: Extend R3F with custom ShaderMaterial subclass, declare JSX intrinsic elements for ergonomics

**MeshLine Abstraction:**
- Purpose: Line geometry with width and dash properties
- Examples: `src/MeshLine/` module exports geometry and material
- Pattern: Custom geometry type extending BufferGeometry, extended into R3F via `extend()`

## Entry Points

**Browser Entry:**
- Location: `index.html` → `src/index.tsx`
- Triggers: Page load
- Responsibilities: DOM root creation, React app render

**App Component:**
- Location: `src/App.tsx` (App function)
- Triggers: React root render
- Responsibilities: Canvas setup, mouse tracking, loading overlay, attribution UI, initial state checks

**Scene Component:**
- Location: `src/Scene.tsx` (Scene function)
- Triggers: Mounted inside Canvas
- Responsibilities: Scene graph composition, camera controls, visual element placement, state-driven scaling

**Effects Post-Processing:**
- Location: `src/Effects.tsx` (Effects function)
- Triggers: Mounted inside Canvas, renders at priority 1 (after scene)
- Responsibilities: Effect composer setup, bloom/film/glitch pass management, bass-driven bloom strength

## Error Handling

**Strategy:** Minimal explicit error handling; relies on React suspense and graceful degradation.

**Patterns:**
- `<Suspense fallback={null}>` wraps Music component to handle async audio loading without blocking render
- useLoader in Music.tsx handles xhr progress events; errors silently fail (no error callback)
- Audio playback assumes successful buffer setup after load verification via didLoad flags
- Shader compilation errors fall back to Three.js defaults; not explicitly handled
- Canvas context loss handled by Three.js internally

## Cross-Cutting Concerns

**Logging:** None - no explicit logging framework used. Audio loading state tracked via `didLoad` flags in store.

**Validation:** Minimal validation; relies on TypeScript strict mode and Three.js runtime checks:
- Audio track types checked at compile time via union type 'bass' | 'drums' | 'melody' | 'vocals'
- Scene props validated by React and Three.js type systems
- Uniforms assumed to be set correctly; no runtime validation

**Authentication:** Not applicable - single-user visualization application.

**Performance Optimizations:**
- Zustand shallow comparison prevents re-renders on non-changed object references
- Selective subscriptions via `subscribeWithSelector` reduce store update frequency
- InstancedMesh for SpaceDust (10k particles) instead of individual meshes
- useFrame priority rendering (Effects at priority 1) to control update order
- Memoization of expensive computations (line curves in Sparks, particle arrays in SpaceDust)

---

*Architecture analysis: 2026-03-10*
