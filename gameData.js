const ITEMS_DB = {
  "brossette": { name: "Brossette", icon: "🪥", illegal: false },
  "savon": { name: "Savon", icon: "🧼", illegal: false },
  "cigarettes": { name: "Cigarettes", icon: "🚬", illegal: true, desc: "Moral +10, Reput +2" },
  "livre_adulte": { name: "Livre Adulte", icon: "🔞", illegal: true, desc: "Moral +30" },
  "shivan": { name: "Shivan", icon: "🔪", illegal: true, desc: "Force +15 en combat" },
  "corde": { name: "Corde", icon: "🪢", illegal: true },
  "dopant": { name: "Dopant", icon: "🧪", illegal: true, desc: "Force temporaire" }
};

const WORLD_DATA = {
  rooms: {
    entrance: { 
      name: "Accueil & Fouille", 
      hotspots: [{ id: "toCorridor", label: "Pénétrer dans la prison", action: { type: "move", leads_to: "corridor" } }]
    },
    cell: { 
      name: "Votre Cellule", 
      hotspots: [
        { id: "toCorridor", label: "Sortir dans le couloir", action: { type: "move", leads_to: "corridor" } },
        { id: "pushups", label: "Pompes (Force)", action: { type: "train", stat: "force", energy: 20, time: 15 } },
        { id: "sleep", label: "Dormir (Reset Journée)", action: { type: "sleep" } }
      ]
    },
    corridor: { 
      name: "Couloir Principal", 
      hotspots: [
        { id: "toCell", label: "Ma Cellule", action: { type: "move", leads_to: "cell" } },
        { id: "toYard", label: "Cour de promenade", action: { type: "move", leads_to: "yard" } },
        { id: "toCanteen", label: "Cantine", action: { type: "move", leads_to: "canteen" } },
        { id: "toInfirmary", label: "Infirmerie", action: { type: "move", leads_to: "infirmary" } },
        { id: "toCommon", label: "Salle Commune", action: { type: "move", leads_to: "common" } },
        { id: "toVisiting", label: "Parloir", action: { type: "move", leads_to: "visiting_room" } }
      ]
    },
    yard: { 
      name: "Cour", 
      hotspots: [
        { id: "toCorridor", label: "Retour Couloir", action: { type: "move", leads_to: "corridor" } },
        { id: "train_yard", label: "Musculation (+Force)", action: { type: "train", stat: "force", energy: 30, time: 30 } }
      ]
    },
    canteen: { 
      name: "Cantine", 
      hotspots: [
        { id: "toCorridor", label: "Retour Couloir", action: { type: "move", leads_to: "corridor" } },
        { id: "eat", label: "Prendre un repas (+Énergie)", action: { type: "train", stat: "moral", energy: -40, time: 30 } }
      ]
    },
    visiting_room: {
      name: "Parloir",
      hotspots: [
        { id: "toCorridor", label: "Retour Couloir", action: { type: "move", leads_to: "corridor" } },
        { id: "meet", label: "Rencontrer un proche (1h)", action: { type: "visiting_event" } }
      ]
    },
    infirmary: {
      name: "Infirmerie",
      hotspots: [
        { id: "toCorridor", label: "Retour Couloir", action: { type: "move", leads_to: "corridor" } },
        { id: "steal_meds", label: "Chercher des dopants (Risqué)", action: { type: "train", stat: "intelligence", energy: 10, time: 20 } }
      ]
    },
    common: {
      name: "Salle Commune",
      hotspots: [
        { id: "toCorridor", label: "Retour Couloir", action: { type: "move", leads_to: "corridor" } },
        { id: "toOffices", label: "Bureaux Administratifs", action: { type: "move", leads_to: "offices" } }
      ]
    },
    offices: {
      name: "Bureaux",
      hotspots: [{ id: "toCommon", label: "Retour Salle Commune", action: { type: "move", leads_to: "common" } }]
    },
    solitary: {
      name: "Isolement (Le Trou)",
      hotspots: [{ id: "wait", label: "Attendre la fin de peine", action: { type: "wait_punishment" } }]
    }
  },
  npcs: {
    yard: [{ id: "brute", name: "La Brute", x: "40%", y: "55%", force: 40 }],
    visiting_room: [{ id: "visitor", name: "Visiteur", x: "50%", y: "50%", force: 0 }]
  }
};
