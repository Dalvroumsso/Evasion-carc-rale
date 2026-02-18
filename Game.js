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

  // Vérification des horaires
  const checkAccess = (room) => {
    const sched = WORLD_DATA.schedule;
    const now = time % 1440;

    if (room === "yard" && (now < sched.yard.start || now > sched.yard.end)) {
        addMessage(`🚫 La cour est fermée. (Ouverte: ${sched.yard.label})`);
        return false;
    }
    if (room === "canteen") {
        const openMidi = (now >= sched.canteen.start && now <= sched.canteen.end);
        const openSoir = (now >= sched.canteen_evening.start && now <= sched.canteen_evening.end);
        if (!openMidi && !openSoir) {
            addMessage(`🚫 La cantine est fermée. Repas à 12h et 18h.`);
            return false;
        }
    }
    if (room === "visiting_room" && (now < sched.visiting.start || now > sched.visiting.end)) {
        addMessage(`🚫 Parloir fermé. (Horaires: ${sched.visiting.label})`);
        return false;
    }
    return true;
  };

  // Dans ton composant Game, mets à jour handleAction :

const handleAction = (action) => {
    if (isShakedown) return;
    const now = time % 1440;
    const isNight = (now > 1320 || now < 360); // Entre 22h et 06h

    // --- LOGIQUE DE MOUVEMENT & INFILTRATION ---
    if (action.type === "move") {
        // Si on est dehors la nuit et qu'on ne va pas vers la cellule/isolement
        if (isNight && action.leads_to !== "cell" && action.leads_to !== "solitary") {
            
            // Calcul du risque : 80% de base, réduit par l'agilité
            // Si agilité = 15, risque = 80 - 45 = 35%
            const detectionRisk = 0.80 - (stats.agilite * 0.03); 
            
            if (Math.random() < detectionRisk) {
                addMessage("🚨 PATROUILLE ! Un gardien vous a repéré dans le noir !");
                setStats(s => ({ ...s, reputation: Math.max(0, s.reputation - 5), moral: s.moral - 5 }));
                setCurrentRoom("solitary"); // Direction le trou
                setTime(t => t + 600); // On perd 10h en cellule d'isolement
                return;
            } else {
                addMessage("👣 Vous vous glissez dans les ombres... (Discrétion réussie)");
            }
        }

        // Fouille aléatoire classique (le jour seulement)
        if (!isNight && Math.random() < 0.10) {
            triggerShakedown();
        }

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

    // ... reste des actions (train, sleep, etc.)
  
    if (action.type === "train") {
      if (energy >= action.energy) {
        setStats(s => ({ ...s, [action.stat]: s[action.stat] + 3 }));
        setEnergy(e => e - action.energy);
        setTime(t => t + action.time);
        addMessage(`Entraînement fini. +3 ${action.stat}`);
      } else addMessage("Trop fatigué...");
    }

    if (action.type === "visiting_event") {
        setTime(t => t + 60);
        if (stats.reputation >= 40) {
            const gift = ["cigarettes", "livre_adulte"][Math.floor(Math.random()*2)];
            setInventory(prev => [...prev, gift]);
            addMessage(`🎁 Objet reçu : ${ITEMS_DB[gift].name}`);
        } else {
            setStats(s => ({...s, moral: s.moral + 10}));
            addMessage("👋 Visite calme. Moral +10.");
        }
    }

    if (action.type === "sleep") {
        setTime(480); // Reset à 8h demain
        setEnergy(100);
        addMessage("🌞 Une nouvelle journée commence à Blackridge.");
    }
  };

  return React.createElement("div", { className: `min-h-screen p-4 max-w-5xl mx-auto space-y-4 ${isShakedown ? 'shakedown-active' : ''}` },
    // HUD 5 COLONNES
    React.createElement("div", { className: "grid grid-cols-5 gap-2 bg-gray-900 p-4 rounded-xl border border-blue-900 shadow-xl" },
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-green-400 font-bold" }, "⚡ ÉNERGIE"), React.createElement("p", { className: "text-xl font-black" }, energy + "%")),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-yellow-500 font-bold" }, "🔥 REPUTATION"), React.createElement("p", { className: "text-xl font-black" }, stats.reputation)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-red-500 font-bold" }, "💪 FORCE"), React.createElement("p", { className: "text-xl font-black" }, stats.force)),
      React.createElement("div", null, React.createElement("p", { className: "text-[10px] text-blue-300 font-bold" }, "🕒 HEURE"), React.createElement("p", { className: "text-xl font-black text-white" }, formatTime(time))),
      React.createElement("div", { className: "text-right" }, React.createElement("p", { className: "text-[10px] text-blue-500 font-bold" }, "ZONE"), React.createElement("p", { className: "text-[10px] font-bold uppercase truncate" }, WORLD_DATA.rooms[currentRoom].name))
    ),

    // La Vue (Image + Boutons)
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
        React.createElement("h3", { className: "text-[10px] text-gray-500 uppercase font-black mb-3" }, "Poches"),
        React.createElement("div", { className: "flex flex-wrap gap-2" },
          inventory.map((id, i) => React.createElement("div", { key: i, className: `item-slot ${ITEMS_DB[id].illegal ? 'item-illegal' : ''} group` },
            ITEMS_DB[id].icon,
            React.createElement("span", { className: "item-tooltip" }, ITEMS_DB[id].name)
          ))
        )
      )
    )
  );
}

