# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**None Detected**

This is a client-side only application with no backend API integration.

## Data Storage

**Databases:**
- Not applicable - no database integration

**File Storage:**
- Local filesystem only
  - Audio files: `/public/quitters-raga/` - Served as static assets
  - 3D Model: `/public/model.gltf` - Loaded via useGLTF hook from @react-three/drei

**Caching:**
- Browser cache - Standard HTTP caching for static assets
- No dedicated caching service

## Web Audio API

**Audio System:**
- Web Audio API via Three.js (`src/Music.tsx`)
  - AudioLoader - Loads MP3 files from `/public/quitters-raga/`
  - AudioListener - Captures audio context
  - AudioAnalyser - Analyzes frequency data (32 frequency bins)
  - Audio (Three.js Audio) - Playback control

**Audio Assets:**
- Bass track: `/quitters-raga/bass.mp3`
- Drums track: `/quitters-raga/drums.mp3`
- Melody track: `/quitters-raga/melody.mp3`
- Vocals track: `/quitters-raga/vocals.mp3`
- Full song: `/quitters-raga/quitters-raga.mp3`

## 3D Assets & Models

**Model Loading:**
- useGLTF hook from @react-three/drei
- Model location: `/public/model.gltf`
- Used in: `src/SpaceShip.tsx`

## CDN Dependencies

**Google Fonts:**
- Josefin Sans (400, 700 weight) loaded from Google Fonts CDN
  - Used for UI typography throughout the application

## WebGL & Graphics

**WebGL Context:**
- Three.js native WebGL renderer
- Shader compilation from GLSL files:
  - `src/shaders/silky.vert` - Silky material vertex shader
  - `src/shaders/silky.frag` - Silky material fragment shader
  - `src/shaders/common/noise3d.glsl` - 3D noise functions
  - `src/shaders/common/noise4d.glsl` - 4D noise functions

**Shader Libraries:**
- glsl-noise - Perlin/Simplex noise functions
- glsl-blend-soft-light - Soft light blending
- glsl-film-grain - Film grain effects

## Authentication & Identity

**Auth Provider:**
- Not applicable - public, authentication-free application

## Monitoring & Observability

**Error Tracking:**
- Not detected

**Logs:**
- Browser console only
- No remote logging

## CI/CD & Deployment

**Hosting:**
- Netlify - solarstorm.netlify.app

**CI Pipeline:**
- Not detected in codebase
- Likely configured via Netlify dashboard or netlify.toml (not present in repo)

## Environment Configuration

**No Environment Variables Required**

All configuration is static in source code:
- Audio file paths hardcoded in `src/Music.tsx` (lines 6-12)
- API endpoints: None
- Secrets: None

**Audio Playback Configuration:**
- Volume: 0.5 for tracks, 0 for muted tracks (`src/Music.tsx` line 105)
- Frequency bins: 32 (`src/Music.tsx` line 30)
- Loop: Disabled for all tracks (`src/Music.tsx` line 78)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Browser APIs Used

**Required Capabilities:**
- WebGL 2.0 - 3D rendering
- Web Audio API - Audio playback and frequency analysis
- WebGL extensions:
  - EXT_texture_filter_anisotropic - Texture filtering
  - Standard VAO, FBO, Instancing support

**Device Capabilities:**
- Minimum canvas size: 600px width check in `src/App.tsx` (line 33)
- Camera adjusts for smaller screens (mobile optimization)

## External Links & Metadata

**Social/Attribution:**
- YouTube: https://www.youtube.com/watch?v=EeLlAg6GGLc - Music credit
- GitHub: https://github.com/winkerVSbecks/solarstorm - Source repository
- Personal Site: https://varun.ca/ - Creator attribution

---

*Integration audit: 2026-03-10*
