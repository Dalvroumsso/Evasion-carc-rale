const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
  // L'état 'step' est crucial : il définit par quoi le jeu commence
  const [step, setStep] = React.useState("start"); 
  const [initialStats, setInitialStats] = React.useState({
    force: 0,
    resistance: 0,
    reputation: 0,
    intelligence: 0,
    charisme: 0
  });

  const updateInitialStats = (stat, points) => {
    setInitialStats(prev => ({ ...prev, [stat]: (prev[stat] || 0) + points }));
  };

  // 1. Écran de démarrage
  if (step === "start") {
    return React.createElement(StartScreen, { onStart: () => setStep("intro") });
  }

  // 2. Scène du bus (Intro)
  if (step === "intro") {
    return React.createElement(IntroScene, { 
      onComplete: () => setStep("game"),
      updateStats: updateInitialStats 
    });
  }

  // 3. Le jeu en cellule
  return React.createElement(Game, { startingBonus: initialStats });
}

root.render(React.createElement(App));
