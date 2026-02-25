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
  const [time, setTime] = React.useState(480); 

  const addMessage = (text) => setMessages(prev => [{ text, id: Date.now() }, ...prev].slice(0, 30));

  const formatTime = (t) => {
    const h = Math.floor((t % 1440) / 60);
    const m = t % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // --- LOGIQUE DE TROC ---
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

    // --- 1. DÉPLACEMENTS ---
    if (action.type === "move") {
      // Risque de patrouille la nuit si on n'est pas en cellule
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
      // Risque de fouille aléatoire le jour
      if (!isNight && Math.random() < 0.10) triggerShakedown();
      
      setCurrentRoom(action.leads_to);
      setTime(t => t + 10);
    }

    // --- 2. CANTINE (REPAS) ---
    else if (action.type === "eat_event") {
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

    // --- 3. ENTRAÎNEMENT ---
    else if (action.type === "train") {
      if (energy >= action.energy) {
        setStats(s => ({ ...s, [action.stat]: s[action.stat] + 3 }));
        setEnergy(e => e - action.energy);
        setTime(t => t + (action.time || 45));
        addMessage(`👊 Entraînement : +3 ${action.stat}`);
      } else {
        addMessage("⚠️ Trop fatigué pour s'entraîner...");
      }
    }

    // --- 4. PARLOIR (VISITE) ---
    else if (action.type === "visiting_event") {
      setTime(t => t + 60);
      if (stats.reputation >= 40) {
        const gift = Math.random() > 0.5 ? "cigarettes" : "livre_adulte";
        setInventory(prev => [...prev, gift]);
        addMessage(`🎁 Un proche a glissé un objet : ${ITEMS_DB[gift].name}`);
      } else {
        setStats(s => ({ ...s, moral: Math.min(100, s.moral + 15) }));
        addMessage("👋 Une visite qui fait du bien au moral.");
      }
    }

    // --- 5. SOMMEIL ---
    else if (action.type === "sleep") {
      setTime(480); // Réveil à 08:00
      setEnergy(100);
      setStats(s => ({ ...s, moral: Math.min(100, s.moral + 5) }));
      addMessage("🌞 Une nouvelle journée commence.");
    }

    // --- 6. FIN DE PUNITION ---
    else if (action.type === "wait_punishment") {
      setCurrentRoom("cell");
      setTime(t => t + 60);
      addMessage("Fin de peine. Retour en cellule.");
    }


// --- 7. ACTIONS SOCIALES (PNJ) ---
    else if (action.type === "social") {
      const { subType, npc } = action;
      const npcId = npc.id;
      const isAssocial = npc.personalities?.includes("associal");
      
      if (subType === "talk") {
        const success = Math.random() < (stats.intelligence / 100 + 0.4);
        if (success) {
          setStats(s => ({ ...s, reputation: s.reputation + 2 }));
          addMessage(`💬 Tu discutes avec ${npc.name}. On commence à respecter ton nom. (+2 Rép)`);
        } else {
          addMessage(`💬 ${npc.name} : "${npc.dialog || "Ouais, c'est ça..."}"`);
      } 
    }
 
	else if (subType === "charm") {
          if (isAssocial) {
          addMessage(`🚫 ${npc.name} est associal. Tes tentatives de flirt l'irritent plus qu'autre chose.`);
          setRelations(prev => ({ ...prev, [npcId]: (prev[npcId] || 0) - 2 }));
        } else {
          // On gagne +5 points de relation
          setRelations(prev => ({ ...prev, [npcId]: (prev[npcId] || 0) + 5 }));
          
          const currentRel = (relations[npcId] || 0) + 5;
          addMessage(`❤️ Tu flirtes avec ${npc.name}. Affinité : ${currentRel} points.`);
          
          if (currentRel >= 50) {
            addMessage(`🔥 ${npc.name} semble être sous ton charme total.`);
          }
        }
      } 
      
      else if (subType === "humiliate") {
        setStats(s => ({ ...s, reputation: s.reputation + 5, moral: s.moral + 2 }));
        addMessage(`🔥 Tu as humilié ${npc.name} devant tout le monde ! (+5 Réput)`);
        
        // --- LOGIQUE D'AGRESSION ---
        // Le PNJ attaque s'il est strictement plus fort que le joueur
        if (npc.force > stats.force) {
          addMessage(`😡 ${npc.name} ne se laisse pas faire : "Tu vas regretter tes paroles !"`);
          // Délai de 1s pour laisser le temps de lire avant que la modale de combat s'ouvre
          setTimeout(() => {
            setCombatNpc(npc);
          }, 1000);
        } else {
          addMessage(`😒 ${npc.name} s'écrase et baisse les yeux.`);
        }
      }
  };

  const handleNpcClick = (npc) => {
	// On stocke le PNJ pour afficher le menu de choix
	setInteractingNpc(npc);
  };

  return React.createElement("div", { className: `min-h-screen p-4 max-w-5xl mx-auto space-y-4 ${isShakedown ? 'shakedown-active' : ''}` },
    

{/* --- MENU D'INTERACTION PNJ --- */}
{interactingNpc && React.createElement("div", { 
  className: "fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
},
  React.createElement("div", { 
    className: "bg-gray-900 border-2 border-blue-600 p-6 rounded-xl max-w-sm w-full text-center shadow-[0_0_20px_rgba(37,99,235,0.3)]" 
  },
    // Icône
    React.createElement("div", { className: "text-4xl mb-2" }, interactingNpc.icon || "👤"),
    
    // Titre et Relation
    React.createElement("h2", { className: "text-white font-black text-2xl mb-1 uppercase tracking-tighter" }, interactingNpc.name),
    React.createElement("p", { className: "text-pink-500 text-xs font-bold mb-6" }, `Relation : ${relations[interactingNpc.id] || 0} pts`),
    
    React.createElement("div", { className: "grid grid-cols-1 gap-3" },
      
      // --- ACTIONS SPÉCIFIQUES (Troc / Combat) ---
      (interactingNpc.type === "trade" || interactingNpc.type === "hybrid") && 
        React.createElement("button", { 
          onClick: () => { setTradeNpc(interactingNpc); setInteractingNpc(null); },
          className: "py-3 bg-gradient-to-r from-yellow-700 to-yellow-600 text-white font-black rounded-lg hover:from-yellow-600 hover:to-yellow-500 transition-all shadow-lg"
        }, "🛒 TROQUER"),
      
      (interactingNpc.type === "fight" || interactingNpc.type === "hybrid") && 
        React.createElement("button", { 
          onClick: () => { setCombatNpc(interactingNpc); setInteractingNpc(null); },
          className: "py-3 bg-gradient-to-r from-red-700 to-red-600 text-white font-black rounded-lg hover:from-red-600 hover:to-red-500 transition-all shadow-lg"
        }, "💀 COMBATTRE"),

      // --- ACTIONS SOCIALES ---
      React.createElement("button", { 
        onClick: () => { handleAction({ type: 'social', subType: 'talk', npc: interactingNpc }); setInteractingNpc(null); },
        className: "py-3 bg-gray-800 text-blue-300 font-bold rounded-lg border border-blue-900/50 hover:bg-gray-700"
      }, "🗣️ PARLER"),

      React.createElement("button", { 
        onClick: () => { handleAction({ type: 'social', subType: 'charm', npc: interactingNpc }); setInteractingNpc(null); },
        className: "py-3 bg-gray-800 text-pink-300 font-bold rounded-lg border border-pink-900/50 hover:bg-gray-700"
      }, "✨ CHARMER"),

      React.createElement("button", { 
        onClick: () => { handleAction({ type: 'social', subType: 'humiliate', npc: interactingNpc }); setInteractingNpc(null); },
        className: "py-3 bg-gray-800 text-orange-300 font-bold rounded-lg border border-orange-900/50 hover:bg-gray-700"
      }, "🔥 HUMILIER"),
      
      // Bouton Fermer
      React.createElement("button", { 
        onClick: () => setInteractingNpc(null), 
        className: "mt-4 py-2 text-gray-500 text-[10px] uppercase font-bold tracking-widest hover:text-white" 
      }, "[ Annuler ]")
    )
  )
)},

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

