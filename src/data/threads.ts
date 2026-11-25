import type { PlotThread } from './types.ts';

export const THREADS: PlotThread[] = [
  {
    id: 'thread-doom-franklin',
    title: 'Doctor Doom & Franklin Richards',
    category: 'post-credits',
    status: 'converging',
    summary:
      'Galactus tried to claim infant Franklin Richards on Earth-828 for his reality-shaping Power Cosmic. Four years later, Victor von Doom silently infiltrates the Baxter Building and kneels beside five-year-old Franklin.',
    doomsdayImpact:
      'Doom’s direct interest in Franklin Richards’ cosmic power explains why the Fantastic Four flee Earth-828 toward Earth-616 and anchors Doomsday’s central conflict.',
    originTitleId: 'fantastic-four-first-steps',
    keyTitleIds: ['fantastic-four-first-steps', 'thunderbolts', 'avengers-doomsday'],
    characterIds: ['doctor-doom', 'franklin-richards', 'sue-storm', 'reed-richards'],
    realityIds: ['earth-828', 'earth-616'],
    beats: [
      { titleId: 'fantastic-four-first-steps', note: 'Galactus demands Franklin Richards for his limitless Power Cosmic.' },
      { titleId: 'fantastic-four-first-steps', note: 'Mid-credits (+4 yrs): Cloaked Doctor Doom appears quietly beside five-year-old Franklin.' },
      { titleId: 'avengers-doomsday', note: 'Doctor Doom threatens multiple realities while the First Family fights beside Earth-616.' },
    ],
    confidence: 'official',
    sources: [
      { label: 'Wikipedia — The Fantastic Four: First Steps', url: 'https://en.wikipedia.org/wiki/The_Fantastic_Four:_First_Steps' },
      { label: 'Marvel.com — Avengers: Doomsday', url: 'https://www.marvel.com/movies/avengers-doomsday' },
    ],
  },
  {
    id: 'thread-f4-breach',
    title: 'Fantastic Four Vessel Breaching Earth-616',
    category: 'post-credits',
    status: 'converging',
    summary:
      'Fourteen months after Thunderbolts*, Watchtower alarms detect an extra-dimensional Fantastic Four rocket descending into Earth-616 atmosphere.',
    doomsdayImpact:
      'Brings Reed, Sue, Johnny, and Ben physically from Earth-828 onto Earth-616’s doorstep, uniting Earth-828’s First Family with the New Avengers.',
    originTitleId: 'thunderbolts',
    keyTitleIds: ['thunderbolts', 'fantastic-four-first-steps', 'avengers-doomsday'],
    characterIds: ['reed-richards', 'sue-storm', 'johnny-storm', 'ben-grimm', 'yelena-belova', 'bucky-barnes'],
    realityIds: ['earth-828', 'earth-616'],
    beats: [
      { titleId: 'thunderbolts', note: 'Post-credits: New Avengers watch the F4 rocket pierce Earth-616 space.' },
      { titleId: 'fantastic-four-first-steps', note: 'Establishes Earth-828 and the Excelsior ship’s retro-futuristic design.' },
      { titleId: 'avengers-doomsday', note: 'First Family meets Sam’s Avengers, New Avengers, and Wakanda.' },
    ],
  },
  {
    id: 'thread-steve-stolen-lives',
    title: "Steve Rogers' Branch & \"Stolen Lives\"",
    category: 'incursion',
    status: 'converging',
    summary:
      'After returning the Infinity Stones in Endgame, Steve Rogers lived a second life with Peggy Carter in a branched 1940s timeline. Doctor Doom views multiversal anomalies like this as "stolen lives" tearing reality apart.',
    doomsdayImpact:
      'Doomsday promos show Steve Rogers and Peggy Carter raising a teenage son inside their branched timeline before the Fantastic Four track them down to stand against Doctor Doom.',
    originTitleId: 'captain-america-first-avenger',
    keyTitleIds: ['captain-america-first-avenger', 'agent-carter-series', 'avengers-endgame', 'avengers-doomsday'],
    characterIds: ['steve-rogers', 'peggy-carter', 'doctor-doom', 'sam-wilson', 'bucky-barnes'],
    realityIds: ['earth-616', 'steve-branch'],
    beats: [
      { titleId: 'captain-america-first-avenger', note: 'Steve promises Peggy a dance before crashing into Arctic ice.' },
      { titleId: 'avengers-endgame', note: 'Steve returns the Stones, stays in the past with Peggy, and hands Sam the shield.' },
      { titleId: 'avengers-doomsday', note: 'Doom condemns heroes living stolen lives; the Fantastic Four recruit Steve and Peggy into the fray.' },
    ],
    confidence: 'official',
    sources: [
      { label: 'Marvel.com — Avengers: Doomsday', url: 'https://www.marvel.com/movies/avengers-doomsday' },
      { label: 'Wikipedia — Avengers: Doomsday', url: 'https://en.wikipedia.org/wiki/Avengers:_Doomsday' },
    ],
  },
  {
    id: 'thread-loki-world-tree',
    title: "Loki's Multiverse World Tree (Yggdrasil)",
    category: 'incursion',
    status: 'converging',
    summary:
      'Rather than watch infinite branches die when the Temporal Loom overloaded, Loki climbed to the End of Time and physically wove every timeline into Yggdrasil.',
    doomsdayImpact:
      'Loki literally holds Earth-616, Earth-828, and Earth-10005 together—making his throne ground zero when incursions collide, and setting up a long-awaited reunion with Thor.',
    originTitleId: 'the-avengers',
    keyTitleIds: ['the-avengers', 'avengers-endgame', 'loki-s1', 'loki-s2', 'avengers-doomsday'],
    characterIds: ['loki', 'thor'],
    realityIds: ['tva', 'earth-616'],
    beats: [
      { titleId: 'avengers-endgame', note: '2012 Loki steals the Tesseract, creating a TVA Nexus Event.' },
      { titleId: 'loki-s1', note: 'Sylvie kills He Who Remains, freeing timeline branches.' },
      { titleId: 'loki-s2', note: 'Loki destroys the Loom and becomes the living core of Yggdrasil.' },
      { titleId: 'avengers-doomsday', note: 'Confirmed Tom Hiddleston return right as realities collide.' },
    ],
  },
  {
    id: 'thread-incursions-838',
    title: 'Incursions & The Earth-838 Warning',
    category: 'incursion',
    status: 'active',
    summary:
      'Earth-838 Reed Richards explained that dreamwalking or crossing too deeply between realities creates an Incursion—pushing two universes together until one or both shatter completely.',
    doomsdayImpact:
      'Provides the exact physics behind the three-universe crisis in Doomsday (Earth-616, Earth-828, Earth-10005).',
    originTitleId: 'doctor-strange-mom',
    keyTitleIds: ['spider-man-no-way-home', 'doctor-strange-mom', 'avengers-doomsday'],
    characterIds: ['doctor-strange', 'professor-x'],
    realityIds: ['earth-616', 'earth-838'],
    beats: [
      { titleId: 'spider-man-no-way-home', note: 'Strange’s botched spell nearly breaks Earth-616 open.' },
      { titleId: 'doctor-strange-mom', note: 'Earth-838 Illuminati warn Strange that his footprint threatens whole universes.' },
    ],
  },
  {
    id: 'thread-monica-xmen',
    title: "Monica Stranded in Beast & Xavier's X-Men Universe",
    category: 'post-credits',
    status: 'converging',
    summary:
      'Monica Rambeau sacrificed herself to seal a spacetime tear in The Marvels—waking up on the wrong side inside an alternate X-Mansion beside Hank McCoy (Kelsey Grammer’s Beast).',
    doomsdayImpact:
      'Directly links Earth-616’s cosmic Avengers side to the classic Fox X-Men cast confirmed for Doomsday.',
    originTitleId: 'wandavision',
    keyTitleIds: ['wandavision', 'the-marvels', 'x-men-last-stand-2006', 'x-men-dofp-2014', 'avengers-doomsday'],
    characterIds: ['monica-rambeau', 'beast', 'professor-x', 'captain-marvel'],
    realityIds: ['earth-616', 'earth-10005-x', 'earth-10005'],
    beats: [
      { titleId: 'wandavision', note: 'Monica gains photon spectrum powers walking through the Westview Hex.' },
      { titleId: 'the-marvels', note: 'Mid-credits: Monica wakes in an X-Mansion while Beast checks in with Charles Xavier.' },
      { titleId: 'avengers-doomsday', note: 'Xavier, Magneto, Cyclops, Beast, Nightcrawler, Mystique, and Gambit enter the conflict.' },
    ],
  },
  {
    id: 'thread-anchor-void',
    title: 'Anchor Beings & Void Resistance Survivors',
    category: 'incursion',
    status: 'active',
    summary:
      'Deadpool & Wolverine introduced "Anchor Beings": when a reality loses its keystone figure (like Logan on Earth-10005 or Tony Stark on Earth-616), its timeline begins decaying toward pruning in The Void.',
    doomsdayImpact:
      'Explains why Earth-616 may be destabilizing post-Endgame, connects pre-Phase-1 films (Blade, Elektra, 2005 F4) into MCU lore, and funnels Channing Tatum’s Gambit straight into Doomsday.',
    originTitleId: 'logan-2017',
    keyTitleIds: ['logan-2017', 'deadpool-wolverine', 'blade-1998', 'daredevil-2003', 'fantastic-four-2005', 'avengers-doomsday'],
    characterIds: ['wolverine', 'deadpool', 'gambit', 'blade', 'elektra', 'johnny-storm-2005'],
    realityIds: ['earth-10005', 'the-void', 'earth-26320', 'earth-701306', 'earth-121698'],
    beats: [
      { titleId: 'logan-2017', note: 'Earth-10005 Anchor Being Logan dies in 2029.' },
      { titleId: 'deadpool-wolverine', note: 'Void Resistance (Gambit, Blade, Elektra) defeat Cassandra Nova and stabilize Earth-10005.' },
      { titleId: 'avengers-doomsday', note: 'Void survivor Gambit steps onto the main Doomsday board.' },
    ],
  },
  {
    id: 'thread-two-avengers',
    title: "Two Avengers Rosters: Sam's Team vs. New Avengers",
    category: 'faction',
    status: 'converging',
    summary:
      'President Ross asked Sam Wilson to rebuild the Avengers in Brave New World—only for CIA Director Valentina to publicly unveil the Thunderbolts* as the trademarked "New Avengers" in Watchtower.',
    doomsdayImpact:
      'Creates built-in Earth-616 tension (with Bucky bridging both sides) right when Earth-828’s ship enters orbit.',
    originTitleId: 'captain-america-brave-new-world',
    keyTitleIds: ['falcon-winter-soldier', 'captain-america-brave-new-world', 'thunderbolts', 'avengers-doomsday'],
    characterIds: ['sam-wilson', 'yelena-belova', 'bucky-barnes', 'valentina', 'john-walker', 'sentry'],
    realityIds: ['earth-616'],
    beats: [
      { titleId: 'captain-america-brave-new-world', note: 'Sam Wilson begins assembling an official Avengers team.' },
      { titleId: 'thunderbolts', note: 'Post-credits: Yelena & Bucky joke about Sam threatening a copyright lawsuit over "New Avengers".' },
      { titleId: 'avengers-doomsday', note: 'Both squads are forced to share the battlefield against Doctor Doom.' },
    ],
  },
  {
    id: 'thread-sentry-void',
    title: "Sentry & Bob Reynolds' Dormant Void",
    category: 'faction',
    status: 'active',
    summary:
      'OXE’s Project Sentry turned Bob Reynolds into a godlike Superman-tier powerhouse whose shadow persona, The Void, nearly trapped Manhattan in living trauma.',
    doomsdayImpact:
      'Gives Earth-616’s New Avengers a double-edged trump card: unleashing Sentry against Doctor Doom risks waking The Void.',
    originTitleId: 'thunderbolts',
    keyTitleIds: ['thunderbolts', 'avengers-doomsday'],
    characterIds: ['sentry', 'yelena-belova', 'valentina'],
    realityIds: ['earth-616'],
    beats: [
      { titleId: 'thunderbolts', note: 'Yelena and the team pull Bob out of The Void’s shadow rooms; Bob stays cautious at Watchtower.' },
      { titleId: 'avengers-doomsday', note: 'Lewis Pullman’s Sentry is confirmed in the Doomsday ensemble.' },
    ],
  },
  {
    id: 'thread-adamantium-tiamut',
    title: "Tiamut Adamantium & Sterns' Warning",
    category: 'artifact',
    status: 'active',
    summary:
      'Celestial Tiamut’s frozen body from Eternals yielded Adamantium—sparking an international treaty crisis in Brave New World before Samuel Sterns predicted coming wars with "the others".',
    doomsdayImpact:
      'Introduces Adamantium into Earth-616 (echoing Wolverine’s skeleton) and explicitly warns Sam Wilson of outside-world adversaries.',
    originTitleId: 'eternals',
    keyTitleIds: ['eternals', 'captain-america-brave-new-world', 'avengers-doomsday'],
    characterIds: ['sam-wilson', 'joaquin-torres'],
    realityIds: ['earth-616'],
    beats: [
      { titleId: 'eternals', note: 'Tiamut turns to stone in the Indian Ocean.' },
      { titleId: 'captain-america-brave-new-world', note: 'Global powers harvest Adamantium; Sterns warns Sam from the Raft about threats from other worlds.' },
    ],
  },
  {
    id: 'thread-ten-rings-bands',
    title: 'Ten Rings & Quantum Bands Beacon',
    category: 'artifact',
    status: 'open-mystery',
    summary:
      'Both Shang-Chi’s Ten Rings and Kamala Khan’s Quantum Bands are ancient, non-human artifacts tied to cosmic/dimensional rifts and signals.',
    doomsdayImpact:
      'With Shang-Chi confirmed for Doomsday and Ms. Marvel uniting young heroes alongside Kate Bishop, their artifacts connect Phase 4’s mystery threads directly to multiversal engineering.',
    originTitleId: 'shang-chi',
    keyTitleIds: ['shang-chi', 'ms-marvel', 'the-marvels', 'avengers-doomsday'],
    characterIds: ['shang-chi', 'ms-marvel', 'bruce-banner', 'captain-marvel', 'kate-bishop'],
    realityIds: ['earth-616'],
    beats: [
      { titleId: 'shang-chi', note: 'Banner, Carol, and Wong detect an unknown signal pulsing from the Ten Rings.' },
      { titleId: 'ms-marvel', note: 'Quantum Band bears Ten Rings temple markings.' },
      { titleId: 'the-marvels', note: 'Both Quantum Bands rip a hole into another universe.' },
    ],
  },
  {
    id: 'thread-spidey-space',
    title: "Spider-Man's Deep-Space Signal (Brand New Day)",
    category: 'post-credits',
    status: 'converging',
    summary:
      'In Spider-Man: Brand New Day’s post-credits scene, memory-wiped Ned Leeds’ "Spidey-Tracker" app watches Peter Parker’s dot shoot off Earth deep into outer space.',
    doomsdayImpact:
      'Acts as the eleventh-hour cliffhanger immediately preceding Avengers: Doomsday, yanking street-level Spider-Man back toward cosmic/multiversal stakes.',
    originTitleId: 'spider-man-no-way-home',
    keyTitleIds: ['spider-man-no-way-home', 'spider-man-brand-new-day', 'avengers-doomsday'],
    characterIds: ['peter-parker-616', 'punisher', 'bruce-banner', 'jean-grey-616'],
    realityIds: ['earth-616'],
    beats: [
      { titleId: 'spider-man-no-way-home', note: 'Everyone forgets Peter Parker’s identity.' },
      { titleId: 'spider-man-brand-new-day', note: 'Post-credits: Ned’s Spidey-Tracker traces Peter’s signature shooting out past the Moon into space.' },
    ],
    confidence: 'official',
    sources: [
      { label: 'Wikipedia — Spider-Man: Brand New Day', url: 'https://en.wikipedia.org/wiki/Spider-Man:_Brand_New_Day' },
    ],
  },
  {
    id: 'thread-wakanda-talokan',
    title: 'Wakanda & Talokan Mutual Defense Pact',
    category: 'faction',
    status: 'converging',
    summary:
      'Shuri spared Namor at the close of Wakanda Forever in exchange for an alliance promising Talokan will fight alongside Wakanda against surface/outside threats.',
    doomsdayImpact:
      'Explains why Shuri, M’Baku, Namor, and Namora deploy together in Avengers: Doomsday.',
    originTitleId: 'black-panther',
    keyTitleIds: ['black-panther', 'black-panther-wakanda-forever', 'avengers-doomsday'],
    characterIds: ['shuri', 'mbaku', 'namor', 'namora'],
    realityIds: ['earth-616'],
    beats: [
      { titleId: 'black-panther-wakanda-forever', note: 'Shuri and Namor sign a quiet mutual-defense truce while M’Baku steps up to the throne.' },
      { titleId: 'avengers-doomsday', note: 'Wakanda and Talokan unite on screen against Doctor Doom.' },
    ],
  },
  {
    id: 'thread-white-vision',
    title: "White Vision's Identity Quest",
    category: 'mystery',
    status: 'active',
    summary:
      'After Hex Vision unlocked his archival memories inside Westview, White Vision vanished to rebuild his identity—headlining 2026’s VisionQuest.',
    doomsdayImpact:
      'Bridges WandaVision and Agatha All Along to Earth-616’s late-2026 readiness before Doomsday.',
    originTitleId: 'wandavision',
    keyTitleIds: ['avengers-age-of-ultron', 'wandavision', 'vision-quest'],
    characterIds: ['white-vision'],
    realityIds: ['earth-616'],
    beats: [
      { titleId: 'wandavision', note: 'White Vision declares "I am Vision" and flies off.' },
      { titleId: 'vision-quest', note: '2026 Disney+ series follows White Vision confronting AI echoes including Ultron and Paladin alongside Thomas Shepherd.' },
    ],
    confidence: 'official',
    sources: [
      { label: 'Wikipedia — VisionQuest', url: 'https://en.wikipedia.org/wiki/VisionQuest' },
      { label: 'Marvel.com — VisionQuest', url: 'https://www.marvel.com/tv-shows/visionquest/1' },
    ],
  },
  {
    id: 'thread-strange-clea',
    title: "Doctor Strange & Clea's Off-World Incursion Mission",
    category: 'post-credits',
    status: 'open-mystery',
    summary:
      'Clea summoned Doctor Strange into the Dark Dimension at the end of Multiverse of Madness to help repair an incursion he triggered.',
    doomsdayImpact:
      'Leaves Earth-616 without its chief sorcerer during Brave New World and Thunderbolts* until multiversal collapse erupts.',
    originTitleId: 'doctor-strange-mom',
    keyTitleIds: ['doctor-strange-mom', 'avengers-doomsday'],
    characterIds: ['doctor-strange'],
    realityIds: ['earth-616', 'earth-838'],
    beats: [
      { titleId: 'doctor-strange-mom', note: 'Strange opens a Dark Dimension portal beside Clea with his third eye open.' },
    ],
  },

  // ── CLEARLY-BADGED THEORY / OPEN QUESTION LAYER ─────────────────────────────
  {
    id: 'thread-theory-stark-face',
    title: 'Theory: Why Doctor Doom Has Tony Stark’s Face',
    category: 'mystery',
    status: 'open-mystery',
    isTheory: true,
    summary:
      'UNCONFIRMED THEORY: Fans debate whether Victor von Doom is a true Stark variant whose Earth-828 life diverged, a Doom who hijacked/dreamwalked a Stark vessel, or an unrelated Victor whose face is an intentional psychological weapon against Earth-616’s Avengers.',
    doomsdayImpact:
      'However explained in the film, Earth-616 heroes—especially Peter Parker, Sam Wilson, and Bruce Banner—must confront a ruthless enemy wearing their fallen savior’s face.',
    originTitleId: 'iron-man',
    keyTitleIds: ['iron-man', 'avengers-endgame', 'fantastic-four-first-steps', 'avengers-doomsday'],
    characterIds: ['doctor-doom', 'tony-stark', 'peter-parker-616', 'steve-rogers'],
    realityIds: ['earth-616', 'earth-828'],
    beats: [
      { titleId: 'avengers-endgame', note: 'Earth-616 Tony Stark dies using the Infinity Stones.', isTheory: true },
      { titleId: 'fantastic-four-first-steps', note: 'RDJ returns as Victor von Doom (face unshown in mid-credits).', isTheory: true },
      { titleId: 'avengers-doomsday', note: 'Leading theories: (A) Earth-828 native Victor von Doom who happens to share Stark’s likeness; (B) Variant Stark adopted by Latveria.', isTheory: true },
    ],
  },
  {
    id: 'thread-theory-xmen-incursion',
    title: "Theory: Monica's Rift Triggers the 616 × 10005 Incursion",
    category: 'incursion',
    status: 'open-mystery',
    isTheory: true,
    summary:
      'UNCONFIRMED THEORY: Monica Rambeau crossing into Earth-10005-X (coupled with Carol Danvers searching for her and Deadpool/Wolverine’s Anchor Being stress) may serve as the direct trigger pitting the Fox X-Men against Earth-616’s Avengers.',
    doomsdayImpact:
      'Explains why Beast, Xavier, Magneto, and Cyclops clash with MCU Avengers before uniting against Doctor Doom.',
    originTitleId: 'the-marvels',
    keyTitleIds: ['the-marvels', 'deadpool-wolverine', 'avengers-doomsday'],
    characterIds: ['monica-rambeau', 'captain-marvel', 'beast', 'professor-x', 'cyclops'],
    realityIds: ['earth-616', 'earth-10005-x', 'earth-10005'],
    beats: [
      { titleId: 'the-marvels', note: 'Quantum Bands tear a hole linking 616 and an X-Men branch.', isTheory: true },
      { titleId: 'avengers-doomsday', note: 'Both realities collide under incursion pressure before Doom intervenes.', isTheory: true },
    ],
  },
  {
    id: 'thread-theory-battleworld',
    title: 'Theory: Doom Hijacks Franklin & Loki’s Tree to Forge Battleworld',
    category: 'incursion',
    status: 'open-mystery',
    isTheory: true,
    summary:
      'UNCONFIRMED THEORY: Doctor Doom seeks Franklin Richards’ reality-warping Power Cosmic in order to seize control of Loki’s Multiverse World Tree—turning Doomsday’s collapse into Secret Wars’ Battleworld.',
    doomsdayImpact:
      'Directly bridges Avengers: Doomsday (Dec 2026) into Avengers: Secret Wars (2027).',
    originTitleId: 'loki-s2',
    keyTitleIds: ['loki-s2', 'fantastic-four-first-steps', 'avengers-doomsday'],
    characterIds: ['doctor-doom', 'franklin-richards', 'loki'],
    realityIds: ['tva', 'earth-828', 'earth-616'],
    beats: [
      { titleId: 'loki-s2', note: 'Loki anchors all branches at the End of Time.', isTheory: true },
      { titleId: 'fantastic-four-first-steps', note: 'Doom approaches five-year-old Franklin Richards.', isTheory: true },
      { titleId: 'avengers-doomsday', note: 'Combining Franklin’s creation power with Yggdrasil’s dying strands enables Battleworld.', isTheory: true },
    ],
  },
];
