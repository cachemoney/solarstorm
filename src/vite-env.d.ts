/// <reference types="vite/client" />

declare module '*.glsl' {
  const value: string;
  export default value;
}

declare module '*.vert' {
  const value: string;
  export default value;
}

declare module '*.frag' {
  const value: string;
  export default value;
}

declare module 'canvas-sketch-util/random' {
  const Random: any;
  export default Random;
}

declare module 'canvas-sketch-util/math' {
  export const mapRange: (
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
    clamp?: boolean
  ) => number;
  export const lerp: (v0: number, v1: number, t: number) => number;
}

declare namespace JSX {
  interface IntrinsicElements {
    meshLine: any;
    meshLineMaterial: any;
    silkyMaterial: any;
    effectComposer: any;
    renderPass: any;
    unrealBloomPass: any;
    filmPass: any;
    glitchPass: any;
    waterPass: any;
    audio: any;
  }
}
