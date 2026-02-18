function IntroScene({ onComplete, updateStats, initialStats }) {
  const [step, setStep] = React.useState("crime_choice");

  const handleConfrontation = (choice) => {
    if (choice === "soutenir_final") {
      // Test de résistance : il faut au moins 8 en résistance pour rester debout
      if (initialStats.resistance >= 8) {
        updateStats("reputation", 10);
        updateStats("moral", 10);
        alert("Tu encaisses le coup sans broncher. Le gardien semble surpris, les autres détenus murmurent ton nom. (+10 Reput)");
      } else {
        updateStats("reputation", -5);
        updateStats("moral", -10);
        alert("Le coup te brise net. Tu t'effondres sur le sol du bus. La honte te submerge. (-5 Reput)");
      }
      onComplete();
    }
  };

  if (step === "crime_choice") {
    return React.createElement("div", { className: "h-screen bg-gray-950 flex flex-col items-center justify-center p-6" },
      React.createElement("h2", { className: "text-xl font-bold mb-8 text-gray-400 uppercase tracking-widest" }, "Dossier d'incarcération : Motif ?"),
      React.createElement("div", { className: "grid gap-4 w-full max-w-md" },
        Object.entries(CRIME_DATA).map(([key, data]) => 
          React.createElement("button", {
            key: key,
            className: "p-4 bg-gray-900 border border-gray-800 hover:border-red-600 text-left transition-all group",
            onClick: () => {
              Object.entries(data.stats).forEach(([stat, val]) => updateStats(stat, val));
              setStep("bus_ride");
            }
          }, 
            React.createElement("div", { className: "font-bold text-white group-hover:text-red-500" }, data.label),
            React.createElement("div", { className: "text-xs text-gray-500" }, data.desc)
          )
        )
      )
    );
  }

  return React.createElement("div", { className: "h-screen bg-black flex flex-col" },
    React.createElement("div", { className: "flex-1 flex items-center justify-center bg-gray-900" },
      React.createElement("p", { className: "text-gray-500 italic" }, "[ Image du Bus : Le trajet vers Blackridge ]")
    ),
    React.createElement("div", { className: "p-8 bg-gray-950 border-t-2 border-red-600" },
      step === "bus_ride" ? React.createElement(React.Fragment, null,
        React.createElement("p", { className: "text-lg text-white mb-6" }, "Un gardien patrouille dans l'allée du bus et s'arrête devant toi..."),
        React.createElement("div", { className: "flex gap-4" },
          React.createElement("button", { 
            className: "px-4 py-2 bg-gray-800 hover:bg-blue-600 text-xs font-bold",
            onClick: () => { updateStats("intelligence", 1); updateStats("reputation", -2); onComplete(); }
          }, "Baisser les yeux (+1 Intel, -2 Reput)"),
          React.createElement("button", { 
            className: "px-4 py-2 bg-gray-800 hover:bg-red-600 text-xs font-bold",
            onClick: () => setStep("confrontation")
          }, "Soutenir son regard"),
          React.createElement("button", { 
            className: "px-4 py-2 bg-gray-800 hover:bg-gray-600 text-xs font-bold",
            onClick: onComplete
          }, "Ignorer")
        )
      ) : React.createElement(React.Fragment, null,
        React.createElement("p", { className: "text-lg text-red-500 mb-6 font-bold" }, "Le gardien s'approche : 'Tu veux que je t'apprenne le respect, petit ?'"),
        React.createElement("div", { className: "flex gap-4" },
          React.createElement("button", { 
            className: "px-6 py-3 bg-red-600 text-white font-black",
            onClick: () => handleConfrontation("soutenir_final")
          }, "NE PAS CILLER (Test de Résistance)"),
          React.createElement("button", { 
            className: "px-6 py-3 bg-gray-800 text-white font-bold",
            onClick: onComplete
          }, "Se soumettre")
        )
      )
    )
  );
}
