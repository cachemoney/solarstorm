precision highp float;

#include "./common/noise4d.glsl"

#define noise snoise

uniform vec2 u_resolution;
uniform float u_music;
uniform float u_scale;
uniform vec3 u_background;
uniform vec3 u_foreground;

varying vec3 vPosition;
varying vec2 vUv;
varying float vOutput;

const int AMOUNT = 4;

float loopNoise (vec3 v, float t, float scale, float offset) {
  float duration = scale;
  float current = t * scale;
  return ((duration - current) * noise(vec4(v, current + offset)) + current * noise(vec4(v, current - duration + offset))) / duration;
}

void main(){
  vec2 coord = 20.0 * vUv;

  vec3 p = vPosition * 1.0;
  float v = 0.0;
  float amp = 0.5;
  v = loopNoise(p, u_music, 1.0, 60.0) * amp;

  float len;

  for (int i = 0; i < AMOUNT; i++){
    len = length(vec2(coord.x, coord.y));
    coord.x = coord.x - cos(coord.y + sin(len)) + cos(u_music / 9.0);
    coord.y = coord.y + sin(coord.x + cos(len)) + sin(u_music / 12.0);
  }

  len += v * u_scale;
  vec3 color = mix(u_background,  vec3(0.25, 0.25, 0.25), cos(vOutput));

  gl_FragColor = vec4(color, 1.0);
}
