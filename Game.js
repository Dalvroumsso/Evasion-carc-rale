function Game() {
  const [gameState, setGameState] = React.useState("start");
  const [currentRoom, setCurrentRoom] = React.useState("cell");
  const [inventory, setInventory] = React.useState(["brossette", "savon", "corde"]);
  const [messages, setMessages] = React.useState([]);
  const [stats, setStats] = React.useState({ force: 10, resistance: 10, reputation: 0, moral: 10 });
  const [energy, setEnergy] = React.useState(100);
  const [time, setTime] = React.useState(480);
  const [isDoped, setIsDoped] = React.useState(false);
  const [combatNpc, setCombatNpc] = React.useState(null);
  const [allies, setAllies] = React.useState([]);

  const addMessage = (text) => setMessages(prev => [{ text, id: Date.now() }, ...prev].slice(0, 50));
  const formatTime = (t) => `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`;

  // --- ACTIONS ---
  const handleSleep = () => {
    // 1. Embuscade nocturne ?
    if (stats.reputation > 60 && Math.random() < 0.3) {
      addMessage("⚠️ RÉVEIL BRUTAL ! Un gang rival t'attaque pendant ton sommeil !");
      return initiateCombat({ name: "Assassin de nuit", force: 25, gang: "ariens" });
    }
    // 2. Récupération énergie
    let gain = stats.reputation >= 70 ? 100 : (stats.reputation >= 30 ? 75 : 50);
    setEnergy(e => Math.min(100, e + gain));
    // 3. Atrophie
    const lost = Math.random() < 0.5 ? "force" : "resistance";
    setStats(s => ({ ...s, [lost]: Math.max(0, s[lost] - 1) }));
    setTime(480); setIsDoped(false);
    addMessage(`🌞 Nouvelle journée. +${gain}% Énergie. -1 ${lost}.`);
  };

  const handleTrain = (stat, cost, t) => {
    if (energy < cost) return addMessage("❌ Trop fatigué !");
    let gain = (isDoped ? 6 : 3) + (Math.random() < 0.2 ? 1 : 0);
    setStats(s => ({ ...s, [stat]: Math.min(100, s[stat] + gain) }));
    setEnergy(e => e - cost);
    setTime(time + t);
    addMessage(`💪 ${stat.toUpperCase()} +${gain}.`);
  };

  const handleShower = () => {
    const hasSoap = inventory.includes("savon_corde");
    let risk = stats.reputation >= 50 ? 0 : (hasSoap ? 15 : 45);
    if (Math.random() * 100 < risk) {
      addMessage("⚠️ La savonnette a glissé...");
      initiateCombat({ name: "Brute des douches", force: 15, gang: "latinos" });
    } else {
      setEnergy(e => Math.min(100, e + 20));
      addMessage("🚿 Douche finie. (+20 Énergie)");
    }
    setTime(time + 30);
  };

  const resolveCombat = () => {
    let power = (inventory.includes("shivan") ? stats.force * 2 : stats.force) + stats.resistance + (allies.length * 10);
    if (power + Math.random() * 20 > combatNpc.force + 15) {
      let rep = Math.ceil(combatNpc.force / 5) + 2;
      setStats(s => ({ ...s, reputation: Math.min(100, s.reputation + rep) }));
      addMessage(`🏆 VICTOIRE contre ${combatNpc.name} ! +${rep} Rep.`);
    } else {
      setStats(s => ({ ...s, reputation: Math.max(0, s.reputation - 5) }));
      setCurrentRoom("cell"); setTime(time + 120);
      addMessage(`🤕 DÉFAITE. -5 Rép. Tu finis au lit.`);
    }
    setCombatNpc(null);
  };

  const initiateCombat = (npc) => setCombatNpc(npc);

  const handleHotspotClick = (action) => {
    // Événement Racket Aléatoire lors des déplacements
    if (action.type === "move" && Math.random() < 0.15 && stats.reputation < 30) {
        addMessage("✋ RACKET ! Des détenus bloquent le chemin...");
        // Logique de racket simplifiée ici
    }
    
    switch(action.type) {
      case "move": setCurrentRoom(action.leads_to); setTime(time + 15); break;
      case "train": handleTrain(action.stat, action.energy, action.time); break;
      case "sleep": handleSleep(); break;
      case "shower_risk": handleShower(); break;
      case "craft": 
        if(inventory.includes(action.from)) {
            setInventory(prev => [...prev.filter(i=>i!==action.from), action.to]);
            addMessage(`🔪 Crafté : ${action.to}`);
        } break;
      case "craft_complex":
        if(action.materials.every(m => inventory.includes(m))) {
            setInventory(prev => [...prev.filter(i=> !action.materials.includes(i)), action.result]);
            addMessage(`🛠️ Fabriqué : ${action.result}`);
        } break;
    }
  };

  // --- RENDU UI ---
  if (gameState === "start") return React.createElement(StartScreen, { onStart: () => setGameState("intro") });
  if (gameState === "intro") return React.createElement(IntroScene, { 
    onComplete: () => { setGameState("playing"); },
    updateStats: (s, v) => setStats(prev => ({ ...prev, [s]: prev[s] + v }))
  });

  return React.createElement("div", { className: "p-4 max-w-5xl mx-auto space-y-4" },
    combatNpc && React.createElement("div", { className: "fixed inset-0 bg-red-900/90 z-50 flex flex-col items-center justify-center p-8 text-white" },
        React.createElement("h2", { className: "text-6xl font-black mb-4" }, "BASTON !"),
        React.createElement("p", { className: "text-2xl mb-8" }, `VS ${combatNpc.name} (${combatNpc.force} Force)`),
        React.createElement("button", { onClick: resolveCombat, className: "bg-white text-red-900 px-12 py-4 text-3xl font-bold rounded-full" }, "FRAPPER !")
    ),
    React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-900 p-4 rounded-xl border border-blue-900 shadow-2xl" },
        React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-blue-400" }, "TEMPS"), React.createElement("p", { className: "text-2xl font-black" }, formatTime(time))),
        React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-green-400" }, "ÉNERGIE"), React.createElement("div", { className: "h-2 bg-gray-800 rounded mt-1" }, React.createElement("div", { className: "h-full bg-green-500 rounded", style: {width: `${energy}%`} }))),
        React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-yellow-500" }, "RÉPUTATION"), React.createElement("p", { className: "font-bold" }, `${stats.reputation}/100`)),
        React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-red-500" }, "STATS"), React.createElement("p", { className: "text-xs" }, `F: ${stats.force} | R: ${stats.resistance}`))
    ),
    React.createElement(RoomView, { 
        roomId: currentRoom, 
        npcs: WORLD_DATA.npcs[currentRoom] || [], 
        hotspots: WORLD_DATA.rooms[currentRoom].hotspots, 
        onHotspotClick: handleHotspotClick,
        onNpcClick: (npc) => {
            if(confirm(`Engager le combat avec ${npc.name} ?`)) initiateCombat(npc);
            else if(stats.reputation >= 50 && confirm(`Recruter ${npc.name} ?`)) setAllies([...allies, npc]);
        }
    }),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 h-48" },
        React.createElement("div", { className: "bg-black/80 p-4 rounded overflow-y-auto border border-white/10 text-xs font-mono text-gray-400" }, messages.map(m => React.createElement("p", { key: m.id }, `> ${m.text}`))),
        React.createElement("div", { className: "bg-gray-900/80 p-4 rounded border border-white/10" },
            React.createElement("p", { className: "text-[10px] mb-2" }, "INVENTAIRE"),
            React.createElement("div", { className: "flex flex-wrap gap-2" }, inventory.map((item, i) => React.createElement("button", { key: i, onClick: () => {
                if(item === "dopant") { setIsDoped(true); setInventory(prev => prev.filter((_,idx) => idx !== i)); addMessage("🧪 DOPÉ !"); }
            }, className: "px-2 py-1 bg-blue-900/30 border border-blue-500/50 rounded text-[10px]" }, item)))
        )
    )
  );
}
