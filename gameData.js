// ============================================================
//  BLACKRIDGE - GAME DATA  v2.0
// ============================================================

const GAME_SETTINGS = {
  STATS: { MIN: 0, MAX: 100, STARTING_ENERGY: 100, STARTING_MORAL: 50 },
  ECONOMY: { BUY_DIVIDER: 5, SELL_DIVIDER: 10 },
  COMBAT: {
    BASE_HP: 20,
    BASE_DAMAGE: 3,           // Réduit (était 5)
    SPAWN_SPEED_BASE: 1400,   // Plus lent (était 1200)
    SPAWN_SPEED_MIN: 600,     // Plus lent (était 400)
    TARGET_TIMEOUT: 900,
    REPUTATION_WIN: 15,
    REPUTATION_LOSS: 5,
    PRISON_RISK: 0.4
  },
  TIME: { TICK_SPEED: 10, DAY_START: 480, DAY_END: 1440 },
  PROGRESSION: {
    TRAIN_GAIN: 1,            // Réduit (était 3) — progression lente
    STAT_CAP_PER_DAY: 3,      // Maximum de gains par stat par journée
    COOLDOWN_TRAIN_MINUTES: 60, // Temps minimum entre deux entraînements du même type
    RANDOM_EVENT_INTERVAL: 8  // Une chance d'événement toutes les X actions
  }
};

// ============================================================
//  BASE D'OBJETS
// ============================================================
const ITEMS_DB = {
  "brossette":    { name: "Brossette",          icon: "🪥", illegal: false, value: 0 },
  "savon":        { name: "Savon",               icon: "🧼", illegal: false, value: 1 },
  "cigarettes":   { name: "Cigarettes",          icon: "🚬", illegal: true,  value: 5 },
  "livre_adulte": { name: "Livre Adulte",        icon: "🔞", illegal: true,  value: 10 },
  "shivan":       { name: "Shivan (Couteau)",    icon: "🔪", illegal: true,  value: 15 },
  "dopant":       { name: "Dopant",              icon: "🧪", illegal: true,  value: 8 },
  "corde":        { name: "Bout de corde",       icon: "🪢", illegal: true,  value: 3 },
  "savon_corde":  { name: "Savon de combat",     icon: "🧼🪢", illegal: true, value: 12 },
  "lettre":       { name: "Lettre codée",        icon: "✉️", illegal: false, value: 2 },
  "plan_prison":  { name: "Plan de la prison",   icon: "🗺️", illegal: true,  value: 20 },
  "sedatif":      { name: "Sédatif",             icon: "💊", illegal: true,  value: 12 },
  "clef_usee":    { name: "Clef usée",           icon: "🗝️", illegal: true,  value: 8 },
  "radio_cassee": { name: "Radio cassée",        icon: "📻", illegal: false, value: 1 },
  "photo_famille":{ name: "Photo de famille",    icon: "🖼️", illegal: false, value: 0 },
};

// ============================================================
//  BASE DES PNJ (enrichie)
//  Chaque PNJ a : backstory, faction, seuils de confiance,
//  dialogues évolutifs, quête associée, capacité spéciale
// ============================================================
const NPCS_DB = {

  "garde_corridor": {
    id: "garde_corridor",
    name: "Gardien Jones",
    icon: "👮",
    type: "fight",
    faction: "guards",
    force: 40,
    personnality: "aggressive",
    backstory: "Jones est à Blackridge depuis 18 ans. Il a tout vu, perdu la moitié de ses illusions et compense par la brutalité.",
    trustLevels: {
      "-50": "Il te surveille de près. Un faux pas et tu goes au trou.",
      "0":   "Jones te traite comme du bétail ordinaire.",
      "20":  "Jones te laisse passer sans fouille systématique.",
      "50":  "Jones t'a à la bonne. Il ferme les yeux de temps en temps."
    },
    dialogs: [
      "Circule, gamin.",
      "J'ai l'œil sur toi.",
      "T'as un problème ?",
      "Ma patience a des limites."
    ],
    specialUnlock: { trust: 50, action: "bribe_guard", label: "🤝 Corrompre" },
    questGiver: null
  },

  "dealer": {
    id: "dealer",
    name: "Le Dealer",
    icon: "🧪",
    type: "trade",
    faction: "neutre",
    force: 15,
    personnality: "coward",
    inventory: ["dopant", "savon", "sedatif"],
    backstory: "Ancien chimiste reconverti. Il ne sait plus vraiment pourquoi il est là, mais il sait que tout le monde a besoin de lui.",
    trustLevels: {
      "0":  "Il te regarde avec méfiance.",
      "15": "Il baisse ses prix de 10% pour toi.",
      "40": "Il te propose des produits exclusifs.",
    },
    dialogs: [
      "Besoin d'un remède pour tenir le coup ?",
      "J'ai ce qu'il faut pour les longues nuits.",
      "Rien n'est gratuit ici, mais t'as l'air futé.",
      "Le dopant, c'est pour les faibles... ou les malins."
    ],
    specialUnlock: { trust: 40, action: "buy_plan", label: "🗺️ Acheter un plan" },
    questGiver: "quest_dealer_supply"
  },

  "brute": {
    id: "brute",
    name: "La Brute",
    icon: "👺",
    type: "hybrid",
    faction: "muscles",
    force: 55,
    personnality: "aggressive",
    backstory: "Marcus 'La Brute' Diaz. Triple champion de boxe amateur avant de tout perdre en une nuit de violence. Maintenant il protège son territoire par instinct.",
    trustLevels: {
      "-20": "Il t'a dans le viseur. Fait gaffe.",
      "0":   "Il t'ignore. Pour l'instant.",
      "30":  "Il te respecte. Un signe de tête dans la cour.",
      "60":  "Allié potentiel. Il couvre tes arrières."
    },
    dialogs: [
      "T'as quelque chose à dire ou tu viens juste perdre du temps ?",
      "Ici c'est mon territoire.",
      "T'as du cran, je te donne ça.",
      "Prouve ta valeur avant de me parler."
    ],
    specialUnlock: { trust: 60, action: "recruit_ally", label: "🤜 Recruter comme allié" },
    questGiver: "quest_brute_challenge",
    inventory: ["savon_corde"],
    charm_threshold: 80
  },

  "rat": {
    id: "rat",
    name: "Le Rat",
    icon: "🐀",
    type: "hybrid",
    faction: "neutre",
    force: 12,
    personnality: "scheming",
    inventory: ["shivan", "cigarettes", "corde", "lettre"],
    backstory: "Personne ne connaît son vrai nom. Il vend des informations et des objets. Son réseau s'étend jusqu'aux gardiens. Dangereux à contrarier.",
    trustLevels: {
      "0":  "Il te jauge. Il voit si tu peux lui servir.",
      "20": "Il partage des rumeurs gratuitement.",
      "45": "Il te montre comment éviter les patrouilles.",
      "70": "Il partage les secrets de la prison avec toi."
    },
    dialogs: [
      "Rien n'est gratuit ici...",
      "J'ai des oreilles partout, tu sais.",
      "Je peux t'aider. Mais t'as quelque chose pour moi ?",
      "Le savoir, c'est la vraie monnaie de Blackridge."
    ],
    specialUnlock: { trust: 70, action: "get_plan", label: "🗺️ Plan de la prison" },
    questGiver: "quest_rat_network"
  },

  "vieux": {
    id: "vieux",
    name: "Le Vieux",
    icon: "👴",
    type: "hybrid",
    faction: "neutre",
    force: 8,
    personnality: "friendly",
    inventory: ["livre_adulte", "savon", "radio_cassee"],
    backstory: "Émile, 67 ans. 25 ans à Blackridge pour un meurtre qu'il dit ne pas avoir commis. Il a trouvé la paix dans les livres et observe tout avec une sagesse troublante.",
    trustLevels: {
      "0":  "Il te regarde comme tous les autres jeunes con qui passent.",
      "15": "Il partage sa nourriture. Rare ici.",
      "35": "Il t'apprend des choses. +INT accéléré.",
      "60": "Il te confie quelque chose d'important."
    },
    dialogs: [
      "Le savoir, c'est la seule liberté.",
      "J'ai vu des centaines comme toi. La plupart sont partis les pieds devant.",
      "Assieds-toi. Écoute. Ça t'évitera des erreurs.",
      "La patience est la seule arme que les gardiens ne peuvent pas confisquer."
    ],
    specialUnlock: { trust: 60, action: "learn_secret", label: "📖 Secret de la prison" },
    questGiver: "quest_vieux_wisdom"
  },

  "Jocelyn": {
    id: "Jocelyn",
    name: "Jocelyn",
    icon: "👩‍⚕️",
    type: "hybrid",
    faction: "guards",
    force: 5,
    personnality: "friendly",
    inventory: ["sedatif", "dopant"],
    backstory: "Infirmière depuis 3 ans à Blackridge. Elle soigne tout le monde sans juger. Mais elle n'est pas naïve — elle connaît les règles du jeu.",
    trustLevels: {
      "0":  "Elle fait son travail, rien de plus.",
      "20": "Elle soigne mieux quand tu es blessé. +HP bonus.",
      "40": "Elle ferme les yeux sur certains objets médicaux.",
      "65": "Elle est prête à t'aider à sortir... à un prix."
    },
    dialogs: [
      "Encore toi ? C'est quoi cette fois ?",
      "Je soigne, je ne juge pas. Mais je regarde.",
      "Fais attention à toi. Ici les blessures s'infectent vite.",
      "Il y a des façons de sortir d'ici sans se faire tuer."
    ],
    specialUnlock: { trust: 65, action: "escape_help", label: "🚪 Aide à l'évasion" },
    questGiver: "quest_jocelyn_escape"
  }
};

// ============================================================
//  SYSTÈME DE QUÊTES
// ============================================================
const QUESTS_DB = {

  // ─── ACTE 1 : SURVIVRE ───────────────────────────────────

  "quest_survive": {
    id: "quest_survive",
    title: "Semaine de Survie",
    act: 1,
    type: "main",
    icon: "🌅",
    description: "Tu viens d'arriver. Mange, dors, ne meurs pas. Simple en théorie.",
    objectives: [
      { id: "sleep_3", type: "sleep",  count: 3, label: "Survivre 3 nuits",   progress: 0 },
      { id: "eat_3",   type: "eat",    count: 3, label: "Manger 3 fois",       progress: 0 },
      { id: "train_2", type: "train",  count: 2, label: "S'entraîner 2 fois",  progress: 0 }
    ],
    rewards: { reputation: 3, moral: 5, message: "Tu tiens encore debout. C'est déjà quelque chose." },
    prerequisite: [],
    unlocks: ["quest_meet_rat", "quest_vieux_wisdom"]
  },

  "quest_meet_rat": {
    id: "quest_meet_rat",
    title: "Faire Connaissance",
    act: 1,
    type: "main",
    icon: "🐀",
    description: "Le Rat contrôle les informations et les objets dans ce bloc. Tu vas en avoir besoin.",
    objectives: [
      { id: "talk_rat_1",  type: "talk_npc",  target: "rat", count: 1, label: "Parler au Rat",              progress: 0 },
      { id: "charm_rat_1", type: "charm_npc", target: "rat", count: 1, label: "Gagner sa confiance",         progress: 0 },
      { id: "cigs_5",      type: "have_item", itemId: "cigarettes", count: 5, label: "Avoir 5 cigarettes",   progress: 0 }
    ],
    rewards: { intelligence: 2, items: ["cigarettes", "cigarettes"], message: "Le Rat t'a à la bonne. Pour l'instant." },
    prerequisite: ["quest_survive"],
    unlocks: ["quest_rat_network", "quest_obtain_weapon"]
  },

  // ─── ACTE 1 : CÔTÉ ───────────────────────────────────────

  "quest_vieux_wisdom": {
    id: "quest_vieux_wisdom",
    title: "Le Passeur de Sagesse",
    act: 1,
    type: "side",
    icon: "📚",
    description: "Le Vieux est à Blackridge depuis 25 ans. Il en sait plus qu'il ne le dit.",
    objectives: [
      { id: "talk_vieux_3", type: "talk_npc",  target: "vieux", count: 3,  label: "Parler au Vieux 3 fois", progress: 0 },
      { id: "charm_vieux",  type: "charm_npc", target: "vieux", count: 1,  label: "Gagner sa confiance",     progress: 0 },
      { id: "read_book",    type: "use_item",  itemId: "livre_adulte", count: 1, label: "Lire un livre",     progress: 0 }
    ],
    rewards: { intelligence: 4, moral: 8, message: "Le Vieux t'a appris quelque chose que personne d'autre ne peut t'enseigner." },
    prerequisite: ["quest_survive"],
    unlocks: ["quest_jocelyn_escape"]
  },

  // ─── ACTE 2 : S'IMPOSER ──────────────────────────────────

  "quest_obtain_weapon": {
    id: "quest_obtain_weapon",
    title: "Se Défendre",
    act: 2,
    type: "main",
    icon: "🔪",
    description: "Sans arme, tu es une cible. Il te faut un shivan.",
    objectives: [
      { id: "get_shivan",  type: "have_item",    itemId: "shivan",     count: 1, label: "Avoir un shivan",              progress: 0 },
      { id: "win_fight_1", type: "combat_win",   target: null,         count: 1, label: "Gagner un combat",             progress: 0 }
    ],
    rewards: { reputation: 8, message: "T'as prouvé que tu peux te défendre. Les regards ont changé." },
    prerequisite: ["quest_meet_rat"],
    unlocks: ["quest_brute_challenge"]
  },

  "quest_rat_network": {
    id: "quest_rat_network",
    title: "Le Réseau",
    act: 2,
    type: "side",
    icon: "🕸️",
    description: "Le Rat peut te donner les horaires des patrouilles. Mais il veut quelque chose en échange.",
    objectives: [
      { id: "give_rat_cigs",  type: "talk_npc",  target: "rat",         count: 3, label: "Parler au Rat 3 fois",           progress: 0 },
      { id: "rep_20",         type: "stat_reach", stat: "reputation",   value: 20, label: "Atteindre 20 de Réputation",    progress: 0 }
    ],
    rewards: { intelligence: 3, unlockInfo: "patrol_schedule", message: "Le Rat te file les horaires des gardes. Les nuits sont moins risquées." },
    prerequisite: ["quest_meet_rat"],
    unlocks: ["quest_big_escape"]
  },

  // ─── ACTE 2 : CONFRONTATION ──────────────────────────────

  "quest_brute_challenge": {
    id: "quest_brute_challenge",
    title: "Le Baptême du Feu",
    act: 2,
    type: "main",
    icon: "👊",
    description: "La Brute domine la cour depuis 3 ans. Bats-la en public et tu deviens quelqu'un.",
    objectives: [
      { id: "force_15",     type: "stat_reach",  stat: "force",    value: 15, label: "Atteindre 15 de Force",      progress: 0 },
      { id: "beat_brute",   type: "combat_win",  target: "brute",  count: 1,  label: "Battre La Brute",            progress: 0 }
    ],
    rewards: { reputation: 20, force: 2, message: "La cour entière a vu. Ton nom circule maintenant." },
    prerequisite: ["quest_obtain_weapon"],
    unlocks: ["quest_gang_choice", "quest_intimidation"]
  },

  // ─── ACTE 2 : CÔTÉ ───────────────────────────────────────

  "quest_intimidation": {
    id: "quest_intimidation",
    title: "Faire Régner la Terreur",
    act: 2,
    type: "side",
    icon: "🔥",
    description: "La peur est une forme de respect. Humilie 3 prisonniers.",
    objectives: [
      { id: "humiliate_3", type: "humiliate", count: 3, label: "Humilier 3 prisonniers", progress: 0 }
    ],
    rewards: { reputation: 12, moral: -10, message: "Tout le monde baisse les yeux quand tu passes. Mais t'as perdu quelque chose en chemin." },
    prerequisite: ["quest_brute_challenge"],
    unlocks: []
  },

  "quest_jocelyn_escape": {
    id: "quest_jocelyn_escape",
    title: "La Confidente",
    act: 2,
    type: "side",
    icon: "💉",
    description: "Jocelyn sait des choses sur la prison. Elle pourrait t'aider. Gagne sa confiance.",
    objectives: [
      { id: "talk_jocelyn_3", type: "talk_npc",  target: "Jocelyn", count: 3, label: "Parler à Jocelyn 3 fois",       progress: 0 },
      { id: "charm_jocelyn",  type: "charm_npc", target: "Jocelyn", count: 1, label: "Charmer Jocelyn",               progress: 0 },
      { id: "moral_40",       type: "stat_reach", stat: "moral",    value: 40, label: "Maintenir un moral > 40",      progress: 0 }
    ],
    rewards: { items: ["sedatif"], unlockInfo: "jocelyn_help", message: "Jocelyn t'a remis quelque chose. 'Pour le bon moment', dit-elle." },
    prerequisite: ["quest_vieux_wisdom"],
    unlocks: ["quest_big_escape"]
  },

  // ─── ACTE 3 : LA GRANDE SORTIE ───────────────────────────

  "quest_gang_choice": {
    id: "quest_gang_choice",
    title: "Choisir son Camp",
    act: 3,
    type: "main",
    icon: "⚔️",
    description: "Trois factions te sollicitent. Ce choix va définir la suite de ton séjour.",
    objectives: [
      { id: "rep_35",       type: "stat_reach",  stat: "reputation", value: 35, label: "Avoir 35 de Réputation",  progress: 0 },
      { id: "join_faction", type: "join_faction", count: 1,           label: "Rejoindre une faction",             progress: 0 }
    ],
    rewards: { reputation: 10, message: "Tu appartiens à quelque chose maintenant. Pour le meilleur et le pire." },
    prerequisite: ["quest_brute_challenge"],
    unlocks: ["quest_big_escape"]
  },

  "quest_big_escape": {
    id: "quest_big_escape",
    title: "La Grande Évasion",
    act: 3,
    type: "main",
    icon: "🚪",
    description: "C'est maintenant ou jamais. Rassemble ce qu'il faut. Une seule chance.",
    objectives: [
      { id: "have_corde",    type: "have_item",   itemId: "corde",       count: 1,  label: "Avoir une corde",            progress: 0 },
      { id: "hack_cams",     type: "action",      actionType: "hack",    count: 1,  label: "Désactiver les caméras",     progress: 0 },
      { id: "rep_50",        type: "stat_reach",  stat: "reputation",    value: 50, label: "50 de Réputation",           progress: 0 },
      { id: "have_plan",     type: "have_item",   itemId: "plan_prison", count: 1,  label: "Avoir le plan de la prison", progress: 0 }
    ],
    rewards: { ending: "escape", message: "Tout est en place. L'heure venue, tu sauras quoi faire." },
    prerequisite: ["quest_gang_choice", "quest_rat_network"],
    unlocks: []
  }
};

// ============================================================
//  ÉVÉNEMENTS ALÉATOIRES
// ============================================================
const RANDOM_EVENTS = [

  {
    id: "ev_fight_witness",
    weight: 15,
    rooms: ["corridor", "yard", "canteen"],
    title: "Bagarre dans le couloir",
    description: "Deux détenus s'affrontent violemment devant toi. Le grand frappe le petit au sol. Qu'est-ce que tu fais ?",
    choices: [
      { text: "Intervenir (Force requis : 10)", condition: { stat: "force", min: 10 },
        effect: { reputation: +5, moral: +5, message: "Tu les sépares. Le plus petit t'adresse un signe de tête reconnaissant." } },
      { text: "Filmer mentalement les techniques",
        effect: { force: 1, message: "Tu observes et tu retiens. +1 Force." } },
      { text: "Dégager tranquillement",
        effect: { moral: -3, message: "Tu passes ton chemin. C'est pas tes oignons." } }
    ]
  },

  {
    id: "ev_found_item",
    weight: 20,
    rooms: ["corridor", "cell", "yard", "showers"],
    title: "Trouvaille inattendue",
    description: "Tu trouves quelque chose planqué sous une brique descellée. Quelqu'un l'a laissé là.",
    choices: [
      { text: "Prendre l'objet",
        effect: { item: "cigarettes", message: "Tu récupères les cigarettes. Finders keepers." } },
      { text: "Le signaler au Rat (Confiance +5)",
        effect: { npcTrust: { id: "rat", value: 8 }, message: "Le Rat apprécie l'info. Sa confiance en toi monte." } },
      { text: "Laisser en place — trop risqué",
        effect: { moral: 2, message: "Tu laisses tomber. Mieux vaut ne pas s'impliquer." } }
    ]
  },

  {
    id: "ev_guard_pressure",
    weight: 12,
    rooms: ["corridor", "yard"],
    title: "Pression du gardien",
    description: "Jones te coince dans un couloir vide. 'T'as des cigarettes sur toi ?' Il tend la main.",
    choices: [
      { text: "Lui donner 2 cigarettes",
        effect: { removeItem: "cigarettes", count: 2, npcTrust: { id: "garde_corridor", value: 10 }, message: "Il empoche en silence. 'Bonne journée.' Il partira plus tôt que prévu." } },
      { text: "Refuser (Réputation requis : 25)", condition: { stat: "reputation", min: 25 },
        effect: { reputation: 3, npcTrust: { id: "garde_corridor", value: -5 }, message: "Il recule. T'as du cran. Mais il s'en souvient." } },
      { text: "Chercher une excuse",
        effect: { intelligence: 1, message: "Tu t'en tires avec une histoire bancale. Il n'est pas convaincu, mais il s'éloigne." } }
    ]
  },

  {
    id: "ev_newcomer",
    weight: 10,
    rooms: ["cell", "corridor"],
    title: "Le Nouveau",
    description: "Un nouveau débarque dans ton bloc. Il a l'air perdu et apeuré — comme toi à l'arrivée.",
    choices: [
      { text: "L'aider à s'orienter",
        effect: { moral: 8, reputation: 2, message: "Il sera ton obligé. Le moral remonte. On n'oublie pas les gens qui nous ont aidés en entrant." } },
      { text: "Lui extorquer ses affaires",
        effect: { item: "cigarettes", moral: -8, reputation: 3, message: "Tu prends ses maigres affaires. Il pleure. T'as deux clopes de plus et un goût amer." } },
      { text: "L'ignorer",
        effect: { message: "Tu passes devant lui sans le regarder. Il apprendra tout seul." } }
    ]
  },

  {
    id: "ev_night_sound",
    weight: 8,
    rooms: ["cell"],
    title: "Bruit dans la nuit",
    description: "Au milieu de la nuit, tu entends des pas furtifs dans le couloir. Quelqu'un de planqué.",
    choices: [
      { text: "Observer discrètement (Agilité requis : 8)", condition: { stat: "agilite", min: 8 },
        effect: { intelligence: 2, message: "Tu vois Le Rat transporter un sac. Il ne t'a pas vu. Information précieuse." } },
      { text: "Faire semblant de dormir",
        effect: { message: "Prudence. Tu mémorises l'heure : 02h30." } },
      { text: "Interpeller la personne",
        effect: { reputation: -3, message: "Elle s'enfuit. Tu t'es peut-être fait un ennemi pour rien." } }
    ]
  },

  {
    id: "ev_contraband_offer",
    weight: 12,
    rooms: ["showers", "yard", "canteen"],
    title: "Offre suspecte",
    description: "Un détenu inconnu s'approche et te propose discrètement un objet illégal à prix cassé. C'est peut-être un test des gardiens.",
    choices: [
      { text: "Acheter (5 cigarettes)", condition: { item: "cigarettes", count: 5 },
        effect: { item: "shivan", removeItem: "cigarettes", removeCount: 5, risk: 0.35, message: "Tu prends le risque. 35% de chances que ce soit un piège." } },
      { text: "Décliner prudemment",
        effect: { intelligence: 1, message: "Bonne intuition. On ne sait jamais avec les nouveaux." } },
      { text: "Dénoncer au Rat (Confiance +5)",
        effect: { npcTrust: { id: "rat", value: 6 }, message: "Le Rat apprécie l'info. 'Ce type travaille pour Jones. T'as bien fait.'" } }
    ]
  },

  {
    id: "ev_bet",
    weight: 10,
    rooms: ["yard", "common"],
    title: "Pari de cour",
    description: "Un groupe de détenus organise un pari sur le prochain combat. Quelqu'un mise sur toi.",
    choices: [
      { text: "Accepter de te battre",
        effect: { triggerCombat: true, reputationBonus: 10, message: "Tu acceptes. Tout le monde regarde." } },
      { text: "Parier 3 cigarettes sur toi-même", condition: { item: "cigarettes", count: 3 },
        effect: { removeItem: "cigarettes", removeCount: 3, itemGain: "cigarettes", itemGainCount: 8, message: "Le pari est conclu. Tu as gagné 8 cigarettes." } },
      { text: "Refuser — pas de spectacle",
        effect: { reputation: -2, message: "La foule est déçue. '-2 Rép. Certains t'appellent 'froussard'." } }
    ]
  },

  {
    id: "ev_letter",
    weight: 8,
    rooms: ["cell"],
    title: "Lettre anonyme",
    description: "Glissée sous ta porte. 'Ne fais pas confiance au Rat ce soir. Signé : un ami.' Pas de signature.",
    choices: [
      { text: "Garder la lettre et rester vigilant",
        effect: { item: "lettre", intelligence: 1, message: "Tu gardes la lettre. Quelqu'un te surveille... pour le bien ?" } },
      { text: "Montrer la lettre au Rat",
        effect: { npcTrust: { id: "rat", value: -8 }, message: "Le Rat pâlit. 'Qui t'a donné ça ?' Sa confiance en toi chute légèrement." } },
      { text: "Brûler la lettre",
        effect: { moral: -2, message: "Tu brûles la lettre dans les toilettes. Moins de problèmes." } }
    ]
  },

  {
    id: "ev_solitary_hallucination",
    weight: 20,
    rooms: ["solitary"],
    title: "Les murs parlent",
    description: "Au trou depuis des heures, les pensées deviennent bruyantes. Une image de ta vie d'avant.",
    choices: [
      { text: "Te concentrer sur un objectif précis",
        effect: { moral: 5, intelligence: 1, message: "La vision se dissipe. Tu sors avec une conviction." } },
      { text: "Te laisser submerger",
        effect: { moral: -10, resistance: 1, message: "Ça fait mal. Mais tu ressortiras plus dur." } }
    ]
  },

  {
    id: "ev_food_trade",
    weight: 15,
    rooms: ["canteen"],
    title: "Échange de plateau",
    description: "Un détenu t'offre d'échanger son plateau contre tes cigarettes. Son repas a l'air meilleur.",
    choices: [
      { text: "Accepter l'échange (1 cigarette)",
        effect: { removeItem: "cigarettes", removeCount: 1, energy: +20, moral: 3, message: "Meilleure nourriture. +20 Énergie en bonus." } },
      { text: "Refuser",
        effect: { message: "Tu gardes tes cigarettes." } }
    ]
  },

  {
    id: "ev_guard_distracted",
    weight: 8,
    rooms: ["corridor"],
    title: "Gardien distrait",
    description: "Jones s'est endormi debout à son poste. Une occasion rare de fouiller son bureau proche.",
    choices: [
      { text: "Fouiller rapidement (Agilité requis : 12)", condition: { stat: "agilite", min: 12 },
        effect: { item: "clef_usee", message: "Tu trouves une vieille clef. Jones ne s'est pas réveillé." } },
      { text: "Photographier mentalement sa position",
        effect: { intelligence: 1, message: "Information enregistrée." } },
      { text: "Dégager sans risquer",
        effect: { message: "Sage décision. Pas de risque, pas de récompense." } }
    ]
  }
];

// ============================================================
//  WORLD DATA (Horaires, Gangs, Salles, PNJs par salle)
// ============================================================
const WORLD_DATA = {
  schedule: {
    yard:             { start: 480,  end: 1200, label: "08:00 - 20:00" },
    canteen:          { start: 720,  end: 840,  label: "12:00 - 14:00" },
    canteen_evening:  { start: 1080, end: 1200, label: "18:00 - 20:00" },
    visiting:         { start: 840,  end: 1020, label: "14:00 - 17:00" }
  },

  gangs: {
    neutre:   { name: "Solitaire",       color: "text-gray-400",   power: 0 },
    ariens:   { name: "La Fraternité",   color: "text-red-500",    power: 10, boss: "brute",   joinStat: "force",        joinMin: 20 },
    latinos:  { name: "Los Muertos",     color: "text-orange-500", power: 8,  boss: "rat",     joinStat: "intelligence", joinMin: 15 },
    muscles:  { name: "Les Cogneurs",    color: "text-blue-500",   power: 12, boss: "brute",   joinStat: "resistance",   joinMin: 18 }
  },

  rooms: {
    corridor: {
      name: "Couloir Principal",
      hotspots: [
        { id: "toCell",      label: "Cellule",             action: { type: "move", leads_to: "cell" } },
        { id: "toShowers",   label: "Douches",             action: { type: "move", leads_to: "showers" } },
        { id: "toYard",      label: "Cour",                action: { type: "move", leads_to: "yard" } },
        { id: "toCanteen",   label: "Cantine",             action: { type: "move", leads_to: "canteen" } },
        { id: "toParlor",    label: "Parloir",             action: { type: "move", leads_to: "visiting_room" } },
        { id: "toCommon",    label: "Salle commune",       action: { type: "move", leads_to: "common" } },
        { id: "toEntrance",  label: "Entrée",              action: { type: "move", leads_to: "entrance" } },
        { id: "toInfirmary", label: "Infirmerie",          action: { type: "move", leads_to: "infirmary" } },
        { id: "toOffice",    label: "Bureau dir.",         action: { type: "move", leads_to: "office" } },
        { id: "toSecurity",  label: "Salle caméras",       action: { type: "move", leads_to: "security" } }
      ]
    },
    cell: {
      name: "Votre Cellule",
      hotspots: [
        { id: "toCorridor", label: "Sortir",              action: { type: "move", leads_to: "corridor" } },
        { id: "pushups",    label: "Pompes (Force)",      action: { type: "train", stat: "force",      energy: 30, cooldownKey: "force" } },
        { id: "situps",     label: "Abdos (Résistance)",  action: { type: "train", stat: "resistance", energy: 30, cooldownKey: "resistance" } },
        { id: "meditate",   label: "Méditer (Moral)",     action: { type: "train", stat: "moral",      energy: 10, cooldownKey: "moral" } },
        { id: "sleep",      label: "Dormir",              action: { type: "sleep" } }
      ]
    },
    showers: {
      name: "Douches",
      hotspots: [
        { id: "toCorridor",   label: "Sortir",              action: { type: "move", leads_to: "corridor" } },
        { id: "take_shower",  label: "Se doucher (+Moral)", action: { type: "shower_event" } }
      ]
    },
    yard: {
      name: "Cour de Promenade",
      hotspots: [
        { id: "toCorridor",  label: "Sortir",                  action: { type: "move", leads_to: "corridor" } },
        { id: "train_yard",  label: "Musculation (Force)",     action: { type: "train", stat: "force",  energy: 35, cooldownKey: "force_yard" } },
        { id: "jog",         label: "Course (Agilité)",        action: { type: "train", stat: "agilite",energy: 25, cooldownKey: "agilite" } },
        { id: "observe",     label: "Observer (Intelligence)", action: { type: "train", stat: "intelligence", energy: 5, cooldownKey: "intelligence" } }
      ]
    },
    canteen: {
      name: "Cantine",
      hotspots: [
        { id: "toCorridor", label: "Sortir",              action: { type: "move", leads_to: "corridor" } },
        { id: "eat",        label: "Manger le plateau",   action: { type: "eat_event" } }
      ]
    },
    visiting_room: {
      name: "Parloir",
      hotspots: [
        { id: "toCorridor", label: "Sortir",              action: { type: "move", leads_to: "corridor" } },
        { id: "visit",      label: "Parler au visiteur",  action: { type: "visiting_event" } }
      ]
    },
    entrance: {
      name: "Entrée",
      hotspots: [
        { id: "toCorridor",  label: "Entrer dans la prison", action: { type: "move", leads_to: "corridor" } },
        { id: "entranceid",  label: "Parler au garde",       action: { type: "entrance_event" } }
      ]
    },
    common: {
      name: "Salle commune",
      hotspots: [
        { id: "toCorridor", label: "Sortir",                   action: { type: "move", leads_to: "corridor" } },
        { id: "tv",         label: "Regarder la télé (+Moral)", action: { type: "watch_tv" } },
        { id: "cards",      label: "Jouer aux cartes",          action: { type: "play_cards" } }
      ]
    },
    infirmary: {
      name: "Infirmerie",
      hotspots: [
        { id: "toCorridor",      label: "Sortir",                  action: { type: "move", leads_to: "corridor" } },
        { id: "infirmaryid",     label: "Parler à Jocelyn",        action: { type: "infirmary_event" } },
        { id: "infirmary_steal", label: "Voler des produits",      action: { type: "infirmary_steal" } }
      ]
    },
    office: {
      name: "Bureau du Directeur",
      hotspots: [
        { id: "toCorridor", label: "Sortir",                 action: { type: "move", leads_to: "corridor" } },
        { id: "privileges", label: "Demander des privilèges",action: { type: "upgrade" } },
        { id: "rat_info",   label: "Balancer des infos",     action: { type: "rat_action" } }
      ]
    },
    security: {
      name: "Salle des Caméras",
      hotspots: [
        { id: "toCorridor", label: "Sortir",                    action: { type: "move", leads_to: "corridor" } },
        { id: "hack",       label: "Désactiver les caméras",    action: { type: "hack" } }
      ]
    },
    solitary: {
      name: "Le Trou (Isolement)",
      hotspots: [
        { id: "wait", label: "Attendre la fin de peine", action: { type: "wait_punishment" } },
        { id: "train_mind", label: "Entraîner l'esprit", action: { type: "train", stat: "intelligence", energy: 5, cooldownKey: "solitary_int" } }
      ]
    }
  },

  npcs: {
    cell:          [],
    corridor:      [ NPCS_DB["garde_corridor"] ],
    showers:       [ { ...NPCS_DB["dealer"], x: "70%", y: "60%" } ],
    yard:          [
      { ...NPCS_DB["brute"], x: "40%", y: "55%" },
      { ...NPCS_DB["rat"],   x: "75%", y: "60%" }
    ],
    canteen:       [ { ...NPCS_DB["vieux"], x: "30%", y: "50%" } ],
    infirmary:     [ { ...NPCS_DB["Jocelyn"], x: "30%", y: "50%" } ],
    office:        [],
    common:        [],
    entrance:      [],
    visiting_room: [],
    security:      [],
    solitary:      []
  }
};
