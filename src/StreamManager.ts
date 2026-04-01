import { AudioListener } from 'three';
import { useStreamStore } from './useStreamStore';

export class StreamManager {
  private mediaStream: MediaStream | null = null;
  private videoTrack: MediaStreamTrack | null = null;
  private audioTrack: MediaStreamTrack | null = null;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private connectedListeners: AudioListener[] = [];
  private peerConnection: RTCPeerConnection | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;

  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  start(
    canvas: HTMLCanvasElement,
    audioListeners: AudioListener[]
  ): void {
    if (this.mediaStream) {
      this.cleanup();
    }

    try {
      if (audioListeners.length === 0) {
        throw new Error('No audio listeners available');
      }

      const videoStream = canvas.captureStream(30);
      const videoTrack = videoStream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('Failed to capture video track from canvas');
      }
      this.videoTrack = videoTrack;

      const audioContext = audioListeners[0].context;
      if (!audioContext) {
        throw new Error('AudioListener context is undefined');
      }
      if (audioContext.state === 'suspended') {
        throw new Error('AudioContext is suspended - user interaction required');
      }
      this.audioDestination = audioContext.createMediaStreamDestination();

      for (const listener of audioListeners) {
        listener.gain.connect(this.audioDestination);
        this.connectedListeners.push(listener);
      }

      const audioTrack = this.audioDestination.stream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error('Failed to capture audio track');
      }
      this.audioTrack = audioTrack;

      this.mediaStream = new MediaStream([this.videoTrack, this.audioTrack]);

      useStreamStore.getState().setStatus('connecting');

      const { relayUrl, streamKey } = useStreamStore.getState().config;
      if (!relayUrl) {
        throw new Error('Relay URL not configured');
      }
      if (!streamKey) {
        throw new Error('Stream key not configured');
      }
      this.connectWhip(relayUrl, streamKey);
    } catch (error) {
      this.cleanup();
      const message =
        error instanceof Error ? error.message : 'Failed to start media capture';
      useStreamStore.getState().setError(message);
    }
  }

  stop(): void {
    this.cleanup();
    useStreamStore.getState().setStatus('offline');
  }

  private async connectWhip(relayUrl: string, streamKey: string): Promise<void> {
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      if (this.mediaStream) {
        for (const track of this.mediaStream.getTracks()) {
          this.peerConnection.addTrack(track, this.mediaStream);
        }
      }

      this.peerConnection.oniceconnectionstatechange = () => {
        if (!this.peerConnection) return;
        const state = this.peerConnection.iceConnectionState;
        if (state === 'connected') {
          this.clearConnectionTimeout();
          useStreamStore.getState().setStatus('live');
        } else if (state === 'failed' || state === 'disconnected') {
          this.cleanup();
          useStreamStore.getState().setError('Connection lost to relay server');
        }
      };

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      const response = await fetch(relayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
          Authorization: `Bearer ${streamKey}`,
        },
        body: offer.sdp,
      });

      if (!response.ok) {
        throw new Error(`Relay returned ${response.status}: ${response.statusText}`);
      }

      const answerSdp = await response.text();
      const answer = new RTCSessionDescription({ type: 'answer', sdp: answerSdp });
      await this.peerConnection.setRemoteDescription(answer);

      this.connectionTimeout = setTimeout(() => {
        if (this.peerConnection) {
          this.cleanup();
          useStreamStore.getState().setError('Connection timed out after 10 seconds');
        }
      }, 10_000);
    } catch (error) {
      this.cleanup();
      const message =
        error instanceof Error ? error.message : 'WHIP connection failed';
      useStreamStore.getState().setError(message);
    }
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private cleanup(): void {
    this.clearConnectionTimeout();

    if (this.peerConnection) {
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }

    for (const listener of this.connectedListeners) {
      if (this.audioDestination) {
        try {
          listener.gain.disconnect(this.audioDestination);
        } catch {
          // best-effort disconnect
        }
      }
    }
    this.connectedListeners = [];

    this.videoTrack?.stop();
    this.audioTrack?.stop();
    this.mediaStream = null;
    this.videoTrack = null;
    this.audioTrack = null;
    this.audioDestination = null;
  }
}

export const streamManager = new StreamManager();
