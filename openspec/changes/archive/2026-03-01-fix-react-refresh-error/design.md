## Context

The recent migration to Vite 5 and React 18 introduced a syntax error in the browser: `Uncaught SyntaxError: The requested module '/@react-refresh' does not provide an export named 'injectIntoGlobalHook'`. This error usually happens when the React Fast Refresh runtime is not properly initialized before the application script runs.

## Goals / Non-Goals

**Goals:**
- **Runtime Stability**: Eliminate the `@react-refresh` syntax error in development mode.
- **HMR Functionality**: Ensure React components correctly hot-reload during development.

**Non-Goals:**
- **Production Changes**: This fix should not impact the production build or external assets.
- **Library Versioning**: No need to downgrade libraries unless absolutely necessary.

## Decisions

### 1. Manual React Refresh Preamble (if needed)
- **Decision**: Check if `@vitejs/plugin-react` is correctly injecting the preamble. If not, add it manually in `index.html` during development.
- **Rationale**: Vite's React plugin requires a small piece of code to run before any other scripts to bridge React DevTools and Fast Refresh.

### 2. Dependency Verification
- **Decision**: Ensure `@vitejs/plugin-react` and `vite` versions are compatible.
- **Rationale**: Mismatched major versions can cause HMR script injection errors.

## Risks / Trade-offs

- **[Risk] Conflict with Other Scripts** → **Mitigation**: Place the React Refresh preamble at the very top of the `<head>` or before the first module script.
- **[Risk] No Impact on Production** → **Mitigation**: Vite automatically handles the removal of the preamble in production builds.
