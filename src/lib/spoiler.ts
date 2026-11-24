export function isRedacted(
  titleIds: string[],
  watchedIds: Set<string>,
  spoilerShield: boolean,
): boolean {
  if (!spoilerShield || titleIds.length === 0) return false;
  return titleIds.some((id) => !watchedIds.has(id));
}

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  watchedIds: string[];
}

export function serializeWatchlistBackup(watchedIds: string[]): string {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    watchedIds: Array.from(new Set(watchedIds)),
  };
  return JSON.stringify(payload, null, 2);
}

export function parseImportedWatchlist(
  rawJson: string,
  validTitleIds: Set<string>,
): { ok: true; watchedIds: string[] } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { ok: false, error: 'Invalid JSON file or snippet.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Backup payload must be a JSON object.' };
  }

  const candidate = Array.isArray(parsed)
    ? parsed
    : (parsed as Record<string, unknown>).watchedIds;

  if (!Array.isArray(candidate)) {
    return { ok: false, error: 'Missing "watchedIds" array in backup JSON.' };
  }

  const cleanIds = Array.from(
    new Set(
      candidate.filter((item): item is string => typeof item === 'string' && validTitleIds.has(item)),
    ),
  );

  return { ok: true, watchedIds: cleanIds };
}
