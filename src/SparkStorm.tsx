import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import Random from 'canvas-sketch-util/random';
import { lerp } from 'canvas-sketch-util/math';
import {
  createAttractor,
  updateAttractor,
  dadrasAttractor,
  aizawaAttractor,
  arneodoAttractor,
  dequanAttractor,
  lorenzAttractor,
  lorenzMod2Attractor,
  Simulation,
} from './attractor';

const simulationFunc = () =>
  Random.pick([
    dadrasAttractor,
    aizawaAttractor,
    arneodoAttractor,
    dequanAttractor,
    lorenzAttractor,
    lorenzMod2Attractor,
  ]) as Simulation;

interface FatlineProps {
  radius: number;
  simulation: Simulation;
  width: number;
  color: string;
}

function Fatline({ radius, simulation, width, color }: FatlineProps) {
  const line = useRef<any>(null!);
  const [positions, currentPosition] = useMemo(() => createAttractor(5), []);

  useFrame(() => {
    if (line.current) {
      const nextPosition = updateAttractor(
        currentPosition,
        radius,
        simulation,
        0.005
      );

      line.current.advance(nextPosition);
    }
  });

  return (
    <mesh>
      <meshLine ref={line} attach="geometry" points={positions} />
      <meshLineMaterial
        attach="material"
        transparent
        lineWidth={width}
        color={color}
      />
    </mesh>
  );
}

interface SparkStormProps {
  mouse: React.MutableRefObject<[number, number]>;
  count: number;
  colors: string[];
  radius?: number;
}

export function SparkStorm({ mouse, count, colors, radius = 10 }: SparkStormProps) {
  const lines = useMemo(
    () =>
      new Array(count).fill(null).map(() => {
        return {
          color: Random.pick(colors) as string,
          width: Random.range(0.1, 0.2),
          speed: Random.range(0.001, 0.002),
          simulation: simulationFunc(),
          radius: Random.range(2, 2.25) * radius,
        };
      }),
    [count, colors, radius]
  );

  const storm = useRef<THREE.Group>(null!);

  const { size, viewport } = useThree();
  const aspect = size.width / viewport.width;

  useFrame(() => {
    if (storm.current) {
      storm.current.rotation.x = lerp(
        storm.current.rotation.x,
        0 + mouse.current[1] / aspect / 200,
        0.1
      );
      storm.current.rotation.y = lerp(
        storm.current.rotation.y,
        0 + mouse.current[0] / aspect / 400,
        0.1
      );
    }
  });

  return (
    <group ref={storm}>
      <group>
        {lines.map((props, index) => (
          <Fatline key={index} {...props} />
        ))}
      </group>
    </group>
  );
}
