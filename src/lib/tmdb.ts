const sessionCache = new Map<string, string | null>();
const STORAGE_PREFIX = 'tva-tmdb-search:v2:';

export type TmdbQuery =
  | { kind: 'title'; mediaType: 'movie' | 'tv'; title: string; year: number }
  | { kind: 'person'; name: string };

export function titleTmdbQuery(item: {
  kind: string;
  title: string;
  year: number;
  runtime?: string;
}): TmdbQuery {
  const isTv =
    item.kind === 'series' ||
    (item.kind === 'animated' && /\beps\b|\bseason/i.test(item.runtime ?? ''));
  const cleanTitle = item.title.replace(/(\s*\([^)]*\))+$/g, '').trim() || item.title;
  return {
    kind: 'title',
    mediaType: isTv ? 'tv' : 'movie',
    title: cleanTitle,
    year: item.year,
  };
}

export function personTmdbQuery(actor: string): TmdbQuery | undefined {
  const clean = actor.trim();
  if (!clean || /^(tba|various|unknown)/i.test(clean)) return undefined;
  return { kind: 'person', name: clean };
}

export function getEffectiveTmdbKey(userKey: string): string {
  const trimmed = userKey.trim();
  if (trimmed) return trimmed;
  // Safe optional Vite env fallback when running in browser bundle
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  return env?.VITE_TMDB_API_KEY?.trim() ?? '';
}

export function buildTmdbSearchUrl(params: TmdbQuery, apiKey: string): string {
  const key = apiKey.trim();
  if (params.kind === 'title') {
    const qs = new URLSearchParams({
      api_key: key,
      query: params.title,
      ...(params.mediaType === 'movie'
        ? { year: String(params.year) }
        : { first_air_date_year: String(params.year) }),
    });
    return `https://api.themoviedb.org/3/search/${params.mediaType}?${qs.toString()}`;
  }
  const qs = new URLSearchParams({
    api_key: key,
    query: params.name,
  });
  return `https://api.themoviedb.org/3/search/person?${qs.toString()}`;
}

export async function fetchTmdbImage(
  params: TmdbQuery,
  apiKey: string,
): Promise<string | null> {
  const key = apiKey.trim();
  if (!key) return null;

  const cacheKey =
    params.kind === 'title'
      ? `${params.mediaType}:${params.title}:${params.year}`
      : `person:${params.name}`;

  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey) ?? null;
  }

  try {
    const stored =
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem(STORAGE_PREFIX + cacheKey)
        : null;
    if (stored !== null) {
      const val = stored === 'NONE' ? null : stored;
      sessionCache.set(cacheKey, val);
      return val;
    }
  } catch {
    // Ignore storage read errors in restricted contexts
  }

  const endpoint = buildTmdbSearchUrl(params, key);

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      sessionCache.set(cacheKey, null);
      return null;
    }
    const data = (await res.json()) as {
      results?: { poster_path?: string | null; profile_path?: string | null }[];
    };
    const first = data.results?.[0];
    const path = params.kind === 'title' ? first?.poster_path : first?.profile_path;
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
