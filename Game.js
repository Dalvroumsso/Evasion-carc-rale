function Game({ startingBonus, startRoom }) {
  const [currentRoom, setCurrentRoom] = React.useState(startRoom || "entrance");
  const [inventory, setInventory] = React.useState(["brossette", "savon"]);
  const [messages, setMessages] = React.useState([{ text: "Début de l'incarcération.", id: Date.now() }]);
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

  const addMessage = (text) => setMessages(prev => [{ text, id: Date.now() }, ...prev].slice(0, 50));

  // --- ACTIONS ---
  const handleAction = (action) => {
    if (isShakedown) return;

    switch (action.type) {
      case "move":
        if (Math.random() < 0.10) { // 10% de chance de fouille
            triggerShakedown();
        }
        setCurrentRoom(action.leads_to);
        setTime(t => t + 10);
        break;

      case "train":
        if (energy >= action.energy) {
            setStats(s => ({ ...s, [action.stat]: s[action.stat] + 2 }));
            setEnergy(e => e - action.energy);
            setTime(t => t + action.time);
            addMessage(`Entraînement : +2 ${action.stat}`);
        } else {
            addMessage("Trop fatigué...");
        }
        break;

      case "visiting_event":
        setTime(t => t + 60);
        if (stats.reputation >= 40) {
            const gifts = ["cigarettes", "livre_adulte", "dopant"];
            const gift = gifts[Math.floor(Math.random() * gifts.length)];
            setInventory(prev => [...prev, gift]);
            addMessage(`🎁 Contrebande reçue : ${ITEMS_DB[gift].name}`);
        } else {
            addMessage("👋 Visite terminée. Moral +5");
            setStats(s => ({ ...s, moral: s.moral + 5 }));
        }
        break;

      case "wait_punishment":
        addMessage("Tu sors de l'isolement...");
        setTime(t => t + 480);
        setCurrentRoom("cell");
        break;

      case "sleep":
        setEnergy(100);
        setTime(480);
        addMessage("Une nouvelle journée commence.");
        break;
    }
  };

  // --- FOUILLE ---
  const triggerShakedown = () => {
    setIsShakedown(true);
    addMessage("🚨 FOUILLE SURPRISE !");
    setTimeout(() => {
      setInventory(prev => {
        const illegal = prev.filter(id => ITEMS_DB[id]?.illegal);
        if (illegal.length > 0) addMessage(`🚫 Confisqué : ${illegal.join(", ")}`);
        return prev.filter(id => !ITEMS_DB[id]?.illegal);
      });
      setIsShakedown(false);
    }, 2000);
  };

  // --- COMBAT ---
  const resolveCombat = () => {
    if (stats.force > combatNpc.force) {
      addMessage("🏆 Victoire !");
      const newRep = stats.reputation + 10;
      setStats(s => ({ ...s, reputation: newRep }));
      
      // Risque d'isolement
      let risk = 0;
      if (newRep < 25) risk = 0.66;
      else if (newRep < 50) risk = 0.50;
      else if (newRep < 75) risk = 0.25;

      if (Math.random() < risk) {
        addMessage("👮 Les gardes t'embarquent au Trou !");
        setCurrentRoom("solitary");
      }
    } else {
      addMessage("🤕 Tu as fini au tapis...");
      setEnergy(10);
      setCurrentRoom("infirmary");
    }
    setCombatNpc(null);
  };

  // --- INVENTAIRE ---
  const useItem = (id, index) => {
    const item = ITEMS_DB[id];
    if (!item) return;
    
    if (id === "livre_adulte") setStats(s => ({...s, moral: Math.min(100, s.moral + 30)}));
    if (id === "cigarettes") {
        setStats(s => ({...s, moral: Math.min(100, s.moral + 10), reputation: s.reputation + 2}));
    }
    
    setInventory(prev => prev.filter((_, i) => i !== index));
    addMessage(`Utilisé : ${item.name}`);
  };

  return React.createElement("div", { className: `p-4 max-w-5xl mx-auto space-y-4 ${isShakedown ? 'shakedown-active' : ''}` },
    // Overlay Combat
    combatNpc && React.createElement("div", { className: "fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center" },
      React.createElement("h2", { className: "text-red-600 text-6xl font-black mb-8" }, "COMBAT"),
      React.createElement("button", { onClick: resolveCombat, className: "bg-red-600 px-12 py-6 text-2xl font-bold rounded-full hover:scale-110 transition" }, "FRAPPER")
    ),

    // Interface
    React.createElement("div", { className: "grid grid-cols-4 gap-2 bg-gray-900 p-4 rounded-xl border border-blue-900" },
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-green-400" }, "⚡ ÉNERGIE"), React.createElement("p", { className: "text-xl" }, energy + "%")),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-yellow-500" }, "🔥 REPUTATION"), React.createElement("p", { className: "text-xl" }, stats.reputation)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-red-500" }, "💪 FORCE"), React.createElement("p", { className: "text-xl" }, stats.force)),
      React.createElement("div", { className: "text-right" }, React.createElement("p", { className: "text-[10px] text-blue-400" }, "LIEU"), React.createElement("p", { className: "text-sm" }, WORLD_DATA.rooms[currentRoom].name))
    ),

    React.createElement(RoomView, { 
      roomId: currentRoom, 
      npcs: WORLD_DATA.npcs[currentRoom] || [], 
      hotspots: WORLD_DATA.rooms[currentRoom].hotspots,
      onHotspotClick: handleAction,
      onNpcClick: (npc) => setCombatNpc(npc)
    }),

    React.createElement("div", { className: "grid grid-cols-2 gap-4 h-48" },
      React.createElement("div", { className: "bg-black/60 p-4 rounded overflow-y-auto text-[11px] text-gray-400" },
        messages.map(m => React.createElement("div", { key: m.id }, `> ${m.text}`))
      ),
      React.createElement("div", { className: "bg-gray-900/50 p-4 rounded border border-white/5" },
        React.createElement("h3", { className: "text-[10px] text-gray-500 uppercase mb-4" }, "Poches"),
        React.createElement("div", { className: "flex flex-wrap gap-2" },
          inventory.map((id, i) => {
            const item = ITEMS_DB[id] || { icon: "❓", name: id };
            return React.createElement("div", { 
              key: i, 
              onClick: () => useItem(id, i),
              className: `item-slot ${item.illegal ? 'item-illegal' : ''} group` 
            },
              item.icon,
              React.createElement("span", { className: "item-tooltip" }, item.name)
            );
          })
        )
      )
    )
  );
}
