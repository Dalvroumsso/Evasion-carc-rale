const GAME_SETTINGS = {
  // Limites des statistiques
  STATS: { MIN: 0, MAX: 100, STARTING_ENERGY: 100, STARTING_MORAL: 50 },
  
  // Économie (Cigarettes)
  ECONOMY: {
    BUY_DIVIDER: 5,  // Prix d'achat = Valeur / 5
    SELL_DIVIDER: 10 // Prix de vente = Valeur / 10
  },
  
  // Combat
  COMBAT: {
    BASE_HP: 20,
    BASE_DAMAGE: 5,
    SPAWN_SPEED_BASE: 1200,
    SPAWN_SPEED_MIN: 400,
    TARGET_TIMEOUT: 1000,
    REPUTATION_WIN: 15,
    REPUTATION_LOSS: 5,
    PRISON_RISK: 0.4
  },

  // Temps
  TIME: {
    TICK_SPEED: 10, // Minutes par action de base
    DAY_START: 480, // 08:00
    DAY_END: 1440   // Minuit
  }
};

const ITEMS_DB = {
  "brossette": { name: "Brossette", icon: "🪥", illegal: false, value: 0 },
  "savon": { name: "Savon", icon: "🧼", illegal: false, value: 1 },
  "cigarettes": { name: "Cigarettes", icon: "🚬", illegal: true, value: 5 },
  "livre_adulte": { name: "Livre Adulte", icon: "🔞", illegal: true, value: 10 },
  "shivan": { name: "Shivan (Couteau)", icon: "🔪", illegal: true, value: 15 },
  "dopant": { name: "Dopant", icon: "🧪", illegal: true, value: 8 },
  "corde": { name: "Bout de corde", icon: "🪢", illegal: true, value: 3 },
  "savon_corde": { name: "Savon de combat", icon: "🧼", illegal: true, value: 12 }
};

const WORLD_DATA = {
  // Horaires essentiels pour handleAction
  schedule: {
    yard: { start: 480, end: 1200, label: "08:00 - 20:00" },
    canteen: { start: 720, end: 840, label: "12:00 - 14:00" },
    canteen_evening: { start: 1080, end: 1200, label: "18:00 - 20:00" },
    visiting: { start: 840, end: 1020, label: "14:00 - 17:00" }
  },
  
  gangs: {
    neutre: { name: "Petite merde", color: "text-gray-400" },
    ariens: { name: "Fraternité", color: "text-red-500", power: 10 },
    latinos: { name: "Los Muertos", color: "text-orange-500", power: 8 },
    musclés: { name: "Les Cogneurs", color: "text-blue-500", power: 12 }
  },

  rooms: {
    corridor: { 
      name: "Couloir Principal", 
      hotspots: [
        { id: "toCell", label: "Cellule", action: { type: "move", leads_to: "cell" } },
        { id: "toShowers", label: "Douches", action: { type: "move", leads_to: "showers" } },
        { id: "toYard", label: "Cour", action: { type: "move", leads_to: "yard" } },
        { id: "toCanteen", label: "Cantine", action: { type: "move", leads_to: "canteen" } },
        { id: "toParlor", label: "Parloir", action: { type: "move", leads_to: "visiting_room" } },
      	{ id: "toCommon", label: "Salle commune", action: { type: "move", leads_to: "common" } },
	      { id: "toEntrance", label: "Entree", action: { type: "move", leads_to: "entrance" } },
      	{ id: "toInfirmary", label: "Infirmerie", action: { type: "move", leads_to: "infirmary" } },
      	{ id: "toOffice", label: "Bureau du directeur", action: { type: "move", leads_to: "office" } },
      	{ id: "toSecurity", label: "Salle des cameras", action: { type: "move", leads_to: "security" } }
      ]
    },
    cell: { 
      name: "Votre Cellule", 
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "pushups", label: "Pompes (Force)", action: { type: "train", stat: "force", energy: 25, time: 10 } },
        { id: "situps", label: "Abdos (Résistance)", action: { type: "train", stat: "resistance", energy: 25, time: 10 } },
        { id: "sleep", label: "Dormir", action: { type: "sleep" } }
      ]
    },
    showers: {
      name: "Douches",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "take_shower", label: "Se doucher", action: { type: "shower_risk" } } // À coder dans handleAction
      ]
    },
    yard: { 
      name: "Cour de Promenade", 
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "train_yard", label: "Musculation", action: { type: "train", stat: "force", energy: 30, time: 20 } }
      ]
    },
    canteen: {
      name: "Cantine",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "eat", label: "Manger le plateau", action: { type: "eat_event" } }
      ]
    },
    visiting_room: {
      name: "Parloir",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "visit", label: "Parler au visiteur", action: { type: "visiting_event" } }
      ]
    },
    entrance: {
      name: "Entree",
      hotspots: [
        { id: "toCorridor", label: "Entrer dans la prison", action: { type: "move", leads_to: "corridor" } },
        { id: "entranceid", label: "Parler au garde", action: { type: "entrance_event" } }
      ]
    },
    common: {
      name: "Salle commune",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "tv", label: "Regarder la tele", action: { type: "watch_tv" } }
      ]
    },
    infirmary: {
      name: "Infirmerie",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "infirmaryid", label: "Parler avec l'infermiere", action: { type: "infirmary_event" } },
	{ id: "infirmary_steal", label: "Voler des produits", action: { type: "infirmary_event_steal" } }
      ]
    },
    office: {
      name: "Bureau du directeur",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "tv", label: "Demander des privileges", action: { type: "upgrade" } },
	{ id: "tv", label: "Balancer des infos", action: { type: "rat" } }
      ]
    },
    security: {
      name: "Salle des cameras",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "tv", label: "Desactiver les cameras", action: { type: "hack" } }
      ]
    },
    solitary: {
      name: "Le Trou (Isolement)",
      hotspots: [
        { id: "wait", label: "Attendre la fin de peine", action: { type: "wait_punishment" } }
      ]
    }
  },

  npcs: {
    cell: [],
    corridor: [],
    showers: [
      { id: "dealer", name: "Le Dealer", x: "70%", y: "60%", type: "trade", inventory: ["dopant", "savon"], dialog: "Besoin d'un remède pour tenir le coup ?" }
    ],
    yard: [
      { id: "brute", name: "La Brute", x: "40%", y: "55%", force: 40, type: "fight", icon: "👺" },
      { id: "rat", name: "Le Rat", x: "70%", y: "60%", type: "trade", inventory: ["shivan", "cigarettes", "corde"], dialog: "Rien n'est gratuit ici..." }
    ],
    canteen: [
      { id: "vieux", name: "Le Vieux", x: "30%", y: "50%", type: "trade", inventory: ["livre_adulte", "savon"], dialog: "Le savoir, c'est la seule liberté." }
    ]
  }
};
