import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TITLES,
  entityKey,
  parseEntityKey,
  titlesById,
} from '../data/index.ts';
import type { AppView, EntityRef } from '../data/index.ts';
import type { TitleEra } from '../data/types.ts';
import { parseImportedWatchlist, serializeWatchlistBackup } from '../lib/spoiler.ts';

const STORAGE_KEY = 'tva-doomsday-state-v1';

export type TimelinePreset = 'all' | 'beginner' | 'essential' | 'key';

interface StoredState {
  watchedIds: string[];
  spoilerShield: boolean;
  showTheories: boolean;
  tmdbApiKey: string;
  welcomeDismissed: boolean;
}

const DEFAULT_STORED: StoredState = {
  watchedIds: [],
  spoilerShield: false,
  showTheories: false,
  tmdbApiKey: '',
  welcomeDismissed: false,
};

const VALID_VIEWS = new Set<AppView>([
  'hub',
  'graph',
  'timeline',
  'dossiers',
  'factions',
  'realities',
  'threads',
  'pathfinder',
]);

function readInitialStorage(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORED;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      watchedIds: Array.isArray(parsed.watchedIds)
        ? parsed.watchedIds.filter((id): id is string => typeof id === 'string' && titlesById.has(id))
        : [],
      spoilerShield: Boolean(parsed.spoilerShield),
      showTheories: Boolean(parsed.showTheories),
      tmdbApiKey: typeof parsed.tmdbApiKey === 'string' ? parsed.tmdbApiKey : '',
      welcomeDismissed: Boolean(parsed.welcomeDismissed),
    };
  } catch {
    return DEFAULT_STORED;
  }
}

function readInitialUrl(): { view: AppView; selected: EntityRef | null } {
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view') as AppView | null;
    const view = v && VALID_VIEWS.has(v) ? v : 'hub';
    const e = params.get('entity');
    const selected = e ? parseEntityKey(e) : null;
    return { view, selected };
  } catch {
    return { view: 'hub', selected: null };
  }
}

export function useAppState() {
  const [stored, setStored] = useState<StoredState>(readInitialStorage);
  const initialUrl = useMemo(readInitialUrl, []);
  const [activeView, setActiveView] = useState<AppView>(initialUrl.view);
  const [selectedEntity, setSelectedEntity] = useState<EntityRef | null>(initialUrl.selected);
  const [graphFocusKey, setGraphFocusKey] = useState<string | null>(null);
  const [pathOriginKey, setPathOriginKey] = useState<string>('title:x-men-2000');
  const [pathTargetKey, setPathTargetKey] = useState<string>('title:avengers-doomsday');
  const [timelinePreset, setTimelinePreset] = useState<TimelinePreset>('all');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Ignore storage quota errors
    }
  }, [stored]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      params.set('view', activeView);
      if (selectedEntity) {
        params.set('entity', entityKey(selectedEntity));
      } else {
        params.delete('entity');
      }
      const next = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', next);
    } catch {
      // Ignore history API restrictions
    }
  }, [activeView, selectedEntity]);

  const watchedSet = useMemo(() => new Set(stored.watchedIds), [stored.watchedIds]);

  const toggleWatched = useCallback((titleId: string) => {
    if (!titlesById.has(titleId)) return;
    setStored((prev) => {
      const exists = prev.watchedIds.includes(titleId);
      const watchedIds = exists
        ? prev.watchedIds.filter((id) => id !== titleId)
        : [...prev.watchedIds, titleId];
      return { ...prev, watchedIds };
    });
  }, []);

  const markEraWatched = useCallback((era: TitleEra, watched: boolean) => {
    const eraIds = TITLES.filter((t) => t.era === era).map((t) => t.id);
    setStored((prev) => {
      const nextSet = new Set(prev.watchedIds);
      for (const id of eraIds) {
        if (watched) nextSet.add(id);
        else nextSet.delete(id);
      }
      return { ...prev, watchedIds: Array.from(nextSet) };
    });
  }, []);

  const toggleSpoilerShield = useCallback(() => {
    setStored((prev) => ({ ...prev, spoilerShield: !prev.spoilerShield }));
  }, []);

  const toggleTheories = useCallback(() => {
    setStored((prev) => ({ ...prev, showTheories: !prev.showTheories }));
  }, []);

  const setTmdbApiKey = useCallback((tmdbApiKey: string) => {
    setStored((prev) => ({ ...prev, tmdbApiKey }));
  }, []);

  const toggleWelcomeDismissed = useCallback(() => {
    setStored((prev) => ({ ...prev, welcomeDismissed: !prev.welcomeDismissed }));
  }, []);

  const openBeginnerWatchPath = useCallback(() => {
    setTimelinePreset('beginner');
    setActiveView('timeline');
  }, []);

  const exportBackupJson = useCallback(() => {
    return serializeWatchlistBackup(stored.watchedIds);
  }, [stored.watchedIds]);

  const importBackupJson = useCallback((rawJson: string) => {
    const validIds = new Set(titlesById.keys());
    const result = parseImportedWatchlist(rawJson, validIds);
    if (!result.ok) return result;
    setStored((prev) => ({ ...prev, watchedIds: result.watchedIds }));
    return result;
  }, []);

  const resetProgress = useCallback(() => {
    setStored((prev) => ({ ...prev, watchedIds: [] }));
  }, []);

  const focusInGraph = useCallback((ref: EntityRef) => {
    setGraphFocusKey(entityKey(ref));
    setSelectedEntity(ref);
    setActiveView('graph');
  }, []);

  const traceFromEntity = useCallback((ref: EntityRef) => {
    const key = entityKey(ref);
    setPathOriginKey(key);
    setPathTargetKey(key === 'title:avengers-doomsday' ? 'character:doctor-doom' : 'title:avengers-doomsday');
    setSelectedEntity(null);
    setActiveView('pathfinder');
  }, []);

  return {
    activeView,
    setActiveView,
    selectedEntity,
    setSelectedEntity,
    graphFocusKey,
    setGraphFocusKey,
    pathOriginKey,
    setPathOriginKey,
    pathTargetKey,
    setPathTargetKey,
    watchedIds: stored.watchedIds,
    watchedSet,
    spoilerShield: stored.spoilerShield,
    showTheories: stored.showTheories,
    tmdbApiKey: stored.tmdbApiKey,
    welcomeDismissed: stored.welcomeDismissed,
    timelinePreset,
    setTimelinePreset,
    toggleWatched,
    markEraWatched,
    toggleSpoilerShield,
    toggleTheories,
    setTmdbApiKey,
    toggleWelcomeDismissed,
    openBeginnerWatchPath,
    exportBackupJson,
    importBackupJson,
    resetProgress,
    focusInGraph,
    traceFromEntity,
  };
}
