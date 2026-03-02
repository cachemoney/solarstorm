## 1. Dependency and Environment Setup

- [ ] 1.1 Update `package.json` with latest versions of Vite, React, Three.js, and @react-three ecosystem.
- [ ] 1.2 Remove `react-scripts` and its associated configuration.
- [ ] 1.3 Create a root-level `vite.config.ts` for build and HMR configuration.
- [ ] 1.4 Configure `tsconfig.json` for strict type checking and modern ECMAScript features.
- [ ] 1.5 Relocate `public/index.html` to the project root and update it for Vite compatibility.

## 2. Source Conversion and Type Safety

- [ ] 2.1 Convert all utility files (`attractor.js`, `useMusicStore.js`, etc.) to `.ts` and resolve type errors.
- [ ] 2.2 Rename React components (`App.js`, `Planet.js`, `Scene.js`, etc.) to `.tsx` and fix props/state typing.
- [ ] 2.3 Transition `src/MeshLine/` files to TypeScript and ensure full compatibility.
- [ ] 2.4 Implement `vite-plugin-glsl` for shader file processing and update relevant imports.

## 3. Verification and Finalization

- [ ] 3.1 Confirm successful development server startup and verify HMR functionality.
- [ ] 3.2 Execute an optimized production build and validate the output in `dist/`.
- [ ] 3.3 Ensure a clean `npm run type-check` pass across the entire codebase.
- [ ] 3.4 Perform a visual regression check of the solar storm visualization in the browser.
