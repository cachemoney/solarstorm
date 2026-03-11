# Codebase Structure

**Analysis Date:** 2026-03-10

## Directory Layout

```
solarstorm/
├── public/                         # Static assets served as-is
│   └── quitters-raga/              # Audio files for three tracks (bass, drums, melody, vocals)
├── src/                            # TypeScript/TSX source code
│   ├── shaders/                    # GLSL shader files
│   │   ├── common/                 # Shared GLSL utilities
│   │   ├── silky.frag              # Planet material fragment shader
│   │   └── silky.vert              # Planet material vertex shader
│   ├── post/                       # Post-processing effect implementations
│   │   ├── Glitchpass.ts           # Digital glitch effect shader pass
│   │   └── Waterpass.ts            # Water distortion effect shader pass
│   ├── MeshLine/                   # Custom line geometry library
│   │   ├── index.ts                # Module exports
│   │   ├── meshline.ts             # Geometry implementation
│   │   ├── material.ts             # MeshLineMaterial shader material
│   │   ├── raycast.ts              # Raycasting support
│   │   └── utils.ts                # Helper functions
│   ├── App.tsx                     # Root component with Canvas and UI
│   ├── Scene.tsx                   # 3D scene composition
│   ├── Effects.tsx                 # Post-processing effects pipeline
│   ├── Music.tsx                   # Audio loading and analysis
│   ├── Planet.tsx                  # Planet mesh with shader material
│   ├── SpaceDust.tsx               # Particle system background
│   ├── Sparks.tsx                  # Animated line sparkles
│   ├── SparkStorm.tsx              # Animated lines with attractor simulation
│   ├── SpaceShip.tsx               # Spaceship model with trajectory
│   ├── SilkyMaterial.tsx           # Custom shader material for Planet
│   ├── useMusicStore.ts            # Zustand state management store
│   ├── attractor.ts                # Strange attractor simulation functions
│   ├── index.tsx                   # React DOM root render
│   ├── styles.css                  # Global styles
│   └── vite-env.d.ts               # Vite environment type definitions
├── index.html                      # HTML entry point
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript compiler configuration
├── tsconfig.node.json              # TypeScript config for build tools
├── vite.config.ts                  # Vite build configuration
└── sandbox.config.json             # CodeSandbox configuration
```

## Directory Purposes

**public/quitters-raga/:**
- Purpose: Audio tracks for the music-reactive visualization
- Contains: MP3 files for bass, drums, melody, vocals frequencies and full song
- Key files: `bass.mp3`, `drums.mp3`, `melody.mp3`, `vocals.mp3`, `quitters-raga.mp3`

**src/:**
- Purpose: All application source code
- Contains: React components, shaders, utilities, state management
- Key files: `App.tsx` (root), `useMusicStore.ts` (state), `Scene.tsx` (3D scene)

**src/shaders/:**
- Purpose: GLSL shader implementations
- Contains: Vertex and fragment shaders for custom materials and effects
- Key files: `silky.vert` and `silky.frag` for Planet material, `common/` for reusable utilities

**src/post/:**
- Purpose: Custom post-processing effects
- Contains: Shader-based visual effects applied after scene render
- Key files: `Glitchpass.ts` (digital glitch), `Waterpass.ts` (water distortion)

**src/MeshLine/:**
- Purpose: Custom line rendering library (not from npm)
- Contains: Geometry, material, and utilities for thick lines with dash patterns
- Key files: `meshline.ts` (core geometry), `material.ts` (shader material)

## Key File Locations

**Entry Points:**
- `index.html`: Browser entry, loads `/src/index.tsx` as module script
- `src/index.tsx`: React root creation, renders App component to #root DOM node
- `src/App.tsx`: Root component wrapping Canvas with overlays and mouse tracking

**Configuration:**
- `vite.config.ts`: Vite setup with React plugin and GLSL shader loader
- `tsconfig.json`: TypeScript strict mode, path alias `@/*` → `src/*`
- `package.json`: Dependencies (React, Three.js, R3F, Zustand), build scripts

**Core Logic:**
- `src/useMusicStore.ts`: Zustand store with audio analysis state, progress calculations, effect triggers
- `src/Scene.tsx`: Scene composition with OrbitControls, CameraShake, visual component placement
- `src/Music.tsx`: Audio loading pipeline, frequency analysis, progress tracking

**3D Components:**
- `src/Planet.tsx`: Central icosahedron mesh with SilkyMaterial and music-driven distortion
- `src/SpaceDust.tsx`: InstancedMesh particle system (10k particles, mouse-reactive lighting)
- `src/Sparks.tsx`: 20 animated curves with drum-frequency width modulation
- `src/SparkStorm.tsx`: 500 animated curves with attractor simulations (renders only after music trigger)
- `src/SpaceShip.tsx`: GLTF model with Lorenz attractor trajectory and trailing mesh line

**Visual Effects:**
- `src/Effects.tsx`: Effect composer managing bloom, film grain, glitch, water passes
- `src/post/Glitchpass.ts`: Digital glitch distortion effect class
- `src/SilkyMaterial.tsx`: Custom ShaderMaterial for planet with time/music/distortion uniforms

**Utilities:**
- `src/attractor.ts`: Strange attractor implementations (6 types) for SpaceShip and SparkStorm
- `src/MeshLine/`: Custom line geometry supporting width, color, dash patterns, raycasting

## Naming Conventions

**Files:**
- React components: PascalCase (e.g., `Planet.tsx`, `SpaceDust.tsx`)
- Non-component TypeScript: camelCase (e.g., `useMusicStore.ts`, `attractor.ts`)
- Shaders: GLSL extension naming (`.vert`, `.frag`)
- Post-processing: Class name with "pass" suffix (e.g., `Glitchpass.ts`, `Waterpass.ts`)

**Directories:**
- Modules/feature areas: PascalCase for clarity (e.g., `MeshLine`, `SparkStorm`)
- Shared code: lowercase plural (e.g., `shaders`, `post`)
- Public assets: lowercase with hyphens (e.g., `quitters-raga`)

**TypeScript Types/Interfaces:**
- Props interfaces: `[ComponentName]Props` (e.g., `PlanetProps`, `SpaceDustProps`)
- State interfaces: Describe state shape (e.g., `MusicState` in useMusicStore)
- Function types: Describe signature (e.g., `Simulation` type in attractor.ts)

**Functions:**
- React components: PascalCase (e.g., `function Planet() {}`, `export function App() {}`)
- Hooks: camelCase with `use` prefix (e.g., `useFrame`, `useThree`, `useMusicStore`)
- Utility functions: camelCase (e.g., `createAttractor()`, `updateAttractor()`)
- Factory/simulation functions: camelCase (e.g., `lorenzAttractor()`, `glitchFactor()`)

## Where to Add New Code

**New Visual Component (e.g., new 3D object):**
- Primary code: Create new file in `src/`, e.g., `src/NewVisual.tsx`
- Props interface: Define as `[FileName]Props` interface at top of component file
- Integration: Import and render in `src/Scene.tsx` inside the main `<group>` element
- Audio reactivity: Import `useMusicStore` and subscribe to relevant audio data (bass, drums, melody, vocals)
- Example pattern from existing: `src/Planet.tsx` subscribes to `distortFactor`, uses `useFrame` for animation

**New Shader Effect:**
- Shader files: Create `.vert` and/or `.frag` in `src/shaders/`
- Material class: Create subclass of `ShaderMaterial` in `src/` (e.g., `NewMaterial.tsx`)
- Import shaders: Use top-level imports in material class, rely on vite-plugin-glsl for bundling
- Register with R3F: Call `extend({ NewMaterial })` and add JSX intrinsic element type declaration
- Usage: Use `<newMaterial />` in component meshes
- Example from existing: `src/SilkyMaterial.tsx` shows full pattern

**New Post-Processing Pass:**
- Pass class: Create new file in `src/post/` extending Three.js `Pass` class
- Shader definition: Define vertex/fragment shaders as string templates or imported GLSL
- Uniforms: Set up uniforms object with render method updates
- Integration: Add to Effects.tsx: import pass class, extend() it, add `<passName />` element to effectComposer
- Example from existing: `src/post/Glitchpass.ts` shows full implementation

**New Audio-Reactive State:**
- Store definition: Add field to `MusicState` interface in `src/useMusicStore.ts`
- Calculation: Add setter function in store definition if value computed from progress
- Update trigger: Call setter in appropriate place (Analyzer for real-time, setProgress for timeline-based)
- Component usage: Import store and subscribe using `useMusicStore((state) => state.newField)`
- Example from existing: `glitchFactor` and `distortFactor` computed from progress in setProgress

**Attractor-Based Animation:**
- Function: Add new function in `src/attractor.ts` following `Simulation` type signature
- Registration: Add to `simulationFunc()` random picker in `src/SparkStorm.tsx` if used for storm
- Component: Use in component with `useFrame`, `createAttractor()`, and `updateAttractor()` calls
- Example from existing: `lorenzMod2Attractor` is signature to follow

**Utility/Helper Functions:**
- Location: New file in `src/` with camelCase name if single-use module, or add to existing file
- Module pattern: Use named exports, avoid default exports
- Example from existing: `src/attractor.ts` exports multiple simulation functions

**Global Styles:**
- Location: `src/styles.css` for global CSS, component-local CSS in same file with imports
- Already present: `.overlay`, `.loader`, `.attribution` classes in App.tsx
- New styles: Add to `src/styles.css` and import in component file

## Special Directories

**dist/:**
- Purpose: Build output directory
- Generated: Yes (by `vite build`)
- Committed: No (in .gitignore)
- Contents: Bundled HTML, JS, CSS, and assets for production deployment

**.planning/codebase/:**
- Purpose: GSD mapping documents for development reference
- Generated: Yes (by `/gsd:map-codebase` command)
- Committed: Yes
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md files

**.agent/, .github/, openspec/:**
- Purpose: Agent configuration and spec management
- Generated: Yes (infrastructure files)
- Committed: Yes
- Contents: Workflow definitions, skill configurations, change specifications

**node_modules/:**
- Purpose: Installed npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in .gitignore)

**public/quitters-raga/:**
- Purpose: Audio assets for the visualization
- Generated: No (source audio files)
- Committed: Yes (binary MP3 files tracked in git)

---

*Structure analysis: 2026-03-10*
