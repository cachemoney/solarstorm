## 1. Diagnosis and Fix

- [x] 1.1 Verify `@vitejs/plugin-react` and `vite` versions for compatibility in `package.json`.
- [x] 1.2 Inspect the injected `index.html` during a dev session to see where `@react-refresh` is being requested.
- [x] 1.3 Update Vite and React plugin to latest stable versions to fix HMR injection.
- [x] 1.4 Update Zustand to use `createWithEqualityFn` to resolve deprecation warnings.
- [x] 1.5 Restart the dev server and verify the error is gone from the browser console.
- [x] 1.6 Fix Shader Errors: Replace glslify pragmas and configure vite-plugin-glsl to resolve noise functions.

## 2. Verification

- [ ] 2.1 Confirm the application renders without console errors.
- [ ] 2.2 Verify that modifying a component (e.g., `App.tsx`) triggers HMR and updates the browser.
