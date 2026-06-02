// ============================================
// DREAMSCAPE JOURNEY — DEEP ARCHETYPAL GENERATORS
// This file is the soul of the experience.
// All content is designed to feel ancient, personal, and psychologically resonant.
// ============================================

export function simpleHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash);
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getSeededIndex(seed: number, length: number): number {
  return Math.floor(seededRandom(seed) * length);
}

// ============================================
// NAME ANALYSIS — Creates real personality from the name
// ============================================
export interface NameProfile {
  length: number;
  vowelWeight: number;      // 0-1, how "open / receptive" the name feels
  consonantWeight: number;  // 0-1, how "structured / grounded"
  firstLetterArchetype: string;
  dominantVowel: string;
  soulTone: number;         // 0-5 for musical / emotional key
}

const VOWELS = 'aeiouy';
const ARCHETYPES: Record<string, string> = {
  A: "The Initiator", E: "The Witness", I: "The Seeker", O: "The Keeper", U: "The Mourner",
  Y: "The Weaver", B: "The Builder", C: "The Alchemist", D: "The Guardian", F: "The Flame",
  G: "The Root", H: "The Threshold", J: "The Herald", K: "The Blade", L: "The Listener",
  M: "The Mountain", N: "The Night", P: "The Priest", R: "The River", S: "The Shadow",
  T: "The Tower", V: "The Veil", W: "The Wind", Z: "The End",
};

export function analyzeName(name: string): NameProfile {
  const clean = name.toLowerCase().trim();
  const letters = clean.replace(/[^a-z]/g, '');
  const length = Math.min(letters.length, 18);

  let vowelCount = 0;
  let dominantVowel = 'a';
  const vowelFreq: Record<string, number> = {};

  for (const ch of letters) {
    if (VOWELS.includes(ch)) {
      vowelCount++;
      vowelFreq[ch] = (vowelFreq[ch] || 0) + 1;
    }
  }

  let max = 0;
  Object.entries(vowelFreq).forEach(([v, c]) => {
    if (c > max) { max = c; dominantVowel = v; }
  });

  const vowelWeight = Math.min(1, vowelCount / Math.max(3, letters.length * 0.45));
  const consonantWeight = 1 - vowelWeight;

  const first = letters[0]?.toUpperCase() || 'A';
  const firstLetterArchetype = ARCHETYPES[first] || "The Wanderer";

  // Soul tone: derived from char codes for consistent "musical key"
  const soulTone = letters.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 6;

  return {
    length,
    vowelWeight,
    consonantWeight,
    firstLetterArchetype,
    dominantVowel,
    soulTone,
  };
}

// ============================================
// MYTHIC DREAM TITLES — Far more archetypal and specific
// ============================================
const DREAM_TITLES = [
  "Bearer of the Unwritten Name",
  "Walker Between Two Moons",
  "Keeper of the Ninth Threshold",
  "Shepherd of Forgotten Constellations",
  "The One Who Remembers the Sky",
  "Warden of the Breathing Stone",
  "Child of the Last Unbroken Dream",
  "Singer of Names the Wind Has Lost",
  "Guardian of the Root That Dreams",
  "The Quiet Architect of Becoming",
  "Heir to the Lantern That Never Dies",
  "Weaver of the Veil Between Heartbeats",
  "The One Who Carries the River Home",
  "Listener at the Edge of All Things",
  "The Hand That Holds the Sleeping Flame",
];

// ============================================
// DEEP DESTINY QUOTES — Literary and emotionally heavy
// ============================================
const DESTINY_QUOTES = [
  "You did not arrive here by accident. Something older than your memory has been guiding your steps toward this exact moment of recognition.",
  "Every name is a spell cast by the future upon the past. Yours has been working quietly for years, preparing you for what you are only now ready to see.",
  "There is a version of you that has already lived this journey. It is waiting on the other side of your fear, holding a lantern.",
  "The world does not need you to be more. It needs you to be willing to be exactly what you already are when no one is watching.",
  "Some names are doors. Yours appears to be one that opens inward. Few are brave enough to walk through.",
  "You have spent your life collecting pieces of a story that only makes sense when told in the dark, to no one but yourself.",
  "The oldest gods were not worshipped in temples. They were recognized in the sudden silence between one breath and the next. You are learning their language.",
  "What you have always called coincidence was simply the universe using your true name without your permission.",
  "You are not here to find yourself. You are here to remember that you were never lost — only deliberately hidden from those who would fear what you carry.",
  "There are names that must be spoken only once in a lifetime, and only when the listener is ready to be changed by them. This may be one of those moments.",
];

// ============================================
// WORLD ECHOES — Deep, personalized reflections for each realm
// ============================================
const SKY_ECHOES = [
  "The clouds do not ask the wind for permission to move. Neither should you.",
  "Everything that has ever risen must one day learn how to fall with grace. You are learning.",
  "There is a kind of freedom that only exists at great height. Most people spend their lives afraid of it.",
  "The sky has never once judged a single creature for the shape of its wings.",
];

const CRYSTAL_ECHOES = [
  "What is buried deepest often becomes the most unbreakable. You have always known this.",
  "Crystals do not grow in comfort. They require pressure, darkness, and time. So do souls.",
  "The stone remembers every footstep that has ever walked upon it. Your name is already written in its memory.",
  "Sometimes the clearest reflection is found in the darkest cavern, where no light can reach to distort it.",
];

const OCEAN_ECHOES = [
  "The ocean has no need to prove its depth. It simply is. You are learning the same art.",
  "Every wave that reaches the shore has already surrendered to something larger than itself.",
  "You are not drowning. You are being taught how to breathe in a different medium.",
  "The stars have always used the water as their mirror. Perhaps they have been trying to show you something.",
];

const FOREST_ECHOES = [
  "The oldest trees do not compete for light. They simply become so vast that light finds them.",
  "Roots do not ask permission before they reach toward water. They simply know where life is.",
  "Every forest was once a single seed that decided the darkness was not an enemy.",
  "The trees have been practicing patience longer than any civilization has practiced war.",
];

const MIRROR_ECHOES = [
  "The water does not lie. It simply waits until you are still enough to see what has always been there.",
  "What you fear others will see in you is usually the part you have refused to look at yourself.",
  "In this lake there are no waves. Only the truth you have been too busy to notice.",
  "You have always been both the question and the answer. The lake is only reminding you.",
];

// ============================================
// THE GUARDIANS — Now proper archetypal beings with depth
// ============================================
export interface Guardian {
  name: string;
  epithet: string;
  description: string;
  symbol: string;
  color: string;
  glowColor: string;
  message: string;      // The direct message they give the user (personalized)
  lesson: string;       // What they teach
  shadow: string;       // Their warning / dark mirror
  threeProps: {         // Hints for 3D rendering
    geometry: 'wolf' | 'phoenix' | 'dragon' | 'deer' | 'tiger';
    scale: number;
    emissive: number;
  };
}

const GUARDIANS: Guardian[] = [
  {
    name: "The Moon Wolf",
    epithet: "Silent Witness of Thresholds",
    description: "It does not hunt. It watches. It has seen every version of you that ever existed and loved them all without condition.",
    symbol: "☾",
    color: "#c5d5f0",
    glowColor: "#e0e7ff",
    message: "You have spent too long believing you must choose between your wildness and your belonging. Both are true.",
    lesson: "Loyalty without self-erasure is the highest form of love.",
    shadow: "You fear being truly seen because you still believe parts of you are unworthy of the pack.",
    threeProps: { geometry: 'wolf', scale: 1.15, emissive: 0.55 },
  },
  {
    name: "The Crystal Phoenix",
    epithet: "The One Who Burns and Remembers",
    description: "It has died more times than you have been born. Each death was a lesson it chose. Each rebirth was an act of radical forgiveness toward itself.",
    symbol: "✧",
    color: "#f0abfc",
    glowColor: "#fae8ff",
    message: "You are not broken. You are between fires. The part of you that must die is not the same as the part that must survive.",
    lesson: "Transformation is not improvement. It is the honest recognition of what no longer serves the soul.",
    shadow: "You have mistaken constant reinvention for growth. Sometimes the bravest thing is to remain.",
    threeProps: { geometry: 'phoenix', scale: 1.0, emissive: 0.7 },
  },
  {
    name: "The Azure Dragon",
    epithet: "Breath of the Forgotten Sea",
    description: "It does not speak in words. It speaks in pressure changes, in the weight of water, in the electricity before a storm. It has carried entire civilizations in its coils and set none of them down gently.",
    symbol: "〜",
    color: "#67e8f9",
    glowColor: "#bae6fd",
    message: "The storm inside you is not a flaw. It is ancient weather that has been waiting for a body honest enough to weather it.",
    lesson: "Power that refuses to destroy is more terrifying than power that cannot.",
    shadow: "You have confused gentleness with smallness. Your mercy has cost you pieces of your own truth.",
    threeProps: { geometry: 'dragon', scale: 1.25, emissive: 0.45 },
  },
  {
    name: "The Celestial Stag",
    epithet: "Walker of the Hidden Paths",
    description: "Its antlers are not bone. They are the branches of a tree that grows only in the space between what is and what could have been. It appears only to those who have lost something they were never meant to keep.",
    symbol: "⚜︎",
    color: "#d1d5db",
    glowColor: "#f3e8ff",
    message: "You are allowed to mourn the life you thought you would live. Grief is not the opposite of gratitude — it is its shadow.",
    lesson: "Grace is not the absence of weight. It is the decision to carry it differently.",
    shadow: "You have been performing peace for so long that you have forgotten what your own anger sounds like.",
    threeProps: { geometry: 'deer', scale: 1.1, emissive: 0.5 },
  },
  {
    name: "The Storm Tiger",
    epithet: "The Boundary That Walks",
    description: "It exists only where two worlds meet: day and night, life and death, love and terror. It does not protect you from the edge. It teaches you how to stand there without flinching.",
    symbol: "⚡",
    color: "#fcd34d",
    glowColor: "#fef08c",
    message: "The part of you that still flinches when someone offers you real love is the part that still believes you must earn the right to exist.",
    lesson: "Ferocity and tenderness were never meant to be enemies. You were born containing both.",
    shadow: "You have weaponized your sensitivity as a form of control. Your vulnerability is not a liability — it is the only honest map you own.",
    threeProps: { geometry: 'tiger', scale: 1.18, emissive: 0.6 },
  },
];

// ============================================
// PERSONALIZED ECHOES — The world speaks to *this* person
// ============================================
export function getWorldEcho(phase: string, name: string, profile: NameProfile): string {
  const hash = simpleHash(name + phase);
  let pool: string[] = [];

  switch (phase) {
    case 'sky': pool = SKY_ECHOES; break;
    case 'crystal': pool = CRYSTAL_ECHOES; break;
    case 'ocean': pool = OCEAN_ECHOES; break;
    case 'mirror': pool = MIRROR_ECHOES; break;
    case 'forest': pool = FOREST_ECHOES; break;
    default: return "";
  }

  // Bias toward certain echoes based on name profile for deeper personalization
  let index = getSeededIndex(hash, pool.length);
  if (profile.vowelWeight > 0.65 && phase === 'ocean') index = Math.min(pool.length - 1, index + 1);
  if (profile.consonantWeight > 0.7 && phase === 'crystal') index = Math.min(pool.length - 1, index + 1);

  return pool[index % pool.length];
}

// ============================================
// GUARDIAN SELECTION + PERSONALIZED MESSAGE
// ============================================
export function getGuardianSpirit(name: string, profile: NameProfile): Guardian {
  const hash = simpleHash(name.toLowerCase().trim() + profile.firstLetterArchetype);
  let index = getSeededIndex(hash * 17 + 41, GUARDIANS.length);

  // Gentle bias: more "open" names lean toward Phoenix or Stag, grounded names toward Wolf or Tiger
  if (profile.vowelWeight > 0.72 && index < 2) index = 1; // Phoenix
  if (profile.consonantWeight > 0.78 && index > 2) index = 0; // Wolf

  const guardian = { ...GUARDIANS[index] };

  // Inject the user's name into the message for intimacy
  guardian.message = guardian.message.replace(/You/g, name).replace(/your/g, `${name.toLowerCase()}'s`);
  
  return guardian;
}

// ============================================
// FINAL TITLES & QUOTES (still seeded but richer)
// ============================================
export function getDreamTitle(name: string, profile: NameProfile): string {
  const hash = simpleHash(name.toLowerCase().trim() + profile.soulTone);
  let index = getSeededIndex(hash * 7 + 13, DREAM_TITLES.length);

  // Bias for very long or very short names
  if (profile.length > 11 && index < 4) index = 3;
  if (profile.length < 5 && index > 10) index = 13;

  return DREAM_TITLES[index];
}

export function getDestinyQuote(name: string, profile: NameProfile): string {
  const hash = simpleHash(name.toLowerCase().trim() + profile.dominantVowel);
  return DESTINY_QUOTES[getSeededIndex(hash * 11 + 29, DESTINY_QUOTES.length)];
}

// ============================================
// WORLD WELCOME + THRESHOLD TEXT
// ============================================
export function getWorldThresholdText(phase: string, name: string): { title: string; line: string } {
  const messages: Record<string, { title: string; line: string }> = {
    sky: {
      title: "The First Threshold",
      line: "The wind does not ask who you were before you learned to fly.",
    },
    crystal: {
      title: "The Second Threshold",
      line: "What you have hidden in darkness is now becoming your light.",
    },
    ocean: {
      title: "The Third Threshold",
      line: "You are not meant to stay above the surface forever.",
    },
    mirror: {
      title: "The Fourth Threshold",
      line: "Stillness is not emptiness. It is where the name finally speaks back.",
    },
    forest: {
      title: "The Fifth Threshold",
      line: "The oldest magic has always grown in places no one thought to look.",
    },
  };
  return messages[phase] || { title: "", line: "" };
}

export function getWelcomeMessage(world: number, name: string, profile: NameProfile): string {
  const base = [
    `Even the sky has been waiting for someone who carries your particular kind of light, ${name}.`,
    `The stone has held your name in its memory longer than you have been alive.`,
    `The water recognizes the shape of your silence, ${name}.`,
    `The forest has already prepared a place for the version of you that no longer needs to hide.`,
  ];
  return base[Math.min(world - 1, base.length - 1)];
}

// ============================================
// FINAL BLESSING — The last thing the user hears
// ============================================
export function getFinalBlessing(name: string, guardian: Guardian, profile: NameProfile): string {
  const blessings = [
    `You have walked through fire that did not burn you and water that did not drown you. ${name}, the world is slightly kinder now because you remembered how to dream inside it.`,
    `Whatever you choose to become next, know this: you were never required to be smaller than the sky that named you.`,
    `The journey does not end here. It only becomes honest. Carry ${guardian.name} with you — not as a pet, but as a reminder that something ancient still believes you are worth guarding.`,
  ];
  return blessings[getSeededIndex(simpleHash(name + guardian.name), blessings.length)];
}