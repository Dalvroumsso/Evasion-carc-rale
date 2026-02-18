function Game({ startingBonus }) {
  // --- ÉTATS ---
  const [currentRoom, setCurrentRoom] = React.useState("cell");
  const [inventory, setInventory] = React.useState(["brossette", "savon", "corde"]);
  const [messages, setMessages] = React.useState([{ text: "Premier jour à Blackridge. Reste discret.", id: Date.now() }]);
  
  // Stats incluant Intelligence et Charisme de l'intro
  const [stats, setStats] = React.useState({ 
    force: 10 + (startingBonus?.force || 0), 
    resistance: 10 + (startingBonus?.resistance || 0), 
    reputation: 0 + (startingBonus?.reputation || 0),
    intelligence: 0 + (startingBonus?.intelligence || 0),
    charisme: 0 + (startingBonus?.charisme || 0),
    moral: 10 
  });
  
  const [energy, setEnergy] = React.useState(100);
  const [time, setTime] = React.useState(480);
  const [combatNpc, setCombatNpc] = React.useState(null);

  // --- QUÊTES ---
  const [activeQuests, setActiveQuests] = React.useState({ "escape_plan": { currentStep: 1 } });
  const QUEST_DATA = {
    "escape_plan": {
      title: "PROJET ÉVASION",
      steps: [
        { id: 1, text: "Gagner du respect (Reputation > 20)", check: (s) => s.reputation >= 20 },
        { id: 2, text: "Avoir un Shivan", check: (s, inv) => inv.includes("shivan") },
        { id: 3, text: "Force brute (Force > 50)", check: (s) => s.force >= 50 },
        { id: 4, text: "Prêt pour la sortie", check: () => false }
      ]
    }
  };

  // --- LOGIQUE ---
  const addMessage = (text) => setMessages(prev => [{ text, id: Date.now() }, ...prev].slice(0, 50));
  const formatTime = (t) => `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`;

  const advanceTime = (mins, leadsTo = currentRoom) => {
    const nextTime = time + mins;
    if (nextTime >= 1320) { // 22h00
      addMessage("🚨 COUVRE-FEU !");
      setCurrentRoom("cell");
      handleSleep();
    } else {
      setTime(nextTime);
      setCurrentRoom(leadsTo);
    }
  };

  const handleSleep = () => {
    setEnergy(100);
    setTime(480);
    addMessage("🌞 Une nouvelle journée commence.");
  };

  const handleTrain = (stat, eCost, tCost) => {
    if (energy < eCost) return addMessage("❌ Trop fatigué.");
    setStats(s => ({ ...s, [stat]: s[stat] + 5 }));
    setEnergy(e => e - eCost);
    advanceTime(tCost);
  };

  const resolveCombat = () => {
    if (stats.force > combatNpc.force) {
      setStats(s => ({ ...s, reputation: s.reputation + 10 }));
      addMessage("🏆 Tu l'as étalé !");
    } else {
      setStats(s => ({ ...s, moral: s.moral - 2 }));
      addMessage("🤕 Tu as pris cher...");
      setCurrentRoom("cell");
    }
    setCombatNpc(null);
  };

  const handleAction = (action) => {
    if (action.type === "move") advanceTime(10, action.leads_to);
    if (action.type === "train") handleTrain(action.stat, action.energy, action.time);
    if (action.type === "sleep") handleSleep();
    if (action.type === "shower_risk") {
        if (Math.random() < 0.3) setCombatNpc({name: "Agresseur", force: 20});
        else { setEnergy(e => Math.min(100, e + 20)); addMessage("🚿 Douche propre."); }
        advanceTime(30);
    }
    if (action.type === "craft") {
        if (inventory.includes(action.from)) {
            setInventory(prev => [...prev.filter(i => i !== action.from), action.to]);
            addMessage("🔪 Shivan fabriqué !");
        }
    }
  };
// Dans ta fonction Game(), ajoute/modifie la logique handleAction :

const handleAction = (action) => {
  if (action.type === "move") {
    if (Math.random() < 0.05) triggerShakedown();
    setCurrentRoom(action.leads_to);
    setTime(t => t + 10);
  }

  // --- LOGIQUE DU PARLOIR ---
  if (action.type === "visiting_event") {
    setTime(t => t + 60); // Un parloir dure 1h
    
    if (stats.reputation >= 40) {
      // Si réputation haute, on reçoit de la contrebande
      const possibleGifts = ["cigarettes", "livre_adulte", "dopant"];
      const gift = possibleGifts[Math.floor(Math.random() * possibleGifts.length)];
      setInventory(prev => [...prev, gift]);
      addMessage(`🎁 Un proche t'a glissé discrètement : ${ITEMS_DB[gift].name}`);
      setStats(s => ({ ...s, moral: s.moral + 10 }));
    } else {
      addMessage("👋 Ton parloir s'est bien passé, mais personne n'a pris de risque pour toi.");
      setStats(s => ({ ...s, moral: s.moral + 5 }));
    }
  }

  // ... (Garde les autres actions : sleep, train, etc.)
};

// --- AJOUT : Utilisation des objets depuis l'inventaire ---
const useItem = (itemId, index) => {
    if (itemId === "livre_adulte") {
        setStats(s => ({ ...s, moral: Math.min(100, s.moral + 30) }));
        setInventory(prev => prev.filter((_, i) => i !== index));
        addMessage("📖 Tu lis en cachette... Ton moral remonte en flèche !");
    }
    if (itemId === "cigarettes") {
        setStats(s => ({ ...s, moral: s.moral + 10, reputation: s.reputation + 2 }));
        setInventory(prev => prev.filter((_, i) => i !== index));
        addMessage("🚬 Une petite pause cigarette. Tu te sens plus zen.");
    }
    // ... autres objets
};

// Dans ton InventoryUI, modifie le clic :
const InventoryUI = () => React.createElement("div", { className: "flex flex-wrap gap-2" },
  inventory.map((itemId, i) => {
    const item = ITEMS_DB[itemId] || { name: itemId, icon: "❓", illegal: false };
    return React.createElement("div", { 
      key: i, 
      className: `item-icon ${item.illegal ? 'item-illegal' : ''} cursor-pointer group`,
      onClick: () => useItem(itemId, i) // Permet d'utiliser l'objet
    },
      item.icon,
      React.createElement("span", { className: "item-tooltip" }, `${item.name} (Cliquer pour utiliser)`)
    );
  })
);

  
  // --- RENDU ---
  return React.createElement("div", { className: "p-4 max-w-5xl mx-auto space-y-4 font-sans" },
    combatNpc && React.createElement("div", { className: "fixed inset-0 bg-black/90 z-50 flex items-center justify-center" },
      React.createElement("button", { onClick: resolveCombat, className: "bg-red-600 p-8 text-3xl font-black rounded" }, "FRAPPER !")
    ),

    // HUD
    React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-900 p-4 rounded-xl border border-blue-900" },
      React.createElement("div", null, 
        React.createElement("p", { className: "text-[10px] text-green-400 font-bold" }, "ÉNERGIE"),
        React.createElement("div", { className: "progress-bar-bg h-2 rounded overflow-hidden" }, 
          React.createElement("div", { className: "energy-fill h-full", style: { width: `${energy}%` } })
        )
      ),
      React.createElement("div", null, 
        React.createElement("p", { className: "text-[10px] text-yellow-500 font-bold" }, "REPUTATION"),
        React.createElement("div", { className: "progress-bar-bg h-2 rounded overflow-hidden" }, 
          React.createElement("div", { className: "reputation-fill h-full", style: { width: `${stats.reputation}%` } })
        )
      ),
      React.createElement("div", null, 
        React.createElement("p", { className: "text-[10px] text-red-500 font-bold" }, "PHYSIQUE"),
        React.createElement("p", { className: "text-white text-xs font-mono" }, `F:${stats.force} R:${stats.resistance}`)
      ),
      React.createElement("div", { className: "text-right" }, 
        React.createElement("p", { className: "text-[10px] text-blue-400 font-bold" }, "HEURE"),
        React.createElement("p", { className: "text-xl text-white font-black" }, formatTime(time))
      )
    ),

    // VUE DU JEU
    React.createElement(RoomView, { 
      roomId: currentRoom, 
      npcs: WORLD_DATA.npcs[currentRoom], 
      hotspots: WORLD_DATA.rooms[currentRoom].hotspots,
      onHotspotClick: handleAction,
      onNpcClick: (npc) => confirm(`Défier ${npc.name} ?`) && setCombatNpc(npc)
    }),

    // JOURNAL & QUETES
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 h-40" },
      React.createElement("div", { className: "bg-black/40 p-3 rounded border border-white/5 overflow-y-auto text-[11px] text-gray-400" },
        messages.map(m => React.createElement("div", { key: m.id }, `> ${m.text}`))
      ),
      React.createElement("div", { className: "bg-gray-900/40 p-3 rounded border border-yellow-900/20" },
        React.createElement("p", { className: "text-yellow-600 text-[10px] font-bold" }, "OBJECTIF ACTUEL"),
        React.createElement("p", { className: "text-white text-sm" }, QUEST_DATA.escape_plan.steps.find(s => s.id === activeQuests.escape_plan.currentStep)?.text)
      )
    )
  );
}

