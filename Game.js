function Game() {
  // --- ÉTATS (STATS & RESSOURCES) ---
  const [gameState, setGameState] = React.useState("playing");
  const [currentRoom, setCurrentRoom] = React.useState("cell");
  const [inventory, setInventory] = React.useState(["brossette", "savon", "corde"]);
  const [messages, setMessages] = React.useState([{ text: "Bienvenue à Blackridge. Surveille tes arrières.", id: Date.now() }]);
  const [stats, setStats] = React.useState({ force: 10, resistance: 10, reputation: 0, moral: 10 });
  const [energy, setEnergy] = React.useState(100);
  const [time, setTime] = React.useState(480); // 08:00
  const [isDoped, setIsDoped] = React.useState(false);
  const [combatNpc, setCombatNpc] = React.useState(null);
  const [allies, setAllies] = React.useState([]);

  // --- SYSTÈME DE QUÊTES ---
  const [activeQuests, setActiveQuests] = React.useState({
    "escape_plan": { currentStep: 1, completed: false }
  });

  const QUEST_DATA = {
    "escape_plan": {
      title: "PROJET ÉVASION",
      steps: [
        { id: 1, text: "Gagner du respect (Reputation > 20)", check: (s) => s.reputation >= 20 },
        { id: 2, text: "Fabriquer un Shivan pour se protéger", check: (s, inv) => inv.includes("shivan") },
        { id: 3, text: "S'entraîner dur (Force > 50)", check: (s) => s.force >= 50 },
        { id: 4, text: "Prêt pour le grand saut", check: () => false } // Étape finale
      ]
    }
  };

  // --- LOGIQUE INTERNE ---
  const addMessage = (text) => setMessages(prev => [{ text, id: Date.now() }, ...prev].slice(0, 50));
  const formatTime = (t) => `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`;

  const advanceTime = (mins, leadsTo = currentRoom) => {
    const nextTime = time + mins;
    if (nextTime >= 1320) { // 22h00
      if (leadsTo === "cell") {
        addMessage("⌛ 22h00 : Pile à l'heure pour le couvre-feu.");
        handleSleep();
      } else {
        addMessage("🚨 COUVRE-FEU ! Les gardes t'envoient à l'isolement !");
        setStats(s => ({ ...s, moral: Math.max(0, s.moral - 2), reputation: Math.max(0, s.reputation - 2) }));
        setCurrentRoom("cell");
        handleSleep();
      }
    } else {
      setTime(nextTime);
    }
  };

  // --- ACTIONS SPÉCIALES ---
  const handleSleep = () => {
    // Risque d'embuscade si trop réputé
    if (stats.reputation > 60 && Math.random() < 0.3) {
      addMessage("⚠️ RÉVEIL BRUTAL ! On essaie de te suriner dans ton sommeil !");
      setCombatNpc({ name: "Tueur à gages", force: 30, gang: "ariens" });
      return;
    }

    let recovery = stats.reputation >= 70 ? 100 : (stats.reputation >= 30 ? 75 : 50);
    const lost = Math.random() < 0.5 ? "force" : "resistance";
    
    setEnergy(e => Math.min(100, e + recovery));
    setStats(s => ({ ...s, [lost]: Math.max(0, s[lost] - 1) }));
    setTime(480);
    setIsDoped(false);
    addMessage(`🌞 Matin. Énergie +${recovery}%. Atrophie : -1 ${lost}.`);
  };

  const handleTrain = (stat, eCost, tCost) => {
    if (energy < eCost) return addMessage("❌ Trop épuisé...");
    let gain = (isDoped ? 6 : 3) + (Math.random() < 0.2 ? 1 : 0);
    setStats(s => ({ ...s, [stat]: Math.min(100, s[stat] + gain) }));
    setEnergy(e => e - eCost);
    advanceTime(tCost);
    addMessage(`💪 Entraînement : +${gain} en ${stat}.`);
  };

  const handleShower = () => {
    const hasSoap = inventory.includes("savon_corde");
    let risk = stats.reputation >= 50 ? 0 : (hasSoap ? 10 : 40);
    if (Math.random() * 100 < risk) {
      addMessage("⚠️ Savonnette perdue ! On t'agresse !");
      setCombatNpc({ name: "Brute des douches", force: 20, gang: "latinos" });
    } else {
      setEnergy(e => Math.min(100, e + 20));
      addMessage("🚿 Douche rafraîchissante (+20 Énergie).");
    }
    advanceTime(30);
  };

  const resolveCombat = () => {
    const hasShivan = inventory.includes("shivan");
    let power = (hasShivan ? stats.force * 2 : stats.force) + stats.resistance + (allies.length * 10);
    let enemyPower = combatNpc.force + (Math.random() * 20);

    if (power > enemyPower) {
      let repGain = Math.ceil(combatNpc.force / 5) + 3;
      setStats(s => ({ ...s, reputation: Math.min(100, s.reputation + repGain) }));
      addMessage(`🏆 VICTOIRE contre ${combatNpc.name} ! +${repGain} Rep.`);
    } else {
      setStats(s => ({ ...s, reputation: Math.max(0, s.reputation - 5), moral: Math.max(0, s.moral - 2) }));
      setCurrentRoom("cell");
      advanceTime(120);
      addMessage(`🤕 DÉFAITE. Tu te réveilles avec un mal de crâne...`);
    }
    setCombatNpc(null);
  };

  // --- GESTION DES CLICS ---
  const handleHotspotClick = (action) => {
    switch(action.type) {
      case "move": setCurrentRoom(action.leads_to); advanceTime(15, action.leads_to); break;
      case "train": handleTrain(action.stat, action.energy, action.time); break;
      case "sleep": handleSleep(); break;
      case "shower_risk": handleShower(); break;
      case "craft": 
        if(inventory.includes(action.from)) {
          setInventory(prev => [...prev.filter(i=>i!==action.from), action.to]);
          addMessage(`🔪 Craft réussi : ${action.to}`);
        } break;
      case "craft_complex":
        if(action.materials.every(m => inventory.includes(m))) {
          setInventory(prev => [...prev.filter(i=> !action.materials.includes(i)), action.result]);
          addMessage(`🛠️ Craft complexe réussi : ${action.result}`);
        } break;
    }
  };

  // --- MISE À JOUR QUÊTES ---
  React.useEffect(() => {
    const quest = activeQuests["escape_plan"];
    const stepData = QUEST_DATA["escape_plan"].steps.find(s => s.id === quest.currentStep);
    if (stepData && stepData.check(stats, inventory)) {
      setActiveQuests(prev => ({
        ...prev,
        "escape_plan": { ...prev["escape_plan"], currentStep: prev["escape_plan"].currentStep + 1 }
      }));
      addMessage(`🎯 OBJECTIF ATTEINT : ${stepData.text}`);
    }
  }, [stats, inventory]);

  // --- RENDU UI ---
  return React.createElement("div", { className: "p-4 max-w-5xl mx-auto space-y-4 font-sans select-none" },
    
    // MODAL COMBAT
    combatNpc && React.createElement("div", { className: "combat-overlay fixed inset-0 z-50 flex items-center justify-center p-4" },
      React.createElement("div", { className: "combat-box p-8 text-center" },
        React.createElement("h2", { className: "text-5xl font-black text-red-600 mb-2" }, "COMBAT"),
        React.createElement("p", { className: "text-xl text-white mb-6" }, `Cible : ${combatNpc.name}`),
        React.createElement("button", { onClick: resolveCombat, className: "bg-red-600 hover:bg-red-700 text-white px-10 py-4 text-2xl font-bold rounded" }, "FRAPPER")
      )
    ),

    // HUD (Barres de stats)
    React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-900 p-4 rounded-xl border border-blue-900 shadow-2xl" },
      React.createElement("div", null, 
        React.createElement("p", { className: "text-[10px] text-green-400 font-bold mb-1" }, "ÉNERGIE"),
        React.createElement("div", { className: "progress-bar-bg h-2 rounded overflow-hidden" }, 
          React.createElement("div", { className: "energy-fill h-full transition-all duration-500", style: { width: `${energy}%` } })
        )
      ),
      React.createElement("div", null, 
        React.createElement("p", { className: "text-[10px] text-yellow-500 font-bold mb-1" }, "RÉPUTATION"),
        React.createElement("div", { className: "progress-bar-bg h-2 rounded overflow-hidden" }, 
          React.createElement("div", { className: "reputation-fill h-full transition-all duration-500", style: { width: `${stats.reputation}%` } })
        )
      ),
      React.createElement("div", null,
        React.createElement("p", { className: "text-[10px] text-red-500 font-bold" }, "CONDITION"),
        React.createElement("p", { className: "text-xs font-mono text-white" }, `F:${stats.force} R:${stats.resistance} M:${stats.moral}`)
      ),
      React.createElement("div", { className: "text-right" },
        React.createElement("p", { className: "text-[10px] text-blue-400 font-bold" }, "HEURE"),
        React.createElement("p", { className: "text-2xl font-black text-white" }, formatTime(time))
      )
    ),

    // VUE DU JEU
    React.createElement(RoomView, { 
      roomId: currentRoom, 
      npcs: (WORLD_DATA.npcs[currentRoom] || []), 
      hotspots: (WORLD_DATA.rooms[currentRoom].hotspots || []), 
      onHotspotClick: handleHotspotClick,
      onNpcClick: (npc) => {
        if(npc.trade && confirm(`Échanger avec ${npc.name} ?`)) {
            // Logique de troc simplifiée
            addMessage(`Troc avec ${npc.name} effectué.`);
        } else if(confirm(`Défier ${npc.name} ?`)) setCombatNpc(npc);
      }
    }),

    // BAS DE PAGE (Journal, Quêtes, Inventaire)
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
      // Journal
      React.createElement("div", { className: "bg-black/60 p-4 h-48 rounded overflow-y-auto border border-white/5" },
        React.createElement("h3", { className: "text-[10px] text-gray-500 uppercase mb-2" }, "Journal de bord"),
        messages.map(m => React.createElement("div", { key: m.id, className: "journal-entry text-xs text-gray-400" }, `> ${m.text}`))
      ),
      // Quêtes
      React.createElement("div", { className: "bg-gray-900/50 p-4 h-48 rounded border border-yellow-900/20" },
        React.createElement("h3", { className: "text-[10px] text-yellow-600 uppercase mb-2" }, "Objectifs"),
        React.createElement("p", { className: "text-sm font-bold text-white" }, QUEST_DATA.escape_plan.title),
        React.createElement("p", { className: "text-[11px] text-gray-400 mt-1" }, 
          "📍 " + (QUEST_DATA.escape_plan.steps.find(s => s.id === activeQuests.escape_plan.currentStep)?.text || "Libre !")
        )
      ),
      // Inventaire
      React.createElement("div", { className: "bg-gray-900/50 p-4 h-48 rounded border border-white/5" },
        React.createElement("h3", { className: "text-[10px] text-gray-500 uppercase mb-2" }, "Poches"),
        React.createElement("div", { className: "flex flex-wrap gap-2" },
          inventory.map((item, i) => React.createElement("button", {
            key: i,
            onClick: () => {
              if(item === "dopant") { setIsDoped(true); setInventory(prev => prev.filter((_,idx)=>idx!==i)); addMessage("🧪 EFFET : DOPAGE ACTIVÉ."); }
            },
            className: "px-2 py-1 bg-blue-900/20 border border-blue-500/30 text-[10px] rounded hover:action-btn"
          }, item))
        )
      )
    )
  );
}
