import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Maximize2, X } from 'lucide-react';
import type { FactionEmblem } from '../data/types.ts';
import { fetchTmdbImage, getEffectiveTmdbKey, type TmdbQuery } from '../lib/tmdb.ts';
import { fetchWikiThumbnail } from '../lib/wikiImages.ts';

export interface LightboxPayload {
  url: string;
  code: string;
  title: string;
  subtitle: string;
  accentColor: string;
}

const ImageLightboxContext = createContext<{
  openLightbox: (payload: LightboxPayload) => void;
}>({
  openLightbox: () => {},
});

export function useImageLightbox() {
  return useContext(ImageLightboxContext);
}

export function ImageLightboxProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<LightboxPayload | null>(null);

  const openLightbox = useCallback((next: LightboxPayload) => {
    setPayload(next);
  }, []);

  useEffect(() => {
    if (!payload) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setPayload(null);
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [payload]);

  return (
    <ImageLightboxContext.Provider value={{ openLightbox }}>
      {children}
      {payload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4"
          onClick={() => setPayload(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Full image preview: ${payload.title}`}
        >
          <div
            className="relative max-w-[94vw] max-h-[92vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPayload(null)}
              className="self-end inline-flex items-center gap-1.5 rounded border border-[#cbb895]/60 bg-[#1b1511] px-3 py-1.5 text-xs font-mono-code text-[#f5e7c8] hover:border-amber-400 hover:text-amber-300"
              aria-label="Close full image preview"
            >
              <X className="w-4 h-4" /> Close (Esc)
            </button>
            <img
              src={payload.url}
              alt={payload.title}
              referrerPolicy="no-referrer"
              className="max-w-[92vw] max-h-[78vh] w-auto h-auto object-contain bg-[#140f0c] border-2 border-[#cbb895] rounded shadow-2xl"
            />
            <div className="tva-folder rounded px-4 py-2 text-center max-w-xl">
              <div className="text-[10px] font-mono-code font-bold uppercase tracking-widest" style={{ color: payload.accentColor }}>
                {payload.code}
              </div>
              <div className="text-sm font-bold text-[#1d1610]">{payload.title}</div>
              {payload.subtitle !== payload.title && (
                <div className="text-xs text-[#61503e]">{payload.subtitle}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </ImageLightboxContext.Provider>
  );
}

export function TvaLogoMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="6" stroke="#f59e0b" strokeWidth="2" fill="#231912" />
      <path d="M8 20h24" stroke="#ea580c" strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M12 13c5 0 6 7 10 7s5-7 10-7" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 27c5 0 6-7 10-7s5 7 10 7" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
      <circle cx="20" cy="20" r="2.75" fill="#f59e0b" />
    </svg>
  );
}

export function FactionEmblemIcon({
  emblem,
  color = '#b45309',
  className = 'w-5 h-5',
}: {
  emblem: FactionEmblem;
  color?: string;
  className?: string;
}) {
  switch (emblem) {
    case 'doom':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M6 4h12l2 6-8 10L4 10l2-6z" stroke={color} strokeWidth="1.8" />
          <path d="M8 10h3m2 0h3M9 15h6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'avengers':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
          <path d="M9 17l4-11 3 11M8.5 13h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'thunderbolts':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <polygon points="12,3 14.5,9.5 21,9.5 15.8,13.5 17.8,20 12,16 6.2,20 8.2,13.5 3,9.5 9.5,9.5" stroke={color} strokeWidth="1.7" />
        </svg>
      );
    case 'f4':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
          <path d="M13.5 17V7l-5 6.5h7" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'xmen':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
          <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      );
    case 'wakanda':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M6 5l2.5 5L12 7l3.5 3L18 5l1 8-7 7-7-7 1-8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'tva':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.7" />
          <path d="M12 7v5l3.5 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'wildcards':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" stroke={color} strokeWidth="1.7" />
        </svg>
      );
  }
}

export function EntityVisual({
  code,
  title,
  subtitle,
  accentColor,
  emblem = 'tva',
  variant = 'poster',
  wikiPage,
  staticImagePath,
  preferWikiOverStatic = false,
  tmdbQuery,
  tmdbApiKey = '',
  compact = false,
  clickImageToZoom = false,
  className = '',
}: {
  code: string;
  title: string;
  subtitle: string;
  accentColor: string;
  emblem?: FactionEmblem;
  variant?: 'polaroid' | 'poster' | 'plate';
  wikiPage?: string;
  staticImagePath?: string;
  preferWikiOverStatic?: boolean;
  tmdbQuery?: TmdbQuery;
  tmdbApiKey?: string;
  compact?: boolean;
  clickImageToZoom?: boolean;
  className?: string;
}) {
  const effectiveKey = getEffectiveTmdbKey(tmdbApiKey);
  const { openLightbox } = useImageLightbox();
  const [imageUrl, setImageUrl] = useState<string | null>(staticImagePath ?? null);
  const [imgFailed, setImgFailed] = useState(false);

  const tmdbCacheId = tmdbQuery
    ? tmdbQuery.kind === 'title'
      ? `${tmdbQuery.mediaType}:${tmdbQuery.title}:${tmdbQuery.year}`
      : `person:${tmdbQuery.name}`
    : '';

  useEffect(() => {
    let active = true;
    setImgFailed(false);
    setImageUrl(staticImagePath ?? null);
    if (staticImagePath && !preferWikiOverStatic) return;

    async function load() {
      if (effectiveKey && tmdbQuery) {
        const tmdbUrl = await fetchTmdbImage(tmdbQuery, effectiveKey);
        if (active && tmdbUrl) {
          setImageUrl(tmdbUrl);
          return;
        }
      }
      if (wikiPage) {
        const wikiUrl = await fetchWikiThumbnail(wikiPage);
        if (active && wikiUrl) {
          setImageUrl(wikiUrl);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [effectiveKey, staticImagePath, preferWikiOverStatic, wikiPage, tmdbCacheId]);

  const handleImgError = () => {
    if (staticImagePath && imageUrl !== staticImagePath) {
      setImageUrl(staticImagePath);
    } else {
      setImgFailed(true);
    }
  };

  const showImage = Boolean(imageUrl && !imgFailed);

  const handleOpenLightbox = () => {
    if (!showImage || !imageUrl) return;
    openLightbox({ url: imageUrl, code, title, subtitle, accentColor });
  };

  const zoomTrigger = showImage ? (
    <span
      role="button"
      tabIndex={0}
      aria-label={`Inspect full image: ${title}`}
      title="View full uncropped image"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handleOpenLightbox();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          e.preventDefault();
          handleOpenLightbox();
        }
      }}
      className="absolute top-1.5 right-1.5 z-10 inline-flex items-center justify-center rounded bg-[#140f0c]/85 p-1 text-[#f5e7c8] border border-[#cbb895]/40 opacity-80 hover:opacity-100 hover:border-amber-400 hover:text-amber-300 transition-opacity cursor-zoom-in"
    >
      <Maximize2 className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
    </span>
  ) : null;

  if (variant === 'plate') {
    return (
      <div
        onClick={clickImageToZoom && showImage ? handleOpenLightbox : undefined}
        className={`relative aspect-[16/9] w-full overflow-hidden rounded border border-[#cbb895] bg-[#1e1712] ${
          clickImageToZoom && showImage ? 'cursor-zoom-in' : ''
        } ${className}`}
      >
        {zoomTrigger}
        {showImage ? (
          <img
            src={imageUrl!}
            alt={title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={handleImgError}
            className="w-full h-full object-cover sepia-[0.18] contrast-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#1c1510]">
            <FactionEmblemIcon emblem={emblem} color={accentColor} className="w-10 h-10 opacity-85" />
            <span className="text-[11px] font-mono-code text-[#d6c5a3] uppercase tracking-widest">
              {code} // {subtitle}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#120d0a] via-[#120d0a]/85 to-transparent px-3 pt-5 pb-2 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-mono-code uppercase tracking-widest text-amber-400">
              {code}
            </div>
            <div className="text-xs font-semibold text-[#faf3e3] truncate">{subtitle}</div>
          </div>
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/40"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      </div>
    );
  }

  if (variant === 'polaroid') {
    const sizeCls = compact ? 'w-16' : 'w-24 sm:w-28';
    return (
      <div
        onClick={clickImageToZoom && showImage ? handleOpenLightbox : undefined}
        className={`relative tva-polaroid rounded-sm p-1.5 pb-2 shrink-0 flex flex-col gap-1.5 ${sizeCls} ${
          clickImageToZoom && showImage ? 'cursor-zoom-in' : ''
        } ${className}`}
      >
        <span aria-hidden="true" className="tva-tape pointer-events-none" />
        <div
          className={`relative overflow-hidden bg-[#1e1712] border border-[#d6c7aa] ${
            compact ? 'h-16' : 'h-24 sm:h-28'
          }`}
        >
          {zoomTrigger}
          {showImage ? (
            <img
              src={imageUrl!}
              alt={title}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={handleImgError}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FactionEmblemIcon emblem={emblem} color={accentColor} className="w-7 h-7 opacity-90" />
            </div>
          )}
          <span
            className="absolute top-1 left-1 px-1 py-0.2 text-[8px] font-mono-code font-bold uppercase bg-[#1b1511]/85 text-[#f5e7c8] rounded-[2px]"
            style={{ borderLeft: `2px solid ${accentColor}` }}
          >
            {code.replace('TVA-', '')}
          </span>
        </div>
        <div className="px-0.5">
          <p className="text-[9px] font-mono-code font-semibold text-[#1d1610] truncate leading-tight">
            {subtitle}
          </p>
        </div>
      </div>
    );
  }

  // Poster variant (movies/shows) — uncropped object-contain on dark matte
  const posterSize = compact ? 'w-12 h-16' : 'w-20 h-28';
  return (
    <div
      onClick={clickImageToZoom && showImage ? handleOpenLightbox : undefined}
      className={`relative overflow-hidden rounded-sm border border-[#cbb895] bg-[#140f0c] shrink-0 shadow-sm ${posterSize} ${
        clickImageToZoom && showImage ? 'cursor-zoom-in' : ''
      } ${className}`}
    >
      {zoomTrigger}
      {showImage ? (
        <img
          src={imageUrl!}
          alt={title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={handleImgError}
          className="w-full h-full object-contain bg-[#140f0c] pb-3.5"
        />
      ) : (
        <div className="w-full h-full p-1.5 flex flex-col justify-between bg-[#241b14]">
          <span className="text-[8px] font-mono-code uppercase text-[#e6d5b5] truncate">{code}</span>
          <div className="my-auto flex justify-center">
            <FactionEmblemIcon emblem={emblem} color={accentColor} className="w-5 h-5" />
          </div>
          <span className="text-[8px] font-mono-code text-[#d0bea0] truncate">{subtitle}</span>
        </div>
      )}
      <span
        className="absolute bottom-0 inset-x-0 px-1 py-0.5 text-[8px] font-mono-code font-bold uppercase text-center bg-[#18120e]/90 text-[#f7ebd4] truncate"
        style={{ borderTop: `2px solid ${accentColor}` }}
      >
        {code}
      </span>
    </div>
  );
}

/** Atmospheric archival photo header banner with readable dark scrim and lightbox zoom. */
export function ViewHeroBanner({
  wikiPage,
  staticImagePath,
  preferWikiOverStatic = false,
  catalogStamp,
  title,
  subtitle,
  accentColor = '#c2410c',
  emblem = 'tva',
  compactBanner = false,
  className = '',
  children,
}: {
  wikiPage?: string;
  staticImagePath?: string;
  preferWikiOverStatic?: boolean;
  catalogStamp: string;
  title: string;
  subtitle: string;
  accentColor?: string;
  emblem?: Parameters<typeof FactionEmblemIcon>[0]['emblem'];
  compactBanner?: boolean;
  className?: string;
  children?: import('react').ReactNode;
}) {
  const { openLightbox } = useImageLightbox();
  const [wikiUrl, setWikiUrl] = useState<string | null>(null);
  const [wikiFailed, setWikiFailed] = useState(false);
  const [staticFailed, setStaticFailed] = useState(false);

  useEffect(() => {
    setWikiFailed(false);
    setStaticFailed(false);
    setWikiUrl(null);
    if ((staticImagePath && !preferWikiOverStatic) || !wikiPage) return;
    let active = true;
    fetchWikiThumbnail(wikiPage).then((url) => {
      if (active) setWikiUrl(url);
    });
    return () => {
      active = false;
    };
  }, [wikiPage, staticImagePath, preferWikiOverStatic]);

  const activeWiki = !wikiFailed ? wikiUrl : null;
  const resolvedUrl = preferWikiOverStatic
    ? activeWiki || (!staticFailed ? staticImagePath : null)
    : (!staticFailed ? staticImagePath : null) || activeWiki;
  const showImage = Boolean(resolvedUrl);

  const handleOpen = () => {
    if (!showImage || !resolvedUrl) return;
    openLightbox({
      url: resolvedUrl,
      code: catalogStamp,
      title,
      subtitle,
      accentColor,
    });
  };

  return (
    <div
      className={`relative overflow-hidden rounded-md border border-[#3d2d20] bg-[#1b140f] text-[#faf3e3] shadow-sm ${
        compactBanner ? 'h-20' : 'min-h-[124px] sm:min-h-[140px]'
      } ${className}`}
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      {showImage ? (
        <img
          src={resolvedUrl!}
          alt={title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => {
            if (resolvedUrl && resolvedUrl === wikiUrl) setWikiFailed(true);
            else setStaticFailed(true);
          }}
          className="absolute inset-0 w-full h-full object-cover object-center sepia-[0.22] contrast-[1.06] opacity-70"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-end pr-8 opacity-20"
          style={{
            background: `radial-gradient(circle at 80% 45%, ${accentColor}44, #1b140f 70%)`,
          }}
        >
          <FactionEmblemIcon
            emblem={emblem}
            color={accentColor}
            className={compactBanner ? 'w-14 h-14' : 'w-24 h-24'}
          />
        </div>
      )}

      <div
        className={`absolute inset-0 ${
          compactBanner
            ? 'bg-gradient-to-r from-[#16100c]/95 via-[#16100c]/80 to-[#16100c]/35'
            : 'bg-gradient-to-r from-[#16100c]/95 via-[#16100c]/82 to-[#16100c]/50'
        }`}
      />

      {showImage && (
        <span
          role="button"
          tabIndex={0}
          title={`Expand ${title} image`}
          aria-label={`Expand ${title} image`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleOpen();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.preventDefault();
              handleOpen();
            }
          }}
          className="absolute top-2 right-2 z-20 inline-flex items-center justify-center rounded bg-[#140f0c]/85 p-1 text-[#f5e7c8] border border-[#cbb895]/40 opacity-80 hover:opacity-100 hover:border-amber-400 hover:text-amber-300 transition-opacity cursor-zoom-in"
        >
          <Maximize2 className="w-3 h-3" />
        </span>
      )}

      <div
        className={`relative z-10 h-full flex flex-col sm:flex-row sm:items-end justify-between gap-3 ${
          compactBanner ? 'px-4 py-2.5 pr-9' : 'p-4 sm:p-5 pr-10'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] font-mono-code uppercase tracking-widest text-amber-300/90">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            <span className="truncate">{catalogStamp}</span>
          </div>
          {compactBanner ? (
            <h2 className="font-serif-display font-bold text-[#fcf6e8] leading-tight truncate text-base sm:text-lg mt-0.5">
              {title}
            </h2>
          ) : (
            <h1 className="font-serif-display font-bold text-[#fcf6e8] leading-tight truncate text-xl sm:text-2xl mt-1">
              {title}
            </h1>
          )}
          <p
            className={`text-[#dfd1b5] leading-snug ${
              compactBanner ? 'text-[11px] truncate' : 'text-xs sm:text-sm mt-1 max-w-2xl'
            }`}
          >
            {subtitle}
          </p>
        </div>

        {children && <div className="shrink-0 flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}

/** Tactile comic-archive section header strip with dark issue pill, divider line, and right action slot. */
export function SectionDivider({
  badge,
  title,
  accentColor = '#c2410c',
  rightSlot,
}: {
  badge: string;
  title: string;
  accentColor?: string;
  rightSlot?: import('react').ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span
          className="shrink-0 rounded-sm bg-[#1d1610] px-2 py-0.5 text-[10px] font-mono-code font-bold uppercase tracking-widest text-[#f59e0b] shadow-[2px_2px_0_rgba(29,22,16,0.25)]"
          style={{ borderLeft: `3px solid ${accentColor}` }}
        >
          {badge}
        </span>
        <h2 className="text-sm sm:text-base font-display font-bold text-[#1d1610] truncate">
          {title}
        </h2>
        <span
          aria-hidden="true"
          className="hidden sm:block h-[2px] flex-1 min-w-[24px] rounded-full opacity-45"
          style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }}
        />
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}
