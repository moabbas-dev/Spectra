import type { IpcMainInvokeEvent } from 'electron';
import type { Database } from 'better-sqlite3';
import { IPC } from '../../shared/ipc-channels';

type HandleFn = (
  channel: string,
  listener: (
    event: IpcMainInvokeEvent,
    ...args: unknown[]
  ) => unknown | Promise<unknown>,
) => void;

export function registerSettingsIpc(db: Database, handle: HandleFn): void {
  handle(IPC.SETTINGS_GET, (_e, key: unknown) => {
    const row = db
      .prepare<[string], { value: string }>(
        'SELECT value FROM user_settings WHERE key = ?',
      )
      .get(key as string);
    return row?.value ?? null;
  });

  handle(IPC.SETTINGS_SET, (_e, key: unknown, value: unknown) => {
    db.prepare(
      `INSERT INTO user_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ).run(key as string, value as string);
    return { ok: true };
  });
}
