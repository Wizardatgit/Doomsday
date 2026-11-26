import { useRef, useState, type ChangeEvent } from 'react';
import { Download, KeyRound, RotateCcw, Upload, X } from 'lucide-react';
import { TITLES } from '../data/index.ts';
import { useDialogA11y } from '../lib/useDialogA11y.ts';

export function SettingsModal({
  onClose,
  tmdbApiKey,
  onSaveTmdbKey,
  watchedCount,
  onExportBackup,
  onImportBackup,
  onResetProgress,
}: {
  onClose: () => void;
  tmdbApiKey: string;
  onSaveTmdbKey: (key: string) => void;
  watchedCount: number;
  onExportBackup: () => string;
  onImportBackup: (raw: string) => { ok: true; watchedIds: string[] } | { ok: false; error: string };
  onResetProgress: () => void;
}) {
  const [keyDraft, setKeyDraft] = useState(tmdbApiKey);
  const [importText, setImportText] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(dialogRef, true);

  const handleDownload = () => {
    const json = onExportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tva-doomsday-watchlist-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Watchlist JSON exported.');
  };

  const handleFileImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = onImportBackup(text);
      setStatusMsg(res.ok ? `Imported ${res.watchedIds.length} watched titles.` : res.error);
    } catch {
      setStatusMsg('Could not read the selected file.');
    } finally {
      input.value = '';
    }
  };

  const handleTextImport = () => {
    const res = onImportBackup(importText);
    if (res.ok) {
      setStatusMsg(`Imported ${res.watchedIds.length} watched titles.`);
      setImportText('');
    } else {
      setStatusMsg(res.error);
    }
  };

  return (
    <div
      className="tva-backdrop-fade fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[1px] p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        tabIndex={-1}
        className="tva-folder tva-modal-pop w-full max-w-lg rounded-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#cbb895] pb-3">
          <div>
            <p className="text-[11px] font-mono-code uppercase tracking-widest text-[#b45309] font-semibold">
              TVA Terminal Configuration
            </p>
            <h2 id="settings-modal-title" className="text-xl font-bold text-[#1d1610]">
              Settings &amp; Watchlist Backup
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#e6d7ba] text-[#61503e] hover:text-[#1d1610]"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <section className="space-y-2">
          <label
            htmlFor="tmdb-api-key-input"
            className="flex items-center gap-2 text-sm font-semibold text-[#1d1610]"
          >
            <KeyRound className="w-4 h-4 text-[#b45309]" />
            Optional TMDB v3 API Key Override
          </label>
          <p className="text-xs text-[#61503e] leading-relaxed">
            Character portraits and title posters already load automatically with zero API key via Wikimedia. Optionally paste a free TMDB v3 key to prefer live TMDB title/actor search stills (kept locally in browser storage; this desk uses the TMDB API if supplied and is not endorsed or certified by TMDB).
          </p>
          <div className="flex gap-2">
            <input
              id="tmdb-api-key-input"
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="Paste optional TMDB v3 API key..."
              className="flex-1 rounded border border-[#cbb895] bg-[#fffaf0] px-3 py-2 text-sm font-mono-code text-[#1d1610] focus:border-[#b45309] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                onSaveTmdbKey(keyDraft.trim());
                setStatusMsg(keyDraft.trim() ? 'TMDB API key saved locally.' : 'TMDB key cleared (using built-in Wikimedia imagery).');
              }}
              className="rounded bg-[#1d1610] px-3.5 py-2 text-xs font-mono-code font-bold uppercase text-[#faf4e6] hover:bg-[#35281e]"
            >
              Save
            </button>
          </div>
        </section>

        <section className="space-y-3 border-t border-[#cbb895] pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#1d1610]">
                Watchlist Backup ({watchedCount} / {TITLES.length} watched)
              </h3>
              <p className="text-xs text-[#61503e]">Export or restore your checklist as JSON.</p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded border border-[#b45309] bg-[#b45309]/10 px-3 py-1.5 text-xs font-mono-code font-semibold text-[#9a3412] hover:bg-[#b45309]/20"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
          </div>

          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 cursor-pointer rounded border border-[#cbb895] bg-[#fffaf0] px-3 py-1.5 text-xs font-mono-code text-[#1d1610] hover:border-[#b45309]">
              <Upload className="w-3.5 h-3.5 text-[#b45309]" />
              Import .json file
              <input type="file" accept="application/json,.json" onChange={handleFileImport} className="hidden" />
            </label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                aria-label="Paste watchlist backup JSON"
                placeholder='Or paste JSON: {"watchedIds":["iron-man","thunderbolts"]}'
                className="flex-1 rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1.5 text-xs font-mono-code text-[#1d1610] focus:border-[#b45309] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTextImport}
                disabled={!importText.trim()}
                className="rounded border border-[#cbb895] bg-[#fffaf0] px-3 py-1.5 text-xs font-mono-code font-semibold text-[#b45309] hover:border-[#b45309] disabled:opacity-40"
              >
                Import
              </button>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#cbb895] pt-4">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirmReset(false);
                  setStatusMsg('Watchlist progress cleared.');
                }}
                className="rounded border border-[#b91c1c] bg-[#b91c1c] px-2.5 py-1 text-xs font-mono-code font-bold text-white hover:bg-[#991b1b]"
              >
                Confirm Reset?
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs font-mono-code text-[#61503e] hover:text-[#1d1610]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 text-xs font-mono-code text-[#b91c1c] hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Watchlist
            </button>
          )}
          <span role="status" aria-live="polite" className="text-xs font-mono-code font-semibold text-[#047857]">
            {statusMsg ?? ''}
          </span>
        </div>
      </div>
    </div>
  );
}
