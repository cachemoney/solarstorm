## Why

Upgrading the project to Vite and TypeScript will significantly improve developer experience (DX) by providing near-instant hot module replacement (HMR), faster build times, and enhanced type safety. Moving away from `react-scripts` (Create React App) reduces maintenance overhead as CRA is no longer the recommended standard for React development.

## What Changes

- **BREAKING**: Replace `react-scripts` with Vite as the build tool.
- **BREAKING**: Relocate `public/index.html` to the root directory for Vite compatibility.
- Upgrade React to 18+ and Three.js dependencies to latest compatible versions.
- Convert core source files from `.js` to `.tsx` / `.ts`.
- Configure `tsconfig.json` for modern TypeScript features.
- Update `package.json` scripts (`start`, `build`, `test`) to use Vite commands.

## Capabilities

### New Capabilities
- `build-tooling`: Modern build environment using Vite with HMR and optimized production bundling.
- `typescript-system`: Project-wide TypeScript configuration and integration for improved code quality and maintainability.

### Modified Capabilities
<!-- No existing spec-level behavior is changing. -->

## Impact

- **Dependencies**: Major upgrades for React, Three.js, and @react-three ecosystem.
- **Build Scripts**: Transition from `react-scripts` to `vite`.
- **File Structure**: Root-level `index.html` and `.tsx` file extensions.
- **Type Safety**: Introduction of project-wide types and strict mode checking.
