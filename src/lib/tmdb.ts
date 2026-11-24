const sessionCache = new Map<string, string | null>();
const STORAGE_PREFIX = 'tva-tmdb-cache:';

export function getEffectiveTmdbKey(userKey: string): string {
  const trimmed = userKey.trim();
  if (trimmed) return trimmed;
  // Safe optional Vite env fallback when running in browser bundle
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  return env?.VITE_TMDB_API_KEY?.trim() ?? '';
}

export async function fetchTmdbImage(
  params:
    | { kind: 'title'; mediaType: 'movie' | 'tv'; id: number }
    | { kind: 'person'; id: number },
  apiKey: string,
): Promise<string | null> {
  const key = apiKey.trim();
  if (!key) return null;

  const cacheKey =
    params.kind === 'title' ? `${params.mediaType}:${params.id}` : `person:${params.id}`;

  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey) ?? null;
  }

  try {
    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_PREFIX + cacheKey) : null;
    if (stored !== null) {
      const val = stored === 'NONE' ? null : stored;
      sessionCache.set(cacheKey, val);
      return val;
    }
  } catch {
    // Ignore storage read errors in restricted contexts
  }

  const endpoint =
    params.kind === 'title'
      ? `https://api.themoviedb.org/3/${params.mediaType}/${params.id}?api_key=${encodeURIComponent(key)}`
      : `https://api.themoviedb.org/3/person/${params.id}?api_key=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      sessionCache.set(cacheKey, null);
      return null;
    }
    const data = (await res.json()) as { poster_path?: string; profile_path?: string };
    const path = params.kind === 'title' ? data.poster_path : data.profile_path;
    const url = path ? `https://image.tmdb.org/t/p/w500${path}` : null;
    sessionCache.set(cacheKey, url);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(STORAGE_PREFIX + cacheKey, url ?? 'NONE');
      }
    } catch {
      // Ignore storage quota errors
    }
    return url;
  } catch {
    sessionCache.set(cacheKey, null);
    return null;
  }
}
