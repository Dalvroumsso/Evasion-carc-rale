/**
 * Rôle : Gestionnaire d'état principal.
 * Gère la transition entre les écrans et conserve les statistiques du joueur.
 */
const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
  const [step, setStep] = React.useState("start"); // "start" -> "intro" -> "game"

  // Statistiques initiales complètes
  const [initialStats, setInitialStats] = React.useState({
    force: 0,
    resistance: 0,
    reputation: 0,
    intelligence: 0,
    charisme: 0,
    agilite: 5,  // Requis pour l'infiltration nocturne
    moral: 50    // Requis pour l'équilibre mental
  });

  // Fonction pour cumuler les points gagnés durant l'introduction
  const updateInitialStats = (stat, points) => {
    setInitialStats(prev => ({ 
      ...prev, 
      [stat]: (prev[stat] || 0) + points 
    }));
  };

  // --- RENDU CONDITIONNEL ---

  // 1. Écran de titre
  if (step === "start") {
    return React.createElement(StartScreen, { 
      onStart: () => setStep("intro") 
    });
  }

  // 2. Scène d'introduction (Bus)
  if (step === "intro") {
    return React.createElement(IntroScene, { 
      onComplete: () => setStep("game"),
      updateStats: updateInitialStats 
    });
  }

  // 3. Le Jeu Principal (Blackridge Prison)
  return React.createElement(Game, { 
    startingBonus: initialStats 
  });
}

root.render(React.createElement(App));
