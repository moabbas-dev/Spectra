import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';

const allowedChannels = new Set<string>(Object.values(IPC));

function invoke(channel: string, ...args: unknown[]): Promise<unknown> {
  if (!allowedChannels.has(channel)) {
    return Promise.reject(new Error(`IPC channel not allowed: ${channel}`));
  }
  return ipcRenderer.invoke(channel, ...args);
}

contextBridge.exposeInMainWorld('spectra', {
  invoke,
  channels: IPC,
});
