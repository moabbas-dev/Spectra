/// <reference types="vite/client" />

import type { IPC } from '@shared/ipc-channels';

export interface SpectraApi {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  channels: typeof IPC;
}

declare global {
  interface Window {
    spectra: SpectraApi;
  }
}

export {};
