// lib/hubIcons.ts — deterministic keyword → emoji picker for hub cards.
// Not infinite (emoji can't be), so repeats are expected and fine — the goal
// is "thematically plausible," not "globally unique."

const KEYWORD_RULES: Array<[RegExp, string]> = [
  // history
  [/genghis|alexander|punic|guerrilla|conquest|maratha/i, "⚔️"],
  [/sun tzu|art of war/i, "🏹"],
  [/chinese (military|unorthodox)|ch'i/i, "☯️"],
  [/roman empire/i, "🏛️"],
  [/stalin|hitler|terror/i, "🩸"],
  [/putin|power consolidation/i, "👑"],
  [/rasputin/i, "🕯️"],
  [/romanov|imperial russia/i, "❄️"],
  [/neolithic|astronomy/i, "🌌"],
  [/population genetics|migration/i, "🧬"],
  [/ritual violence|sacrifice/i, "🔥"],
  [/arthashastra|mauryan|ashokan/i, "🪷"],
  [/faxian|buddhist kingdoms/i, "🧭"],
  [/robert greene/i, "🐍"],

  // psychology
  [/archetypal psychology/i, "🎭"],
  [/shame/i, "🫥"],
  [/trauma.*soul|soul.*trauma/i, "👻"],
  [/trauma|dissociation|somatic/i, "🩹"],
  [/moore and gillette/i, "🛡️"],
  [/identity architecture/i, "🪞"],
  [/inner child|child psychology/i, "🧸"],
  [/maslow/i, "🔺"],
  [/mass psychology|public opinion/i, "📢"],
  [/mental control|suppression|coercion/i, "🧠"],
  [/neuroscience|brain/i, "⚡"],
  [/power, authority|social navigation/i, "👑"],
  [/subpersonality|parts psychology/i, "🧩"],
  [/ego development/i, "🌱"],
  [/alchemical|individuation/i, "⚗️"],
  [/gigerenzer|depth psychology/i, "🔮"],
  [/evolutionary psychology/i, "🧬"],
  [/behavioral economics|decision science/i, "🎲"],
  [/bioenergetics|character structure/i, "⚡"],
  [/achievement, identity/i, "🏔️"],

  // eastern-spirituality
  [/bodhisattva|chuan fa/i, "🥋"],
  [/buddhist philosophy/i, "☸️"],
  [/charvaka|materialism/i, "⚛️"],
  [/guru authority|transmission/i, "🕉️"],
  [/kṛṣṇa|krishna|bhakti/i, "🪈"],
  [/mysticism|numinous/i, "✨"],
  [/indian aesthetics/i, "🎨"],
  [/sadhana/i, "🧘"],
  [/śākta|shakta|devī māhātmyam/i, "🗡️"],
  [/śiva|shiva/i, "🔱"],
  [/siddhis/i, "💫"],
  [/soul cosmology|death transit/i, "🌑"],
  [/trika|tantric metaphysics/i, "🕸️"],
  [/vedic astrology/i, "🔭"],
  [/vedic philosophy/i, "📜"],
  [/vivekananda|four yogas/i, "🙏"],
  [/waryoga/i, "🗿"],
  [/yoga and tantra history/i, "📿"],

  // business
  [/ai-assisted creator/i, "🤖"],
  [/^ai$|^ai /i, "🤖"],
  [/branding/i, "🏷️"],
  [/creator economy/i, "💡"],
  [/russell brunson/i, "📈"],
  [/sales/i, "🤝"],

  // creative-practice
  [/historiography/i, "🖋️"],
  [/integral storytelling/i, "🌀"],
  [/narrative architecture/i, "🏗️"],
  [/nāṭyaśāstra|content creation/i, "🎭"],
  [/non-fiction writing/i, "📰"],
  [/oral storytelling/i, "🗣️"],
  [/presence-based/i, "🌊"],
  [/screenwriting/i, "🎬"],
  [/worldbuilding/i, "🌍"],
  [/writing practice|creator discipline/i, "✍️"],

  // cross-domain
  [/economics, pricing|behavioral signaling/i, "💹"],
  [/japanese martial/i, "⛩️"],
  [/knowledge encoding/i, "🗝️"],
  [/language, semiotics/i, "🔤"],
  [/meaning, temporality/i, "⏳"],
  [/polymathic/i, "🧭"],
  [/narrative authority|knowledge production/i, "📚"],
  [/sacred cosmology|supernatural/i, "👁️"],
  [/solar consciousness/i, "☀️"],
  [/warfare, coercion|conflict theory/i, "⚔️"],

  // behavioral-mechanics
  [/capital accumulation/i, "💰"],
  [/chase hughes/i, "🎯"],
  [/consumer psychology|pricing/i, "🏷️"],
  [/decline mechanisms/i, "📉"],
  [/evolutionary behavioral/i, "🧬"],
  [/haha lung/i, "🥷"],
  [/manipulation and influence/i, "🕹️"],
  [/online positioning|personal monopoly/i, "🎯"],
  [/pecking order/i, "🐓"],
  [/strategic positioning|indirect approach/i, "♟️"],

  // african-spirituality
  [/igbo/i, "🌳"],
  [/odinala/i, "🛖"],
  [/odwirafo kemetic/i, "🏺"],
  [/odwirafo tradition/i, "🥁"],
  [/west african/i, "🌍"],
];

// Domain-level fallback pools — used only if no keyword rule matched.
// Cycled by index so consecutive misses in the same domain don't all
// collapse onto the same glyph.
const DOMAIN_FALLBACK: Record<string, string[]> = {
  "eastern-spirituality": ["🕉️", "🪷", "☸️", "🔱"],
  history: ["📜", "🏹", "⚔️", "🗿"],
  psychology: ["🧠", "🪞", "🎭", "🌱"],
  business: ["💡", "📈", "🤝", "🏷️"],
  "creative-practice": ["✍️", "🎬", "🌀", "📰"],
  "african-spirituality": ["🌳", "🥁", "🛖", "🏺"],
  "cross-domain": ["🧭", "👁️", "🔤", "⏳"],
  "behavioral-mechanics": ["🎯", "♟️", "🕹️", "💰"],
  "occult": ["🔮", "🕯️", "⚗️", "🗝️"],
};

/** Deterministic per-hub glyph: keyword match first, then a domain-cycled fallback. */
export function pickHubIcon(title: string, domain: string, index = 0): string {
  const clean = title.replace(" — Map of Content", "").replace(/ Hub$/i, "");
  for (const [re, glyph] of KEYWORD_RULES) {
    if (re.test(clean)) return glyph;
  }
  const pool = DOMAIN_FALLBACK[domain] ?? ["✦"];
  return pool[index % pool.length];
}
