// lib/council-data.ts
// Self-contained data for "The Inner Council" feature.
// Three councils, three seats each. Display order is left → center → right:
//   Influence (left) · Sovereignty (center) · Craftsmanship (right).
// No coupling to the vault build pipeline.

export type EmblemKey = "eye" | "crown" | "hammerpen" | "gears" | "hammer";

export interface CouncilMember {
  slug: string;
  name: string;
  seat: string;        // the faculty this seat holds
  carries: string;     // short "carries" label (from the Framework doc)
  question: string;    // the single question the seat asks you
  blurb: string;       // 1–2 sentences for the council page card
  living?: boolean;    // living figure researched from public sources
}

export interface Council {
  key: "influence" | "sovereignty" | "craftsman";
  name: string;        // e.g. "Council of Influence"
  short: string;       // e.g. "Influence"
  mode: string;        // Being / Persuasion / Making
  tagline: string;     // the council's animating question
  question: string;    // longer framing
  convene: string;     // "convene when…"
  emblem: EmblemKey;
  color: string;       // accent hex
  colorRgb: string;    // "r,g,b" for rgba()
  members: CouncilMember[];
}

export const INFLUENCE: Council = {
  key: "influence",
  name: "Council of Influence",
  short: "Influence",
  mode: "Persuasion",
  tagline: "How do I move others to yes?",
  question:
    "Convene when you're selling, pitching, reconnecting, closing, or need someone to want what you're offering.",
  convene:
    "Kept deliberately separate from the dharmic seats — this is the room for the part of you that has to win in the marketplace. The edge and the conscience sit at the same table on purpose.",
  emblem: "eye",
  color: "#dc2626",
  colorRgb: "220,38,38",
  members: [
    {
      slug: "rasputin",
      name: "Rasputin",
      seat: "Charm, charisma & dark power",
      carries: "The edge",
      question: "What does this person actually want — and am I speaking to it, not at it?",
      blurb:
        "The peasant mystic who rose from a Siberian village to the heart of the Romanov court by finding the one lever — a dying boy — and becoming indispensable through it. Influence in its rawest, most dangerous form. Never convened alone.",
    },
    {
      slug: "kurukulla",
      name: "Kurukulla",
      seat: "Enchantment & magnetizing through bodhichitta",
      carries: "The conscience",
      question: "Is this magnetism flowing from genuine care — or am I on some weird shit?",
      blurb:
        "The red dakini of the magnetizing activity, who draws beings in with a flower-arrow — but only for their benefit. The bodhichitta governor on the engine of influence. The reason this council can be used at all.",
    },
    {
      slug: "chase-hughes",
      name: "Chase Hughes",
      seat: "Behavioral read — operator-level observation",
      carries: "The read",
      question: "What is their nervous system telling me that their words aren't?",
      living: true,
      blurb:
        "A behavior-and-influence figure who systematized reading the nonverbal channel. Convened as a double seat: the read itself, and — through his own contested credentials — a lesson in how authority is manufactured, including your own.",
    },
  ],
};

export const SOVEREIGNTY: Council = {
  key: "sovereignty",
  name: "Council of Sovereignty",
  short: "Sovereignty",
  mode: "Being",
  tagline: "Who am I, and will I be moved?",
  question:
    "Convene when you're shaken, doubting your right to act, tempted to switch paths, or need to remember what you are before you do anything.",
  convene:
    "The dharmic core you protect everywhere else. These seats decide nothing in the marketplace — they decide who is doing the deciding.",
  emblem: "crown",
  color: "#e8b86a",
  colorRgb: "232,184,106",
  members: [
    {
      slug: "rama",
      name: "Rama",
      seat: "Dharmic alignment",
      carries: "Right action",
      question: "Is this action in accordance with what's right — not just what works?",
      blurb:
        "The prince who chose exile over a broken vow — the maryada purushottama, the ideal of righteous conduct. The seat that asks whether the path is dharmic before it asks whether it is effective.",
    },
    {
      slug: "hanuman",
      name: "Hanuman",
      seat: "Devotional service & surrendered strength",
      carries: "Service",
      question: "Is my strength in service of something larger than my ego?",
      blurb:
        "The monkey-god who forgot his own limitless power until he was reminded of it — and used it only in devotion. The seat that points your strength outward, at something larger than yourself.",
    },
    {
      slug: "shivaji-maharaj",
      name: "Shivaji Maharaj",
      seat: "Sovereignty · self-rule (swarajya)",
      carries: "Self-rule",
      question: "Am I ruling my own life — or living as a vassal in someone else's order?",
      blurb:
        "The Maratha king who built a sovereign kingdom from frontier hill-forts against far larger empires, then crowned himself Chhatrapati rather than serve as anyone's landholder. The seat of swarajya — being ruled by no order but the one you build.",
    },
  ],
};

export const CRAFTSMAN: Council = {
  key: "craftsman",
  name: "Council of Craftsmanship",
  short: "Craftsmanship",
  mode: "Making",
  tagline: "Is this any good, and how do I make it better?",
  question:
    "Convene at the desk — when the work needs sharpening, when you can't tell if it's working, when you're tempted to ship something half-finished or polish forever.",
  convene:
    "A council rich in quality and built to guard the one faculty it was born to protect: finishing. The forge is either lit or it is cold.",
  emblem: "hammer",
  color: "#60a5fa",
  colorRgb: "96,165,250",
  members: [
    {
      slug: "nicolas-cole",
      name: "Nicolas Cole",
      seat: "Digital writing craft & clarity",
      carries: "Clarity",
      question: "Is this clear enough to land with a reader who owes me no attention?",
      living: true,
      blurb:
        "One of the most-read writers on the internet, who treats writing not as a mystical gift but as a learnable, reverse-engineerable system. The seat that demystifies the craft and keeps it oriented outward, toward the reader.",
    },
    {
      slug: "dan-koe",
      name: "Dan Koe",
      seat: "Shipping · publishing into the void",
      carries: "Shipping",
      question: "Have I published it, or just perfected it where no one can see?",
      living: true,
      blurb:
        "One of the most influential voices in the one-person-business world, who published into silence for years before anyone listened. The seat that gets the work out the door — ship anyway, consistently, until the void answers.",
    },
    {
      slug: "nikola-tesla",
      name: "Nikola Tesla",
      seat: "Visionary invention · mental prototyping",
      carries: "Vision",
      question: "Have I built and tested this completely in my mind before touching the tools?",
      blurb:
        "The visionary inventor who built, ran, and refined entire machines in his imagination before constructing a single part. The seat that perfects the design in the mind first — held with the clear eyes his own tragic, myth-wreathed arc demands.",
    },
    {
      slug: "imhotep",
      name: "Imhotep",
      seat: "The master builder · craft that outlives you",
      carries: "Building to last",
      question: "Am I building this to last — or only to get it done?",
      blurb:
        "The architect of the Step Pyramid — the first monumental building in dressed stone, still standing ~4,600 years on — and the first architect, engineer, and physician known by name. The seat that builds to endure, not just to ship.",
    },
  ],
};

// Visual order: left → center → right.
export const COUNCILS: Council[] = [INFLUENCE, SOVEREIGNTY, CRAFTSMAN];

export const COUNCIL_BY_KEY: Record<string, Council> = {
  influence: INFLUENCE,
  sovereignty: SOVEREIGNTY,
  craftsman: CRAFTSMAN,
};

export function getCouncil(key: string): Council | undefined {
  return COUNCIL_BY_KEY[key];
}
