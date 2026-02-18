const ITEMS_DB = {
  "brossette": { name: "Brossette", icon: "🪥", illegal: false },
  "savon": { name: "Savon", icon: "🧼", illegal: false },
  "cigarettes": { name: "Cigarettes", icon: "🚬", illegal: true, desc: "Moral +10, Reput +2" },
  "livre_adulte": { name: "Livre Adulte", icon: "🔞", illegal: true, desc: "Moral +30" },
  "shivan": { name: "Shivan", icon: "🔪", illegal: true, desc: "Force +15" },
  "dopant": { name: "Dopant", icon: "🧪", illegal: true, desc: "Boost d'énergie" }
};

const WORLD_DATA = {
  rooms: {
    entrance: { 
      name: "Accueil & Fouille",
      hotspots: [
        { id: "toCorridor", label: "Entrer dans le bloc", action: { type: "move", leads_to: "corridor" } }
      ]
    },
    cell: { 
      name: "Votre Cellule",
      hotspots: [
        { id: "toCorridor", label: "Sortir dans le couloir", action: { type: "move", leads_to: "corridor" } },
        { id: "pushups", label: "Faire des pompes", action: { type: "train", stat: "force", energy: 20, time: 15 } },
        { id: "sleep", label: "Dormir", action: { type: "sleep" } }
      ]
    },
    corridor: { 
      name: "Couloir Principal",
      hotspots: [
        { id: "toCell", label: "Ma Cellule", action: { type: "move", leads_to: "cell" } },
        { id: "toYard", label: "Cour de promenade", action: { type: "move", leads_to: "yard" } },
        { id: "toCanteen", label: "Cantine", action: { type: "move", leads_to: "canteen" } },
        { id: "toVisiting", label: "Parloir", action: { type: "move", leads_to: "visiting_room" } },
        { id: "toCommon", label: "Salle Commune", action: { type: "move", leads_to: "common" } }
      ]
    },
    yard: { 
      name: "Cour",
      hotspots: [
        { id: "toCorridor", label: "Rentrer au bloc", action: { type: "move", leads_to: "corridor" } },
        { id: "train_yard", label: "Musculation", action: { type: "train", stat: "force", energy: 30, time: 45 } }
      ]
    },
    canteen: { 
      name: "Cantine",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "eat", label: "Prendre un plateau", action: { type: "train", stat: "moral", energy: -30, time: 30 } }
      ]
    },
    visiting_room: {
      name: "Parloir",
      hotspots: [
        { id: "toCorridor", label: "Retourner en cellule", action: { type: "move", leads_to: "corridor" } },
        { id: "meet", label: "Rencontre Parloir", action: { type: "visiting_event" } }
      ]
    },
    infirmary: {
      name: "Infirmerie",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } }
      ]
    },
    common: {
      name: "Salle Commune",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } }
      ]
    },
    solitary: {
      name: "Isolement (Le Trou)",
      hotspots: [
        { id: "wait", label: "Attendre...", action: { type: "wait_punishment" } }
      ]
    }
  },
  npcs: {
    yard: [{ id: "brute", name: "La Brute", x: "40%", y: "55%", force: 40 }],
    visiting_room: [{ id: "visitor", name: "Visiteur", x: "50%", y: "50%", force: 0 }]
  }
};
