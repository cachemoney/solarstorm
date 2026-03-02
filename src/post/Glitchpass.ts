import { 
  DataTexture, 
  FloatType, 
  MathUtils, 
  Mesh, 
  OrthographicCamera, 
  PlaneGeometry, 
  RGBAFormat, 
  Scene, 
  ShaderMaterial, 
  UniformsUtils,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js'

const DigitalGlitch = {
  uniforms: {
    tDiffuse: { value: null },
    tDisp: { value: null },
    byp: { value: 0 },
    amount: { value: 0.08 },
    angle: { value: 0.02 },
    seed: { value: 0.02 },
    seed_x: { value: 0.02 },
    seed_y: { value: 0.02 },
    distortion_x: { value: 0.5 },
    distortion_y: { value: 0.6 },
    col_s: { value: 0.05 }
  },

  vertexShader: `varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,

  fragmentShader: `uniform int byp;
    uniform sampler2D tDiffuse;
    uniform sampler2D tDisp;
    uniform float amount;
    uniform float angle;
    uniform float seed;
    uniform float seed_x;
    uniform float seed_y;
    uniform float distortion_x;
    uniform float distortion_y;
    uniform float col_s;
    varying vec2 vUv;
    float rand(vec2 co){
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }
    void main() {
      if(byp<1) {
        vec2 p = vUv;
        vec4 normal = texture2D (tDisp, p*seed*seed);
        if(p.y<distortion_x+col_s && p.y>distortion_x-col_s*seed) {
          if(seed_x>0.){
            p.y = 1. - (p.y + distortion_y);
          }
          else {
            p.y = distortion_y;
          }
        }
        p.x+=normal.x*seed_x*(seed/5.);
        p.y+=normal.y*seed_y*(seed/5.);
        vec2 offset = amount * vec2( cos(angle), sin(angle));
        vec4 cr = texture2D(tDiffuse, p + offset);
        vec4 cga = texture2D(tDiffuse, p);
        vec4 cb = texture2D(tDiffuse, p - offset);
        gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
      }
      else {
        gl_FragColor=texture2D (tDiffuse, vUv);
      }
    }`
}

export class GlitchPass extends Pass {
  uniforms: any;
  material: ShaderMaterial;
  camera: OrthographicCamera;
  scene: Scene;
  quad: Mesh;
  factor: number = 0;

  constructor(dt_size: number = 64) {
    super();
    const shader = DigitalGlitch;
    this.uniforms = UniformsUtils.clone(shader.uniforms);
    this.uniforms['tDisp'].value = this.generateHeightmap(dt_size);
    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
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
    this.uniforms['tDiffuse'].value = readBuffer.texture;
    this.uniforms['seed'].value = Math.random() * factor;
    this.uniforms['byp'].value = 0;
    if (factor) {
      this.uniforms['amount'].value = (Math.random() / 90) * factor;
      this.uniforms['angle'].value = MathUtils.randFloat(-Math.PI, Math.PI) * factor;
      this.uniforms['distortion_x'].value = MathUtils.randFloat(0, 1) * factor;
      this.uniforms['distortion_y'].value = MathUtils.randFloat(0, 1) * factor;
      this.uniforms['seed_x'].value = MathUtils.randFloat(-0.3, 0.3) * factor;
      this.uniforms['seed_y'].value = MathUtils.randFloat(-0.3, 0.3) * factor;
    } else {
      this.uniforms['byp'].value = 1;
    }
    
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

  generateHeightmap(dt_size: number) {
    const data_arr = new Float32Array(dt_size * dt_size * 4);
    const length = dt_size * dt_size;

    for (let i = 0; i < length; i++) {
      const val = MathUtils.randFloat(0, 1);
      data_arr[i * 4 + 0] = val;
      data_arr[i * 4 + 1] = val;
      data_arr[i * 4 + 2] = val;
      data_arr[i * 4 + 3] = 1.0;
    }

    const texture = new DataTexture(data_arr, dt_size, dt_size, RGBAFormat, FloatType);
    texture.needsUpdate = true;
    return texture;
  }
}
