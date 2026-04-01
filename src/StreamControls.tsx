import React from 'react';
import { useStreamStore } from './useStreamStore';
import { streamManager } from './StreamManager';

export function StreamControls() {
  const isConfigured = useStreamStore((s) => s.isConfigured);
  const status = useStreamStore((s) => s.status);
  const errorMessage = useStreamStore((s) => s.errorMessage);
  const setStatus = useStreamStore((s) => s.setStatus);

  const handleGoLive = () => {
    setStatus('connecting');
  };

  const handleStop = () => {
    streamManager.stop();
  };

  return (
    <div className="stream-controls">
      <div className={`stream-status stream-status--${status}`}>
        <span className="stream-status__dot" />
        <span>{status}</span>
      </div>

      {status === 'error' && errorMessage && (
        <div className="stream-error-message">{errorMessage}</div>
      )}

      {status === 'live' || status === 'connecting' ? (
        <button onClick={handleStop}>
          Stop Stream
        </button>
      ) : status === 'error' ? (
        <button onClick={handleGoLive}>
          Retry
        </button>
      ) : (
        <button
          disabled={!isConfigured}
          onClick={handleGoLive}
        >
          Go Live
        </button>
      )}
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class StreamErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    const key = useStreamStore.getState().config.streamKey;
    const sanitized =
      key.length > 0 ? error.message.replaceAll(key, '***') : error.message;
    console.error('StreamControls render error:', sanitized);
  }

  render() {
    if (this.state.hasError) {
      return <div className="stream-error-fallback">Streaming error</div>;
    }
    return this.props.children;
  }
}
