## Context

The `solarstorm` project currently uses `react-scripts` (Create React App) with React 17. Build times are relatively slow, and development server startup is not optimized. TypeScript is present in `devDependencies` but not deeply integrated or strictly enforced across the codebase. The project relies on `@react-three/fiber` and `@react-three/drei`, which have newer versions available with significant performance and feature improvements.

## Goals / Non-Goals

**Goals:**
- **Modern Build System**: Transition from `react-scripts` to Vite for significantly faster development and build cycles.
- **Type Safety**: Implement project-wide TypeScript with strict checking to catch errors early.
- **Library Modernization**: Upgrade React and the Three.js ecosystem to latest stable versions.
- **Improved DX**: Enable faster HMR and modern IDE support for Three.js types.

**Non-Goals:**
- **Visual Overhaul**: No changes to the visual style or shaders, except where necessary for compatibility.
- **New Features**: No additions of new gameplay or visualization features during this upgrade.
- **Backend Changes**: No changes to external assets or backend integration.

## Decisions

### 1. Build Tool: Vite
- **Choice**: Use Vite instead of Webpack or keeping CRA.
- **Rationale**: Vite's ES modules approach provides near-instant HMR and faster cold starts compared to Webpack. It is the current industry standard for React projects.
- **Alternative**: CRA-to-Webpack-5 migration was considered but discarded due to the maintenance burden and slower performance.

### 2. TypeScript Integration
- **Choice**: Rename all `.js` files to `.tsx` (for components) and `.ts` (for utilities).
- **Rationale**: Provides end-to-end type safety. Ensures that props passed to R3F components are validated correctly.
- **Alternative**: Maintaining a mix of JS/TS was considered but rejected to avoid complexity and "any" typing.

### 3. Dependencies: Latest Stable
- **Choice**: Upgrade to React 18+, Three.js 0.160+, and latest @react-three packages.
- **Rationale**: Access to Concurrent React features, improved R3F hooks, and better Three.js performance.

## Risks / Trade-offs

- **[Risk] Breaking Changes in Three.js** → **Mitigation**: Carefully review the migration guides for Three.js (r131 to r160+) and R3F. Test core scene elements (`Planet`, `SpaceShip`) individually.
- **[Risk] Shader Compatibility (glslify)** → **Mitigation**: Use `vite-plugin-glsl` to handle shader imports and ensure compatibility with existing `.js` shader definitions.
- **[Risk] Build Errors after TS conversion** → **Mitigation**: Fix types incrementally, starting with utilities and moving to complex React components.
