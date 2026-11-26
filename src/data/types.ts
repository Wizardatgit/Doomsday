export type EntityKind = 'character' | 'title' | 'reality' | 'thread' | 'place';

export interface EntityRef {
  kind: EntityKind;
  id: string;
}

export interface SourceCitation {
  label: string;
  url: string;
}

export type LoreConfidence = 'official' | 'reported' | 'theory';

export type RealityStatus =
  | 'intact'
  | 'endangered'
  | 'incursion-risk'
  | 'pruned'
  | 'outside-time';

export interface Reality {
  id: string;
  code: string;
  name: string;
  designation: string;
  placeName: string;
  wikiPage: string;
  imagePath?: string;
  preferGenuineWiki?: boolean;
  status: RealityStatus;
  anchorBeingId?: string;
  summary: string;
  color: string;
  notableEvents: string[];
  sources?: SourceCitation[];
  confidence?: LoreConfidence;
  isTheory?: boolean;
}

export interface Place {
  id: string;
  name: string;
  realityId: string;
  wikiPage: string;
  imagePath?: string;
  preferGenuineWiki?: boolean;
  summary: string;
  keyTitleIds: string[];
  keyCharacterIds: string[];
}

export type FactionEmblem =
  | 'doom'
  | 'avengers'
  | 'thunderbolts'
  | 'f4'
  | 'xmen'
  | 'wakanda'
  | 'tva'
  | 'wildcards';

export interface Faction {
  id: string;
  name: string;
  shortName: string;
  code: string;
  color: string;
  emblem: FactionEmblem;
  realityId: string;
  summary: string;
  leaderId?: string;
}

export type TitleKind = 'movie' | 'series' | 'special' | 'animated';

export type TitleEra =
  | 'pre-phase-1'
  | 'phase-1'
  | 'phase-2'
  | 'phase-3'
  | 'defenders'
  | 'phase-4'
  | 'phase-5'
  | 'phase-6';

export type TitleImportance = 'essential' | 'key' | 'background';

export interface PostCreditBeat {
  label: string;
  summary: string;
  leadsToTitleId?: string;
  threadId?: string;
}

export interface Title {
  id: string;
  title: string;
  year: number;
  releaseDate: string;
  chronoOrder: number;
  kind: TitleKind;
  era: TitleEra;
  eraLabel: string;
  realityId: string;
  importance: TitleImportance;
  runtime?: string;
  summary: string;
  doomsdayConnection: string;
  keyCharacterIds: string[];
  postCredits?: PostCreditBeat[];
  wikiPage: string;
  sources?: SourceCitation[];
  confidence?: LoreConfidence;
}

export type DoomsdayStatus = 'confirmed' | 'likely' | 'wildcard' | 'legacy';

export interface CharacterJourneyBeat {
  titleId: string;
  beat: string;
  realityShiftTo?: string;
  isTheory?: boolean;
}

export interface CharacterPortrayalNote {
  actor: string;
  context: string;
  kind: 'recast' | 'younger' | 'variant';
  realityCode?: string;
  relatedCharacterId?: string;
}

export interface Character {
  id: string;
  name: string;
  alias: string;
  actor: string;
  factionId: string;
  originRealityId: string;
  currentRealityId: string;
  doomsdayStatus: DoomsdayStatus;
  catalogCode: string;
  whoAreThey: string;
  howTheyGotHere: string;
  lastKnownStatus: string;
  firstAppearanceTitleId: string;
  lastSeenTitleId: string;
  tags: string[];
  wikiPage: string;
  journey: CharacterJourneyBeat[];
  otherPortrayals?: CharacterPortrayalNote[];
  sources?: SourceCitation[];
  confidence?: LoreConfidence;
  isTheory?: boolean;
}

export type ThreadCategory =
  | 'incursion'
  | 'artifact'
  | 'post-credits'
  | 'faction'
  | 'mystery';

export type ThreadStatus =
  | 'converging'
  | 'active'
  | 'open-mystery'
  | 'resolved';

export interface ThreadBeat {
  titleId: string;
  note: string;
  isTheory?: boolean;
}

export interface PlotThread {
  id: string;
  title: string;
  category: ThreadCategory;
  status: ThreadStatus;
  summary: string;
  doomsdayImpact: string;
  originTitleId: string;
  keyTitleIds: string[];
  characterIds: string[];
  realityIds: string[];
  beats: ThreadBeat[];
  sources?: SourceCitation[];
  confidence?: LoreConfidence;
  isTheory?: boolean;
}

export type ConnectionKind =
  | 'alliance'
  | 'conflict'
  | 'incursion'
  | 'variant'
  | 'origin'
  | 'setup'
  | 'theory';

export interface CuratedConnection {
  id: string;
  from: EntityRef;
  to: EntityRef;
  label: string;
  kind: ConnectionKind;
  note?: string;
  titleId?: string;
  isTheory?: boolean;
}

export type AppView =
  | 'hub'
  | 'graph'
  | 'timeline'
  | 'dossiers'
  | 'factions'
  | 'realities'
  | 'threads'
  | 'pathfinder';
