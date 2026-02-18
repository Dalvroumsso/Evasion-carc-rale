function IntroScene({ onComplete, updateStats, initialStats }) {
  const [step, setStep] = React.useState("crime_choice");

  const handleConfrontation = () => {
    // Test de résistance : le crime "Braquage" passe, "Fraude" échoue.
    if (initialStats.resistance >= 8) {
      updateStats("reputation", 10);
      updateStats("moral", 10);
      alert("Tu restes debout. Le gardien grogne mais n'insiste pas. +10 Reput.");
    } else {
      updateStats("reputation", -5);
      updateStats("moral", -10);
      alert("Le coup t'assomme à moitié. Tu t'écroules. -5 Reput.");
    }
    onComplete();
  };

  if (step === "crime_choice") {
    return React.createElement("div", { className: "h-screen bg-black flex flex-col items-center justify-center p-6" },
      React.createElement("h2", { className: "text-gray-400 uppercase tracking-widest mb-8" }, "Motif de condamnation"),
      React.createElement("div", { className: "grid gap-4 w-full max-w-md" },
        Object.entries(CRIME_DATA).map(([key, data]) => 
          React.createElement("button", {
            key: key,
            className: "p-4 bg-gray-900 border border-gray-800 hover:border-red-600 text-left transition-all",
            onClick: () => {
              Object.entries(data.stats).forEach(([s, v]) => updateStats(s, v));
              setStep("bus");
            }
          }, 
            React.createElement("div", { className: "font-bold text-white" }, data.label),
            React.createElement("div", { className: "text-[10px] text-gray-500" }, data.desc)
          )
        )
      )
    );
  }

  return React.createElement("div", { className: "h-screen bg-black flex flex-col" },
    React.createElement("div", { className: "flex-1 flex items-center justify-center text-gray-600 italic" }, "[ Trajet en bus vers la prison ]"),
    React.createElement("div", { className: "p-8 bg-gray-950 border-t-2 border-red-600" },
      step === "bus" ? React.createElement(React.Fragment, null,
        React.createElement("p", { className: "mb-6 text-white" }, "Un gardien te fixe méchamment dans le bus..."),
        React.createElement("div", { className: "flex gap-4" },
          React.createElement("button", { className: "px-4 py-2 bg-gray-800 text-xs font-bold", onClick: () => { updateStats("intelligence", 1); onComplete(); } }, "Baisser les yeux (+1 Intel)"),
          React.createElement("button", { className: "px-4 py-2 bg-red-600 text-xs font-black", onClick: () => setStep("fight") }, "Soutenir le regard")
        )
      ) : React.createElement(React.Fragment, null,
        React.createElement("p", { className: "mb-6 text-red-500 font-bold" }, "Le gardien lève sa matraque. Tu restes fixé dans ses yeux ?"),
        React.createElement("button", { className: "px-6 py-3 bg-red-600 font-black", onClick: handleConfrontation }, "NE PAS CILLER")
      )
    )
  );
}
