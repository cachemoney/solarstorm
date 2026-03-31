import React, { useState } from 'react';
import { useStreamStore } from './useStreamStore';

export function StreamSettings() {
  const config = useStreamStore((s) => s.config);
  const setConfig = useStreamStore((s) => s.setConfig);
  const clearConfig = useStreamStore((s) => s.clearConfig);

  const [open, setOpen] = useState(false);
  const [relayUrl, setRelayUrl] = useState(config.relayUrl);
  const [streamKey, setStreamKey] = useState(config.streamKey);

  const handleOpen = () => {
    setRelayUrl(config.relayUrl);
    setStreamKey(config.streamKey);
    setOpen(true);
  };

  const handleSave = () => {
    if (relayUrl.trim().length === 0 || streamKey.trim().length === 0) return;
    setConfig({ relayUrl: relayUrl.trim(), streamKey: streamKey.trim() });
    setOpen(false);
  };

  const handleClear = () => {
    clearConfig();
    setRelayUrl('');
    setStreamKey('');
    setOpen(false);
  };

  return (
    <>
      <button className="stream-settings-toggle" onClick={handleOpen}>
        Settings
      </button>

      {open && (
        <div className="stream-settings-panel">
          <label>
            Relay URL
            <input
              type="text"
              value={relayUrl}
              onChange={(e) => setRelayUrl(e.target.value)}
              placeholder="https://relay.example.com/whip"
            />
          </label>
          <label>
            Stream Key
            <input
              type="password"
              value={streamKey}
              onChange={(e) => setStreamKey(e.target.value)}
              placeholder="xxxx-xxxx-xxxx"
            />
          </label>
          <div className="stream-settings-actions">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleClear}>Clear</button>
            <button onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
