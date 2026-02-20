function Game({ startingBonus }) {
  const [currentRoom, setCurrentRoom] = React.useState("entrance");
  const [inventory, setInventory] = React.useState(["brossette", "savon"]);
  const [messages, setMessages] = React.useState([{ text: "Bienvenue à Blackridge.", id: Date.now() }]);
  const [isShakedown, setIsShakedown] = React.useState(false);
  
  const [combatNpc, setCombatNpc] = React.useState(null);
  const [tradeNpc, setTradeNpc] = React.useState(null);
  
  const [stats, setStats] = React.useState({ 
    force: startingBonus.force || 0, 
    reputation: startingBonus.reputation || 0,
    intelligence: startingBonus.intelligence || 0,
    resistance: startingBonus.resistance || 0,
    agilite: startingBonus.agilite || 0,
    moral: startingBonus.moral || 50
  });
  
  const [energy, setEnergy] = React.useState(100);
  const [time, setTime] = React.useState(480); 

  const addMessage = (text) => setMessages(prev => [{ text, id: Date.now() }, ...prev].slice(0, 30));

  const formatTime = (t) => {
    const h = Math.floor((t % 1440) / 60);
    const m = t % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // --- LOGIQUE DE TROC (À insérer ici) ---
  const buyItem = (itemId) => {
    const item = ITEMS_DB[itemId];
    const cost = Math.ceil(item.value / 5);
    const playerCigs = inventory.filter(id => id === "cigarettes").length;

    if (playerCigs >= cost) {
      setInventory(prev => {
        let count = 0;
        const filtered = prev.filter(id => {
          if (id === "cigarettes" && count < cost) { count++; return false; }
          return true;
        });
        return [...filtered, itemId];
      });
      addMessage(`🛒 Acheté : ${item.name} (-${cost} 🚬)`);
    } else {
      addMessage("⚠️ Pas assez de cigarettes !");
    }
  };

  const sellItem = (itemId) => {
    const item = ITEMS_DB[itemId];
    const gain = Math.floor((item?.value || 0) / 10);
    setInventory(prev => {
      const newInv = [...prev];
      const realIndex = newInv.indexOf(itemId);
      if (realIndex > -1) {
        newInv.splice(realIndex, 1);
        return [...newInv, ...Array(gain).fill("cigarettes")];
      }
      return prev;
    });
    if (gain > 0) addMessage(`💰 Vendu ${item.name} pour ${gain} 🚬`);
  };

  // --- ACTIONS & EVENTS ---
  const triggerShakedown = () => {
    setIsShakedown(true);
    addMessage("🚨 FOUILLE ! Les gardes vident vos poches !");
    setTimeout(() => {
      setInventory(prev => {
        const illegal = prev.filter(id => ITEMS_DB[id]?.illegal);
        if (illegal.length > 0) addMessage(`🚫 Confisqué : ${illegal.map(id => ITEMS_DB[id].name).join(", ")}`);
        return prev.filter(id => !ITEMS_DB[id]?.illegal);
      });
      setIsShakedown(false);
    }, 2000);
  };

  const useItem = (id, index) => {
    if (id === "livre_adulte") {
      setStats(s => ({ ...s, moral: Math.min(100, s.moral + 30) }));
      addMessage("📖 Lecture discrète... Le moral remonte !");
    } else if (id === "cigarettes") {
      setStats(s => ({ ...s, moral: Math.min(100, s.moral + 10), reputation: s.reputation + 2 }));
      addMessage("🚬 Pause cigarette. +10 Moral, +2 Reput.");
    } else return;
    setInventory(prev => prev.filter((_, i) => i !== index));
  };

  const handleAction = (action) => {
    if (isShakedown) return;
    const now = time % 1440;
    const isNight = (now > 1320 || now < 360);

    if (action.type === "move") {
      if (isNight && !["cell", "solitary"].includes(action.leads_to)) {
        const detectionRisk = 0.80 - (stats.agilite * 0.03); 
        if (Math.random() < detectionRisk) {
          addMessage("🚨 PATROUILLE ! Direction le trou !");
          setStats(s => ({ ...s, reputation: Math.max(0, s.reputation - 5) }));
          setTime(t => t + 600);
          setCurrentRoom("solitary");
          return;
        }
      }
      if (!isNight && Math.random() < 0.10) triggerShakedown();
      setCurrentRoom(action.leads_to);
      setTime(t => t + 10);
    }

    if (action.type === "eat_event") {
      const sched = WORLD_DATA.schedule;
      const isOpen = (now >= sched.canteen.start && now <= sched.canteen.end) || 
                     (now >= sched.canteen_evening.start && now <= sched.canteen_evening.end);
      if (!isOpen) return addMessage("🚫 La cantine est fermée.");
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
        setTime(t => t + (action.time || 45));
        addMessage(`👊 Entraînement : +3 ${action.stat}`);
      } else addMessage("⚠️ Trop fatigué...");
    }

    if (action.type === "visiting_event") {
      setTime(t => t + 60);
      if (stats.reputation >= 40) {
        const gift = Math.random() > 0.5 ? "cigarettes" : "livre_adulte";
        setInventory(prev => [...prev, gift]);
        addMessage(`🎁 Un proche a glissé un objet : ${ITEMS_DB[gift].name}`);
      } else {
        setStats(s => ({ ...s, moral: Math.min(100, s.moral + 10) }));
        addMessage("👋 Une visite qui fait du bien au moral.");
      }
    }

    if (action.type === "sleep") {
      setTime(480); 
      setEnergy(100);
      addMessage("🌞 Une nouvelle journée commence.");
    }

    if (action.type === "wait_punishment") {
      setCurrentRoom("cell");
      setTime(t => t + 60);
      addMessage("Fin de peine. Retour en cellule.");
    }
  };

  const handleNpcClick = (npc) => {
    if (npc.type === "fight") setCombatNpc(npc);
    if (npc.type === "trade") setTradeNpc(npc);
  };

  return React.createElement("div", { className: `min-h-screen p-4 max-w-5xl mx-auto space-y-4 ${isShakedown ? 'shakedown-active' : ''}` },
    
    // MODALES
    combatNpc && React.createElement(CombatModal, { 
      npc: combatNpc, stats, inventory,
      onWin: () => {
        setStats(s => ({ ...s, reputation: s.reputation + 15 }));
        addMessage(`🏆 Victoire contre ${combatNpc.name} !`);
        setCombatNpc(null);
      },
      onLose: () => {
        setEnergy(20);
        addMessage("🤕 Tu t'es fait étaler... Direction l'infirmerie.");
        setCurrentRoom("infirmary");
        setCombatNpc(null);
      }
    }),

    tradeNpc && React.createElement(TradeModal, { 
      npc: tradeNpc, 
      inventory, 
      onBuy: buyItem, 
      onSell: sellItem, 
      onClose: () => setTradeNpc(null) 
    }),

    // HUD (8 colonnes pour inclure le MORAL)
    React.createElement("div", { className: "grid grid-cols-4 md:grid-cols-8 gap-2 bg-gray-900 p-4 rounded-xl border border-blue-900 shadow-xl text-white" },
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-green-400 font-bold" }, "⚡ ÉNERGIE"), React.createElement("p", { className: "text-xl font-black" }, energy + "%")),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-yellow-500 font-bold" }, "🔥 REPUTATION"), React.createElement("p", { className: "text-xl font-black" }, stats.reputation)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-red-500 font-bold" }, "💪 FORCE"), React.createElement("p", { className: "text-xl font-black" }, stats.force)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-pink-500 font-bold" }, "❤️ MORAL"), React.createElement("p", { className: "text-xl font-black" }, stats.moral)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-purple-400 font-bold" }, "🏃 AGILITÉ"), React.createElement("p", { className: "text-xl font-black" }, stats.agilite)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-orange-400 font-bold" }, "🛡️ RESISTANCE"), React.createElement("p", { className: "text-xl font-black" }, stats.resistance)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-blue-400 font-bold" }, "🧠 INTELLIGENCE"), React.createElement("p", { className: "text-xl font-black" }, stats.intelligence)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-blue-300 font-bold" }, "🕒 HEURE"), React.createElement("p", { className: "text-xl font-black" }, formatTime(time))),
      React.createElement("div", { className: "text-right" }, React.createElement("p", { className: "text-[10px] text-blue-500 font-bold" }, "ZONE"), React.createElement("p", { className: "text-[10px] font-bold uppercase truncate" }, WORLD_DATA.rooms[currentRoom].name))
    ),

    React.createElement(RoomView, { 
      roomId: currentRoom, 
      npcs: WORLD_DATA.npcs[currentRoom] || [], 
      hotspots: WORLD_DATA.rooms[currentRoom].hotspots,
      onHotspotClick: handleAction,
      onNpcClick: handleNpcClick
    }),

    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 h-44" },
      React.createElement("div", { className: "bg-black/60 p-4 rounded-xl overflow-y-auto border border-white/5 text-[11px] font-mono text-gray-400" },
        messages.map(m => React.createElement("div", { key: m.id, className: "mb-1 border-l-2 border-blue-900 pl-2" }, `> ${m.text}`))
      ),
      React.createElement("div", { className: "bg-gray-900/50 p-4 rounded-xl border border-white/5 text-white" },
        React.createElement("h3", { className: "text-[10px] text-gray-500 uppercase font-black mb-3 tracking-widest" }, "Poches (Cliquer pour utiliser)"),
        React.createElement("div", { className: "flex flex-wrap gap-2" },
          inventory.map((id, i) => React.createElement("div", { 
            key: i, onClick: () => useItem(id, i),
            className: `item-slot ${ITEMS_DB[id]?.illegal ? 'item-illegal' : ''} group cursor-pointer` 
          }, 
            ITEMS_DB[id]?.icon || "❓",
            React.createElement("span", { className: "item-tooltip" }, ITEMS_DB[id]?.name || id)
          ))
        )
      )
    )
  );
}
