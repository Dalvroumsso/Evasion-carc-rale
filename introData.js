const INTRO_DATA = {
  // ÉTAPE 1 : LE CRIME (Gros bonus de départ)
  "start": {
    background: "images/courthouse.png",
    dialogues: [
      { speaker: "Juge", text: "Accusé, levez-vous. Rappelez à la cour la nature de vos actes." }
    ],
    choices: [
      { text: "Braquage à main armée (Force +10, Reput +5)", target: "bus_arrival", reward: { stat: "force", points: 10 } },
      { text: "Cyber-fraude massive (Intell +10, Agilité +5)", target: "bus_arrival", reward: { stat: "intelligence", points: 10 } },
      { text: "Escroquerie en bande organisée (Charisme +10, Intell +5)", target: "bus_arrival", reward: { stat: "charisme", points: 10 } },
      { text: "Rixe de bar sanglante (Résistance +10, Force +5)", target: "bus_arrival", reward: { stat: "resistance", points: 10 } }
    ]
  },

  // ÉTAPE 2 : ARRIVÉE DANS LE BUS
  "bus_arrival": {
    background: "images/bus.png",
    characters: [{ id: "guard_bus", name: "Gardien Bus", x: "50%", y: "50%" }],
    dialogues: [
      { speaker: "Gardien Bus", text: "Fini de rêver. Vous allez à Blackridge maintenant. Fermez vos gueules et asseyez-vous !" }
    ],
    choices: [
      { text: "Baisser les yeux (Intelligence +1)", target: "baisser_yeux", reward: { stat: "intelligence", points: 1 } },
      { text: "Soutenir son regard (Charisme +1)", target: "soutenir_regard", reward: { stat: "charisme", points: 1 } },
      { text: "Regarder les autres (Force +1)", target: "regarder_autres", reward: { stat: "force", points: 1 } }
    ]
  },

  // ÉTAPE 3 : LES RÉACTIONS (Transition)
  "baisser_yeux": {
    background: "images/bus.png",
    dialogues: [{ speaker: "Vous", text: "Tu baisses les yeux. Passer pour une cible facile est parfois une stratégie." }],
    choices: [{ text: "Le trajet continue...", target: "sortir_bus" }]
  },
  "soutenir_regard": {
    background: "images/bus.png",
    dialogues: [{ speaker: "Gardien Bus", text: "T'as du cran, le nouveau. On verra si tu le gardes une fois en cellule." }],
    choices: [{ text: "Le trajet continue...", target: "sortir_bus" }]
  },
  "regarder_autres": {
    background: "images/bus.png",
    dialogues: [{ speaker: "Vous", text: "Tu étudies la concurrence. Il y a au moins trois chefs de gangs potentiels ici." }],
    choices: [{ text: "Le trajet continue...", target: "sortir_bus" }]
  },

  // ÉTAPE 4 : LA SORTIE
  "sortir_bus": {
    background: "images/cour_prison.png",
    dialogues: [
      { speaker: "Vous", text: "Les portes s'ouvrent. L'air sent le béton froid et la sueur." },
      { speaker: "Gardien Bus", text: "Tout le monde descend ! Bienvenue en enfer." }
    ],
    choices: [{ text: "Entrer dans le bloc", target: "fin_intro" }]
  },

  // ÉTAPE 5 : CONCLUSION
  "fin_intro": {
    background: "images/entrance.png",
    dialogues: [{ speaker: "Système", text: "Traitement terminé. Dossier criminel enregistré. Bonus de bienvenue appliqué." }],
    reward: { stat: "reputation", points: 5 },
    choices: [] 
  }
};
