import type { IpcMainInvokeEvent } from 'electron';
import * as yaml from 'js-yaml';

export function registerSpecIpc(
  handle: (
    channel: string,
    listener: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown,
  ) => void,
  IPC: {
    SPEC_FORMAT: string;
    SPEC_SAVE: string;
  },
): void {
  /**
   * SPEC_FORMAT — Parse YAML string and re-serialize with consistent formatting.
   * Returns the formatted YAML string.
   */
  handle(IPC.SPEC_FORMAT, (_e, content: unknown) => {
    const raw = content as string;
    if (!raw || typeof raw !== 'string') {
      throw new Error('SPEC_FORMAT: content must be a non-empty string');
    }

    try {
      const doc = yaml.load(raw);
      if (doc === null || doc === undefined) {
        // Empty or null document — return as-is
        return raw;
      }

      return yaml.dump(doc, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        quotingType: '"',
        forceQuotes: false,
        sortKeys: false,
        flowLevel: -1,       // Always block style
        noCompatMode: true,
      });
    } catch (err) {
      // If parsing fails, return the original content
      // (user may have invalid YAML mid-edit)
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`YAML formatting failed: ${message}`);
    }
  });

  /**
   * SPEC_SAVE — Placeholder for save-with-version logic (Sprint 13+).
   */
  handle(IPC.SPEC_SAVE, (_e, _payload: unknown) => {
    // TODO: Implement spec save with version snapshot (Sprint 13–14)
    return { ok: true };
  });
}

