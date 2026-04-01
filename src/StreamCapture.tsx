import React, { useEffect, useRef } from 'react';
import { AudioListener } from 'three';
import { useThree } from '@react-three/fiber';
import { useStreamStore } from './useStreamStore';
import { streamManager } from './StreamManager';

interface StreamCaptureProps {
  audioListeners: AudioListener[];
}

export function StreamCapture({ audioListeners }: StreamCaptureProps) {
  const { gl } = useThree();
  const status = useStreamStore((s) => s.status);
  const startedRef = useRef(false);

  useEffect(() => {
    if (status === 'error' || status === 'offline') {
      startedRef.current = false;
      return;
    }

    if (startedRef.current || audioListeners.length === 0) return;

    startedRef.current = true;
    streamManager.start(gl.domElement, audioListeners);
  }, [status, audioListeners, gl]);

  useEffect(() => {
    return () => {
      if (startedRef.current) {
        streamManager.stop();
        startedRef.current = false;
      }
    };
  }, []);

  return null;
}
