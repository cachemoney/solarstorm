import { mapRange } from 'canvas-sketch-util/math';
import { createWithEqualityFn } from 'zustand/traditional';
import { subscribeWithSelector } from 'zustand/middleware';

interface MusicState {
  didLoad: {
    bass: boolean;
    drums: boolean;
    melody: boolean;
    vocals: boolean;
  };
  init: boolean;
  bass: number;
  drums: number;
  melody: number;
  vocals: number;
  scale: number;
  progress: number;
  sparkStorm: boolean;
  planetDistortion: boolean;
  spaceshipDistortion: boolean;
  beep: boolean;
  planetDistortionMax: boolean;
  glitchFactor: number;
  distortFactor: number;
  setInit: (init: boolean) => void;
  setAudioData: (type: 'bass' | 'drums' | 'melody' | 'vocals', data: number) => void;
  setLoaded: (type: 'bass' | 'drums' | 'melody' | 'vocals', loaded: boolean) => void;
  setProgress: (progress: number) => void;
}

const glitchFactor = (progress: number) => {
  if (progress > 0.487179487179487 && progress < 0.495726495726496) {
    return 1;
  } else if (progress > 0.504273504273504 && progress < 0.52) {
    return 0.5;
  }

  return 0;
};

const distortFactor = (progress: number) => {
  if (progress > 0.726495726495726 && progress < 0.777777777777778) {
    return 0.4;
  } else if (progress > 0.777777777777778 && progress < 0.82051282051282) {
    return 0.6;
  } else if (progress > 0.82051282051282 && progress < 0.923076923076923) {
    return 0.8;
  }

  return 0;
};

const scaleFunc = (progress: number) => {
  if (progress > 0.5299 && progress < 0.605) {
    return mapRange(progress, 0.52, 0.605, 1, 1.5, true);
  }

  return 1;
};

export const useMusicStore = createWithEqualityFn<MusicState>()(
  subscribeWithSelector((set) => ({
    didLoad: {
      bass: false,
      drums: false,
      melody: false,
      vocals: false,
    },
    init: false,
    bass: 0,
    drums: 0,
    melody: 0,
    vocals: 0,
    scale: 1,
    progress: 0,
    sparkStorm: false,
    planetDistortion: false,
    spaceshipDistortion: false,
    beep: false,
    planetDistortionMax: false,
    glitchFactor: 0,
    distortFactor: 0,
    setInit: (init) =>
      set(() => {
        return { init };
      }),
    setAudioData: (type, data) =>
      set(() => {
        return { [type]: mapRange(data, 0, 255, 0, 1) };
      }),
    setLoaded: (type, loaded) =>
      set((state) => {
        return {
          didLoad: { ...state.didLoad, [type]: loaded },
        };
      }),
    setProgress: (progress) =>
      set(() => {
        return {
          progress,
          sparkStorm:
            progress > 0.213675213675214 && progress < 0.95,
          planetDistortion:
            progress > 0.273504273504274 && progress < 0.95,
          spaceshipDistortion:
            progress > 0.435897435897436 && progress < 0.95,
          beep: progress > 0.487179487179487 && progress < 0.95,
          planetDistortionMax:
            progress > 0.598290598290598 && progress < 0.95,
          glitchFactor: glitchFactor(progress),
          distortFactor: distortFactor(progress),
          scale: scaleFunc(progress),
        };
      }),
  }))
);
