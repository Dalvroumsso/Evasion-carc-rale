function Game() {
  const [gameState, setGameState] = React.useState("start");
  const [currentRoom, setCurrentRoom] = React.useState("entrance");
  const [inventory, setInventory] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  
  // Stats initiales à 0
  const [stats, setStats] = React.useState({
    force: 0,
    intelligence: 0,
    charisme: 0,
    reputation: 0
  });

  const updateStats = (statName, value) => {
    setStats(prev => ({ ...prev, [statName]: prev[statName] + value }));
  };

  const addMessage = (text) => {
    setMessages(prev => [{ text, id: Date.now() }, ...prev].slice(0, 50));
  };

  const handleHotspotClick = (action) => {
    switch (action.type) {
      case "move":
        setCurrentRoom(action.leads_to);
        addMessage(`Vous entrez dans : ${WORLD_DATA.rooms[action.leads_to].name}`);
        break;
      case "item":
        if (!inventory.includes(action.item)) {
          setInventory(prev => [...prev, action.item]);
          addMessage(`[OBJET] Vous avez ramassé : ${action.item}`);
        }
        break;
    }
  };

  const handleNpcClick = (npc) => {
    addMessage(`${npc.name} : "${npc.dialogue}"`);
  };

  if (gameState === "start") return React.createElement(StartScreen, { onStart: () => setGameState("intro") });
  
  if (gameState === "intro") return React.createElement(IntroScene, { 
    onComplete: () => {
      setGameState("playing");
      setCurrentRoom("cell"); // On se réveille en cellule après l'intro
      addMessage("Bienvenue dans votre cellule. C'est ici que tout commence.");
    },
    updateStats: updateStats 
  });

  const currentRoomData = WORLD_DATA.rooms[currentRoom] || {};
  const roomNpcs = WORLD_DATA.npcs[currentRoom] || [];

  return React.createElement("div", { className: "p-4 max-w-6xl mx-auto flex flex-col gap-6 font-sans" },
    // Vue principale
    React.createElement(RoomView, { 
      roomId: currentRoom, 
      npcs: roomNpcs, 
      hotspots: currentRoomData.hotspots, 
      onHotspotClick: handleHotspotClick,
      onNpcClick: handleNpcClick 
    }),

    // Interface du bas
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6" },
      // Stats Profil (Nouveau)
      React.createElement("div", { className: "bg-gray-900/80 p-4 rounded-xl border border-blue-900/30" },
        React.createElement("h3", { className: "text-blue-500 text-xs font-black mb-3 uppercase tracking-widest" }, "Profil Matricule"),
        React.createElement("div", { className: "space-y-2 text-sm" },
          React.createElement("div", { className: "flex justify-between" }, React.createElement("span", null, "💪 Force"), React.createElement("span", { className: "font-bold" }, stats.force)),
          React.createElement("div", { className: "flex justify-between" }, React.createElement("span", null, "🧠 Intel"), React.createElement("span", { className: "font-bold" }, stats.intelligence)),
          React.createElement("div", { className: "flex justify-between" }, React.createElement("span", null, "🗣️ Charisme"), React.createElement("span", { className: "font-bold" }, stats.charisme)),
          React.createElement("div", { className: "mt-4 pt-2 border-t border-gray-800 flex justify-between text-yellow-500" }, 
            React.createElement("span", null, "⭐ Réputation"), 
            React.createElement("span", { className: "font-black" }, stats.reputation)
          )
        )
      ),

      // Journal d'activité
      React.createElement("div", { className: "md:col-span-2 bg-black/40 p-4 rounded-xl border border-white/5 h-48 flex flex-col" },
        React.createElement("h3", { className: "text-gray-500 text-xs font-bold mb-2 uppercase" }, "Journal"),
        React.createElement("div", { className: "overflow-y-auto flex-1 space-y-2 custom-scrollbar text-sm text-gray-400" },
          messages.map(m => React.createElement("p", { key: m.id }, "> " + m.text))
        )
      ),

      // Inventaire
      React.createElement("div", { className: "bg-gray-900/80 p-4 rounded-xl border border-white/5 h-48" },
        React.createElement("h3", { className: "text-gray-500 text-xs font-bold mb-2 uppercase" }, "Inventaire"),
        React.createElement("div", { className: "flex flex-wrap gap-2" },
          inventory.map((item, i) => React.createElement("span", { key: i, className: "px-2 py-1 bg-blue-900/30 border border-blue-500/50 text-[10px] rounded uppercase font-bold" }, item))
        )
      )
    )
  );
}