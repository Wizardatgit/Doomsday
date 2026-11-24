import type { Faction } from './types.ts';

export const FACTIONS: Faction[] = [
  {
    id: 'doctor-doom',
    name: 'Victor von Doom / Doctor Doom',
    shortName: 'Doctor Doom',
    code: 'FAC-DOOM',
    color: '#10b981',
    emblem: 'doom',
    realityId: 'earth-828',
    leaderId: 'doctor-doom',
    summary:
      'Portrayed by Robert Downey Jr., Victor von Doom views multiversal heroes—especially branches like Steve Rogers’—as living "stolen lives" causing cosmic collapse. Armed with sorcery, supreme science, and an interest in Franklin Richards.',
  },
  {
    id: 'avengers',
    name: "Sam Wilson's Avengers & MCU Alums",
    shortName: 'Avengers',
    code: 'FAC-AVG',
    color: '#3b82f6',
    emblem: 'avengers',
    realityId: 'earth-616',
    leaderId: 'sam-wilson',
    summary:
      'President Ross tasked Sam Wilson with rebuilding the official Avengers after Captain America: Brave New World—joined by Falcon, Thor, Ant-Man, Cassie Lang, Shang-Chi, Kate Bishop, and pulled-back veterans Steve Rogers and Peggy Carter.',
  },
  {
    id: 'new-avengers',
    name: 'New Avengers (Thunderbolts*)',
    shortName: 'New Avengers',
    code: 'FAC-NAVG',
    color: '#f97316',
    emblem: 'thunderbolts',
    realityId: 'earth-616',
    leaderId: 'yelena-belova',
    summary:
      'Rebranded publicly by Valentina Allegra de Fontaine at the end of Thunderbolts* inside Watchtower (former Avengers Tower). First Earth-616 team to detect the Fantastic Four rocket breaching from another universe.',
  },
  {
    id: 'fantastic-four',
    name: 'The Fantastic Four (Earth-828)',
    shortName: 'Fantastic Four',
    code: 'FAC-F4',
    color: '#38bdf8',
    emblem: 'f4',
    realityId: 'earth-828',
    leaderId: 'reed-richards',
    summary:
      'Earth-828’s First Family—Reed Richards, Sue Storm, Johnny Storm, Ben Grimm, and cosmic child Franklin Richards—who survived Galactus only to face Doctor Doom and flee across the multiverse into Earth-616.',
  },
  {
    id: 'x-men',
    name: 'Legacy Fox X-Men (Earth-10005)',
    shortName: 'X-Men',
    code: 'FAC-XMN',
    color: '#eab308',
    emblem: 'xmen',
    realityId: 'earth-10005',
    leaderId: 'professor-x',
    summary:
      'Professor X, Magneto, Cyclops, Beast, Nightcrawler, Mystique, and Void-survivor Gambit unite in comic-accurate suits as their mutant reality collides with Earth-616 and Doctor Doom’s crusade.',
  },
  {
    id: 'wakanda-talokan',
    name: 'Wakanda & Talokan Alliance',
    shortName: 'Wakanda / Talokan',
    code: 'FAC-WAK',
    color: '#a855f7',
    emblem: 'wakanda',
    realityId: 'earth-616',
    leaderId: 'shuri',
    summary:
      'Bound together by the Black Panther: Wakanda Forever truce, Shuri (Black Panther), M’Baku, Namor, and Namora mobilize Earth-616’s vibranium and oceanic defenses when multiversal invaders arrive.',
  },
  {
    id: 'tva-multiverse',
    name: 'TVA & Multiverse Guardians',
    shortName: 'TVA / Multiverse',
    code: 'FAC-TVA',
    color: '#f59e0b',
    emblem: 'tva',
    realityId: 'tva',
    leaderId: 'loki',
    summary:
      'Loki holding the Multiverse World Tree, reformed TVA keepers, and dimensional watchers like Doctor Strange and Monica Rambeau—positioned at the very fracture points Doom targets.',
  },
  {
    id: 'wildcards',
    name: 'Wildcards & Legacy Bridges',
    shortName: 'Wildcards',
    code: 'FAC-WLD',
    color: '#ef4444',
    emblem: 'wildcards',
    realityId: 'earth-616',
    summary:
      'Crucial players connecting Phase 6 street/cosmic arcs and pre-Phase-1 universes into Doomsday—including Spider-Man, Deadpool, Wolverine, Hulk, Punisher, Jean Grey (Earth-616), White Vision, Blade, and Elektra.',
  },
];
