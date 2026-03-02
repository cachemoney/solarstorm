import { ShaderMaterial, Color } from 'three';
import { extend } from '@react-three/fiber';
import vertexShader from './shaders/silky.vert';
import fragmentShader from './shaders/silky.frag';

export default class SilkyMaterial extends ShaderMaterial {
  constructor() {
    super({
      clipping: true,
      uniforms: {
        u_time: { value: 0 },
        u_music: { value: 0 },
        u_resolution: { value: [800, 800] },
        u_scale: { value: 1 },
        u_background: { value: new Color('#600935') },
        u_foreground: { value: new Color('#de77c7') },
        u_distort: { value: 0.8 },
        u_radius: { value: 1.0 },
      },
      vertexShader,
      fragmentShader,
    });
  }
}

extend({ SilkyMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      silkyMaterial: any;
    }
  }
}
