const WORLD_DATA = {
  gangs: {
    neutre: { name: "Sans étiquette", color: "text-gray-400" },
    ariens: { name: "Fraternité", color: "text-red-500", power: 10 },
    latinos: { name: "Los Muertos", color: "text-orange-500", power: 8 },
    musclés: { name: "Les Cogneurs", color: "text-blue-500", power: 12 }
  },
  thresholds: { bed_nv2: 30, bed_nv3: 70, recruit: 50 },
  rooms: {
    cell: { 
      name: "Votre Cellule", image: "images/cell.png",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "pushups", label: "Pompes (Force)", action: { type: "train", stat: "force", energy: 25, time: 10 } },
        { id: "situps", label: "Abdos (Résistance)", action: { type: "train", stat: "resistance", energy: 25, time: 10 } },
        { id: "craft_shivan", label: "Tailler un Shivan (Brossette)", action: { type: "craft", from: "brossette", to: "shivan" } },
        { id: "craft_soap", label: "Attacher Savon (Corde + Savon)", action: { type: "craft_complex", materials: ["corde", "savon"], result: "savon_corde" } },
        { id: "sleep", label: "Dormir", action: { type: "sleep" } }
      ]
    },
    corridor: { 
      name: "Couloir", image: "images/corridor.png",
      hotspots: [
        { id: "toCell", label: "Cellule", action: { type: "move", leads_to: "cell" } },
        { id: "toShowers", label: "Douches", action: { type: "move", leads_to: "showers" } },
        { id: "toYard", label: "Cour", action: { type: "move", leads_to: "yard" } }
      ]
    },
    showers: {
      name: "Douches", image: "images/showers.png",
      hotspots: [
        { id: "toCorridor", label: "Sortir", action: { type: "move", leads_to: "corridor" } },
        { id: "take_shower", label: "Se doucher (+20 Énergie)", action: { type: "shower_risk" } }
      ]
    },
    yard: { name: "Cour", image: "images/yard.png", hotspots: [{ id: "toCorridor", label: "Entrer", action: { type: "move", leads_to: "corridor" } }] }
  },
  npcs: {
    yard: [
      { id: "big_tony", name: "Big Tony", x: "50%", y: "40%", gang: "musclés", force: 40, dialogue: "Tu veux tâter de mes poings ?" },
      { id: "dealer", name: "Le Dealer", x: "80%", y: "50%", gang: "neutre", force: 5, dialogue: "3 clopes pour du dopant.", trade: { take: "cigarette", give: "dopant", amount: 3, message: "Tiens, ça va booster tes pompes." } }
    ]
  }
};
