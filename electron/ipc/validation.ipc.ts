import type { IpcMainInvokeEvent } from 'electron';

export function registerValidationIpc(
  _handle: (
    channel: string,
    listener: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown,
  ) => void,
  _IPC: Record<string, string>,
): void {
  void _handle;
  void _IPC;
}
