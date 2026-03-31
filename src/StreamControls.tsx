import React from 'react';
import { useStreamStore } from './useStreamStore';

export function StreamControls() {
  const isConfigured = useStreamStore((s) => s.isConfigured);
  const status = useStreamStore((s) => s.status);
  const errorMessage = useStreamStore((s) => s.errorMessage);

  return (
    <div className="stream-controls">
      <div className={`stream-status stream-status--${status}`}>
        <span className="stream-status__dot" />
        <span>{status}</span>
      </div>

      {status === 'error' && errorMessage && (
        <div className="stream-error-message">{errorMessage}</div>
      )}

      {status === 'live' ? (
        <button
          onClick={() => {
            // TODO: Epic 2 - wire to StreamManager.stop()
          }}
        >
          Stop Stream
        </button>
      ) : (
        <button
          disabled={!isConfigured}
          onClick={() => {
            // TODO: Epic 2 - wire to StreamManager.start()
          }}
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
