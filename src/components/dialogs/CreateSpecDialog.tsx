import { useState, type FormEvent } from 'react';
import { IPC } from '@shared/ipc-channels';
import type { CreateSpecFileInput } from '@shared/ipc-payloads';
import { useIPC } from '../../hooks/useIPC';

const VERSIONS: CreateSpecFileInput['openapiVersion'][] = ['3.1', '3.0', '2.0'];

interface Props {
  projectId: string;
  folderId: string | null;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateSpecDialog({
  projectId,
  folderId,
  onClose,
  onCreated,
}: Props) {
  const ipc = useIPC();
  const [name, setName] = useState('');
  const [version, setVersion] =
    useState<CreateSpecFileInput['openapiVersion']>('3.1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const stem = name.trim();
    if (!stem) {
      setError('Name is required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ipc(IPC.SPEC_FILE_CREATE, {
        projectId,
        folderId,
        name: stem,
        openapiVersion: version,
      } satisfies CreateSpecFileInput);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="New OpenAPI file"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="w-full max-w-sm rounded-md border border-shell-border bg-shell-sidebar p-4 shadow-xl"
        onSubmit={submit}
      >
        <h2 className="mb-3 text-sm font-semibold text-gray-200">
          New OpenAPI file
        </h2>
        <label className="mb-2 block text-xs text-gray-500">File name</label>
        <input
          className="mb-3 w-full rounded border border-shell-border bg-shell-bg px-2 py-1.5 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-api"
          disabled={busy}
          autoFocus
        />
        <fieldset className="mb-3">
          <legend className="mb-1 text-xs text-gray-500">OpenAPI version</legend>
          <div className="flex flex-wrap gap-2">
            {VERSIONS.map((v) => (
              <label
                key={v}
                className="flex cursor-pointer items-center gap-1 text-xs text-gray-300"
              >
                <input
                  type="radio"
                  name="oas"
                  checked={version === v}
                  onChange={() => setVersion(v)}
                  disabled={busy}
                />
                {v}
              </label>
            ))}
          </div>
        </fieldset>
        {error ? (
          <p className="mb-2 text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded px-3 py-1.5 text-xs text-gray-400 hover:bg-shell-hover"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-500 disabled:opacity-50"
            disabled={busy}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
