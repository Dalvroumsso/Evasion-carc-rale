/**
 * Fichier : main.js
 * Rôle : Gestionnaire d'état principal (App Shell)
 * Gère la navigation entre le Menu, l'Intro (Création de perso + Bus) et le Jeu.
 */

const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
  // Étapes possibles : "start" (Menu) -> "intro" (Crime + Bus) -> "game" (Prison)
  const [step, setStep] = React.useState("start");

  // Statistiques initiales (seront remplies durant l'IntroScene)
  const [initialStats, setInitialStats] = React.useState({
    force: 0,
    resistance: 0,
    reputation: 0,
    intelligence: 0,
    charisme: 0,
    moral: 50 // Valeur par défaut
  });

  /**
   * Met à jour une statistique spécifique.
   * Utilisé par l'IntroScene pour appliquer les bonus du crime et du bus.
   */
  const updateInitialStats = (stat, points) => {
    setInitialStats(prev => ({ 
      ...prev, 
      [stat]: (prev[stat] || 0) + points 
    }));
  };

  /**
   * Gère le rendu conditionnel selon l'état du jeu
   */
  
  // 1. ÉCRAN TITRE (MENU PRINCIPAL)
  if (step === "start") {
    return React.createElement(StartScreen, { 
      onStart: () => setStep("intro") 
    });
  }

  // 2. SCÈNE D'INTRODUCTION (Choix du crime & Événement du Bus)
  if (step === "intro") {
    return React.createElement(IntroScene, { 
      onComplete: () => setStep("game"),
      updateStats: updateInitialStats,
      initialStats: initialStats // Passé pour les tests de résistance dans le bus
    });
  }

  // 3. LE JEU PRINCIPAL (Blackridge Prison)
  // On passe 'initialStats' au composant Game sous le nom 'startingBonus'
  return React.createElement(Game, { 
    startingBonus: initialStats 
  });
}

// Rendu de l'application
root.render(React.createElement(App));
