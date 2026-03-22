import { useCallback } from 'react';
import type { IpcChannel } from '@shared/ipc-channels';

export function useIPC() {
  return useCallback(
    async <T>(channel: IpcChannel, ...args: unknown[]): Promise<T> => {
      if (typeof window.spectra === 'undefined') {
        throw new Error('Spectra preload bridge is not available.');
      }
      const result = await window.spectra.invoke(channel, ...args);
      return result as T;
    },
    [],
  );
}
