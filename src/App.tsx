import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock,
  Flame,
  GitBranch,
  Globe2,
  Home,
  Menu,
  Network,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { CHARACTERS, REALITIES, TITLES, searchCatalog } from './data/index.ts';
import type { AppView } from './data/index.ts';
import { useAppState } from './state/useAppState.ts';
import { ImageLightboxProvider, TvaLogoMark } from './components/TvaArt.tsx';
import { DossierDrawer } from './components/DossierDrawer.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { CommandHub } from './components/CommandHub.tsx';
import { ConnectionGraph } from './components/ConnectionGraph.tsx';
import { SacredTimeline } from './components/SacredTimeline.tsx';
import { CharacterDirectory } from './components/CharacterDirectory.tsx';
import { FactionsHub } from './components/FactionsHub.tsx';
import { RealitiesAtlas } from './components/RealitiesAtlas.tsx';
import { ThreadsTracker } from './components/ThreadsTracker.tsx';
import { PathFinder } from './components/PathFinder.tsx';

const NAV_ITEMS: { id: AppView; num: string; label: string; icon: typeof Home }[] = [
  { id: 'hub', num: '01', label: 'Desk Overview', icon: Home },
  { id: 'graph', num: '02', label: 'CRT Multiverse Web', icon: Network },
  { id: 'timeline', num: '03', label: 'Timeline Reel', icon: Clock },
  { id: 'dossiers', num: '04', label: 'Personnel Mugshots', icon: Users },
  { id: 'factions', num: '05', label: 'Faction Dossiers', icon: Shield },
  { id: 'realities', num: '06', label: 'Realities & Places', icon: Globe2 },
  { id: 'threads', num: '07', label: 'Case Threads', icon: Flame },
  { id: 'pathfinder', num: '08', label: 'Path Tracer', icon: GitBranch },
];

export function App() {
  const {
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
    watchedIds,
    watchedSet,
    spoilerShield,
    showTheories,
    tmdbApiKey,
    welcomeExpanded,
    timelinePreset,
    setTimelinePreset,
    toggleWatched,
    markEraWatched,
    toggleSpoilerShield,
    toggleTheories,
    setTmdbApiKey,
    toggleWelcomeExpanded,
    openBeginnerWatchPath,
    exportBackupJson,
    importBackupJson,
    resetProgress,
    focusInGraph,
    traceFromEntity,
  } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [focusedFactionId, setFocusedFactionId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const daysToDoomsday = useMemo(() => {
    const release = new Date('2026-12-18T00:00:00').getTime();
    return Math.max(0, Math.ceil((release - Date.now()) / 86_400_000));
  }, []);

  const essentialProgress = useMemo(() => {
    const essentials = TITLES.filter((t) => t.importance === 'essential');
    const done = essentials.filter((t) => watchedSet.has(t.id)).length;
    const pct = essentials.length ? Math.round((done / essentials.length) * 100) : 0;
    return { done, total: essentials.length, pct };
  }, [watchedSet]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMobileMenuOpen(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
          setSearchOpen(true);
        }, 20);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setSelectedEntity(null);
        setSettingsOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setSelectedEntity]);

  const searchHits = useMemo(
    () => searchCatalog(searchQuery, showTheories, 12),
    [searchQuery, showTheories],
  );

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 gap-4 text-[#f5e7c8]">
      <div className="space-y-4">
        {/* Hardware Unit Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-[#3a2c22] pb-3">
          <button
            type="button"
            onClick={() => {
              setActiveView('hub');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 text-left group"
          >
            <TvaLogoMark className="w-8 h-8 shrink-0" />
            <div>
              <div className="text-[9px] font-mono-code uppercase tracking-widest text-[#c58f36]">
                TVA TEMPAD UNIT 07
              </div>
              <div className="text-sm font-bold text-[#faf3e3] group-hover:text-amber-400 transition-colors leading-tight">
                Doomsday Desk
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-[#a89984] hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amber LCD Readout */}
        <div className="rounded border-2 border-[#3c2d22] bg-[#0b0806] px-3 py-2 shadow-inner">
          <div className="flex items-center justify-between text-[9px] font-mono-code uppercase text-[#a88240]">
            <span>CONVERGENCE</span>
            <span>DEC 18, 2026</span>
          </div>
          <div className="mt-0.5 text-base font-mono-code font-bold text-[#f59e0b] tracking-wider">
            T-MINUS {daysToDoomsday} DAYS
          </div>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#a88240] absolute left-2.5 top-2.5" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            placeholder="Search archives (⌘K)..."
            className="w-full rounded border border-[#3c2d22] bg-[#110c09] pl-8 pr-2.5 py-1.5 text-xs text-[#faf3e3] placeholder-[#7c6a57] focus:border-[#f59e0b] focus:outline-none"
          />
          {searchOpen && searchHits.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 rounded border border-[#c58f36] bg-[#19120d] shadow-2xl max-h-72 overflow-y-auto z-50">
              {searchHits.map((hit) => (
                <button
                  key={`${hit.ref.kind}:${hit.ref.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedEntity(hit.ref);
                    setSearchOpen(false);
                    setSearchQuery('');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 border-b border-[#2c2118] last:border-none hover:bg-[#281e16] transition-colors"
                >
                  <div className="text-xs font-bold text-[#faf3e3] flex items-center gap-1.5">
                    {hit.isTheory && <Sparkles className="w-3 h-3 text-purple-400" />}
                    {hit.label}
                  </div>
                  <div className="text-[10px] font-mono-code text-[#b79f7d]">{hit.sublabel}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Indexed Filing Tabs */}
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ id, num, label, icon: Icon }) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveView(id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 rounded px-2.5 py-2 text-xs font-mono-code transition-colors ${
                  active
                    ? 'bg-[#f59e0b] text-[#17110c] font-bold shadow-sm'
                    : 'text-[#d4c2a2] hover:bg-[#281f18] hover:text-[#faf3e3]'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </span>
                <span className={`text-[10px] ${active ? 'text-[#17110c]/80' : 'text-[#7c6a57]'}`}>
                  {num}
                </span>
              </button>
            );
          })}
        </nav>

        {/* TemPad Loom Telemetry Widget — fills middle sidebar space cleanly */}
        <div className="rounded border border-[#3c2d22] bg-[#0e0a07] p-2.5 space-y-2 shadow-inner">
          <div className="flex items-center justify-between text-[9px] font-mono-code uppercase tracking-widest">
            <span className="text-[#c58f36] font-semibold">LOOM TELEMETRY</span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 tva-loom-pulse" />3 REALMS
            </span>
          </div>

          <svg viewBox="0 0 180 42" className="w-full h-10 rounded bg-[#140f0b] border border-[#2a1f17]" aria-hidden="true">
            <path d="M0 21 H180 M45 0 V42 M90 0 V42 M135 0 V42" stroke="#241b13" strokeWidth="0.7" />
            <path d="M2 22 C30 22, 48 11, 86 20 C120 28, 145 11, 178 14" fill="none" stroke="#f59e0b" strokeWidth="1.6" className="tva-loom-pulse" />
            <path d="M2 25 C38 26, 62 34, 98 22 C130 12, 152 29, 178 27" fill="none" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85" />
            <circle cx="86" cy="20" r="2.4" fill="#fbbf24" />
            <circle cx="145" cy="18" r="2.2" fill="#34d399" />
          </svg>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono-code">
              <span className="text-[#b79f7d]">ESSENTIAL PREP</span>
              <span className="text-amber-400 font-bold">
                {essentialProgress.done}/{essentialProgress.total} ({essentialProgress.pct}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#241b14] overflow-hidden border border-[#3c2d22]">
              <div
                className="h-full bg-gradient-to-r from-[#c2410c] via-[#f59e0b] to-[#10b981] transition-all duration-300"
                style={{ width: `${essentialProgress.pct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-[9px] font-mono-code text-[#8c7862] border-t border-[#261c14] pt-1.5">
            <span className="truncate">{TITLES.length}T · {CHARACTERS.length}C · {REALITIES.length}R</span>
            <button
              type="button"
              onClick={() => {
                setActiveView('timeline');
                setMobileMenuOpen(false);
              }}
              className="text-amber-400 hover:underline font-semibold shrink-0"
            >
              Reel →
            </button>
          </div>
        </div>
      </div>

      {/* Physical Rocker Switch Bank */}
      <div className="space-y-2 border-t border-[#3a2c22] pt-3">
        <div className="text-[9px] font-mono-code uppercase tracking-widest text-[#a88240]">
          SECURITY SWITCHES
        </div>

        <button
          type="button"
          onClick={toggleSpoilerShield}
          className={`w-full flex items-center justify-between rounded border px-2.5 py-2 text-[11px] font-mono-code font-semibold transition-colors ${
            spoilerShield
              ? 'border-amber-400 bg-amber-500 text-black'
              : 'border-[#3c2d22] bg-[#120d09] text-[#d4c2a2] hover:border-[#c58f36]'
          }`}
          title="Hide summaries and character beats for unwatched titles"
        >
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            REDACT UNWATCHED
          </span>
          <span>{spoilerShield ? 'ON' : 'OFF'}</span>
        </button>

        <button
          type="button"
          onClick={toggleTheories}
          className={`w-full flex items-center justify-between rounded border px-2.5 py-2 text-[11px] font-mono-code font-semibold transition-colors ${
            showTheories
              ? 'border-purple-400 bg-purple-600/30 text-purple-200'
              : 'border-[#3c2d22] bg-[#120d09] text-[#d4c2a2] hover:border-[#c58f36]'
          }`}
          title="Toggle unconfirmed theory layer"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            THEORY LAYER
          </span>
          <span>{showTheories ? 'ON' : 'OFF'}</span>
        </button>

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 rounded border border-[#3c2d22] bg-[#241b15] px-2.5 py-1.5 text-[11px] font-mono-code text-[#c58f36] hover:border-[#f59e0b]"
        >
          <Settings className="w-3.5 h-3.5" /> Settings &amp; JSON Backup
        </button>
      </div>
    </div>
  );

  return (
    <ImageLightboxProvider>
      <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Faint Silver-Age Comic Vectors, Halftone Bands & Square Polaroid Comic Clippings */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 lg:left-64 w-full lg:w-[calc(100%-16rem)] h-full overflow-hidden z-0"
      >
        <div className="absolute -top-6 right-4 w-48 h-48 tva-halftone-dot opacity-[0.26] rounded-full" />
        <div className="absolute -bottom-8 left-4 w-52 h-36 tva-halftone-teal opacity-[0.22]" />

        {/* Square Polaroid-style comic clippings pinned in outer margins */}
        <div className="hidden lg:flex flex-col gap-1.5 tva-bg-polaroid rounded-sm p-1.5 pb-2 w-28 absolute top-8 right-5 rotate-6 opacity-[0.26]">
          <span className="tva-tape pointer-events-none" />
          <div className="w-full aspect-square overflow-hidden border border-[#d6c7aa] bg-[#1e1712]">
            <img src="./comic/comic-portal.jpg" alt="" className="w-full h-full object-cover sepia-[0.25] contrast-125" />
          </div>
          <span className="text-[8px] font-mono-code font-bold tracking-wider text-[#1d1610] uppercase truncate">
            KIRBY RIFT // 828
          </span>
        </div>

        <div className="hidden lg:flex flex-col gap-1.5 tva-bg-polaroid rounded-sm p-1.5 pb-2 w-28 absolute bottom-10 right-7 -rotate-6 opacity-[0.24]">
          <span className="tva-tape pointer-events-none" />
          <div className="w-full aspect-square overflow-hidden border border-[#d6c7aa] bg-[#1e1712]">
            <img src="./comic/comic-citadel.svg" alt="" className="w-full h-full object-cover" />
          </div>
          <span className="text-[8px] font-mono-code font-bold tracking-wider text-[#1d1610] uppercase truncate">
            CASTLE DOOM
          </span>
        </div>

        <div className="hidden xl:flex flex-col gap-1.5 tva-bg-polaroid rounded-sm p-1.5 pb-2 w-28 absolute top-[44%] left-3 -rotate-12 opacity-[0.24]">
          <span className="tva-tape pointer-events-none" />
          <div className="w-full aspect-square overflow-hidden border border-[#d6c7aa] bg-[#1e1712]">
            <img src="./comic/comic-clockwork.svg" alt="" className="w-full h-full object-cover" />
          </div>
          <span className="text-[8px] font-mono-code font-bold tracking-wider text-[#1d1610] uppercase truncate">
            LOOM NEXUS
          </span>
        </div>

        <div className="hidden lg:flex flex-col gap-1.5 tva-bg-polaroid rounded-sm p-1.5 pb-2 w-28 absolute bottom-8 left-8 rotate-12 opacity-[0.23]">
          <span className="tva-tape pointer-events-none" />
          <div className="w-full aspect-square overflow-hidden border border-[#d6c7aa] bg-[#1e1712]">
            <img src="./comic/comic-starburst.svg" alt="" className="w-full h-full object-cover" />
          </div>
          <span className="text-[8px] font-mono-code font-bold tracking-wider text-[#1d1610] uppercase truncate">
            MULTIVERSE IMPACT
          </span>
        </div>

        <svg
          viewBox="0 0 1200 840"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          {/* Drafting rings & timeline arcs */}
          <g fill="none" stroke="#5a3d1e" opacity="0.065">
            <circle cx="880" cy="230" r="245" strokeWidth="1.2" strokeDasharray="8 6" />
            <circle cx="880" cy="230" r="185" strokeWidth="0.9" />
            <circle cx="270" cy="620" r="165" strokeWidth="1" strokeDasharray="6 6" />
            <path d="M-40 440 Q 280 430 480 330 T 1240 160" strokeWidth="1.6" />
            <path d="M180 420 Q 450 540 760 570 T 1240 605" strokeWidth="1.2" strokeDasharray="5 5" />
          </g>

          {/* Silver-Age Comic Shapes: Lightning bolts, Starburst, Speech Silhouette & Kirby Krackle */}
          <g fill="none" stroke="#c2410c" opacity="0.11" strokeLinecap="round" strokeLinejoin="round">
            {/* Comic lightning bolt top-left margin */}
            <path d="M72 48 L44 102 H72 L52 154 L106 90 H78 Z" strokeWidth="2.4" fill="#c2410c" fillOpacity="0.08" />
            {/* Jagged caption-box frame bottom-right */}
            <polygon points="1040,565 1145,555 1138,610 1160,628 1055,638" strokeWidth="2" strokeDasharray="5 3" />
          </g>

          <g fill="none" stroke="#0f766e" opacity="0.11" strokeLinecap="round" strokeLinejoin="round">
            {/* Empty vintage speech-bubble silhouette left mid */}
            <path d="M36 285 Q36 250 88 250 Q140 250 140 285 Q140 318 96 320 L74 342 L78 320 Q36 318 36 285 Z" strokeWidth="2.2" />
            {/* Action burst */}
            <path d="M1070 390 L1085 422 L1118 408 L1098 438 L1132 454 L1094 460 L1106 492 L1076 472 L1052 496 L1060 462 L1026 452 L1058 436 Z" strokeWidth="1.8" />
          </g>

          {/* Kirby Krackle Energy Dot Clusters */}
          <g fill="#2b1e12" opacity="0.12">
            <circle cx="96" cy="198" r="7" /><circle cx="110" cy="190" r="4" /><circle cx="86" cy="212" r="5" /><circle cx="115" cy="206" r="3.5" /><circle cx="98" cy="182" r="3" />
            <circle cx="1115" cy="285" r="8" /><circle cx="1132" cy="274" r="4.5" /><circle cx="1102" cy="300" r="5.5" /><circle cx="1136" cy="296" r="3.5" /><circle cx="1118" cy="264" r="3" />
          </g>

          {/* Print-proof Corner Crop Marks (+) & Vertical Comic Margin Ticks */}
          <g stroke="#5a3d1e" strokeWidth="1.2" opacity="0.16">
            <path d="M24 14 V34 M14 24 H34" />
            <path d="M1176 14 V34 M1166 24 H1186" />
            <path d="M24 806 V826 M14 816 H34" />
            <path d="M1176 806 V826 M1166 816 H1186" />
            <path d="M1190 120 H1200 M1190 180 H1200 M1190 240 H1200 M1190 300 H1200 M1190 360 H1200 M1190 420 H1200 M1190 480 H1200 M1190 540 H1200 M1190 600 H1200 M1190 660 H1200" />
          </g>
        </svg>
      </div>

      {/* Mobile Top Hardware Strip */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-[#1b1511] text-[#faf3e3] border-b border-[#3a2c22]">
        <button
          type="button"
          onClick={() => setActiveView('hub')}
          className="flex items-center gap-2"
        >
          <TvaLogoMark className="w-7 h-7" />
          <span className="text-sm font-bold font-display">TVA Doomsday Desk</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSpoilerShield}
            className={`rounded px-2 py-1 text-[10px] font-mono-code font-bold ${
              spoilerShield ? 'bg-amber-500 text-black' : 'bg-[#2a2018] text-[#d4c2a2]'
            }`}
          >
            {spoilerShield ? 'REDACTED' : 'REDACT'}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded bg-[#2a2018] text-amber-400"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="w-72 h-full bg-[#1b1511] border-r-2 border-[#3c2d22] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Left Fixed Bakelite TemPad Hardware Console */}
      <aside className="hidden lg:block w-64 shrink-0 bg-[#1b1511] border-r-2 border-[#3c2d22] sticky top-0 h-screen overflow-y-auto shadow-xl z-20">
        {sidebarContent}
      </aside>

      {/* Right Bright Cream Archival Desk Workspace */}
      <main
        className="relative z-10 flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto w-full"
        onClick={() => setSearchOpen(false)}
      >
        {activeView === 'hub' && (
          <CommandHub
            watchedSet={watchedSet}
            spoilerShield={spoilerShield}
            showTheories={showTheories}
            tmdbApiKey={tmdbApiKey}
            welcomeExpanded={welcomeExpanded}
            onToggleWelcome={toggleWelcomeExpanded}
            onOpenBeginnerPath={openBeginnerWatchPath}
            onSelect={setSelectedEntity}
            onNavigate={setActiveView}
            onOpenFaction={(factionId) => {
              setFocusedFactionId(factionId);
              setActiveView('factions');
            }}
            onLaunchPresetPath={(fromKey, toKey) => {
              setPathOriginKey(fromKey);
              setPathTargetKey(toKey);
              setActiveView('pathfinder');
            }}
          />
        )}

        {activeView === 'graph' && (
          <ConnectionGraph
            showTheories={showTheories}
            focusKey={graphFocusKey}
            onClearFocusKey={() => setGraphFocusKey(null)}
            onSelect={setSelectedEntity}
          />
        )}

        {activeView === 'timeline' && (
          <SacredTimeline
            watchedSet={watchedSet}
            spoilerShield={spoilerShield}
            tmdbApiKey={tmdbApiKey}
            timelinePreset={timelinePreset}
            onChangePreset={setTimelinePreset}
            onToggleWatched={toggleWatched}
            onMarkEraWatched={markEraWatched}
            onSelect={setSelectedEntity}
          />
        )}

        {activeView === 'dossiers' && (
          <CharacterDirectory
            watchedSet={watchedSet}
            spoilerShield={spoilerShield}
            tmdbApiKey={tmdbApiKey}
            onSelect={setSelectedEntity}
          />
        )}

        {activeView === 'factions' && (
          <FactionsHub
            watchedSet={watchedSet}
            spoilerShield={spoilerShield}
            tmdbApiKey={tmdbApiKey}
            initialExpandedFactionId={focusedFactionId}
            onClearInitialFaction={() => setFocusedFactionId(null)}
            onSelect={setSelectedEntity}
          />
        )}

        {activeView === 'realities' && (
          <RealitiesAtlas
            watchedSet={watchedSet}
            spoilerShield={spoilerShield}
            onSelect={setSelectedEntity}
          />
        )}

        {activeView === 'threads' && (
          <ThreadsTracker
            watchedSet={watchedSet}
            spoilerShield={spoilerShield}
            showTheories={showTheories}
            onSelect={setSelectedEntity}
          />
        )}

        {activeView === 'pathfinder' && (
          <PathFinder
            originKey={pathOriginKey}
            targetKey={pathTargetKey}
            onChangeOrigin={setPathOriginKey}
            onChangeTarget={setPathTargetKey}
            showTheories={showTheories}
            watchedSet={watchedSet}
            spoilerShield={spoilerShield}
            tmdbApiKey={tmdbApiKey}
            onSelect={setSelectedEntity}
          />
        )}

        <footer className="mt-10 border-t border-[#cbb895] pt-4 pb-6 text-[11px] text-[#61503e] leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p>
            Title posters &amp; actor portraits fetched live via{' '}
            <a
              href="https://www.mediawiki.org/wiki/API:Main_page"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#9a3412]"
            >
              Wikipedia / Wikimedia API
            </a>{' '}
            (promotional media remains property of its respective studios/copyright holders). Location plates use custom archival MCU illustrations.
          </p>
          <p className="font-mono-code text-[10px] shrink-0">
            Optional key search uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </footer>
      </main>

      <DossierDrawer
        selected={selectedEntity}
        onClose={() => setSelectedEntity(null)}
        onSelect={setSelectedEntity}
        onFocusGraph={focusInGraph}
        onTracePath={traceFromEntity}
        watchedSet={watchedSet}
        onToggleWatched={toggleWatched}
        spoilerShield={spoilerShield}
        showTheories={showTheories}
        tmdbApiKey={tmdbApiKey}
      />

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          tmdbApiKey={tmdbApiKey}
          onSaveTmdbKey={setTmdbApiKey}
          watchedCount={watchedIds.length}
          onExportBackup={exportBackupJson}
          onImportBackup={importBackupJson}
          onResetProgress={resetProgress}
        />
      )}
      </div>
    </ImageLightboxProvider>
  );
}

export default App;
