import { useState } from 'react';

type Tab = 'problems' | 'output';

export function BottomPanel() {
  const [tab, setTab] = useState<Tab>('problems');

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex shrink-0 gap-1 border-b border-shell-border px-2 text-xs"
        role="tablist"
        aria-label="Bottom panel"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'problems'}
          onClick={() => setTab('problems')}
          className={`rounded-t px-2 py-1 ${
            tab === 'problems'
              ? 'bg-shell-bg text-gray-200'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Problems
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'output'}
          onClick={() => setTab('output')}
          className={`rounded-t px-2 py-1 ${
            tab === 'output'
              ? 'bg-shell-bg text-gray-200'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Output
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2 font-mono text-xs text-gray-400">
        {tab === 'problems' ? (
          <p>No validation issues yet. Open a spec to run Spectral.</p>
        ) : (
          <p>Spectra output — Git and build logs will appear here.</p>
        )}
      </div>
    </div>
  );
}
