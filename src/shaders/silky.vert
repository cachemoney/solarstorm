precision highp float;
varying vec2 vUv;
varying vec3 vPosition;
varying float vOutput;

uniform float u_music;
uniform float u_time;
uniform float u_scale;
uniform vec3 u_background;
uniform float u_distort;
uniform float u_radius;

#include "./common/noise4d.glsl"
#include "./common/noise3d.glsl"

#define noise snoise
#define snoise3 snoise

const int AMOUNT = 4;

float loopNoise (vec3 v, float t, float scale, float offset) {
  float duration = scale;
  float current = t * scale;
  return ((duration - current) * noise(vec4(v, current + offset)) + current * noise(vec4(v, current - duration + offset))) / duration;
}

void main () {
  vPosition = position;

  vec2 coord = 20.0 * vUv;

  vec3 p = vPosition * 1.0;
  float v = 0.0;
  float amp = 0.5;
  v += loopNoise(p, u_music, 1.0, 60.0) * amp;

  float len;

  for (int i = 0; i < AMOUNT; i++) {
    len = length(vec2(coord.x, coord.y));
    coord.x = coord.x - cos(coord.y + sin(len)) + cos(u_music / 9.0);
    coord.y = coord.y + sin(coord.x + cos(len)) + sin(u_music / 12.0);
  }

  len += v * u_scale;
  vec3 displacement = vec3(1.0 + cos(len), 1.0 + cos(len), 1.0 + cos(len));

  vOutput = len;
  vec3 newPosition = position + normal * displacement * 0.1;

  // distortion
  float updateTime = u_time / 50.0;
  float noiseValue = snoise3(vec3(newPosition / 2.0 + updateTime * 5.0));
  vec3 transformed = vec3(newPosition * (noiseValue * pow(u_distort, 2.0) + u_radius));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);

  vUv = position.xy * 0.5 + 0.5;
}
