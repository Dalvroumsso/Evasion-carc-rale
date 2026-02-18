function IntroScene({ onComplete, updateStats }) {
  const [currentStep, setCurrentStep] = React.useState("start");
  const data = INTRO_DATA[currentStep];

  const handleChoice = (choice) => {
    // Appliquer la récompense du choix s'il y en a une
    if (choice.reward) {
      updateStats(choice.reward.stat, choice.reward.points);
    }
    
    // Appliquer la récompense de l'étape (ex: les 5 points de réputation à la fin)
    if (data.reward && choice.target === "fin_intro") {
      updateStats(data.reward.stat, data.reward.points);
    }

    if (choice.target === "fin_intro" || !INTRO_DATA[choice.target]) {
      onComplete();
    } else {
      setCurrentStep(choice.target);
    }
  };

  return React.createElement("div", { className: "fixed inset-0 bg-black flex flex-col font-sans select-none" },
    // Zone Image
    React.createElement("div", { className: "relative flex-1 overflow-hidden" },
      React.createElement("img", { 
        src: data.background, 
        className: "w-full h-full object-cover opacity-50 transition-opacity duration-1000" 
      }),
      (data.characters || []).map(char => 
        React.createElement("img", {
          key: char.id,
          src: `images/npcs/${char.id}.png`,
          className: "absolute bottom-0 left-1/2 -translate-x-1/2 h-[80%] w-auto object-contain animate-in slide-in-from-bottom-10 duration-700",
          onError: (e) => { e.target.src = "https://via.placeholder.com/300x600?text=Gardien"; }
        })
      )
    ),
    // Zone Dialogue et Choix
    React.createElement("div", { className: "h-2/5 bg-gray-900 border-t-4 border-blue-900 p-6 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)]" },
      React.createElement("div", { className: "flex-1 overflow-y-auto mb-4 custom-scrollbar" },
        data.dialogues.map((d, i) => 
          React.createElement("p", { key: i, className: "text-lg md:text-xl text-gray-200 mb-3 leading-relaxed" },
            React.createElement("span", { className: "text-blue-400 font-bold italic" }, d.speaker + " : "),
            d.text
          )
        )
      ),
      React.createElement("div", { className: "flex flex-wrap gap-4 justify-center pb-4" },
        data.choices.length > 0 
          ? data.choices.map((choice, i) => 
              React.createElement("button", {
                key: i,
                onClick: () => handleChoice(choice),
                className: "px-6 py-3 bg-gray-800 border-2 border-gray-700 hover:border-blue-500 hover:bg-gray-700 text-white transition-all rounded-lg text-sm font-bold uppercase tracking-widest"
              }, choice.text)
            )
          : React.createElement("button", {
              onClick: onComplete,
              className: "px-8 py-4 bg-blue-700 hover:bg-blue-600 text-white font-black rounded-full shadow-lg shadow-blue-900/50 animate-bounce"
            }, "COMMENCER MA PEINE")
      )
    )
  );
}