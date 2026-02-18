function Game({ startingBonus }) {
  const [currentRoom, setCurrentRoom] = React.useState("entrance");
  const [inventory, setInventory] = React.useState(["brossette", "savon"]);
  const [messages, setMessages] = React.useState([{ text: "Bienvenue à Blackridge.", id: Date.now() }]);
  const [isShakedown, setIsShakedown] = React.useState(false);
  const [combatNpc, setCombatNpc] = React.useState(null);
  
  const [stats, setStats] = React.useState({ 
    force: startingBonus.force, 
    reputation: startingBonus.reputation,
    intelligence: startingBonus.intelligence,
    resistance: startingBonus.resistance,
    agilite: startingBonus.agilite || 5, // Ajout de l'agilité
    moral: startingBonus.moral
  });
  
  const [energy, setEnergy] = React.useState(100);
  const [time, setTime] = React.useState(480); // 08:00

  const formatTime = (t) => {
    const h = Math.floor((t % 1440) / 60);
    const m = t % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const addMessage = (text) => setMessages(prev => [{ text, id: Date.now() }, ...prev].slice(0, 30));

  const triggerShakedown = () => {
    setIsShakedown(true);
    addMessage("🚨 FOUILLE ! Les gardes vident vos poches !");
    setTimeout(() => {
      setInventory(prev => {
        const illegal = prev.filter(id => ITEMS_DB[id]?.illegal);
        if (illegal.length > 0) addMessage(`🚫 Confisqué : ${illegal.join(", ")}`);
        return prev.filter(id => !ITEMS_DB[id]?.illegal);
      });
      setIsShakedown(false);
    }, 2000);
  };

  const useItem = (id, index) => {
    if (id === "livre_adulte") {
      setStats(s => ({ ...s, moral: Math.min(100, s.moral + 30) }));
      setInventory(prev => prev.filter((_, i) => i !== index));
      addMessage("📖 Tu lis en cachette... Ton moral remonte en flèche !");
    }
    else if (id === "cigarettes") {
      setStats(s => ({ ...s, moral: Math.min(100, s.moral + 10), reputation: s.reputation + 2 }));
      setInventory(prev => prev.filter((_, i) => i !== index));
      addMessage("🚬 Une pause cigarette. +10 Moral, +2 Reput.");
    }
  };

  const handleAction = (action) => {
    if (isShakedown) return;
    const now = time % 1440;
    const isNight = (now > 1320 || now < 360); // 22h - 06h

    // --- LOGIQUE DE MOUVEMENT & INFILTRATION ---
    if (action.type === "move") {
        if (isNight && action.leads_to !== "cell" && action.leads_to !== "solitary") {
            const detectionRisk = 0.80 - (stats.agilite * 0.03); 
            if (Math.random() < detectionRisk) {
                addMessage("🚨 PATROUILLE ! Un gardien vous a repéré dans le noir !");
                setStats(s => ({ ...s, reputation: Math.max(0, s.reputation - 5), moral: s.moral - 10 }));
                setCurrentRoom("solitary");
                setTime(t => t + 600); // 10h de trou
                return;
            } else {
                addMessage("👣 Vous vous glissez dans les ombres... (Discrétion réussie)");
            }
        }

        if (!isNight && Math.random() < 0.10) triggerShakedown();

        setCurrentRoom(action.leads_to);
        setTime(t => t + 10);
        return;
    }

    // --- LOGIQUE CANTINE ---
    if (action.type === "eat_event") {
        const sched = WORLD_DATA.schedule;
        const openMidi = (now >= sched.canteen.start && now <= sched.canteen.end);
        const openSoir = (now >= sched.canteen_evening.start && now <= sched.canteen_evening.end);

        if (!openMidi && !openSoir) {
            addMessage("🚫 La cantine est vide. Il n'y a rien à manger à cette heure.");
            return;
        }

        setEnergy(Math.min(100, energy + 40));
        setStats(s => ({ ...s, moral: Math.min(100, s.moral + 5) }));
        setTime(t => t + 30);
        addMessage("🍴 Repas terminé. +40 Énergie.");
        setCurrentRoom("corridor");
    }

    if (action.type === "train") {
      if (energy >= action.energy) {
        setStats(s => ({ ...s, [action.stat]: s[action.stat] + 3 }));
        setEnergy(e => e - action.energy);
        setTime(t => t + action.time);
        addMessage(`Entraînement fini. +3 ${action.stat}`);
      } else addMessage("⚠️ Trop fatigué...");
    }

    if (action.type === "visiting_event") {
        setTime(t => t + 60);
        if (stats.reputation >= 40) {
            const gift = ["cigarettes", "livre_adulte"][Math.floor(Math.random()*2)];
            setInventory(prev => [...prev, gift]);
            addMessage(`🎁 Objet de contrebande reçu : ${ITEMS_DB[gift].name}`);
        } else {
            setStats(s => ({...s, moral: Math.min(100, s.moral + 10)}));
            addMessage("👋 Visite calme. Ton moral s'améliore.");
        }
    }

    if (action.type === "sleep") {
        setTime(480); // 08:00
        setEnergy(100);
        addMessage("🌞 Une nouvelle journée commence à Blackridge.");
    }

    if (action.type === "wait_punishment") {
        addMessage("Ta peine d'isolement est finie. Retour au bloc.");
        setCurrentRoom("cell");
        setTime(t => t + 60);
    }
  };

  return React.createElement("div", { className: `min-h-screen p-4 max-w-5xl mx-auto space-y-4 ${isShakedown ? 'shakedown-active' : ''}` },
    
    // HUD 6 COLONNES
    React.createElement("div", { className: "grid grid-cols-6 gap-2 bg-gray-900 p-4 rounded-xl border border-blue-900 shadow-xl" },
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-green-400 font-bold" }, "⚡ ÉNERGIE"), React.createElement("p", { className: "text-xl font-black" }, energy + "%")),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-yellow-500 font-bold" }, "🔥 REPUTATION"), React.createElement("p", { className: "text-xl font-black" }, stats.reputation)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-red-500 font-bold" }, "💪 FORCE"), React.createElement("p", { className: "text-xl font-black" }, stats.force)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-purple-400 font-bold" }, "🏃 AGILITÉ"), React.createElement("p", { className: "text-xl font-black" }, stats.agilite)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-blue-300 font-bold" }, "🕒 HEURE"), React.createElement("p", { className: "text-xl font-black text-white" }, formatTime(time))),
      React.createElement("div", { className: "text-right" }, React.createElement("p", { className: "text-[10px] text-blue-500 font-bold" }, "ZONE"), React.createElement("p", { className: "text-[10px] font-bold uppercase truncate" }, WORLD_DATA.rooms[currentRoom].name))
    ),

    // La Vue
    React.createElement(RoomView, { 
      roomId: currentRoom, 
      npcs: WORLD_DATA.npcs[currentRoom] || [], 
      hotspots: WORLD_DATA.rooms[currentRoom].hotspots,
      onHotspotClick: handleAction
    }),

    // Bas : Journal et Inventaire
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 h-44" },
      React.createElement("div", { className: "bg-black/60 p-4 rounded-xl overflow-y-auto border border-white/5 text-[11px] font-mono text-gray-400" },
        messages.map(m => React.createElement("div", { key: m.id, className: "mb-1 border-l-2 border-blue-900 pl-2" }, `> ${m.text}`))
      ),
      React.createElement("div", { className: "bg-gray-900/50 p-4 rounded-xl border border-white/5" },
        React.createElement("h3", { className: "text-[10px] text-gray-500 uppercase font-black mb-3 tracking-widest" }, "Poches (Cliquer pour utiliser)"),
        React.createElement("div", { className: "flex flex-wrap gap-2" },
          inventory.map((id, i) => React.createElement("div", { 
            key: i, 
            onClick: () => useItem(id, i),
            className: `item-slot ${ITEMS_DB[id]?.illegal ? 'item-illegal' : ''} group` 
          },
            ITEMS_DB[id]?.icon || "❓",
            React.createElement("span", { className: "item-tooltip" }, ITEMS_DB[id]?.name || id)
          ))
        )
      )
    )
  );
}
