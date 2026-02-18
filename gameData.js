const CRIME_DATA = {
  "braquage": { 
    label: "Braquage de banque", 
    stats: { force: 10, resistance: 8, intelligence: 2, agilite: 5, reputation: 5 },
    desc: "Costaud et imposant. Difficile de passer inaperçu."
  },
  "trafic": { 
    label: "Trafic de stupéfiants", 
    stats: { force: 4, resistance: 4, intelligence: 6, agilite: 10, reputation: 6 },
    desc: "Vif et habitué à fuir la police. Très agile."
  },
  "fraude": { 
    label: "Cyber-criminalité", 
    stats: { force: 2, resistance: 2, intelligence: 15, agilite: 8, reputation: 3 },
    desc: "Frêle, mais ses doigts de hacker sont d'une précision chirurgicale."
  }
};

const ITEMS_DB = {
  "brossette": { name: "Brossette", icon: "🪥", illegal: false },
  "savon": { name: "Savon", icon: "🧼", illegal: false },
  "cigarettes": { name: "Cigarettes", icon: "🚬", illegal: true },
  "livre_adulte": { name: "Livre Adulte", icon: "🔞", illegal: true },
  "shivan": { name: "Shivan", icon: "🔪", illegal: true },
  "dopant": { name: "Dopant", icon: "🧪", illegal: true }
};

const WORLD_DATA = {
  // Horaires de la prison
  schedule: {
    canteen: { start: 720, end: 840, label: "12h00 - 14h00" }, // Midi
    canteen_evening: { start: 1080, end: 1200, label: "18h00 - 20h00" }, // Soir
    yard: { start: 480, end: 1080, label: "08h00 - 18h00" },
    visiting: { start: 540, end: 1020, label: "09h00 - 17h00" }
  },
  rooms: {
    entrance: { 
      name: "Accueil",
      hotspots: [{ id: "toCorridor", label: "Entrer dans le bloc", action: { type: "move", leads_to: "corridor" } }]
    },
    cell: { 
      name: "Cellule",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "pushups", label: "Pompes", action: { type: "train", stat: "force", energy: 20, time: 15 } },
        { id: "sleep", label: "Dormir (Reset)", action: { type: "sleep" } }
      ]
    },
    corridor: { 
      name: "Couloir",
      hotspots: [
        { id: "toCell", label: "Ma Cellule", action: { type: "move", leads_to: "cell" } },
        { id: "toYard", label: "Cour", action: { type: "move", leads_to: "yard" } },
        { id: "toCanteen", label: "Cantine", action: { type: "move", leads_to: "canteen" } },
        { id: "toVisiting", label: "Parloir", action: { type: "move", leads_to: "visiting_room" } }
      ]
    },
    yard: { 
      name: "Cour de promenade",
      hotspots: [
        { id: "toCorridor", label: "Rentrer", action: { type: "move", leads_to: "corridor" } },
        { id: "train_yard", label: "Musculation", action: { type: "train", stat: "force", energy: 30, time: 45 } }
      ]
    },
    canteen: { 
      name: "Cantine",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "eat", label: "Manger", action: { type: "eat_event" } }
      ]
    },
    visiting_room: {
      name: "Parloir",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "meet", label: "Parloir", action: { type: "visiting_event" } }
      ]
    },
    solitary: { name: "Le Trou", hotspots: [{ id: "wait", label: "Attendre...", action: { type: "wait_punishment" } }] }
  },
  npcs: {
    yard: [{ id: "brute", name: "La Brute", x: "40%", y: "55%", force: 40 }]
  }
};

