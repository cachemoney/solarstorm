import * as THREE from 'three';
import React, { useRef, useMemo, useEffect } from 'react';
import { extend, useThree, useFrame } from '@react-three/fiber';
import { mapRange } from 'canvas-sketch-util/math';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { GlitchPass } from './post/Glitchpass';
import { WaterPass } from './post/Waterpass';
import { useMusicStore } from './useMusicStore';

extend({
  EffectComposer,
  ShaderPass,
  RenderPass,
  WaterPass,
  UnrealBloomPass,
  FilmPass,
  GlitchPass,
});

export function Effects() {
  const composer = useRef<EffectComposer>(null!);
  const bloomPass = useRef<UnrealBloomPass>(null!);

  const { scene, gl, size, camera } = useThree();
  const aspect = useMemo(() => new THREE.Vector2(512, 512), []);

  useEffect(
    () => {
      if (composer.current) {
        composer.current.setSize(size.width, size.height);
      }
    },
    [size]
  );

  const bass = useRef(0);
  const glitchFactor = useMusicStore((state) => state.glitchFactor);

  useEffect(
    () =>
      useMusicStore.subscribe(
        (state) => state.bass,
        (value) => {
          bass.current = value;
        }
      ),
    []
  );

  useFrame(() => {
    if (bloomPass.current && bass.current) {
      bloomPass.current.strength = mapRange(
        bass.current,
        0,
        0.25,
        1.75,
        2.5,
        true
      );
    }

    if (composer.current) {
      composer.current.render();
    }
  }, 1);

  const attachPass = (parent: any, self: any) => {
    parent.addPass(self);
    return () => {
      const index = parent.passes.indexOf(self);
      if (index !== -1) parent.passes.splice(index, 1);
    };
  };

  return (
    <effectComposer ref={composer} args={[gl]}>
      <renderPass attach={attachPass} args={[scene, camera]} />
      <unrealBloomPass
        ref={bloomPass}
        attach={attachPass}
        args={[aspect, 2, 1, 0]}
      />
      <filmPass attach={attachPass} args={[0.35, false]} />
      <glitchPass attach={attachPass} factor={glitchFactor} />
    </effectComposer>
  );
}
