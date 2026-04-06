import { useState, useMemo, useCallback } from 'react';
import {
  X,
  Search,
  Copy,
  BookTemplate,
  ArrowRight,
  Database,
  Shield,
  Upload,
  Webhook,
  Wrench,
} from 'lucide-react';
import {
  ENDPOINT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type EndpointTemplate,
} from './endpoint-templates';
import { useUiStore } from '../../stores/ui.store';
import { useEditorStore } from '../../stores/editor.store';

const METHOD_COLORS: Record<string, string> = {
  get: 'text-green-400 bg-green-500/15',
  post: 'text-blue-400 bg-blue-500/15',
  put: 'text-amber-400 bg-amber-500/15',
  patch: 'text-orange-400 bg-orange-500/15',
  delete: 'text-red-400 bg-red-500/15',
};

const CATEGORY_ICONS: Record<string, typeof Database> = {
  crud: Database,
  auth: Shield,
  upload: Upload,
  webhook: Webhook,
  utility: Wrench,
};

export function TemplateLibrary() {
  const isOpen = useUiStore((s) => s.templateLibraryOpen);
  const close = useCallback(() => useUiStore.getState().setTemplateLibraryOpen(false), []);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = ENDPOINT_TEMPLATES;
    if (category !== 'all') {
      list = list.filter((t) => t.category === category);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.pathSuffix.toLowerCase().includes(q),
      );
    }
    return list;
  }, [query, category]);

  const handleCopy = useCallback((template: EndpointTemplate) => {
    const yamlBlock = `${template.pathSuffix}:\n${template.yaml}`;
    void navigator.clipboard.writeText(yamlBlock).then(() => {
      setCopied(template.id);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);

  const handleInsert = useCallback(
    (template: EndpointTemplate) => {
      const { tabs, activeTabId, setTabContent } = useEditorStore.getState();
      const tab = tabs.find((t) => t.specFileId === activeTabId);
      if (!tab) return;

      // Insert the template YAML at the end of the file (before closing)
      const yamlBlock = `\n${template.pathSuffix}:\n${template.yaml}\n`;
      const newContent = tab.content + yamlBlock;
      setTabContent(tab.specFileId, newContent);
      close();
    },
    [close],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50" onClick={close}>
      <div
        className="flex h-[520px] w-[680px] overflow-hidden rounded-lg border border-shell-border bg-shell-sidebar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: categories */}
        <div className="flex w-[140px] shrink-0 flex-col border-r border-shell-border bg-[#1e1e1e] py-2">
          <div className="flex items-center gap-1.5 px-3 pb-2">
            <BookTemplate className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Templates</span>
          </div>
          {TEMPLATE_CATEGORIES.map((cat) => {
            const active = category === cat.id;
            const Icon = cat.id === 'all' ? BookTemplate : (CATEGORY_ICONS[cat.id] ?? BookTemplate);
            return (
              <button
                key={cat.id}
                type="button"
                className={`flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                  active ? 'bg-purple-500/15 text-purple-400' : 'text-gray-400 hover:bg-shell-hover hover:text-gray-200'
                }`}
                onClick={() => setCategory(cat.id)}
              >
                <Icon className="h-3 w-3" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Right: template list */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center gap-2 border-b border-shell-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              className="flex-1 bg-transparent text-xs text-gray-200 placeholder-gray-600 outline-none"
            />
            <button
              type="button"
              className="rounded p-1 text-gray-500 hover:bg-shell-hover hover:text-gray-300"
              onClick={close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-8">No templates match your search.</p>
            ) : (
              filtered.map((tpl) => {
                const CatIcon = CATEGORY_ICONS[tpl.category] ?? BookTemplate;
                const isCopied = copied === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className="rounded-md border border-shell-border bg-[#1e1e1e] p-3 hover:border-purple-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${METHOD_COLORS[tpl.method]}`}
                          >
                            {tpl.method}
                          </span>
                          <span className="text-xs font-medium text-gray-200">{tpl.name}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-gray-500">{tpl.description}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-600">
                          <CatIcon className="h-2.5 w-2.5" />
                          <span>{tpl.category}</span>
                          <code className="rounded bg-shell-hover px-1 py-0.5 font-mono text-gray-400">
                            {tpl.pathSuffix}
                          </code>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-gray-400 hover:bg-shell-hover hover:text-gray-200 transition-colors"
                          onClick={() => handleCopy(tpl)}
                          title="Copy YAML to clipboard"
                        >
                          <Copy className="h-3 w-3" />
                          {isCopied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-1 rounded bg-purple-600/80 px-2 py-1 text-[10px] font-medium text-white hover:bg-purple-500 transition-colors"
                          onClick={() => handleInsert(tpl)}
                          title="Insert into active file"
                        >
                          <ArrowRight className="h-3 w-3" />
                          Insert
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
