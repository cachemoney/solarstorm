import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  UniformsUtils,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three';
import { Pass } from 'three/examples/jsm/postprocessing/Pass';

const WaterShader = {
  uniforms: {
    byp: { value: 0 },
    tex: { value: null },
    time: { value: 0.0 },
    factor: { value: 0.0 },
    resolution: { value: null },
  },

  vertexShader: `varying vec2 vUv;
    void main(){
      vUv = uv;
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;
    }`,

  fragmentShader: `uniform int byp;
    uniform float time;
    uniform float factor;
    uniform vec2 resolution;
    uniform sampler2D tex;

    varying vec2 vUv;

    void main() {
      if (byp<1) {
        vec2 uv1 = vUv;
        float frequency = 6.0;
        float amplitude = 0.015 * factor;
        float x = uv1.y * frequency + time * .7;
        float y = uv1.x * frequency + time * .3;
        uv1.x += cos(x+y) * amplitude * cos(y);
        uv1.y += sin(x-y) * amplitude * cos(y);
        vec4 rgba = texture2D(tex, uv1);
        gl_FragColor = rgba;
      } else {
        gl_FragColor = texture2D(tex, vUv);
      }
    }`,
};

export class WaterPass extends Pass {
  uniforms: any;
  material: ShaderMaterial;
  camera: OrthographicCamera;
  scene: Scene;
  quad: Mesh;
  factor: number = 0;
  time: number = 0;

  constructor(dt_size: number = 64) {
    super();
    const shader = WaterShader;
    this.uniforms = UniformsUtils.clone(shader.uniforms);
    this.uniforms['resolution'].value = new Vector2(dt_size, dt_size);
    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
    });
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new Scene();
    this.quad = new Mesh(new PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
  }

  render(
    renderer: WebGLRenderer, 
    writeBuffer: WebGLRenderTarget, 
    readBuffer: WebGLRenderTarget, 
    deltaTime: number, 
    maskActive: boolean
  ) {
    const factor = Math.max(0, this.factor);
    this.uniforms['byp'].value = factor ? 0 : 1;
    this.uniforms['tex'].value = readBuffer.texture;
    this.uniforms['time'].value = this.time;
    this.uniforms['factor'].value = this.factor;
    this.time += 0.05;
    this.quad.material = this.material;
    
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      renderer.render(this.scene, this.camera);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
      renderer.render(this.scene, this.camera);
    }
  }
}
