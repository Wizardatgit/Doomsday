import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
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
import { BEGINNER_12_IDS, TITLES, searchCatalog, titlesById } from './data/index.ts';
import type { AppView } from './data/index.ts';
import { resolveEscapeDismissal, useAppState } from './state/useAppState.ts';
import { useDialogA11y } from './lib/useDialogA11y.ts';
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

function getDoomsdayCountdown() {
  const diff = Math.max(0, new Date('2026-12-18T00:00:00').getTime() - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    mins: Math.floor((diff % 3_600_000) / 60_000),
    secs: Math.floor((diff % 60_000) / 1000),
  };
}

const NAV_ITEMS: { id: AppView; label: string; icon: typeof Home }[] = [
  { id: 'hub', label: 'Desk Overview', icon: Home },
  { id: 'graph', label: 'CRT Multiverse Web', icon: Network },
  { id: 'timeline', label: 'Timeline Reel', icon: Clock },
  { id: 'dossiers', label: 'Personnel Mugshots', icon: Users },
  { id: 'factions', label: 'Faction Dossiers', icon: Shield },
  { id: 'realities', label: 'Realities & Places', icon: Globe2 },
  { id: 'threads', label: 'Case Threads', icon: Flame },
  { id: 'pathfinder', label: 'Path Tracer', icon: GitBranch },
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
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const mobileDrawerRef = useRef<HTMLElement>(null);
  useDialogA11y(mobileDrawerRef, mobileMenuOpen);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeView]);

  const [countdown, setCountdown] = useState(getDoomsdayCountdown);

  useEffect(() => {
    const id = window.setInterval(() => setCountdown(getDoomsdayCountdown()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const watchProgress = useMemo(() => {
    const essentials = TITLES.filter((t) => t.importance === 'essential');
    const essentialDone = essentials.filter((t) => watchedSet.has(t.id)).length;
    const essentialPct = essentials.length ? Math.round((essentialDone / essentials.length) * 100) : 0;
    const allTotal = TITLES.length;
    const allDone = watchedSet.size;
    const allPct = allTotal ? Math.round((allDone / allTotal) * 100) : 0;
    const nextBeginnerId = BEGINNER_12_IDS.find((id) => !watchedSet.has(id));
    const nextTitle =
      (nextBeginnerId ? titlesById.get(nextBeginnerId) : undefined) ??
      essentials.find((t) => t.id !== 'avengers-doomsday' && !watchedSet.has(t.id)) ??
      null;
    return {
      essentialDone,
      essentialTotal: essentials.length,
      essentialPct,
      allDone,
      allTotal,
      allPct,
      nextTitle,
    };
  }, [watchedSet]);

  const searchHits = useMemo(
    () => searchCatalog(searchQuery, showTheories, 12),
    [searchQuery, showTheories],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
        if (isMobile) {
          setMobileMenuOpen(true);
          setTimeout(() => {
            mobileSearchRef.current?.focus();
            setSearchOpen(true);
          }, 20);
        } else {
          desktopSearchRef.current?.focus();
          setSearchOpen(true);
        }
      } else if (e.key === 'Escape') {
        const target = resolveEscapeDismissal({
          settingsOpen,
          searchOpen: searchOpen && searchHits.length > 0,
          hasSelectedEntity: Boolean(selectedEntity),
          mobileMenuOpen,
        });
        if (target === 'settings') setSettingsOpen(false);
        else if (target === 'search') setSearchOpen(false);
        else if (target === 'dossier') setSelectedEntity(null);
        else if (target === 'mobileMenu') {
          setSearchOpen(false);
          setMobileMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settingsOpen, searchOpen, searchHits.length, selectedEntity, mobileMenuOpen, setSelectedEntity]);

  const renderSidebar = (searchInputRef: RefObject<HTMLInputElement | null>) => (
    <div className="flex flex-col min-h-full p-2.5 gap-2 text-[#f5e7c8]">
      <div className="shrink-0 space-y-2">
        {/* Hardware Unit Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-[#3a2c22] pb-2">
          <button
            type="button"
            onClick={() => {
              setActiveView('hub');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 text-left group"
          >
            <TvaLogoMark className="w-7 h-7 shrink-0" />
            <div>
              <div className="text-[10px] font-mono-code uppercase tracking-widest text-[#e5a93b]">
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
            className="lg:hidden p-1 text-[#b5a287] hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amber LCD Readout */}
        <div className="rounded border-2 border-[#3c2d22] bg-[#0b0806] px-2.5 py-1.5 shadow-inner flex items-center justify-between gap-2">
          <div className="text-[10px] font-mono-code uppercase text-[#d6a34f] leading-tight">
            <div>CONVERGENCE</div>
            <div className="text-[#b5a287]">DEC 18, 2026</div>
          </div>
          <div className="text-right font-mono-code leading-tight tabular-nums">
            <div className="text-sm font-bold text-[#f59e0b] tracking-wide">
              T-{countdown.days}D
            </div>
            <div className="text-[9px] text-[#c58f36]">
              {String(countdown.hours).padStart(2, '0')}:{String(countdown.mins).padStart(2, '0')}:
              {String(countdown.secs).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#d6a34f] absolute left-2.5 top-2" />
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
            aria-label="Search archives"
            className="w-full rounded border border-[#3c2d22] bg-[#110c09] pl-8 pr-2.5 py-1.5 text-xs text-[#faf3e3] placeholder-[#a8947a] focus:border-[#f59e0b] focus:outline-none"
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
                  <div className="text-[10px] font-mono-code text-[#c9b393]">{hit.sublabel}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Indexed Filing Tabs */}
        <nav className="space-y-0.5" aria-label="Primary sections">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveView(id);
                  setMobileMenuOpen(false);
                }}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-xs font-mono-code transition-colors ${
                  active
                    ? 'bg-[#f59e0b] text-[#17110c] font-bold shadow-sm'
                    : 'text-[#e0cfb0] hover:bg-[#281f18] hover:text-[#faf3e3]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Plain-English Watch Progress Card (flex-fills middle gap) */}
      <div className="flex-1 min-h-0 flex flex-col justify-between rounded border border-[#3c2d22] bg-[#0e0a07] p-2 gap-1 shadow-inner">
        <div className="flex items-center justify-between text-[10px] font-mono-code uppercase tracking-wider">
          <span className="text-[#d6a34f] font-semibold">Watch Progress</span>
          <span className="text-emerald-400 font-bold tabular-nums">
            {watchProgress.essentialPct}% READY
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono-code">
              <span className="text-[#e0cfb0]">Must-Watch</span>
              <span className="text-amber-400 font-bold tabular-nums">
                {watchProgress.essentialDone}/{watchProgress.essentialTotal}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Must-watch progress"
              aria-valuenow={watchProgress.essentialDone}
              aria-valuemin={0}
              aria-valuemax={watchProgress.essentialTotal}
              className="h-1.5 rounded-full bg-[#241b14] overflow-hidden border border-[#3c2d22]"
            >
              <div
                className="h-full bg-gradient-to-r from-[#c2410c] via-[#f59e0b] to-[#10b981] transition-all duration-300"
                style={{ width: `${watchProgress.essentialPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono-code">
              <span className="text-[#b5a287]">All Titles</span>
              <span className="text-[#e0cfb0] font-bold tabular-nums">
                {watchProgress.allDone}/{watchProgress.allTotal}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="All titles progress"
              aria-valuenow={watchProgress.allDone}
              aria-valuemin={0}
              aria-valuemax={watchProgress.allTotal}
              className="h-1.5 rounded-full bg-[#241b14] overflow-hidden border border-[#3c2d22]"
            >
              <div
                className="h-full bg-[#d6a34f] transition-all duration-300"
                style={{ width: `${watchProgress.allPct}%` }}
              />
            </div>
          </div>
        </div>

        {watchProgress.nextTitle ? (
          <button
            type="button"
            onClick={() => {
              setSelectedEntity({ kind: 'title', id: watchProgress.nextTitle!.id });
              setMobileMenuOpen(false);
            }}
            className="w-full text-left rounded border border-[#2f231a] bg-[#16100c] px-2 py-1 hover:border-[#f59e0b] transition-colors"
          >
            <div className="text-[9px] font-mono-code uppercase tracking-widest text-[#b5a287]">
              Up Next
            </div>
            <div className="text-[11px] font-semibold text-[#faf3e3] truncate">
              {watchProgress.nextTitle.title} ({watchProgress.nextTitle.year})
            </div>
          </button>
        ) : (
          <div className="rounded border border-emerald-700/50 bg-emerald-950/30 px-2 py-1 text-[10px] font-mono-code text-emerald-300">
            All essential titles watched!
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-[10px] font-mono-code border-t border-[#261c14] pt-1.5">
          <button
            type="button"
            onClick={() => {
              openBeginnerWatchPath();
              setMobileMenuOpen(false);
            }}
            className="text-[#d6a34f] hover:text-amber-300 hover:underline font-semibold"
          >
            12-Title Path
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView('timeline');
              setMobileMenuOpen(false);
            }}
            className="text-amber-400 hover:underline font-semibold shrink-0"
          >
            Open Timeline →
          </button>
        </div>
      </div>

      {/* Physical Rocker Switch Bank */}
      <div className="shrink-0 space-y-1.5 border-t border-[#3a2c22] pt-2">
        <div className="text-[10px] font-mono-code uppercase tracking-widest text-[#d6a34f]">
          SECURITY SWITCHES
        </div>

        <button
          type="button"
          onClick={toggleSpoilerShield}
          aria-pressed={spoilerShield}
          className={`w-full flex items-center justify-between rounded border px-2.5 py-1.5 text-[11px] font-mono-code font-semibold transition-colors ${
            spoilerShield
              ? 'border-amber-400 bg-amber-500 text-black'
              : 'border-[#3c2d22] bg-[#120d09] text-[#e0cfb0] hover:border-[#c58f36]'
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
          aria-pressed={showTheories}
          className={`w-full flex items-center justify-between rounded border px-2.5 py-1.5 text-[11px] font-mono-code font-semibold transition-colors ${
            showTheories
              ? 'border-purple-400 bg-purple-600/30 text-purple-200'
              : 'border-[#3c2d22] bg-[#120d09] text-[#e0cfb0] hover:border-[#c58f36]'
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
          className="w-full flex items-center justify-center gap-1.5 rounded border border-[#3c2d22] bg-[#241b15] px-2.5 py-1.5 text-[11px] font-mono-code text-[#e5a93b] hover:border-[#f59e0b]"
        >
          <Settings className="w-3.5 h-3.5" /> Settings &amp; JSON Backup
        </button>
      </div>
    </div>
  );

  return (
    <ImageLightboxProvider>
      <div
        data-view={activeView}
        className="min-h-screen flex flex-col lg:flex-row relative tva-desk-stage"
      >
      {/* Living Architect's Comic Blueprint Backdrop & Pinned Clippings */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 lg:left-64 w-full lg:w-[calc(100%-16rem)] h-full overflow-hidden z-0"
      >
        <div className="absolute -top-6 right-4 w-52 h-52 tva-halftone-dot opacity-[0.3] rounded-full" />
        <div className="absolute -bottom-8 left-4 w-56 h-40 tva-halftone-teal opacity-[0.26]" />
        <div className="hidden 2xl:block absolute top-1/2 -left-10 -translate-y-1/2 w-44 h-44 tva-halftone-dot opacity-[0.22] rounded-full" />

        {/* Square Polaroid-style comic clippings pinned in outer margins */}
        <div className="hidden lg:flex flex-col gap-1.5 tva-bg-polaroid rounded-sm p-1.5 pb-2 w-28 absolute top-8 right-5 rotate-6 opacity-[0.38]">
          <span className="tva-tape pointer-events-none" />
          <div className="w-full aspect-square overflow-hidden border border-[#d6c7aa] bg-[#1e1712]">
            <img src="./comic/comic-portal.jpg" alt="" className="w-full h-full object-cover sepia-[0.22] contrast-125" />
          </div>
          <span className="text-[8px] font-mono-code font-bold tracking-wider text-[#1d1610] uppercase truncate">
            KIRBY RIFT // 828
          </span>
        </div>

        <div className="hidden lg:flex flex-col gap-1.5 tva-bg-polaroid rounded-sm p-1.5 pb-2 w-28 absolute bottom-10 right-7 -rotate-6 opacity-[0.36]">
          <span className="tva-tape pointer-events-none" />
          <div className="w-full aspect-square overflow-hidden border border-[#d6c7aa] bg-[#1e1712]">
            <img src="./comic/comic-citadel.jpg" alt="" className="w-full h-full object-cover sepia-[0.18] contrast-115" />
          </div>
          <span className="text-[8px] font-mono-code font-bold tracking-wider text-[#1d1610] uppercase truncate">
            CASTLE DOOM
          </span>
        </div>

        <div className="hidden 2xl:flex flex-col gap-1.5 tva-bg-polaroid rounded-sm p-1.5 pb-2 w-24 absolute top-16 left-5 -rotate-6 opacity-[0.34]">
          <span className="tva-tape pointer-events-none" />
          <div className="w-full aspect-square overflow-hidden border border-[#d6c7aa] bg-[#1e1712]">
            <img src="./comic/comic-clockwork.jpg" alt="" className="w-full h-full object-cover sepia-[0.18] contrast-115" />
          </div>
          <span className="text-[8px] font-mono-code font-bold tracking-wider text-[#1d1610] uppercase truncate">
            TVA CHRONO
          </span>
        </div>

        <div className="hidden 2xl:flex flex-col gap-1.5 tva-bg-polaroid rounded-sm p-1.5 pb-2 w-24 absolute bottom-14 left-6 rotate-6 opacity-[0.34]">
          <span className="tva-tape pointer-events-none" />
          <div className="w-full aspect-square overflow-hidden border border-[#d6c7aa] bg-[#1e1712]">
            <img src="./comic/comic-starburst.jpg" alt="" className="w-full h-full object-cover sepia-[0.18] contrast-115" />
          </div>
          <span className="text-[8px] font-mono-code font-bold tracking-wider text-[#1d1610] uppercase truncate">
            INCURSION // 616
          </span>
        </div>

        <svg
          viewBox="0 0 1200 840"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full opacity-85"
        >
          {/* Drafting rings & drifting timeline arcs */}
          <g fill="none" stroke="#5a3d1e">
            <circle cx="880" cy="230" r="245" strokeWidth="1.2" strokeDasharray="8 6" opacity="0.11" />
            <circle cx="880" cy="230" r="185" strokeWidth="0.9" opacity="0.09" />
            <circle cx="270" cy="620" r="165" strokeWidth="1" strokeDasharray="6 6" opacity="0.1" />
            <path
              d="M-40 440 Q 280 430 480 330 T 1240 160"
              strokeWidth="1.8"
              strokeDasharray="10 6"
              opacity="0.15"
              className="tva-branch-drift"
            />
            <path
              d="M180 420 Q 450 540 760 570 T 1240 605"
              strokeWidth="1.3"
              strokeDasharray="6 6"
              opacity="0.13"
              className="tva-branch-drift"
            />
          </g>

          {/* TVA Sector Calibration Watermarks & Blueprint Crosshairs */}
          <g fill="#5a3d1e" fillOpacity="0.16" fontSize="10" fontFamily="IBM Plex Mono, monospace" fontWeight="700">
            <text x="48" y="42">TVA // SECTOR 616</text>
            <text x="1015" y="42">
              {activeView === 'timeline'
                ? 'FILM REEL // 99 ENTRIES'
                : activeView === 'threads'
                  ? 'CASE BOARD // 15 THREADS'
                  : activeView === 'realities'
                    ? 'CARTOGRAPHY // 16 PLANES'
                    : activeView === 'graph'
                      ? 'CRT SCOPE // ACTIVE'
                      : 'ANCHOR E-828 // LABS'}
            </text>
            <text x="48" y="792">BRANCH E-10005 // MUTANT PRIME</text>
            <text x="1028" y="792">CONVERGENCE // 2026</text>
          </g>

          {activeView === 'timeline' && (
            <g fill="#5a3d1e" opacity="0.16">
              {[70, 140, 210, 280, 350, 420, 490, 560, 630, 700, 770].map((y) => (
                <g key={y}>
                  <rect x="8" y={y} width="12" height="18" rx="2" />
                  <rect x="1180" y={y} width="12" height="18" rx="2" />
                </g>
              ))}
            </g>
          )}

          {activeView === 'threads' && (
            <g fill="none" stroke="#9a3412" opacity="0.18" strokeWidth="1.4">
              <path d="M52 96 L210 240 L64 410 L230 580" strokeDasharray="5 4" />
              <path d="M1140 160 L990 330 L1145 505" strokeDasharray="5 4" />
              <circle cx="52" cy="96" r="5" fill="#9a3412" />
              <circle cx="210" cy="240" r="5" fill="#9a3412" />
              <circle cx="64" cy="410" r="5" fill="#9a3412" />
              <circle cx="1140" cy="160" r="5" fill="#9a3412" />
              <circle cx="990" cy="330" r="5" fill="#9a3412" />
            </g>
          )}

          {activeView === 'realities' && (
            <g fill="none" stroke="#6d28d9" opacity="0.14" strokeWidth="1.2">
              <circle cx="150" cy="180" r="105" strokeDasharray="6 5" />
              <ellipse cx="1020" cy="640" rx="140" ry="62" transform="rotate(-18 1020 640)" />
            </g>
          )}

          {activeView === 'graph' && (
            <g fill="none" stroke="#b45309" opacity="0.18" strokeWidth="1.3">
              <circle cx="600" cy="420" r="350" strokeDasharray="3 8" />
              <path d="M40 420 H120 M1080 420 H1160" />
            </g>
          )}

          <g stroke="#5a3d1e" strokeWidth="1.1" opacity="0.18">
            <path d="M240 110 V130 M230 120 H250" />
            <path d="M600 110 V130 M590 120 H610" />
            <path d="M960 110 V130 M950 120 H970" />
            <path d="M240 710 V730 M230 720 H250" />
            <path d="M960 710 V730 M950 720 H970" />
          </g>

          {/* Silver-Age Comic Shapes: Lightning bolts, Starburst, Speech Silhouette & Kirby Krackle */}
          <g fill="none" stroke="#c2410c" opacity="0.15" strokeLinecap="round" strokeLinejoin="round">
            {/* Comic lightning bolt top-left margin */}
            <path d="M72 58 L44 112 H72 L52 164 L106 100 H78 Z" strokeWidth="2.4" fill="#c2410c" fillOpacity="0.09" />
            {/* Jagged caption-box frame bottom-right */}
            <polygon points="1040,565 1145,555 1138,610 1160,628 1055,638" strokeWidth="2" strokeDasharray="5 3" />
          </g>

          <g fill="none" stroke="#0f766e" opacity="0.14" strokeLinecap="round" strokeLinejoin="round">
            {/* Empty vintage speech-bubble silhouette left mid */}
            <path d="M36 285 Q36 250 88 250 Q140 250 140 285 Q140 318 96 320 L74 342 L78 320 Q36 318 36 285 Z" strokeWidth="2.2" />
            {/* Action burst */}
            <path d="M1070 390 L1085 422 L1118 408 L1098 438 L1132 454 L1094 460 L1106 492 L1076 472 L1052 496 L1060 462 L1026 452 L1058 436 Z" strokeWidth="1.8" />
          </g>

          {/* Kirby Krackle Energy Dot Clusters */}
          <g fill="#2b1e12" opacity="0.15">
            <circle cx="96" cy="198" r="7" /><circle cx="110" cy="190" r="4" /><circle cx="86" cy="212" r="5" /><circle cx="115" cy="206" r="3.5" /><circle cx="98" cy="182" r="3" />
            <circle cx="1115" cy="285" r="8" /><circle cx="1132" cy="274" r="4.5" /><circle cx="1102" cy="300" r="5.5" /><circle cx="1136" cy="296" r="3.5" /><circle cx="1118" cy="264" r="3" />
          </g>

          {/* Print-proof Corner Crop Marks (+) & Vertical Comic Margin Ticks */}
          <g stroke="#5a3d1e" strokeWidth="1.2" opacity="0.22">
            <path d="M24 14 V34 M14 24 H34" />
            <path d="M1176 14 V34 M1166 24 H1186" />
            <path d="M24 806 V826 M14 816 H34" />
            <path d="M1176 806 V826 M1166 816 H1186" />
            <path d="M1190 120 H1200 M1190 180 H1200 M1190 240 H1200 M1190 300 H1200 M1190 360 H1200 M1190 420 H1200 M1190 480 H1200 M1190 540 H1200 M1190 600 H1200 M1190 660 H1200" />
            <path d="M0 120 H10 M0 240 H10 M0 360 H10 M0 480 H10 M0 600 H10 M0 720 H10" />
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
            ref={mobileDrawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
            className="w-72 h-full bg-[#1b1511] border-r-2 border-[#3c2d22] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {renderSidebar(mobileSearchRef)}
          </aside>
        </div>
      )}

      {/* Desktop Left Fixed Bakelite TemPad Hardware Console */}
      <aside className="hidden lg:block w-64 shrink-0 bg-[#1b1511] border-r-2 border-[#3c2d22] sticky top-0 h-screen overflow-y-auto shadow-xl z-20">
        {renderSidebar(desktopSearchRef)}
      </aside>

      {/* Right Bright Cream Archival Desk Workspace */}
      <main
        className="relative z-10 flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto w-full"
        onClick={() => setSearchOpen(false)}
      >
        <div key={activeView} className="tva-view-enter">
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
            tmdbApiKey={tmdbApiKey}
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
        </div>

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
