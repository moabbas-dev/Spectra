import { useState, useEffect, useCallback } from 'react';
import { X, Settings, Code2, Save, History, Keyboard } from 'lucide-react';
import { useUiStore } from '../../stores/ui.store';
import { useIPC } from '../../hooks/useIPC';
import { IPC } from '@shared/ipc-channels';

type SettingsTab = 'general' | 'editor' | 'versioning' | 'shortcuts';

const tabs: { key: SettingsTab; label: string; icon: typeof Settings }[] = [
  { key: 'general', label: 'General', icon: Settings },
  { key: 'editor', label: 'Editor', icon: Code2 },
  { key: 'versioning', label: 'Versioning', icon: History },
  { key: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
];

const shortcuts = [
  { keys: 'Ctrl + S', action: 'Save active file' },
  { keys: 'Ctrl + P', action: 'Quick Open file' },
  { keys: 'Ctrl + Shift + P', action: 'Open Command Palette' },
  { keys: 'Ctrl + W', action: 'Close active tab' },
  { keys: 'Ctrl + B', action: 'Toggle sidebar' },
  { keys: 'Ctrl + J', action: 'Toggle bottom panel' },
  { keys: 'Ctrl + Shift + E', action: 'Focus Explorer panel' },
  { keys: 'Ctrl + Shift + F', action: 'Focus Search panel' },
  { keys: 'Ctrl + ,', action: 'Open Settings' },
];

interface AppSettings {
  autosaveInterval: number;    // seconds, 0 = disabled
  confirmOnDelete: boolean;
  defaultOpenApiVersion: '2.0' | '3.0' | '3.1';
  editorTabSize: number;
  editorFontSize: number;
  editorWordWrap: boolean;
  editorMinimap: boolean;
  versionOnSave: 'always' | 'ask' | 'never';
}

const defaults: AppSettings = {
  autosaveInterval: 30,
  confirmOnDelete: true,
  defaultOpenApiVersion: '3.0',
  editorTabSize: 2,
  editorFontSize: 14,
  editorWordWrap: true,
  editorMinimap: false,
  versionOnSave: 'never',
};

export function SettingsDialog() {
  const ipc = useIPC();
  const isOpen = useUiStore((s) => s.settingsOpen);
  const close = useCallback(() => useUiStore.getState().setSettingsOpen(false), []);

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [loading, setLoading] = useState(true);

  // Load settings from DB
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    ipc<string | null>(IPC.SETTINGS_GET, 'app_settings')
      .then((raw) => {
        if (raw) {
          try {
            setSettings({ ...defaults, ...JSON.parse(raw) });
          } catch { /* use defaults */ }
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen, ipc]);

  // Save settings to DB
  const save = useCallback(
    (next: AppSettings) => {
      setSettings(next);
      void ipc(IPC.SETTINGS_SET, 'app_settings', JSON.stringify(next));
    },
    [ipc],
  );

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    save({ ...settings, [key]: value });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50" onClick={close}>
      <div
        className="flex h-[450px] w-[600px] overflow-hidden rounded-lg border border-shell-border bg-shell-sidebar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar tabs */}
        <div className="flex w-[160px] shrink-0 flex-col border-r border-shell-border bg-[#1e1e1e] py-2">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Settings</p>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                className={`flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                  active ? 'bg-blue-500/15 text-blue-400' : 'text-gray-400 hover:bg-shell-hover hover:text-gray-200'
                }`}
                onClick={() => setActiveTab(t.key)}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-shell-border px-4 py-2.5">
            <span className="text-sm font-medium text-gray-200">
              {tabs.find((t) => t.key === activeTab)?.label}
            </span>
            <button
              type="button"
              className="rounded p-1 text-gray-500 hover:bg-shell-hover hover:text-gray-300"
              onClick={close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <p className="text-xs text-gray-500">Loading…</p>
            ) : activeTab === 'general' ? (
              <>
                <SettingRow label="Autosave interval (seconds)" description="Set to 0 to disable autosave.">
                  <input
                    type="number"
                    min={0}
                    max={600}
                    value={settings.autosaveInterval}
                    onChange={(e) => update('autosaveInterval', Math.max(0, Number(e.target.value)))}
                    className="w-20 rounded border border-shell-border bg-shell-bg px-2 py-1 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
                  />
                </SettingRow>

                <SettingRow label="Confirm before delete" description="Show confirmation dialog before deleting files and folders.">
                  <Toggle value={settings.confirmOnDelete} onChange={(v) => update('confirmOnDelete', v)} />
                </SettingRow>

                <SettingRow label="Default OpenAPI version" description="Default version for new spec files.">
                  <select
                    value={settings.defaultOpenApiVersion}
                    onChange={(e) => update('defaultOpenApiVersion', e.target.value as AppSettings['defaultOpenApiVersion'])}
                    className="rounded border border-shell-border bg-shell-bg px-2 py-1 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="2.0">Swagger 2.0</option>
                    <option value="3.0">OpenAPI 3.0</option>
                    <option value="3.1">OpenAPI 3.1</option>
                  </select>
                </SettingRow>
              </>
            ) : activeTab === 'editor' ? (
              <>
                <SettingRow label="Tab size" description="Number of spaces per tab.">
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={settings.editorTabSize}
                    onChange={(e) => update('editorTabSize', Math.max(1, Math.min(8, Number(e.target.value))))}
                    className="w-16 rounded border border-shell-border bg-shell-bg px-2 py-1 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
                  />
                </SettingRow>

                <SettingRow label="Font size" description="Editor font size in pixels.">
                  <input
                    type="number"
                    min={10}
                    max={24}
                    value={settings.editorFontSize}
                    onChange={(e) => update('editorFontSize', Math.max(10, Math.min(24, Number(e.target.value))))}
                    className="w-16 rounded border border-shell-border bg-shell-bg px-2 py-1 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
                  />
                </SettingRow>

                <SettingRow label="Word wrap" description="Wrap long lines in the editor.">
                  <Toggle value={settings.editorWordWrap} onChange={(v) => update('editorWordWrap', v)} />
                </SettingRow>

                <SettingRow label="Minimap" description="Show code minimap in the editor.">
                  <Toggle value={settings.editorMinimap} onChange={(v) => update('editorMinimap', v)} />
                </SettingRow>
              </>
            ) : activeTab === 'versioning' ? (
              <>
                <SettingRow label="Create version on save" description="Automatically create a version snapshot when saving.">
                  <select
                    value={settings.versionOnSave}
                    onChange={(e) => update('versionOnSave', e.target.value as AppSettings['versionOnSave'])}
                    className="rounded border border-shell-border bg-shell-bg px-2 py-1 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="always">Always</option>
                    <option value="ask">Ask each time</option>
                    <option value="never">Never</option>
                  </select>
                </SettingRow>
              </>
            ) : (
              <div className="space-y-0.5">
                {shortcuts.map((s) => (
                  <div
                    key={s.keys}
                    className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-shell-hover/50"
                  >
                    <span className="text-xs text-gray-300">{s.action}</span>
                    <kbd className="rounded border border-shell-border bg-shell-bg px-2 py-0.5 text-[11px] font-mono text-gray-400">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-shell-border px-4 py-2 flex items-center justify-end">
            <div className="flex items-center gap-1 text-[10px] text-gray-600">
              <Save className="h-3 w-3" />
              Changes saved automatically
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper components ── */

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-200">{label}</p>
        <p className="mt-0.5 text-[11px] text-gray-500">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        value ? 'bg-blue-600' : 'bg-gray-600'
      }`}
      onClick={() => onChange(!value)}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow ${
          value ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
