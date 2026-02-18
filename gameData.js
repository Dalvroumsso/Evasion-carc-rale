// --- ORIGINES (RPG) ---
const CRIME_DATA = {
  "braquage": { 
    label: "Braquage de banque", 
    stats: { force: 10, resistance: 10, intelligence: 2, charisme: 3, reputation: 5 },
    desc: "Profil physique. Tu sais encaisser."
  },
  "trafic": { 
    label: "Trafic de stupéfiants", 
    stats: { force: 5, resistance: 5, intelligence: 5, charisme: 5, reputation: 10 },
    desc: "Équilibré. Tu connais les codes."
  },
  "fraude": { 
    label: "Cyber-criminalité", 
    stats: { force: 2, resistance: 2, intelligence: 15, charisme: 11, reputation: 0 },
    desc: "Fragile mais manipulateur."
  }
};

// --- OBJETS & ICONES ---
const ITEMS_DB = {
  "brossette": { name: "Brossette", icon: "🪥", illegal: false, desc: "Sert à bricoler..." },
  "savon": { name: "Savon", icon: "🧼", illegal: false, desc: "Pour l'hygiène (ou pire)." },
  "shivan": { name: "Surin (Shivan)", icon: "🔪", illegal: true, desc: "Arme : Force +20 (Passif)" },
  "cigarettes": { name: "Cigarettes", icon: "🚬", illegal: true, desc: "Utiliser : Moral +15, Reput +2" },
  "livre_adulte": { name: "Magazines X", icon: "🔞", illegal: true, desc: "Utiliser : Moral +40" },
  "dopant": { name: "Stéroïdes", icon: "💉", illegal: true, desc: "Utiliser : Énergie +50" },
  "smartphone": { name: "Smartphone", icon: "📱", illegal: true, desc: "Rare. Intelligence +10" }
};

// --- CARTE & INTERACTIONS ---
const WORLD_DATA = {
  rooms: {
    entrance: { 
      name: "Accueil & Fouille",
      hotspots: [{ id: "enter", label: "Entrer au Bloc A", action: { type: "move", leads_to: "corridor" } }]
    },
    corridor: { 
      name: "Couloir Principal",
      hotspots: [
        { id: "toCell", label: "Ma Cellule", action: { type: "move", leads_to: "cell" } },
        { id: "toYard", label: "Cour de promenade", action: { type: "move", leads_to: "yard" } },
        { id: "toCanteen", label: "Cantine", action: { type: "move", leads_to: "canteen" } },
        { id: "toVisiting", label: "Parloir", action: { type: "move", leads_to: "visiting_room" } },
        { id: "toInfirmary", label: "Infirmerie", action: { type: "move", leads_to: "infirmary" } },
        { id: "toShowers", label: "Douches", action: { type: "move", leads_to: "showers" } }
      ]
    },
    cell: { 
      name: "Votre Cellule",
      hotspots: [
        { id: "out", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "sleep", label: "Dormir (Reset Énergie)", action: { type: "sleep" } },
        { id: "train_cell", label: "Pompes (+Force)", action: { type: "train", stat: "force", energy: 20, time: 20 } },
        { id: "craft_shiv", label: "Fabriquer un Surin (Besoin: Brossette)", action: { type: "craft", req: "brossette", give: "shivan", energy: 30 } }
      ]
    },
    yard: { 
      name: "Cour",
      hotspots: [
        { id: "out", label: "Rentrer", action: { type: "move", leads_to: "corridor" } },
        { id: "muscle", label: "Musculation (+Force/Res)", action: { type: "train", stat: "resistance", energy: 30, time: 45 } }
      ]
    },
    canteen: { 
      name: "Cantine",
      hotspots: [
        { id: "out", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "eat", label: "Manger (+Énergie)", action: { type: "eat", energy_gain: 40, time: 30 } },
        { id: "steal", label: "Voler un couteau (Risqué)", action: { type: "steal_knife" } }
      ]
    },
    visiting_room: {
      name: "Parloir",
      hotspots: [
        { id: "out", label: "Retour", action: { type: "move", leads_to: "corridor" } },
        { id: "meet", label: "Rencontrer Contact (1h)", action: { type: "visiting_event" } }
      ]
    },
    infirmary: {
      name: "Infirmerie",
      hotspots: [
        { id: "out", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "heal", label: "Se soigner (-Moral)", action: { type: "heal" } }
      ]
    },
    showers: {
      name: "Douches Communes",
      hotspots: [
         { id: "out", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
         { id: "wash", label: "Se laver (+Moral)", action: { type: "wash" } }
      ]
    },
    solitary: {
      name: "ISOLEMENT (LE TROU)",
      hotspots: [{ id: "wait", label: "Attendre...", action: { type: "wait_punishment" } }]
    }
  },
  npcs: {
    yard: [{ id: "brute", name: "La Brute", x: "40%", y: "55%", force: 45 }],
    canteen: [{ id: "cook", name: "Le Cuisistot", x: "80%", y: "40%", force: 10 }],
    showers: [{ id: "psycho", name: "Le Fou", x: "20%", y: "50%", force: 30 }]
  }
};
