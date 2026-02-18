function StartScreen({ onStart }) {
  return React.createElement("div", { 
    className: "h-screen bg-black flex flex-col items-center justify-center space-y-8 bg-gradient-to-b from-gray-900 to-black" 
  },
    React.createElement("div", { className: "text-center" },
      React.createElement("h1", { className: "text-6xl font-black text-white tracking-tighter italic border-b-4 border-red-600 mb-2" }, "BLACKRIDGE"),
      React.createElement("p", { className: "text-red-600 font-bold tracking-[0.3em] uppercase" }, "Prison Riot")
    ),
    
    React.createElement("div", { className: "flex flex-col gap-4 w-64" },
      React.createElement("button", { 
        onClick: onStart,
        className: "py-4 bg-white text-black font-black hover:bg-red-600 hover:text-white transition-all uppercase"
      }, "Nouvelle Partie"),
      
      React.createElement("button", { 
        className: "py-2 bg-gray-800 text-gray-500 cursor-not-allowed uppercase text-xs font-bold" 
      }, "Charger (Verrouillé)"),
      
      React.createElement("button", { 
        className: "py-2 bg-gray-800 text-gray-400 uppercase text-xs font-bold hover:bg-gray-700" 
      }, "Options")
    )
  );
}
