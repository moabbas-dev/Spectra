import type { IpcMainInvokeEvent } from 'electron';

/** Placeholder until spec save/validate IPC is implemented (Sprint 5+). */
export function registerSpecIpc(
  _handle: (
    channel: string,
    listener: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown,
  ) => void,
  _IPC: Record<string, string>,
): void {
  void _handle;
  void _IPC;
}
