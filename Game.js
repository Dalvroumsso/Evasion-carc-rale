function Game({ startingBonus }) {
  const [currentRoom, setCurrentRoom] = React.useState("entrance");
  const [inventory, setInventory] = React.useState(["brossette", "savon"]);
  const [messages, setMessages] = React.useState([{ text: "Bienvenue à Blackridge.", id: Date.now() }]);
  const [isShakedown, setIsShakedown] = React.useState(false);
  
  // États pour les NPCs (Combat et Troc)
  const [combatNpc, setCombatNpc] = React.useState(null);
  const [tradeNpc, setTradeNpc] = React.useState(null);
  
  const [stats, setStats] = React.useState({ 
    force: startingBonus.force || 5, 
    reputation: startingBonus.reputation || 0,
    intelligence: startingBonus.intelligence || 5,
    resistance: startingBonus.resistance || 5,
    agilite: startingBonus.agilite || 5, // Ajout de l'agilité
    moral: startingBonus.moral || 50
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

  // --- GESTION DES COMBATS ---
  const resolveCombat = () => {
    if (stats.force > combatNpc.force) {
      addMessage(`🏆 Victoire contre ${combatNpc.name} !`);
      const newRep = stats.reputation + 10;
      setStats(s => ({ ...s, reputation: newRep }));
      
      let risk = 0.66;
      if (newRep >= 25) risk = 0.50;
      if (newRep >= 50) risk = 0.25;
      if (newRep >= 75) risk = 0;
      
      if (Math.random() < risk) {
        addMessage("👮 Les gardes t'envoient au TROU.");
        setCurrentRoom("solitary");
      }
    } else {
      addMessage("🤕 K.O... Tu te réveilles en cellule.");
      setEnergy(20);
      setCurrentRoom("cell");
    }
    setCombatNpc(null);
  };

  // --- GESTION DU TROC (ACHAT / VENTE) ---
  const handleNpcClick = (npc) => {
    if (npc.type === "fight") setCombatNpc(npc);
    if (npc.type === "trade") setTradeNpc(npc);
  };

  const buyItem = (itemId) => {
    const itemToBuy = ITEMS_DB[itemId];
    const playerCigs = inventory.filter(id => id === "cigarettes").length;
    const cost = Math.ceil(itemToBuy.value / 5);

    if (playerCigs >= cost) {
      let removed = 0;
      setInventory(prev => {
        const nextInv = prev.filter(id => {
          if (id === "cigarettes" && removed < cost) {
            removed++;
            return false;
          }
          return true;
        });
        return [...nextInv, itemId];
      });
      addMessage(`🤝 Achat réussi : ${itemToBuy.name} contre ${cost} 🚬.`);
    } else {
      addMessage("⚠️ Pas assez de cigarettes...");
    }
  };

  const sellItem = (itemId, inventoryIndex) => {
    const itemToSell = ITEMS_DB[itemId];
    if (!itemToSell || itemToSell.value <= 0) {
      addMessage("🚫 Personne ne veut acheter cette camelote.");
      return;
    }

    const gain = Math.floor(itemToSell.value / 10);
    if (gain <= 0) {
      addMessage("💰 Ce n'est pas assez précieux pour en tirer une cigarette.");
      return;
    }

    setInventory(prev => {
      const nextInv = prev.filter((_, i) => i !== inventoryIndex);
      const cigarettesToAdd = Array(gain).fill("cigarettes");
      return [...nextInv, ...cigarettesToAdd];
    });

    addMessage(`🤝 Vendu : ${itemToSell.name} contre ${gain} 🚬.`);
  };

  // --- LOGIQUE DES ACTIONS (DÉPLACEMENTS, HORAIRES, ETC) ---
  const handleAction = (action) => {
    if (isShakedown) return;
    const now = time % 1440;
    const isNight = (now > 1320 || now < 360); // 22h - 06h

    // Mouvement & Infiltration
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

    // Cantine
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

    // Entraînement
    if (action.type === "train") {
      if (energy >= action.energy) {
        setStats(s => ({ ...s, [action.stat]: s[action.stat] + 3 }));
        setEnergy(e => e - action.energy);
        setTime(t => t + action.time);
        addMessage(`Entraînement fini. +3 ${action.stat}`);
      } else addMessage("⚠️ Trop fatigué...");
    }

    // Parloir
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

    // Sommeil
    if (action.type === "sleep") {
        setTime(480); // 08:00
        setEnergy(100);
        addMessage("🌞 Une nouvelle journée commence à Blackridge.");
    }

    // Sortie de l'isolement
    if (action.type === "wait_punishment") {
        addMessage("Ta peine d'isolement est finie. Retour au bloc.");
        setCurrentRoom("cell");
        setTime(t => t + 60);
    }
  };

  return React.createElement("div", { className: `min-h-screen p-4 max-w-5xl mx-auto space-y-4 ${isShakedown ? 'shakedown-active' : ''}` },
    
    // --- MODAL COMBAT ---
    combatNpc && React.createElement("div", { className: "fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4" },
      React.createElement("h2", { className: "text-red-600 text-6xl font-black mb-12 animate-pulse" }, "BASTON"),
      React.createElement("button", { onClick: resolveCombat, className: "bg-red-600 px-16 py-8 text-3xl font-bold rounded-full hover:bg-red-500 transition-transform active:scale-90" }, "FRAPPER !")
    ),

    // --- MODAL TROC (ACHAT/VENTE) ---
    tradeNpc && React.createElement("div", { className: "fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" },
      React.createElement("div", { className: "bg-gray-900 border-2 border-yellow-600 p-6 rounded-xl max-w-2xl w-full grid grid-cols-2 gap-8" },
        
        // Colonne Achat
        React.createElement("div", null,
          React.createElement("h2", { className: "text-yellow-500 font-black text-xl mb-4 border-b border-yellow-900 pb-2" }, `🛒 ACHETER À ${tradeNpc.name}`),
          React.createElement("div", { className: "space-y-2 h-64 overflow-y-auto pr-2" },
            tradeNpc.inventory.map(itemId => {
              const item = ITEMS_DB[itemId];
              const cost = Math.ceil(item.value / 5);
              return React.createElement("div", { key: itemId, className: "flex items-center justify-between bg-black/40 p-2 rounded border border-white/5" },
                React.createElement("span", { className: "text-sm text-white" }, `${item.icon} ${item.name}`),
                React.createElement("button", { 
                  onClick: () => buyItem(itemId),
                  className: "bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded text-[10px] font-bold"
                }, `${cost} 🚬`)
              );
            })
          )
        ),

        // Colonne Vente
        React.createElement("div", null,
          React.createElement("h2", { className: "text-green-500 font-black text-xl mb-4 border-b border-green-900 pb-2" }, "💰 VENDRE"),
          React.createElement("div", { className: "space-y-2 h-64 overflow-y-auto pr-2" },
            inventory.filter(id => id !== "cigarettes").map((itemId, idx) => {
              const item = ITEMS_DB[itemId];
              const gain = Math.floor((item?.value || 0) / 10);
              return React.createElement("div", { key: idx, className: "flex items-center justify-between bg-black/40 p-2 rounded border border-white/5" },
                React.createElement("span", { className: "text-sm text-white" }, `${item?.icon} ${item?.name}`),
                gain > 0 ? React.createElement("button", { 
                  onClick: () => sellItem(itemId, idx),
                  className: "bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-[10px] font-bold"
                }, `+${gain} 🚬`) : React.createElement("span", { className: "text-[10px] text-gray-500 italic" }, "Sans valeur")
              );
            })
          )
        ),

        // Bouton Quitter
        React.createElement("div", { className: "col-span-2 mt-4" },
          React.createElement("button", { 
            onClick: () => setTradeNpc(null),
            className: "w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg uppercase tracking-widest text-xs"
          }, "Quitter le troc")
        )
      )
    ),

    // --- HUD 6 COLONNES ---
    React.createElement("div", { className: "grid grid-cols-6 gap-2 bg-gray-900 p-4 rounded-xl border border-blue-900 shadow-xl text-white" },
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-green-400 font-bold" }, "⚡ ÉNERGIE"), React.createElement("p", { className: "text-xl font-black" }, energy + "%")),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-yellow-500 font-bold" }, "🔥 REPUTATION"), React.createElement("p", { className: "text-xl font-black" }, stats.reputation)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-red-500 font-bold" }, "💪 FORCE"), React.createElement("p", { className: "text-xl font-black" }, stats.force)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-purple-400 font-bold" }, "🏃 AGILITÉ"), React.createElement("p", { className: "text-xl font-black" }, stats.agilite)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-blue-300 font-bold" }, "🕒 HEURE"), React.createElement("p", { className: "text-xl font-black" }, formatTime(time))),
      React.createElement("div", { className: "text-right" }, React.createElement("p", { className: "text-[10px] text-blue-500 font-bold" }, "ZONE"), React.createElement("p", { className: "text-[10px] font-bold uppercase truncate" }, WORLD_DATA.rooms[currentRoom].name))
    ),

    // --- LA VUE PRINCIPALE ---
    React.createElement(RoomView, { 
      roomId: currentRoom, 
      npcs: WORLD_DATA.npcs[currentRoom] || [], 
      hotspots: WORLD_DATA.rooms[currentRoom].hotspots,
      onHotspotClick: handleAction,
      onNpcClick: handleNpcClick // Essentiel pour lancer combats et troc
    }),

    // --- BAS : JOURNAL & INVENTAIRE ---
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 h-44" },
      React.createElement("div", { className: "bg-black/60 p-4 rounded-xl overflow-y-auto border border-white/5 text-[11px] font-mono text-gray-400" },
        messages.map(m => React.createElement("div", { key: m.id, className: "mb-1 border-l-2 border-blue-900 pl-2" }, `> ${m.text}`))
      ),
      React.createElement("div", { className: "bg-gray-900/50 p-4 rounded-xl border border-white/5 text-white" },
        React.createElement("h3", { className: "text-[10px] text-gray-500 uppercase font-black mb-3 tracking-widest" }, "Poches (Cliquer pour utiliser)"),
        React.createElement("div", { className: "flex flex-wrap gap-2" },
          inventory.map((id, i) => React.createElement("div", { 
            key: i, 
            onClick: () => useItem(id, i),
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

