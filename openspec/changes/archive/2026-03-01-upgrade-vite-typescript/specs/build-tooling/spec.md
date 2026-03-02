## ADDED Requirements

### Requirement: Vite Development Server
The system SHALL use Vite to serve the application during development, providing fast HMR and optimized dependency pre-bundling.

#### Scenario: Instant HMR
- **WHEN** a source file is modified and saved
- **THEN** the browser reflects the change immediately without a full page reload

### Requirement: Optimized Production Build
The system SHALL generate a minified and optimized production build using Vite (Rollup), ensuring efficient asset loading and code splitting.

#### Scenario: Successful Production Build
- **WHEN** the `npm run build` command is executed
- **THEN** an optimized `dist/` directory is created containing the production assets
