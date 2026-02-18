// introData.js
const INTRO_DATA = {
  "start": {
    "background": "images/bus.png",
    "characters": [{ "id": "guard_bus", "name": "Gardien Bus", "x": "20%", "y": "50%" }],
    "dialogues": [{ "speaker": "Gardien Bus", "text": "Bienvenue à Blackridge ! Votre nouveau chez-vous, les gars !" }],
    "choices": [
      { "text": "Baisser les yeux (Intelligence +1)", "target": "baisser_yeux", "reward": { stat: "intelligence", points: 1 } },
      { "text": "Soutenir son regard (Charisme +1)", "target": "soutenir_regard", "reward": { stat: "charisme", points: 1 } },
      { "text": "Regarder les autres (Force +1)", "target": "regarder_autres", "reward": { stat: "force", points: 1 } }
    ]
  },
  "baisser_yeux": {
    "background": "images/bus.png",
    "dialogues": [
      { "speaker": "Vous", "text": "Tu baisses les yeux et restes silencieux. Mieux vaut passer inaperçu." },
      { "speaker": "Gardien Bus", "text": "Hmm… t'as l'air d'avoir compris comment ça marche ici." }
    ],
    "choices": [{ "text": "Descendre du bus", "target": "sortir_bus" }]
  },
  "soutenir_regard": {
    "background": "images/bus.png",
    "dialogues": [
      { "speaker": "Vous", "text": "Tu fixes le gardien sans détourner le regard." },
      { "speaker": "Gardien Bus", "text": "Intéressant… t’as du cran. On verra combien de temps ça dure." }
    ],
    "choices": [{ "text": "Descendre du bus", "target": "sortir_bus" }]
  },
  "regarder_autres": {
    "background": "images/bus.png",
    "dialogues": [{ "speaker": "Vous", "text": "Tu scrutes les visages. Des brutes, des désespérés... Tes futurs alliés ou ennemis." }],
    "choices": [{ "text": "Descendre du bus", "target": "sortir_bus" }]
  },
  "sortir_bus": {
    "background": "images/cour_prison.png",
    "dialogues": [
      { "speaker": "Vous", "text": "Tu descends du bus. La boue macule tes chaussures de prisonnier." },
      { "speaker": "Gardien Bus", "text": "Allez, en ligne ! Direction l'accueil !" }
    ],
    "choices": [{ "text": "Avancer vers la prison", "target": "fin_intro" }]
  },
  "fin_intro": {
    "background": "images/entrance.png",
    "dialogues": [
      { "speaker": "Système", "text": "L'enregistrement est terminé. Vous recevez vos 5 points de réputation de base." }
    ],
    "reward": { stat: "reputation", points: 5 },
    "choices": [] 
  }
};