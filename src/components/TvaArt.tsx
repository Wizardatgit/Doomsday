import { useEffect, useState } from 'react';
import type { FactionEmblem } from '../data/types.ts';
import { fetchTmdbImage, getEffectiveTmdbKey } from '../lib/tmdb.ts';
import { fetchWikiThumbnail } from '../lib/wikiImages.ts';

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
  tmdbQuery,
  tmdbApiKey = '',
  compact = false,
  className = '',
}: {
  code: string;
  title: string;
  subtitle: string;
  accentColor: string;
  emblem?: FactionEmblem;
  variant?: 'polaroid' | 'poster' | 'plate';
  wikiPage?: string;
  tmdbQuery?:
    | { kind: 'title'; mediaType: 'movie' | 'tv'; id: number }
    | { kind: 'person'; id: number };
  tmdbApiKey?: string;
  compact?: boolean;
  className?: string;
}) {
  const effectiveKey = getEffectiveTmdbKey(tmdbApiKey);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setImageUrl(null);
    setImgFailed(false);

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
  }, [
    effectiveKey,
    wikiPage,
    tmdbQuery?.kind,
    tmdbQuery?.id,
    tmdbQuery?.kind === 'title' ? tmdbQuery.mediaType : '',
  ]);

  const showImage = Boolean(imageUrl && !imgFailed);

  if (variant === 'plate') {
    return (
      <div
        className={`relative aspect-[16/9] w-full overflow-hidden rounded border border-[#cbb895] bg-[#1e1712] ${className}`}
      >
        {showImage ? (
          <img
            src={imageUrl!}
            alt={title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgFailed(true)}
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
      <div className={`tva-polaroid rounded-sm p-1.5 pb-2 shrink-0 flex flex-col gap-1.5 ${sizeCls} ${className}`}>
        <div
          className={`relative overflow-hidden bg-[#1e1712] border border-[#d6c7aa] ${
            compact ? 'h-16' : 'h-24 sm:h-28'
          }`}
        >
          {showImage ? (
            <img
              src={imageUrl!}
              alt={title}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImgFailed(true)}
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

  // Poster variant (movies/shows)
  const posterSize = compact ? 'w-12 h-16' : 'w-20 h-28';
  return (
    <div
      className={`relative overflow-hidden rounded-sm border border-[#cbb895] bg-[#1e1712] shrink-0 shadow-sm ${posterSize} ${className}`}
    >
      {showImage ? (
        <img
          src={imageUrl!}
          alt={title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
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
        className="absolute bottom-0 inset-x-0 px-1 py-0.5 text-[8px] font-mono-code font-bold uppercase text-center bg-[#18120e]/85 text-[#f7ebd4] truncate"
        style={{ borderTop: `2px solid ${accentColor}` }}
      >
        {code}
      </span>
    </div>
  );
}
