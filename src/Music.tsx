import React, { useRef, useEffect, forwardRef, useState } from 'react';
import { useThree, useLoader, useFrame } from '@react-three/fiber';
import { AudioLoader, AudioListener, AudioAnalyser, Audio as ThreeAudio } from 'three';
import { useMusicStore } from './useMusicStore';

const urls = {
  bass: '/quitters-raga/bass.mp3',
  drums: '/quitters-raga/drums.mp3',
  melody: '/quitters-raga/melody.mp3',
  fullSong: '/quitters-raga/quitters-raga.mp3',
  vocals: '/quitters-raga/vocals.mp3',
};

type TrackType = 'bass' | 'drums' | 'melody' | 'vocals';

interface AnalyzerProps {
  track: TrackType;
  sound: React.MutableRefObject<ThreeAudio | undefined>;
  trackProgress?: boolean;
}

function Analyzer({ track, sound, trackProgress = false }: AnalyzerProps) {
  const analyser = useRef<AudioAnalyser>();
  const setAudioData = useMusicStore((state) => state.setAudioData);
  const setProgress = useMusicStore((state) => state.setProgress);
  const init = useMusicStore((state) => state.init);

  useFrame(() => {
    if (!analyser.current && sound.current) {
      analyser.current = new AudioAnalyser(sound.current, 32);
    }

    if (analyser.current && init && sound.current) {
      const data = analyser.current.getAverageFrequency();
      setAudioData(track, data);

      if (trackProgress) {
        // Accessing internal three.js audio properties safely
        const audio = sound.current as any;
        const progress =
          (Math.max(
            audio.context.currentTime - audio._startedAt,
            0
          ) *
            audio.playbackRate) /
          audio.buffer.duration;

        setProgress(progress);
      }
    }
  });

  return null;
}

interface AudioProps {
  track: TrackType;
  volume: number;
  onListener?: (listener: AudioListener) => void;
}

const Audio = forwardRef<ThreeAudio, AudioProps>(({ track, volume, onListener, ...props }, ref) => {
  const { camera } = useThree();
  const [listener] = useState(() => new AudioListener());
  const onListenerRef = useRef(onListener);
  onListenerRef.current = onListener;

  useEffect(() => {
    if (onListenerRef.current) onListenerRef.current(listener);
  }, [listener]);

  const setLoaded = useMusicStore((state) => state.setLoaded);
  const init = useMusicStore((state) => state.init);

  const buffer = useLoader(AudioLoader, urls[track], undefined, (xhr) => {
    if (xhr.loaded === xhr.total) {
      setLoaded(track, true);
    }
  });

  useEffect(() => {
    const sound = (ref as React.MutableRefObject<ThreeAudio>).current;
    if (sound && init && buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(false);
      sound.setVolume(volume);
      sound.play();
    }

    return () => {
      if (sound && init) {
        sound.stop();
        sound.disconnect();
      }
    };
  }, [buffer, camera, listener, init, ref, volume]);

  return <audio ref={ref as any} args={[listener]} {...props} />;
});

interface AudioLayerProps {
  track: TrackType;
  trackProgress?: boolean;
  quiet?: boolean;
  onListener?: (listener: AudioListener) => void;
}

export function AudioLayer({ track, trackProgress, quiet = false, onListener }: AudioLayerProps) {
  const sound = useRef<ThreeAudio>();

  return (
    <>
      <Audio ref={sound as any} track={track} volume={quiet ? 0 : 0.5} onListener={onListener} />
      <Analyzer track={track} sound={sound} trackProgress={trackProgress} />
    </>
  );
}

interface MusicProps {
  onAudioListenerReady?: (listener: AudioListener) => void;
}

export function Music({ onAudioListenerReady }: MusicProps) {
  return (
    <>
      <AudioLayer track="bass" onListener={onAudioListenerReady} />
      <AudioLayer track="drums" onListener={onAudioListenerReady} />
      <AudioLayer track="melody" trackProgress onListener={onAudioListenerReady} />
      <AudioLayer track="vocals" onListener={onAudioListenerReady} />
    </>
  );
}
