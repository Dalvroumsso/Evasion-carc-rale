function Game({ startingBonus, startRoom }) {
  const [currentRoom, setCurrentRoom] = React.useState(startRoom || "entrance");
  const [inventory, setInventory] = React.useState(["brossette", "savon"]);
  const [messages, setMessages] = React.useState([{ text: "Arrivée à l'accueil de Blackridge.", id: Date.now() }]);
  const [isShakedown, setIsShakedown] = React.useState(false);
  const [combatNpc, setCombatNpc] = React.useState(null);
  
  const [stats, setStats] = React.useState({ 
    force: 10 + (startingBonus?.force || 0), 
    reputation: 0 + (startingBonus?.reputation || 0),
    intelligence: 0 + (startingBonus?.intelligence || 0),
    moral: 50 
  });
  const [energy, setEnergy] = React.useState(100);
  const [time, setTime] = React.useState(480);

  const addMessage = (msg) => setMessages(prev => [{ text: msg, id: Date.now() }, ...prev].slice(0, 50));

  // --- FOUILLE SURPRISE ---
  const triggerShakedown = () => {
    setIsShakedown(true);
    addMessage("🚨 FOUILLE SURPRISE ! Les gardes vident vos poches !");
    setTimeout(() => {
      setInventory(prev => {
        const illegal = prev.filter(id => ITEMS_DB[id]?.illegal);
        if (illegal.length > 0) addMessage(`🚫 Confisqué : ${illegal.join(", ")}`);
        return prev.filter(id => !ITEMS_DB[id]?.illegal);
      });
      setIsShakedown(false);
    }, 2500);
  };

  // --- ACTIONS ---
  const handleAction = (action) => {
    if (isShakedown) return;

    switch (action.type) {
      case "move":
        if (Math.random() < 0.10) triggerShakedown(); // 10% chance
        setCurrentRoom(action.leads_to);
        setTime(t => t + 10);
        break;

      case "train":
        if (energy >= action.energy) {
          setStats(s => ({ ...s, [action.stat]: s[action.stat] + 3 }));
          setEnergy(e => Math.max(0, e - action.energy));
          setTime(t => t + action.time);
          addMessage(`Action effectuée : +3 ${action.stat}`);
        } else {
          addMessage("⚠️ Trop fatigué pour ça...");
        }
        break;

      case "visiting_event":
        setTime(t => t + 60);
        if (stats.reputation >= 40) {
          const gifts = ["cigarettes", "livre_adulte", "dopant"];
          const gift = gifts[Math.floor(Math.random() * gifts.length)];
          setInventory(prev => [...prev, gift]);
          addMessage(`🎁 Un proche vous a passé : ${ITEMS_DB[gift].name}`);
        } else {
          addMessage("👋 Visite terminée. Votre moral remonte un peu.");
          setStats(s => ({ ...s, moral: Math.min(100, s.moral + 10) }));
        }
        break;

      case "sleep":
        setEnergy(100);
        setTime(480);
        addMessage("🌞 Une nouvelle journée commence.");
        break;

      case "wait_punishment":
        addMessage("Fin de l'isolement. Retour au bloc.");
        setTime(t => t + 720); // 12h plus tard
        setCurrentRoom("cell");
        break;
    }
  };

  // --- COMBAT LOGIQUE ---
  const resolveCombat = () => {
    if (stats.force > combatNpc.force) {
      addMessage("🏆 Victoire ! Vous gagnez du respect.");
      const newRep = stats.reputation + 10;
      setStats(s => ({ ...s, reputation: newRep }));
      
      // Risque d'isolement
      let risk = 0.66;
      if (newRep >= 25) risk = 0.50;
      if (newRep >= 50) risk = 0.25;
      if (newRep >= 75) risk = 0;

      if (Math.random() < risk) {
        addMessage("👮 Les gardes interviennent ! Direction le TROU.");
        setCurrentRoom("solitary");
      }
    } else {
      addMessage("🤕 Vous avez perdu... Réveil à l'infirmerie.");
      setEnergy(20);
      setCurrentRoom("infirmary");
    }
    setCombatNpc(null);
  };

  const useItem = (id, index) => {
    if (id === "livre_adulte") {
      setStats(s => ({ ...s, moral: Math.min(100, s.moral + 30) }));
      setInventory(prev => prev.filter((_, i) => i !== index));
      addMessage("📖 Vous lisez en cachette. Moral au top !");
    }
    if (id === "cigarettes") {
      setStats(s => ({ ...s, moral: Math.min(100, s.moral + 10), reputation: s.reputation + 2 }));
      setInventory(prev => prev.filter((_, i) => i !== index));
      addMessage("🚬 Une cigarette bien méritée.");
    }
  };

  return React.createElement("div", { className: `min-h-screen p-4 max-w-5xl mx-auto space-y-4 ${isShakedown ? 'shakedown-active' : ''}` },
    // Combat Modal
    combatNpc && React.createElement("div", { className: "fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4" },
      React.createElement("h2", { className: "text-red-600 text-6xl font-black mb-12 animate-pulse" }, "BASTON"),
      React.createElement("div", { className: "bg-white/10 p-8 rounded-xl text-center mb-8 border border-red-500" },
        React.createElement("p", { className: "text-xl" }, `Cible : ${combatNpc.name}`),
        React.createElement("p", { className: "text-red-500 font-bold" }, `Force adverse : ${combatNpc.force}`)
      ),
      React.createElement("button", { onClick: resolveCombat, className: "bg-red-600 px-16 py-8 text-3xl font-bold rounded-full hover:bg-red-500 transition-transform active:scale-90 shadow-2xl" }, "FRAPPER !")
    ),

    // HUD
    React.createElement("div", { className: "grid grid-cols-4 gap-2 bg-gray-900/90 p-4 rounded-xl border border-blue-900 shadow-lg" },
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-green-400 font-bold" }, "⚡ ÉNERGIE"), React.createElement("p", { className: "text-xl font-black" }, energy + "%")),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-yellow-500 font-bold" }, "🔥 REPUTATION"), React.createElement("p", { className: "text-xl font-black" }, stats.reputation)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-red-500 font-bold" }, "💪 FORCE"), React.createElement("p", { className: "text-xl font-black" }, stats.force)),
      React.createElement("div", { className: "text-right" }, React.createElement("p", { className: "text-[10px] text-blue-400 font-bold" }, "ZONE"), React.createElement("p", { className: "text-xs font-bold uppercase truncate" }, WORLD_DATA.rooms[currentRoom].name))
    ),

    // Vue de la Salle
    React.createElement(RoomView, { 
      roomId: currentRoom, 
      npcs: WORLD_DATA.npcs[currentRoom] || [], 
      hotspots: WORLD_DATA.rooms[currentRoom].hotspots,
      onHotspotClick: handleAction,
      onNpcClick: (npc) => setCombatNpc(npc)
    }),

    // Bas de l'interface
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 h-48" },
      React.createElement("div", { className: "bg-black/60 p-4 rounded-xl overflow-y-auto border border-white/5 text-[11px] font-mono" },
        messages.map(m => React.createElement("div", { key: m.id, className: "mb-1 text-gray-400 border-l-2 border-blue-900 pl-2" }, `> ${m.text}`))
      ),
      React.createElement("div", { className: "bg-gray-900/50 p-4 rounded-xl border border-white/5" },
        React.createElement("h3", { className: "text-[10px] text-gray-500 uppercase font-black mb-3 tracking-widest" }, "Inventaire"),
        React.createElement("div", { className: "flex flex-wrap gap-3" },
          inventory.map((id, i) => {
            const item = ITEMS_DB[id] || { icon: "❓", name: id };
            return React.createElement("div", { 
              key: i, 
              onClick: () => useItem(id, i),
              className: `item-slot ${item.illegal ? 'item-illegal' : ''} group` 
            },
              item.icon,
              React.createElement("span", { className: "item-tooltip" }, `${item.name} (Cliquer pour utiliser)`)
            );
          })
        )
      )
    )
  );
}
