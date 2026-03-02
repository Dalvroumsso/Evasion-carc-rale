function Game({ startingBonus }) {
  const [currentRoom, setCurrentRoom] = React.useState("entrance");
  const [inventory, setInventory] = React.useState(["brossette", "savon"]);
  const [messages, setMessages] = React.useState([{ text: "Bienvenue à Blackridge.", id: Date.now() }]);
  const [isShakedown, setIsShakedown] = React.useState(false);
  const [interactingNpc, setInteractingNpc] = React.useState(null);
  const [combatNpc, setCombatNpc] = React.useState(null);
  const [tradeNpc, setTradeNpc] = React.useState(null);
  const [relations, setRelations] = React.useState({});
  const [stats, setStats] = React.useState({ 
    force: startingBonus.force || 0, 
    reputation: startingBonus.reputation || 0,
    intelligence: startingBonus.intelligence || 0,
    resistance: startingBonus.resistance || 0,
    agilite: startingBonus.agilite || 0,
    moral: startingBonus.moral || 50
  });
  
  const [energy, setEnergy] = React.useState(100);
  const [time, setTime] = React.useState(480); // Début à 08:00

  const addMessage = (text) => setMessages(prev => [{ text, id: Date.now() }, ...prev].slice(0, 30));

  const formatTime = (t) => {
    const h = Math.floor((t % 1440) / 60);
    const m = t % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // --- ÉCONOMIE ---
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

  // --- SYSTÈME DE FOUILLE ---
  const triggerShakedown = () => {
    setIsShakedown(true);
    addMessage("🚨 FOUILLE ! Les gardes arrivent !");
    setTimeout(() => {
      setInventory(prev => {
        const illegal = prev.filter(id => ITEMS_DB[id]?.illegal);
        if (illegal.length > 0) addMessage(`🚫 Confisqué : ${illegal.map(id => ITEMS_DB[id].name).join(", ")}`);
        return prev.filter(id => !ITEMS_DB[id]?.illegal);
      });
      setIsShakedown(false);
    }, 2000);
  };

  // --- UTILISATION D'OBJETS ---
  const useItem = (id, index) => {
    if (id === "livre_adulte") {
      setStats(s => ({ ...s, moral: Math.min(100, s.moral + 30) }));
      addMessage("📖 Lecture... Le moral remonte !");
    } else if (id === "cigarettes") {
      setStats(s => ({ ...s, moral: Math.min(100, s.moral + 10), reputation: s.reputation + 2 }));
      addMessage("🚬 Pause clope. +10 Moral, +2 Rép.");
    } else return;
    setInventory(prev => prev.filter((_, i) => i !== index));
  };

  // --- LOGIQUE PRINCIPALE DES ACTIONS ---
  const handleAction = (action) => {
    if (isShakedown) return;
    const now = time % 1440;
    const isNight = (now > 1320 || now < 360);

    // 1. Déplacements
    if (action.type === "move") {
      if (isNight && !["cell", "solitary"].includes(action.leads_to)) {
        const risk = 0.80 - (stats.agilite * 0.03);
        if (Math.random() < risk) {
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

    // 2. Cantine
    else if (action.type === "eat_event") {
      const sched = WORLD_DATA.schedule;
      const isOpen = (now >= sched.canteen.start && now <= sched.canteen.end) || 
                     (now >= sched.canteen_evening.start && now <= sched.canteen_evening.end);
      if (!isOpen) return addMessage("🚫 La cantine est fermée.");
      setEnergy(Math.min(100, energy + 40));
      setStats(s => ({ ...s, moral: Math.min(100, s.moral + 5) }));
      setTime(t => t + 30);
      addMessage("🍴 +40 Énergie.");
    }

    // 3. Entraînement
    else if (action.type === "train") {
      if (energy >= action.energy) {
        setStats(s => ({ ...s, [action.stat]: s[action.stat] + 3 }));
        setEnergy(e => e - action.energy);
        setTime(t => t + 45);
        addMessage(`👊 +3 ${action.stat}`);
      } else addMessage("⚠️ Trop fatigué...");
    }

    // 4. PARLOIR (Visite)
    else if (action.type === "visiting_event") {
      setTime(t => t + 60);
      if (stats.reputation >= 40) {
        const gift = Math.random() > 0.5 ? "cigarettes" : "livre_adulte";
        setInventory(prev => [...prev, gift]);
        addMessage(`🎁 Visite : Ton contact t'a donné : ${ITEMS_DB[gift].name}`);
      } else {
        setStats(s => ({ ...s, moral: Math.min(100, s.moral + 15) }));
        addMessage("👋 Visite : Voir un visage ami remonte le moral.");
      }
    }

    // 5. SOMMEIL
    else if (action.type === "sleep") {
      setTime(480); // Réveil à 08:00
      setEnergy(100);
      setStats(s => ({ ...s, moral: Math.min(100, s.moral + 5) }));
      addMessage("🌞 Une nouvelle journée commence.");
      setCurrentRoom("cell");
    }


// --- 6. FIN DE PUNITION ---
    else if (action.type === "wait_punishment") {
       setCurrentRoom("cell");
      setTime(t => t + 60);
      addMessage("Fin de peine. Retour en cellule.");
     }

		
    // 6. Social
    else if (action.type === "social") {
      const { subType, npc } = action;
      const isAssocial = npc.personnality === "associal"; // Note : personnality avec deux 'n' comme dans ton gameData
      
      if (subType === "talk") {
        if (Math.random() < (stats.intelligence / 100 + 0.4)) {
          setStats(s => ({ ...s, reputation: s.reputation + 2 }));
          addMessage(`💬 Tu parles avec ${npc.name}. (+2 Rép)`);
        } else addMessage(`💬 ${npc.name} : "${npc.dialog || "Ouais..."}"`);
      }
      else if (subType === "charm") {
        if (isAssocial) {
          addMessage(`🚫 ${npc.name} t'envoie balader.`);
          setRelations(prev => ({ ...prev, [npc.id]: (prev[npc.id] || 0) - 2 }));
        } else {
          setRelations(prev => ({ ...prev, [npc.id]: (prev[npc.id] || 0) + 5 }));
          addMessage(`❤️ Affinité avec ${npc.name} en hausse.`);
        }
      }
      else if (subType === "humiliate") {
        setStats(s => ({ ...s, reputation: s.reputation + 5, moral: s.moral + 2 }));
        setRelations(prev => ({ ...prev, [npc.id]: (prev[npc.id] || 0) - 10 }));
        addMessage(`🔥 Humiliation publique ! (+5 Rép)`);
        if (npc.force > stats.force) {
          addMessage(`😡 ${npc.name} attaque !`);
          setTimeout(() => setCombatNpc(npc), 1000);
        }
      }
    }
  };

  const handleNpcClick = (npc) => setInteractingNpc(npc);

  // --- RENDU ---
  return React.createElement("div", { 
    className: `min-h-screen p-4 max-w-5xl mx-auto space-y-4 ${isShakedown ? 'opacity-50 pointer-events-none' : ''}` 
  },
    // HUD
    React.createElement("div", { className: "grid grid-cols-3 md:grid-cols-9 gap-2 bg-gray-900 p-4 rounded-xl border border-blue-900 shadow-xl text-white" },
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-green-400 font-bold" }, "⚡ ÉNERGIE"), React.createElement("p", { className: "text-lg font-black" }, energy + "%")),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-yellow-500 font-bold" }, "🔥 RÉP"), React.createElement("p", { className: "text-lg font-black" }, stats.reputation)),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-red-500 font-bold" }, "💪 FOR"), React.createElement("p", { className: "text-lg font-black" }, stats.force)),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-pink-500 font-bold" }, "❤️ MORAL"), React.createElement("p", { className: "text-lg font-black" }, stats.moral)),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-purple-400 font-bold" }, "🏃 AGI"), React.createElement("p", { className: "text-lg font-black" }, stats.agilite)),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-orange-400 font-bold" }, "🛡️ RES"), React.createElement("p", { className: "text-lg font-black" }, stats.resistance)),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-blue-400 font-bold" }, "🧠 INT"), React.createElement("p", { className: "text-lg font-black" }, stats.intelligence)),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-blue-300 font-bold" }, "🕒 HEURE"), React.createElement("p", { className: "text-lg font-black" }, formatTime(time))),
      React.createElement("div", { className: "text-right border-l border-white/10" }, React.createElement("p", { className: "text-[8px] text-blue-500" }, "ZONE"), React.createElement("p", { className: "text-[10px] font-bold uppercase" }, WORLD_DATA.rooms[currentRoom].name))
    ),

    // RoomView
    React.createElement(RoomView, { 
      roomId: currentRoom, 
      npcs: WORLD_DATA.npcs[currentRoom] || [], 
      hotspots: WORLD_DATA.rooms[currentRoom].hotspots,
      onHotspotClick: handleAction,
      onNpcClick: handleNpcClick
    }),

    // Logs et Inventaire
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 h-44" },
      React.createElement("div", { className: "bg-black/60 p-4 rounded-xl overflow-y-auto border border-white/5 font-mono text-[11px] text-gray-400" },
        messages.map(m => React.createElement("div", { key: m.id, className: "mb-1 border-l-2 border-blue-900 pl-2" }, `> ${m.text}`))
      ),
      React.createElement("div", { className: "bg-gray-900/50 p-4 rounded-xl border border-white/5" },
        React.createElement("h3", { className: "text-[10px] text-gray-500 uppercase font-black mb-3" }, "Poches"),
        React.createElement("div", { className: "flex flex-wrap gap-2" },
          inventory.map((id, i) => React.createElement("div", { 
            key: i, onClick: () => useItem(id, i),
            className: `item-slot ${ITEMS_DB[id]?.illegal ? 'item-illegal' : ''} cursor-pointer` 
          }, ITEMS_DB[id]?.icon || "❓"))
        )
      )
    ),

    // MODALES
    interactingNpc && React.createElement("div", { className: "fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" },
      React.createElement("div", { className: "bg-gray-900 border-2 border-blue-600 p-6 rounded-xl max-w-sm w-full text-center" },
        React.createElement("div", { className: "text-4xl mb-2" }, interactingNpc.icon || "👤"),
        React.createElement("h2", { className: "text-white font-black text-2xl mb-1" }, interactingNpc.name),
        React.createElement("p", { className: "text-pink-500 text-xs mb-6" }, `Affinité : ${relations[interactingNpc.id] || 0} pts`),
        React.createElement("div", { className: "grid grid-cols-1 gap-3" },
          (interactingNpc.type === "trade" || interactingNpc.type === "hybrid") && React.createElement("button", { onClick: () => { setTradeNpc(interactingNpc); setInteractingNpc(null); }, className: "py-3 bg-yellow-700 text-white font-bold rounded" }, "🛒 TROQUER"),
          (interactingNpc.type === "fight" || interactingNpc.type === "hybrid") && React.createElement("button", { onClick: () => { setCombatNpc(interactingNpc); setInteractingNpc(null); }, className: "py-3 bg-red-700 text-white font-bold rounded" }, "💀 COMBATTRE"),
          React.createElement("button", { onClick: () => { handleAction({ type: 'social', subType: 'talk', npc: interactingNpc }); setInteractingNpc(null); }, className: "py-3 bg-gray-800 text-blue-300 rounded" }, "🗣️ PARLER"),
          React.createElement("button", { onClick: () => { handleAction({ type: 'social', subType: 'charm', npc: interactingNpc }); setInteractingNpc(null); }, className: "py-3 bg-gray-800 text-pink-300 rounded" }, "✨ CHARMER"),
          React.createElement("button", { onClick: () => { handleAction({ type: 'social', subType: 'humiliate', npc: interactingNpc }); setInteractingNpc(null); }, className: "py-3 bg-gray-800 text-orange-300 rounded" }, "🔥 HUMILIER"),
          React.createElement("button", { onClick: () => setInteractingNpc(null), className: "mt-2 text-gray-500 text-[10px]" }, "[ ANNULER ]")
        )
      )
    ),

    combatNpc && React.createElement(CombatModal, { 
      npc: combatNpc, stats, inventory,
      onWin: () => {
        setStats(s => ({ ...s, reputation: s.reputation + 15 }));
        addMessage(`🏆 Victoire contre ${combatNpc.name} !`);
        setCombatNpc(null);
      },
      onLose: () => {
        setEnergy(20);
        addMessage("🤕 Tu t'es fait étaler...");
        setCurrentRoom("infirmary");
        setCombatNpc(null);
      }
    }),

    tradeNpc && React.createElement(TradeModal, { 
      npc: tradeNpc, inventory, onBuy: buyItem, onSell: sellItem, onClose: () => setTradeNpc(null) 
    })
  );
}
