## Why

A browser console error `Uncaught SyntaxError: The requested module '/@react-refresh' does not provide an export named 'injectIntoGlobalHook'` is preventing the application from running correctly in development mode. This typically happens when Vite's React Fast Refresh script is injected but fails to find the expected exports, often due to a conflict between `@vitejs/plugin-react` and the version of React or the structure of `index.html`.

## What Changes

- Resolve the `@react-refresh` syntax error in the browser.
- Ensure `@vitejs/plugin-react` is correctly configured to inject the Fast Refresh preamble.
- Verify that the `index.html` script loading order is compatible with Vite's HMR requirements.

## Capabilities

### New Capabilities
- `hmr-stability`: A stable development environment with functional Hot Module Replacement (HMR) for React components.

### Modified Capabilities
<!-- No requirement changes to existing capabilities. -->

## Impact

- **Development Server**: Fixes the broken development runtime.
- **index.html**: May require a small script tag addition for the React Refresh preamble.
- **vite.config.ts**: Potential configuration adjustments for the React plugin.
