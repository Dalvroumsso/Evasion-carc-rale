// gameData.js - Base de données centralisée de Prison Riot

const MAX_ENERGY = 100;

const WORLD_DATA = {
  // Configuration des pièces et de leurs interactions
  rooms: {
    entrance: { 
      name: "Entrée / Zone d’accueil", 
      image: "images/entrance.png",
      hotspots: [
        { id: "toCell", label: "Aller au bloc cellulaire", action: { type: "move", leads_to: "cell" } }
      ]
    },
    cell: { 
      name: "Bloc cellulaire", 
      description: "Une cellule sombre et froide.", 
      image: "images/cell.png",
      hotspots: [
        { id: "toCorridor", label: "Aller au couloir principal", action: { type: "move", leads_to: "corridor" } },
        { id: "findCig", label: "Ramasser une cigarette", action: { type: "item", item: "cigarette", message: "Vous avez trouvé une cigarette." } }
      ]
    },
    corridor: { 
      name: "Couloirs principaux", 
      image: "images/corridor.png",
      hotspots: [
        { id: "toCanteen", label: "Aller à la cantine", action: { type: "move", leads_to: "canteen" } },
        { id: "toYard", label: "Aller à la cour", action: { type: "move", leads_to: "yard" } },
        { id: "toCommon", label: "Aller à la salle commune", action: { type: "move", leads_to: "common" } },
        { id: "toOffices", label: "Aller aux bureaux", action: { type: "move", leads_to: "offices" } },
        { id: "toSecurity", label: "Aller à la sécurité", action: { type: "move", leads_to: "security" } },
        { id: "toInfirmary", label: "Aller à l’infirmerie", action: { type: "move", leads_to: "infirmary" } }
      ]
    },
    canteen: { 
      name: "Réfectoire / Cuisine", 
      description: "Odeur de nourriture et vaisselle.", 
      image: "images/canteen.png",
      hotspots: [{ id: "toCorridor", label: "Retour au couloir principal", action: { type: "move", leads_to: "corridor" } }]
    },
    common: { 
      name: "Salle commune / Activités", 
      image: "images/common.png",
      hotspots: [{ id: "toCorridor", label: "Retour au couloir principal", action: { type: "move", leads_to: "corridor" } }]
    },
    yard: { 
      name: "Cours extérieure / Cour de promenade", 
      description: "La cour de la prison, en plein air.", 
      image: "images/yard.png",
      hotspots: [{ id: "toCorridor", label: "Retour au couloir principal", action: { type: "move", leads_to: "corridor" } }]
    },
    offices: { 
      name: "Bureaux administratifs", 
      image: "images/offices.png",
      hotspots: [{ id: "toCorridor", label: "Retour au couloir principal", action: { type: "move", leads_to: "corridor" } }]
    },
    security: { 
      name: "Sécurité", 
      image: "images/security.png",
      hotspots: [{ id: "toCorridor", label: "Retour au couloir principal", action: { type: "move", leads_to: "corridor" } }]
    },
    infirmary: { 
      name: "Infirmerie", 
      image: "images/infirmary.png",
      hotspots: [{ id: "toCorridor", label: "Retour au couloir principal", action: { type: "move", leads_to: "corridor" } }]
    }
  },

  // Emplacement des PNJ
  npcs: {
    cell: [
      { 
        id: "prisoner1", 
        name: "Prisonnier 1", 
        x: "15%", y: "60%", 
        dialogue: "Hé toi... T'as pas une cigarette ? C'est long ici." 
      }
    ],
    corridor: [
      { 
        id: "guard1", 
        name: "Gardien", 
        x: "70%", y: "45%", 
        dialogue: "Circulez ! Rien à voir ici." 
      }
    ]
  },

  // Objets collectables
  items: {
    key: { name: "Clé" },
    map: { name: "Plan" },
    cigarette: { name: "Cigarette" }
  },

  // Activités possibles
  activities: {
    exercise: { name: "Faire de l'exercice", energy_cost: 10, stats_impact: { agilite: 1 } },
    read: { name: "Lire", energy_cost: 5, stats_impact: { intelligence: 1 } }
  }
};