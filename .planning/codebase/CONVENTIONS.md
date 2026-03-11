# Coding Conventions

**Analysis Date:** 2026-03-10

## Naming Patterns

**Files:**
- Components: PascalCase with .tsx extension (`App.tsx`, `Planet.tsx`, `SpaceShip.tsx`)
- Utilities/Stores: camelCase with .ts extension (`useMusicStore.ts`, `attractor.ts`)
- Post-processing: PascalCase with .ts extension (`Glitchpass.ts`, `Waterpass.ts`)
- Directories: camelCase when containing related utilities (`post/`, `MeshLine/`)

**Functions:**
- React components: PascalCase (`App`, `Scene`, `Effects`, `Music`)
- Hooks: camelCase with `use` prefix (`useMusicStore`, `useFrame`, `useThree`, `useRef`)
- Regular functions: camelCase (`createAttractor`, `updateAttractor`, `mapRange`, `lerp`)
- Attractor functions: camelCase with "Attractor" suffix (`dadrasAttractor`, `lorenzAttractor`, `lorenzMod2Attractor`)
- Helper functions within components: camelCase (`radiusVariance`, `attachPass`, `generateHeightmap`)

**Variables:**
- State/props: camelCase (`init`, `didLoad`, `bassValue`, `sparkStorm`, `planetDistortion`)
- Constants (in-component): camelCase (`RADIUS`, `urls`, `colors`)
- Refs: camelCase with descriptive names (`mesh`, `composer`, `planet`, `light`, `group`)
- Temporary/loop variables: Short camelCase acceptable (`i`, `j`, `t`, `p`, `x`, `y`, `z`)
- Math/Physics constants: UPPERCASE or camelCase (`beta`, `rho`, `sigma`, `a`, `b`, `c` for mathematical coefficients)

**Types:**
- Interfaces: PascalCase with props suffix (`PlanetProps`, `SceneProps`, `SparksProps`, `AudioProps`, `AnalyzerProps`)
- Type aliases: PascalCase (`TrackType`, `Simulation`, `Particle`, `FatLineProps`, `FatlineProps`)
- Discriminated unions: PascalCase with context (`TrackType` = `'bass' | 'drums' | 'melody' | 'vocals'`)

## Code Style

**Formatting:**
- Tool: Prettier (configured in `.prettierrc`)
- Single quotes for strings: `'true'`
- Bracket spacing: `{ width: 100 }` (spaces around braces)
- JSX bracket same line: `component />` (JSX closing bracket on same line as last prop)
- No semicolons: statements omit trailing semicolons
- Line length: No explicit limit configured, inferred ~80-100 characters based on examples

**Linting:**
- No explicit ESLint config found (.eslintrc* not present)
- TypeScript strict mode enabled in tsconfig.json
- Compiler options enforce:
  - `strict: true` - All strict type checking options enabled
  - `forceConsistentCasingInFileNames: true` - File names must match casing in imports
  - `noEmit: true` - Type checking only, no JavaScript output

**Indentation:**
- Two spaces per indentation level (inferred from Prettier defaults and code examples)
- Consistent spacing in JSX and TypeScript

## Import Organization

**Order:**
1. External library imports (`import * as THREE`, `import React`, `import { ... } from '@react-three/fiber'`)
2. Third-party utilities (`import Random from 'canvas-sketch-util/random'`, `import { mapRange } from 'canvas-sketch-util/math'`)
3. State management (`import { useMusicStore } from './useMusicStore'`)
4. Local component imports (`import { Effects } from './Effects'`, `import * as meshline from './MeshLine'`)
5. CSS imports (`import './styles.css'`)
6. Type imports may be mixed with value imports (no separate import type syntax used)

**Example from `App.tsx`:**
```typescript
import * as THREE from 'three';
import React, { Suspense, useCallback, useRef } from 'react';
import { Canvas, extend } from '@react-three/fiber';
import * as meshline from './MeshLine';
import { Effects } from './Effects';
import { Music } from './Music';
import { Scene } from './Scene';
import { useMusicStore } from './useMusicStore';
import './styles.css';
```

**Path Aliases:**
- Configured in tsconfig.json: `@/*` maps to `src/*`
- Not actively used in current codebase (relative imports preferred for local modules)

## Error Handling

**Patterns:**
- Defensive null checks in refs before operations: `if (mesh.current) { ... }`
- Optional chaining in property access: `sound.current?.play()`
- Type assertions for untyped Three.js internals: `const material = planet.current.material as any`
- Error logs to console for invalid input: `console.error('ERROR: The BufferArray of points is not instancied correctly.')`
- No try-catch blocks observed; relies on TypeScript type safety and null checks
- Fallback values in ternary operators: `quiet ? 0 : 0.5`
- Default parameters for optional values: `radius = 10`
- Guards with early returns not typically used; prefer if conditions around operations

**Example from `Music.tsx`:**
```typescript
if (!analyser.current && sound.current) {
  analyser.current = new AudioAnalyser(sound.current, 32);
}

if (analyser.current && init && sound.current) {
  // Safe to use
}
```

## Logging

**Framework:** `console` object directly

**Patterns:**
- Errors logged with `console.error()` for invalid states
- No info/warn/debug logging observed in codebase
- Logging only for critical failures, not for normal operation
- Zustand store mutations not explicitly logged

**Example from `MeshLine/meshline.ts`:**
```typescript
console.error('ERROR: The BufferArray of points is not instancied correctly.');
```

## Comments

**When to Comment:**
- JSDoc for exported functions and classes
- Inline comments for non-obvious algorithms or mathematical operations
- No extensive comments on simple operations

**JSDoc/TSDoc:**
- Used for exported functions: `/** Different attractor types */`
- Minimal usage; most complex logic relies on clear naming
- No @param, @returns tags observed
- Single-line JSDoc preferred

**Example from `attractor.ts`:**
```typescript
/**
 * Different attractor types
 */
export function dadrasAttractor([x, y, z]: [number, number, number], timestep: number): [number, number, number]
```

## Function Design

**Size:**
- Small focused functions preferred
- Most functions 5-50 lines
- Larger functions break into sub-components or utilities
- Example: `attractor.ts` contains 7 exported functions, each 10-20 lines

**Parameters:**
- Prefer destructured parameters for objects: `{ width, color, speed }`
- Tuple unpacking for coordinate arrays: `[x, y, z]`
- Optional parameters with defaults: `radius = 10`
- Type annotations required for all parameters (strict mode)

**Return Values:**
- Explicit return type annotations: `[number, number, number]`
- Tuples used for multi-value returns: `[positions, currentPosition]`
- Components return JSX, some utilities return refs/objects
- No implicit undefined returns; null checks handle uninitialized values

**Example from `attractor.ts`:**
```typescript
export function updateAttractor(
  currentPosition: THREE.Vector3,
  scale: number,
  simulation: Simulation,
  timeStep: number
): THREE.Vector3
```

## Module Design

**Exports:**
- Named exports preferred: `export function App() { ... }`
- Single component per file pattern (mostly adhered to)
- Utility modules export multiple functions: `attractor.ts` exports 7 functions
- Type exports at module level: `export type Simulation = ...`
- Default exports not used

**Barrel Files:**
- `MeshLine/index.ts` re-exports from submodules:
```typescript
export * from './meshline';
export * from './material';
export * from './raycast';
```
- Simplifies imports: `import * as meshline from './MeshLine'`

## Class Design

**Classes:**
- Extends Three.js base classes: `class MeshLine extends THREE.BufferGeometry`
- Extends Pass classes: `class GlitchPass extends Pass`
- Custom getter/setter properties via Object.defineProperties
- Type properties declared as class fields with initial values

**Example from `MeshLine/meshline.ts`:**
```typescript
export class MeshLine extends THREE.BufferGeometry {
  type: string = 'MeshLine';
  isMeshLine: boolean = true;
  positions: number[] = [];
  raycast: any = MeshLineRaycast;

  constructor() {
    super();
    Object.defineProperties(this, {
      points: {
        enumerable: true,
        get() { return this._points; },
        set(value) { this.setPoints(value, this.widthCallback); }
      }
    });
  }
}
```

## React Component Patterns

**Functional Components:**
- All components are functional components with hooks
- No class components
- Component names exported immediately: `export function ComponentName() { ... }`

**Hooks Usage:**
- Standard hooks: `useRef`, `useState`, `useEffect`, `useMemo`, `useCallback`
- Three.js/React-Three-Fiber hooks: `useFrame`, `useThree`, `useLoader`
- Store hooks: `useMusicStore` with selector pattern
- Effects dependency arrays explicitly managed

**Props Typing:**
- Props defined as interfaces: `interface SceneProps { init?: boolean; mouse: ... }`
- Optional props with `?` operator
- Component signature: `export function Scene({ init = false, mouse }: SceneProps)`
- Spread props to HTML elements: `{...props}` in wrapper components

**Example from `Scene.tsx`:**
```typescript
interface SceneProps {
  init?: boolean;
  mouse: React.MutableRefObject<[number, number]>;
}

export function Scene({ init = false, mouse }: SceneProps) {
  const { sparkStorm, ... } = useMusicStore(appStateSelector, shallow);
  // ...
}
```

## Zustand Store Patterns

**Store Creation:**
- Pattern: `createWithEqualityFn<Type>()(subscribeWithSelector(...))`
- State interface defined: `interface MusicState { ... }`
- Selectors used in components: `useMusicStore((state) => state.init)`
- Shallow equality for multiple properties: `useMusicStore(selector, shallow)`

**Store Structure:**
- State properties and setters in single interface
- Pure reducer pattern in setter functions
- Immutable state updates with spread operators

---

*Convention analysis: 2026-03-10*
