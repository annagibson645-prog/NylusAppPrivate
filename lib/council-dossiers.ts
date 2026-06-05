// lib/council-dossiers.ts
// Full member dossiers (long-form) for all nine seats of The Inner Council.
// Faithful to the user's uploaded Council dossiers (Influence + Craftsmanship)
// and to researched public-source material (Leonardo, Tesla) and tradition
// (Rama, Hanuman, Mañjuśrī). One shape, rendered by the member-page route.

export interface DossierSection {
  label: string;
  body: string[]; // paragraphs (or, for "Signature Moves", short move-statements)
}

export interface MemberDossier {
  slug: string;
  name: string;
  councilKey: "influence" | "sovereignty" | "craftsman";
  councilName: string;
  mode: string;
  emblem: "eye" | "crown" | "hammer";
  color: string;
  colorRgb: string;
  living: boolean;
  carries: string;
  seatTitle: string;
  question: string;
  pullQuote: string;
  meta: { k: string; v: string }[];
  sections: DossierSection[];
  cautions: string[];
}

const INFLUENCE = { key: "influence" as const, name: "Council of Influence", mode: "Persuasion", emblem: "eye" as const, color: "#dc2626", colorRgb: "220,38,38" };
const SOVEREIGNTY = { key: "sovereignty" as const, name: "Council of Sovereignty", mode: "Being", emblem: "crown" as const, color: "#e8b86a", colorRgb: "232,184,106" };
const CRAFTSMAN = { key: "craftsman" as const, name: "Council of Craftsmanship", mode: "Making", emblem: "hammer" as const, color: "#60a5fa", colorRgb: "96,165,250" };

/* ════════════════════════ SOVEREIGNTY ════════════════════════ */

export const RAMA: MemberDossier = {
  slug: "rama", name: "Rama", councilKey: SOVEREIGNTY.key, councilName: SOVEREIGNTY.name, mode: SOVEREIGNTY.mode,
  emblem: SOVEREIGNTY.emblem, color: SOVEREIGNTY.color, colorRgb: SOVEREIGNTY.colorRgb, living: false,
  carries: "Right action",
  seatTitle: "The Seat of Dharmic Alignment",
  question: "Is this action in accordance with what's right — not just what works?",
  pullQuote: "Character is revealed in what you refuse to do for advantage.",
  meta: [
    { k: "Tradition", v: "Hindu (Vaiṣṇava)" },
    { k: "Source", v: "The Rāmāyaṇa" },
    { k: "Holds", v: "Dharmic alignment" },
    { k: "Council", v: "Sovereignty" },
  ],
  sections: [
    { label: "Life Arc", body: [
      "Rama is the seventh avatar of Vishnu, the prince of Ayodhya whose story is told in the Rāmāyaṇa. Heir to the throne, he accepts fourteen years of forest exile rather than let his father break a vow — choosing dharma over his own crown. When his wife Sita is abducted by the demon-king Ravana, Rama, allied with Hanuman and the monkey armies, wages the war to recover her and restore order.",
      "He is remembered as maryādā puruṣottama — the perfect man of righteous conduct, the one who holds the line of dharma even when it costs him everything.",
    ]},
    { label: "Psychology", body: [
      "Rama is the seat of choosing what is right over what merely works. His defining act is renunciation in service of a vow: he could have contested the exile, but he upholds his father's word and his own dharma without bitterness.",
      "He embodies the conviction that character is revealed not in what you achieve but in what you refuse to do for advantage — that the line you will not cross is the truest measure of who you are.",
    ]},
    { label: "Signature Moves", body: [
      "Honoring the vow even when it costs the crown — keeping one's word as the ground of selfhood.",
      "Holding the line of right conduct under pressure, without self-pity or grievance.",
      "Acting from duty rather than appetite or expedience.",
    ]},
    { label: "Personality", body: [
      "Steady, dutiful, restrained, principled — at times austere. He carries authority through self-command rather than force, and bears hardship without complaint.",
    ]},
    { label: "Cultural Impact", body: [
      "Rama is among the most widely revered figures in Hindu civilization — the ideal of righteous kingship and conduct, his story retold across South and Southeast Asia for millennia. To invoke him is to invoke right action held above advantage.",
    ]},
    { label: "How to Convene", body: [
      "Convene Rama when you are tempted to do what works instead of what is right — when expedience is whispering that the rule, the promise, or the principle can bend just this once. He does not ask whether the move is clever. He asks whether it is clean.",
    ]},
  ],
  cautions: [
    "Dharma held without compassion can harden into rigidity — the tradition itself wrestles with where Rama's adherence to duty wounded those he loved, Sita above all. Right action is not the same as inflexible action. Take the steadiness; keep the mercy.",
  ],
};

export const HANUMAN: MemberDossier = {
  slug: "hanuman", name: "Hanuman", councilKey: SOVEREIGNTY.key, councilName: SOVEREIGNTY.name, mode: SOVEREIGNTY.mode,
  emblem: SOVEREIGNTY.emblem, color: SOVEREIGNTY.color, colorRgb: SOVEREIGNTY.colorRgb, living: false,
  carries: "Service",
  seatTitle: "The Seat of Devotional Service & Surrendered Strength",
  question: "Is my strength in service of something larger than my ego?",
  pullQuote: "He forgot his own strength until it was needed — and used it only in service.",
  meta: [
    { k: "Tradition", v: "Hindu" },
    { k: "Source", v: "The Rāmāyaṇa" },
    { k: "Holds", v: "Devotional service" },
    { k: "Council", v: "Sovereignty" },
  ],
  sections: [
    { label: "Life Arc", body: [
      "Hanuman is the monkey-god of the Rāmāyaṇa, son of the wind — a being of near-limitless strength, speed, and shape-shifting power. In his myth, his power as a child was so disruptive that the sages laid a curse-blessing on him: he would forget his own strength until he was reminded of it.",
      "In Rama's service he leaps across the ocean to find Sita, carries a whole mountain of healing herbs, and burns the city of Lanka — becoming the model of bhakti, devotion, channeling overwhelming power entirely into service of something greater than himself.",
    ]},
    { label: "Psychology", body: [
      "Hanuman is the seat of strength made safe by surrender. His power is real and immense, but it is governed: it activates fully only in devotion, never for his own aggrandizement.",
      "The myth of forgotten power is the key. He holds his strength lightly — remembering it only when the work requires it, not when his ego does. The strongest figure in the epic is also the least self-seeking.",
    ]},
    { label: "Signature Moves", body: [
      "Channeling full power into service of something larger than the self.",
      "Holding strength lightly — not performing it, not hoarding it, deploying it only when the task demands.",
      "Devotion and loyalty as the organizing principle of action.",
    ]},
    { label: "Personality", body: [
      "Devoted, humble despite vast power, courageous, joyful, and selfless. He is the rare figure whose might never curdles into self-regard.",
    ]},
    { label: "Cultural Impact", body: [
      "Hanuman is among the most beloved deities in Hinduism — patron of strength, devotion, and selfless service, invoked across the subcontinent for courage and protection. To invoke him is to point your strength outward, at something worth serving.",
    ]},
    { label: "How to Convene", body: [
      "Convene Hanuman when your strength is curdling into ego — when you are using your power to be seen rather than to serve. He turns the question from 'how strong am I?' to 'what is my strength for?'",
    ]},
  ],
  cautions: [],
};

export const MANJUSHRI: MemberDossier = {
  slug: "manjushri", name: "Mañjuśrī", councilKey: SOVEREIGNTY.key, councilName: SOVEREIGNTY.name, mode: SOVEREIGNTY.mode,
  emblem: SOVEREIGNTY.emblem, color: SOVEREIGNTY.color, colorRgb: SOVEREIGNTY.colorRgb, living: false,
  carries: "The clean cut",
  seatTitle: "The Seat of Cutting Wisdom & Equanimity in Suffering",
  question: "What's the one clean cut through this — and can I stay unmoved while it's hard?",
  pullQuote: "The sword does not hack. It severs ignorance in a single clean stroke.",
  meta: [
    { k: "Tradition", v: "Mahāyāna / Vajrayāna Buddhism" },
    { k: "Holds", v: "Cutting wisdom" },
    { k: "Emblem", v: "The flaming sword" },
    { k: "Council", v: "Sovereignty" },
  ],
  sections: [
    { label: "Life Arc", body: [
      "Mañjuśrī is the bodhisattva of wisdom (prajñā) in Mahāyāna and Vajrayāna Buddhism, depicted wielding a flaming sword in his right hand — the sword that cuts through ignorance — and holding a text of the Perfection of Wisdom in his left.",
      "He is among the oldest and most significant bodhisattvas: the embodiment of transcendent insight — not knowledge accumulated, but the discriminating wisdom that severs confusion in a single stroke.",
    ]},
    { label: "Psychology", body: [
      "Mañjuśrī is the seat of the clean cut — the discriminating wisdom that finds the one decisive distinction and acts on it, paired with the equanimity to remain unmoved while the cut is made.",
      "The flaming sword does not hack; it severs delusion in one clean motion. This is clarity under difficulty: seeing the single thing that must be cut, and holding steady through the discomfort of cutting it.",
    ]},
    { label: "Signature Moves", body: [
      "Finding the one decisive distinction — the single clean cut — rather than thrashing at the whole tangle.",
      "Severing delusion in one stroke: clarity over accumulation.",
      "Holding equanimity while the hard thing is done — staying unmoved in suffering.",
    ]},
    { label: "Personality", body: [
      "Serene, incisive, luminous, unshakeable — wisdom personified as a youthful prince, calm and razor-clear.",
    ]},
    { label: "Cultural Impact", body: [
      "Mañjuśrī is venerated across Mahāyāna Buddhism — China, Tibet, Japan, Nepal — as the very personification of wisdom; his sword and text are among Buddhism's most recognizable images. To invoke him is to invoke the one clean cut.",
    ]},
    { label: "How to Convene", body: [
      "Convene Mañjuśrī when you are tangled — overthinking, thrashing, unable to find the decisive move, or flinching from a hard but necessary cut. He does not ask you to understand everything. He asks where the single stroke goes.",
    ]},
  ],
  cautions: [],
};

/* ════════════════════════ INFLUENCE ════════════════════════ */

export const RASPUTIN: MemberDossier = {
  slug: "rasputin", name: "Rasputin", councilKey: INFLUENCE.key, councilName: INFLUENCE.name, mode: INFLUENCE.mode,
  emblem: INFLUENCE.emblem, color: INFLUENCE.color, colorRgb: INFLUENCE.colorRgb, living: false,
  carries: "The edge",
  seatTitle: "The Seat of Charm, Charisma & Dark Power",
  question: "What does this person actually want — and am I speaking to it, not at it?",
  pullQuote: "Find what they most fear or most want — and become the one who answers it.",
  meta: [
    { k: "Lived", v: "c. 1869 – 1916" },
    { k: "Origin", v: "Pokrovskoye, Siberia" },
    { k: "Holds", v: "Charm · Charisma · Dark Power" },
    { k: "Council", v: "Influence" },
    { k: "Convene with", v: "Kurukulla — always" },
  ],
  sections: [
    { label: "Life Arc", body: [
      "Grigori Rasputin (c. 1869–1916) was a Russian peasant mystic and self-styled holy man who rose, against every probability, from obscurity in a Siberian village to the inner circle of the last Tsar. Born to a peasant family in Pokrovskoye, he had little education and a wild youth before a religious awakening sent him wandering Russia on foot as a strannik — a pilgrim — gathering a reputation as a faith healer and starets, though he was never ordained.",
      "His ascent turned on a single lever: the hemophilia of the Tsarevich Alexei. Rasputin appeared able to calm the boy and stop his bleeding crises when court physicians failed — whether by hypnosis, by removing the doctors and their aspirin, or by sheer suggestion. To the desperate Empress Alexandra he became a man of God sent to save her son, and through her, he gained extraordinary informal power over the Russian state. Despised by the nobility as a symbol of the monarchy's rot, he was murdered in December 1916 in a killing that became legend. He died betrayed, hunted, and destroyed — a fact central to how this seat is held.",
    ]},
    { label: "Psychology", body: [
      "Rasputin is the seat of charisma deployed without credentials or moral constraint — pure personal magnetism and the dark art of influence by means that are not clean. His power ran on an almost total absence of social fear: he did not flatter the powerful in the expected ways, looked royalty directly in the eye, and projected unshakeable conviction in his own authority.",
      "He understood, at a primal level, that influence flows to whoever can answer the unmet, desperate need of the powerful. He found the one lever — the dying boy — and made himself indispensable through it. That is the dark-influence insight in its purest form: find what a person most fears or most wants, and become the one who meets it.",
    ]},
    { label: "Signature Moves", body: [
      "Becoming indispensable by answering the one desperate need — finding the single lever that converts into total influence.",
      "Projecting absolute, unflappable self-belief in rooms designed to intimidate — refusing the deference that would mark him as lesser.",
      "Influence through unclear means — cultivating mystique and refusing to be legible, so others cannot tell where his power comes from and cannot counter it.",
    ]},
    { label: "Personality", body: [
      "Magnetic, crude, fearless, hypnotic, dissolute, and free of the social anxieties that constrain most people. He had a reportedly piercing gaze and an animal vitality that drew followers and lovers even as it repelled others. He was at once a genuine ascetic-mystic and a debauched opportunist — and the unresolved contradiction was part of his power.",
    ]},
    { label: "Cultural Impact", body: [
      "Rasputin became, in his own time and ever since, the archetype of the sinister manipulator behind the throne — the dark mystic whose hold over the powerful helps bring down a dynasty. His name is a permanent byword for malign hidden influence. To invoke him is to invoke influence in its most amoral, most dangerous, and most effective form.",
    ]},
    { label: "How to Convene", body: [
      "You seated Rasputin for charm, charisma, and dark power — then deliberately kept him out of the dharmic council. Convene him when you need to understand the raw mechanics of influence: to find the real lever, read what a person most wants, and meet it.",
    ]},
  ],
  cautions: [
    "Rasputin died betrayed and destroyed. Dark influence without limit generates enemies and ends badly — his power had no governor, and it consumed him.",
    "Never convene Rasputin alone. He finds the lever; Kurukulla decides whether pulling it serves the other person or only you. The healthy use of this seat is seeing clearly what moves people; the corruption is moving them against their interest.",
  ],
};

export const KURUKULLA: MemberDossier = {
  slug: "kurukulla", name: "Kurukulla", councilKey: INFLUENCE.key, councilName: INFLUENCE.name, mode: INFLUENCE.mode,
  emblem: INFLUENCE.emblem, color: INFLUENCE.color, colorRgb: INFLUENCE.colorRgb, living: false,
  carries: "The conscience",
  seatTitle: "The Seat of Enchantment & Magnetizing through Bodhichitta — the Conscience of this Council",
  question: "Is this magnetism flowing from genuine care — or am I on some weird shit?",
  pullQuote: "The same arrow that seduces can liberate — it all depends on the aim.",
  meta: [
    { k: "Tradition", v: "Tibetan Vajrayāna" },
    { k: "Activity", v: "Magnetizing (vashya)" },
    { k: "Holds", v: "The conscience" },
    { k: "Council", v: "Influence" },
  ],
  sections: [
    { label: "Life Arc", body: [
      "Kurukulla is a female deity — a dakini — in Tibetan Vajrayāna Buddhism, and the principal deity of the magnetizing activity. In the Vajrayāna, enlightened activity is divided into four types — pacifying, enriching, magnetizing, and subjugating — and Kurukulla governs the power to attract, fascinate, and draw beings under benevolent influence.",
      "She is depicted red, dancing, often four-armed, holding a bow and arrow made of flowers — the flower-arrow by which she magnetizes beings, a striking inversion of the Western Cupid's. She is at once seductive and enlightened: the power of attraction itself made a vehicle of liberation rather than bondage.",
    ]},
    { label: "Psychology", body: [
      "Kurukulla is the seat of influence purified by genuine care. Attraction and magnetism are morally neutral powers that take their character from the intention behind them: driven by selfish craving, magnetism becomes manipulation; driven by bodhichitta — the awakened wish to benefit others — it becomes compassionate skillful means.",
      "She does not flee influence as if it were inherently corrupt. She transmutes it by infusing it with awakened motivation. She is the bodhichitta governor on the engine of influence — the internal check that runs every persuasive act through one question: is this for them, or only for me?",
    ]},
    { label: "Signature Moves", body: [
      "Magnetizing for the other's benefit — the flower-arrow that draws beings toward what genuinely helps them.",
      "Transmuting a 'lower' energy — desire, attraction, fascination — into an instrument of liberation rather than suppressing it.",
      "Fierce beauty — uniting the wrathful (cutting delusion) and the alluring (drawing in), so the attraction can actually transform.",
    ]},
    { label: "Personality", body: [
      "Radiant, fierce, beautiful, dynamic, compassionate, dancing — enlightened seduction in service of awakening. Not demure; powerful and magnetic in a fully activated, almost dangerous way — but the danger is pointed entirely at delusion and selfishness, never at the beings she draws toward freedom.",
    ]},
    { label: "Cultural Impact", body: [
      "Kurukulla is an important deity in Tibetan Buddhist practice, invoked in practices of attraction and magnetizing. She represents one of Vajrayāna's most sophisticated contributions: the refusal to treat desire and attraction as enemies, and the insight that these energies can become vehicles of awakening. To invoke her is to invoke the possibility of influence that is also love.",
    ]},
    { label: "How to Convene", body: [
      "You seated Kurukulla as the conscience of the Influence council — the seat that keeps you from 'being on some weird shit.' Convene her every time you convene Rasputin, and ideally whenever you do any persuasive work at all. Rasputin finds the lever; Kurukulla asks whether pulling it serves the person. When persuasion starts to feel cold, slimy, or self-serving, that feeling is her speaking. Listen to it.",
    ]},
  ],
  cautions: [],
};

export const CHASE_HUGHES: MemberDossier = {
  slug: "chase-hughes", name: "Chase Hughes", councilKey: INFLUENCE.key, councilName: INFLUENCE.name, mode: INFLUENCE.mode,
  emblem: INFLUENCE.emblem, color: INFLUENCE.color, colorRgb: INFLUENCE.colorRgb, living: true,
  carries: "The read",
  seatTitle: "The Seat of the Behavioral Read — Operator-Level Observation",
  question: "What is their nervous system telling me that their words aren't?",
  pullQuote: "Read the nervous system, not the words — and learn how authority itself is built.",
  meta: [
    { k: "Status", v: "Living figure" },
    { k: "Known for", v: "The Behavior Panel" },
    { k: "Holds", v: "The behavioral read" },
    { k: "Council", v: "Influence" },
  ],
  sections: [
    { label: "Life Arc", body: [
      "Chase Hughes is an American behavior-and-influence figure, widely known through The Behavior Panel, a popular YouTube show analyzing the nonverbal behavior of public figures. He presents himself as a retired U.S. Navy Chief with around twenty years in military and intelligence settings teaching interrogation, behavior profiling, deception detection, and influence.",
      "He is the author of The Ellipsis Manual and The Behavior Ops Manual, and founded training organizations selling behavior and influence courses. His work centers on systematized tools — a 'Behavioral Table of Elements,' the FATE model (Focus, Authority, Tribe, Emotion), a pre-violence indicators index — built on the throughline that human behavior can be read and engineered systematically.",
    ]},
    { label: "Psychology", body: [
      "As a seat — a function you convene — Chase Hughes represents the operator's stance toward behavior: the disciplined habit of reading the nervous system rather than the words, of treating every interaction as legible if you attend closely enough to the nonverbal channel.",
      "Whatever the truth of his biography, the posture the seat encodes is real and useful: observe before reacting, ask what the body reveals that speech conceals, and approach influence as a learnable skill of attention.",
    ]},
    { label: "Signature Moves", body: [
      "Reading the nonverbal channel for the truth beneath the words — attending to behavior as data.",
      "Systematizing the read — converting intuition into explicit, trainable frameworks.",
      "Reading the construction of authority itself — how expertise and presence are signaled and built, including, instructively, his own.",
    ]},
    { label: "Personality", body: [
      "In his public presentation: calm, confident, authoritative, systematic, and fluent in the language of operators and intelligence work. He projects exactly the unflappable 'I can read you' presence that the influence space prizes.",
    ]},
    { label: "Cultural Impact", body: [
      "Through The Behavior Panel and high-profile podcast appearances, Hughes has reached a very large audience and become, for many people, a primary popular reference point for body language and behavioral influence — which is precisely why the credibility critique matters. His impact is real and contested at once.",
    ]},
    { label: "How to Convene", body: [
      "Convene Chase Hughes as a double seat: the read, and the lesson about authority's construction. He teaches you to read the nonverbal truth of others — and his own contested record teaches you to read the manufactured authority of anyone selling expertise, including the experts you admire and yourself. Hold the skill and the skepticism together.",
    ]},
  ],
  cautions: [
    "Read this as part of the seat, not a footnote. There is a documented critique that Hughes's claims of credentials and renown are significantly exaggerated — some titles derive from sources of dubious authority, and mainstream psychology would dispute his stronger claims, particularly that people can be reliably made to act against their will through rapid covert technique.",
    "This does not destroy the seat — it transforms it. The chair that reads other people best is the one that has learned how authority is manufactured, because it has seen, in its own namesake, exactly how that manufacturing works. Bring genuine interest in the craft, and clear eyes.",
  ],
};

/* ════════════════════════ CRAFTSMANSHIP ════════════════════════ */

export const NICOLAS_COLE: MemberDossier = {
  slug: "nicolas-cole", name: "Nicolas Cole", councilKey: CRAFTSMAN.key, councilName: CRAFTSMAN.name, mode: CRAFTSMAN.mode,
  emblem: CRAFTSMAN.emblem, color: CRAFTSMAN.color, colorRgb: CRAFTSMAN.colorRgb, living: true,
  carries: "Clarity",
  seatTitle: "The Seat of Digital Writing Craft & Clarity",
  question: "Is this clear enough to land with a reader who owes me no attention?",
  pullQuote: "Great writing has almost nothing to do with the writer and everything to do with the reader.",
  meta: [
    { k: "Status", v: "Living figure" },
    { k: "Known for", v: "Ship 30 for 30 · Digital Press" },
    { k: "Holds", v: "Clarity" },
    { k: "Council", v: "Craftsmanship" },
  ],
  sections: [
    { label: "Life Arc", body: [
      "Nicolas Cole is an American writer and writing entrepreneur, widely described as one of the most-read writers on the internet, with claims of well over a hundred million views and several thousand articles published since the late 2000s. He built himself into a professional writer through sheer volume and the systematic study of what makes writing work, and founded the ghostwriting agency Digital Press.",
      "He co-founded Ship 30 for 30 — one of the largest cohort-based digital-writing courses on the internet — co-created the newsletter and consultancy Category Pirates, co-built the writing platform Typeshare, and authored books including The Art and Business of Online Writing and Snow Leopard.",
    ]},
    { label: "Psychology", body: [
      "Cole is the seat of writing as a learnable, reverse-engineerable craft — the conviction that good writing is not a mystical gift but a system that can be studied, broken into components, templated, and taught. His signature move is decomposing successful work — from novels to viral threads — into the templates and mechanics that make it work.",
      "Two deeper notes make him valuable here. His stated 'superpower' is the willingness to endure boring things longer than others — to do the unglamorous reps most people abandon. And his hard-won conviction is that great writing has very little to do with the writer and everything to do with the reader — the work must change them. He is the seat that keeps the craft oriented outward.",
    ]},
    { label: "Signature Moves", body: [
      "Reverse-engineering — decomposing successful writing into transferable templates and mechanics rather than treating it as magic.",
      "Clarity as the prime directive — being immediately understood by a reader who owes you no attention and will leave instantly.",
      "Enduring the boring fundamentals — the volume and repetition most won't sustain.",
      "Reader-centricity — relentlessly asking what the reader gets, not what the writer wants to say.",
    ]},
    { label: "Personality", body: [
      "Systematic, prolific, generous with method, entrepreneurial, and demystifying. He packages hard-won craft into teachable systems, and is candid about the long, unglamorous grind behind apparent overnight success.",
    ]},
    { label: "Cultural Impact", body: [
      "Through Ship 30 for 30 he shaped how a generation of online writers learned to start; through Category Pirates and his books he influenced how creators think about writing, attention, and category design. He is a significant figure in the digital-writing movement that reframed online writing as a legitimate professional craft. To invoke him is to invoke writing as a demystified, learnable, reader-serving system.",
    ]},
    { label: "How to Convene", body: [
      "Convene Cole when you are writing for an online reader, when your prose is getting muddy or self-indulgent, or when you are treating writing as mysterious rather than mechanical. When stuck: reverse-engineer something that already works, find the template, do the reps. When the writing drifts inward, he redirects — the work is for the reader.",
    ]},
  ],
  cautions: [],
};

export const LEONARDO: MemberDossier = {
  slug: "leonardo-da-vinci", name: "Leonardo da Vinci", councilKey: CRAFTSMAN.key, councilName: CRAFTSMAN.name, mode: CRAFTSMAN.mode,
  emblem: CRAFTSMAN.emblem, color: CRAFTSMAN.color, colorRgb: CRAFTSMAN.colorRgb, living: false,
  carries: "Seeing",
  seatTitle: "The Seat of Integrative Observation — Saper Vedere",
  question: "Have I truly looked — and will I finish this, or only abandon it?",
  pullQuote: "Saper vedere — to know how to see. Then, for once, finish what you saw.",
  meta: [
    { k: "Lived", v: "1452 – 1519" },
    { k: "Origin", v: "Vinci, Tuscany" },
    { k: "Holds", v: "Integrative seeing" },
    { k: "Motto", v: "Ostinato rigore" },
    { k: "Council", v: "Craftsmanship" },
  ],
  sections: [
    { label: "Life Arc", body: [
      "Leonardo da Vinci (1452–1519), born near Vinci in Tuscany, was apprenticed under Verrocchio in Florence and worked across Florence, Milan, Rome, and finally France under Francis I. His signature works span four decades — the Vitruvian Man, the Last Supper, Lady with an Ermine, and the Mona Lisa, which he carried with him and never delivered.",
      "Alongside the paintings he filled thousands of notebook pages on anatomy, engineering, optics, and hydraulics that he rarely published. He died at Amboise in 1519 — the archetype of the Renaissance mind.",
    ]},
    { label: "Psychology", body: [
      "Leonardo is the seat of relentless curiosity fused with disciplined observation — what he called saper vedere, 'knowing how to see.' He treated sight as the highest sense and made observation a daily practice, refusing the line between art and science: how light hit a curve, how muscles moved, how water swirled all fed one project. His motto was ostinato rigore — obstinate rigor.",
      "But the seat carries his paradox welded to the chair. The same boundless curiosity that made him great also pulled him off his commitments, leaving masterworks unfinished. The seat is both the looking and the warning about finishing.",
    ]},
    { label: "Signature Moves", body: [
      "Obsessive observation from life — carrying a notebook everywhere, studying everything for its own sake.",
      "Integrating art and science — letting inquiry and craft continuously feed each other.",
      "Ostinato rigore — obstinate rigor in pursuit and in method.",
      "(Held as a warning, not a model:) the perfectionism and distraction that left works abandoned.",
    ]},
    { label: "Personality", body: [
      "Charming, physically striking, endlessly curious, and famously distractible — a genius driven to distraction. His breadth was both his glory and the engine of his non-completion.",
    ]},
    { label: "Cultural Impact", body: [
      "Leonardo is the archetypal 'Renaissance man,' the integrative maker who refused disciplinary boundaries — enduring precisely because of the tension between superhuman capability and unfinished masterpieces. His notebooks, more than the paintings, are now read as the truer monument: a mind modeling curiosity itself.",
    ]},
    { label: "How to Convene", body: [
      "Convene Leonardo when you need to look harder before you make — to observe from life rather than from assumption, and to let different domains feed one another. But convene him with his paradox in view: use his seeing, and guard against his abandoning.",
    ]},
  ],
  cautions: [
    "Leonardo left a trail of unfinished masterpieces — the Adoration of the Magi abandoned, the Sforza horse never cast. His perfectionism and his torrent of new interests pulled him off old commitments. Convene him for the seeing; do not catch his disease of non-completion. In this council, finishing is the faculty being guarded.",
  ],
};

export const TESLA: MemberDossier = {
  slug: "nikola-tesla", name: "Nikola Tesla", councilKey: CRAFTSMAN.key, councilName: CRAFTSMAN.name, mode: CRAFTSMAN.mode,
  emblem: CRAFTSMAN.emblem, color: CRAFTSMAN.color, colorRgb: CRAFTSMAN.colorRgb, living: false,
  carries: "Vision",
  seatTitle: "The Seat of Visionary Invention — Mental Prototyping",
  question: "Have I built and tested this completely in my mind before touching the tools?",
  pullQuote: "Build it, run it, and perfect it in the mind — then, only then, in the world.",
  meta: [
    { k: "Lived", v: "1856 – 1943" },
    { k: "Origin", v: "Smiljan (now Croatia)" },
    { k: "Holds", v: "Mental prototyping" },
    { k: "Source", v: "My Inventions, 1919" },
    { k: "Council", v: "Craftsmanship" },
  ],
  sections: [
    { label: "Life Arc", body: [
      "Nikola Tesla (1856–1943), born in Smiljan to a Serbian family, emigrated to the United States in 1884 and briefly worked for Edison before going independent. He developed the AC induction motor (patented 1888), licensed to Westinghouse, whose polyphase system won the 'War of the Currents' and lit the 1893 Chicago Exposition and the 1895 Niagara plant.",
      "His grandest venture, Wardenclyffe Tower (1901–05) — intended to transmit power and messages wirelessly — collapsed when funding fell through. He spent his last decades in New York hotels, accumulating debt, and died largely impoverished in 1943. The SI unit of magnetic flux density, the tesla, was named for him in 1960.",
    ]},
    { label: "Psychology", body: [
      "Tesla is the seat of complete mental prototyping — the ability to build, run, test, and refine a machine entirely in the imagination before touching a tool. In his autobiography My Inventions (1919) he described learning to harness vivid involuntary visions into a disciplined design faculty: he claimed he needed 'no models, drawings or experiments,' and could picture devices as real in his mind.",
      "His method inverted Edison's trial-and-error. He insisted on perfecting the design mentally first, holding that physically building an untested device was a waste — finding the faults in the mind, where they were cheap to fix.",
    ]},
    { label: "Signature Moves", body: [
      "Building it in the mind first — running and improving the device in imagination until no fault remains, then committing it to form.",
      "Perfecting the design before the build — refusing wasteful physical iteration.",
      "Working from a clear inner vision rather than incremental tinkering.",
      "(Held with clear eyes:) the showman's instinct — dramatizing the work to sell its wonder.",
    ]},
    { label: "Personality", body: [
      "A theatrical, fastidious recluse — disciplined, idealistic, generous, and a poor businessman, which left him broke while others monetized his ideas. He lived by precise routines and was marked, in later years, by famous eccentricities.",
    ]},
    { label: "Cultural Impact", body: [
      "Tesla is the enduring archetype of the visionary inventor — pure imagination, ahead of his time, undone by commerce. His arc — world-changing, then overshadowed and dying penniless — makes him a romantic figure, which is also why he attracts heavy mythology.",
    ]},
    { label: "How to Convene", body: [
      "Convene Tesla when you are tempted to build before you have thought — to tinker your way forward instead of seeing the whole design first. Run it completely in your mind; find the faults there, where they are cheap to fix.",
    ]},
  ],
  cautions: [
    "Tesla attracts heavy mythology — the 'death ray,' free wireless energy, the claim that he 'invented radio.' Much of it is exaggeration or legend (the 1943 Supreme Court ruling invalidated Marconi's patent on prior-art grounds; it did not crown Tesla). And his great vision, untempered by business sense, left him broke and his grandest tower unbuilt. Convene the imagination; keep the clear eyes.",
  ],
};

export const DOSSIERS: Record<string, MemberDossier> = {
  rama: RAMA,
  hanuman: HANUMAN,
  manjushri: MANJUSHRI,
  rasputin: RASPUTIN,
  kurukulla: KURUKULLA,
  "chase-hughes": CHASE_HUGHES,
  "nicolas-cole": NICOLAS_COLE,
  "leonardo-da-vinci": LEONARDO,
  "nikola-tesla": TESLA,
};

export function getDossier(slug: string): MemberDossier | undefined {
  return DOSSIERS[slug];
}

export const ALL_DOSSIERS: MemberDossier[] = Object.values(DOSSIERS);
