// ============================================================
//  Game.js  — Logique principale du jeu v2.0
// ============================================================
function Game({ startingBonus }) {

  // ─── ÉTAT DU MONDE ──────────────────────────────────────
  const [currentRoom, setCurrentRoom]         = React.useState("entrance");
  const [inventory,   setInventory]           = React.useState(["brossette", "savon"]);
  const [messages,    setMessages]            = React.useState([{ text: "Bienvenue à Blackridge. Bonne chance.", id: Date.now() }]);
  const [isShakedown, setIsShakedown]         = React.useState(false);

  // Temps, énergie, stats
  const [energy, setEnergy]   = React.useState(100);
  const [time,   setTime]     = React.useState(480);
  const [stats,  setStats]    = React.useState({
    force:        startingBonus.force       || 0,
    reputation:   startingBonus.reputation  || 0,
    intelligence: startingBonus.intelligence|| 0,
    resistance:   startingBonus.resistance  || 0,
    agilite:      startingBonus.agilite     || 0,
    moral:        startingBonus.moral       || 50
  });

  // Faction & Faction choisie
  const [playerFaction, setPlayerFaction] = React.useState("neutre");

  // Cooldowns entraînement : { cooldownKey: lastTrainTime }
  const [trainCooldowns, setTrainCooldowns] = React.useState({});

  // Relations PNJ : { npcId: trustPoints }
  const [relations, setRelations] = React.useState({});

  // ─── SYSTÈME DE QUÊTES ──────────────────────────────────
  // Initialisation : quête de départ déverrouillée
  const initQuests = () => {
    const q = QUESTS_DB["quest_survive"];
    return [{
      id: "quest_survive",
      status: "active",
      objectives: q.objectives.map(o => ({ ...o }))
    }];
  };
  const [quests, setQuests] = React.useState(initQuests);
  const [showQuestLog, setShowQuestLog] = React.useState(false);
  const [questNotif, setQuestNotif]   = React.useState(null); // { title, message }

  // ─── MODALES ────────────────────────────────────────────
  const [interactingNpc, setInteractingNpc] = React.useState(null);
  const [combatNpc,      setCombatNpc]      = React.useState(null);
  const [tradeNpc,       setTradeNpc]       = React.useState(null);
  const [activeEvent,    setActiveEvent]    = React.useState(null);

  // Compteur d'actions pour les événements aléatoires
  const actionCounter = React.useRef(0);

  // ─── UTILITAIRES ────────────────────────────────────────
  const addMessage = (text) =>
    setMessages(prev => [{ text, id: Date.now() + Math.random() }, ...prev].slice(0, 40));

  const formatTime = (t) => {
    const h = Math.floor((t % 1440) / 60);
    const m = t % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v));

  const modifyStat = (stat, delta) =>
    setStats(s => ({ ...s, [stat]: clamp(s[stat] + delta) }));

  const modifyTrust = (npcId, delta) =>
    setRelations(prev => ({ ...prev, [npcId]: clamp((prev[npcId] || 0) + delta, -100, 100) }));

  // ─── SYSTÈME DE QUÊTES ──────────────────────────────────

  // Met à jour la progression d'un objectif sur les quêtes actives
  const progressQuest = (type, params = {}) => {
    setQuests(prev => {
      let updated = prev.map(q => {
        if (q.status !== "active") return q;
        const def = QUESTS_DB[q.id];
        if (!def) return q;

        const newObjs = q.objectives.map(obj => {
          if (obj.progress >= obj.count) return obj; // déjà terminé

          let match = false;
          switch (type) {
            case "sleep":          match = (obj.type === "sleep");                                 break;
            case "eat":            match = (obj.type === "eat");                                   break;
            case "train":          match = (obj.type === "train") && (!obj.stat || obj.stat === params.stat); break;
            case "talk_npc":       match = (obj.type === "talk_npc")  && obj.target === params.npcId;        break;
            case "charm_npc":      match = (obj.type === "charm_npc") && obj.target === params.npcId;        break;
            case "combat_win":     match = (obj.type === "combat_win") && (!obj.target || obj.target === params.npcId); break;
            case "humiliate":      match = (obj.type === "humiliate");                             break;
            case "use_item":       match = (obj.type === "use_item")   && obj.itemId === params.itemId;       break;
            case "have_item":      match = (obj.type === "have_item")  && obj.itemId === params.itemId && params.count >= obj.count; break;
            case "stat_reach":     match = (obj.type === "stat_reach") && obj.stat === params.stat && params.value >= obj.value;     break;
            case "join_faction":   match = (obj.type === "join_faction");                          break;
            case "action":         match = (obj.type === "action") && obj.actionType === params.actionType;  break;
            default: break;
          }

          if (match) return { ...obj, progress: Math.min(obj.count, obj.progress + 1) };
          return obj;
        });

        return { ...q, objectives: newObjs };
      });

      // Vérifier si des quêtes sont complétées
      let newlyCompleted = [];
      let toUnlock = [];

      updated = updated.map(q => {
        if (q.status !== "active") return q;
        const def = QUESTS_DB[q.id];
        const allDone = q.objectives.every(o => o.progress >= o.count);
        if (allDone) {
          newlyCompleted.push(q.id);
          if (def && def.unlocks) toUnlock = [...toUnlock, ...def.unlocks];
          return { ...q, status: "completed" };
        }
        return q;
      });

      // Ajouter les nouvelles quêtes déverrouillées (si pas déjà présentes)
      const existingIds = updated.map(q => q.id);
      toUnlock.forEach(qId => {
        if (!existingIds.includes(qId) && QUESTS_DB[qId]) {
          updated.push({
            id: qId,
            status: "active",
            objectives: QUESTS_DB[qId].objectives.map(o => ({ ...o }))
          });
        }
      });

      // Notifications + récompenses pour les quêtes terminées
      newlyCompleted.forEach(qId => {
        const def = QUESTS_DB[qId];
        if (!def) return;
        setTimeout(() => {
          setQuestNotif({ title: def.title, icon: def.icon, message: def.rewards?.message || "Quête terminée !" });
          if (def.rewards) {
            if (def.rewards.reputation)   modifyStat("reputation",   def.rewards.reputation);
            if (def.rewards.force)        modifyStat("force",        def.rewards.force);
            if (def.rewards.intelligence) modifyStat("intelligence", def.rewards.intelligence);
            if (def.rewards.moral)        modifyStat("moral",        def.rewards.moral);
            if (def.rewards.items) {
              setInventory(prev => [...prev, ...def.rewards.items]);
            }
          }
          addMessage(`✅ QUÊTE TERMINÉE : "${def.title}" — ${def.rewards?.message || ""}`);
        }, 300);
      });

      return updated;
    });
  };

  // Vérification automatique des objectifs de stat/possession
  React.useEffect(() => {
    Object.keys(stats).forEach(stat => {
      progressQuest("stat_reach", { stat, value: stats[stat] });
    });
  }, [stats]);

  React.useEffect(() => {
    const cigCount = inventory.filter(i => i === "cigarettes").length;
    if (cigCount > 0) progressQuest("have_item", { itemId: "cigarettes", count: cigCount });
    ["shivan","corde","plan_prison","dopant","sedatif","livre_adulte"].forEach(id => {
      if (inventory.includes(id)) progressQuest("have_item", { itemId: id, count: 1 });
    });
  }, [inventory]);

  // ─── ÉVÉNEMENTS ALÉATOIRES ──────────────────────────────
  const tryTriggerRandomEvent = (room) => {
    actionCounter.current += 1;
    const cfg = GAME_SETTINGS.PROGRESSION;
    if (actionCounter.current % cfg.RANDOM_EVENT_INTERVAL !== 0) return;

    const pool = RANDOM_EVENTS.filter(ev =>
      !ev.rooms || ev.rooms.includes(room)
    );
    if (pool.length === 0) return;

    // Sélection pondérée
    const totalWeight = pool.reduce((sum, ev) => sum + (ev.weight || 10), 0);
    let rand = Math.random() * totalWeight;
    let chosen = pool[pool.length - 1];
    for (const ev of pool) {
      rand -= (ev.weight || 10);
      if (rand <= 0) { chosen = ev; break; }
    }

    // Petite chance que l'événement ne se déclenche pas (imprévisibilité)
    if (Math.random() < 0.25) return;

    setActiveEvent(chosen);
  };

  const handleEventResolution = (effect) => {
    setActiveEvent(null);
    if (!effect) return;

    if (effect.message)    addMessage(`📌 ${effect.message}`);
    if (effect.reputation) modifyStat("reputation",   effect.reputation);
    if (effect.moral)      modifyStat("moral",        effect.moral);
    if (effect.force)      modifyStat("force",        effect.force);
    if (effect.intelligence) modifyStat("intelligence", effect.intelligence);
    if (effect.agilite)    modifyStat("agilite",      effect.agilite);
    if (effect.resistance) modifyStat("resistance",   effect.resistance);
    if (effect.energy)     setEnergy(e => clamp(e + effect.energy));
    if (effect.item)       setInventory(prev => [...prev, effect.item]);
    if (effect.npcTrust)   modifyTrust(effect.npcTrust.id, effect.npcTrust.value);

    if (effect.removeItem) {
      setInventory(prev => {
        const copy = [...prev];
        let count = effect.removeCount || 1;
        const next = copy.filter(id => {
          if (id === effect.removeItem && count > 0) { count--; return false; }
          return true;
        });
        if (effect.itemGain) {
          return [...next, ...Array(effect.itemGainCount || 1).fill(effect.itemGain)];
        }
        return next;
      });
    }

    // Effet avec risque (ex : achat suspect)
    if (effect.risk && Math.random() < effect.risk) {
      addMessage("🚨 C'était un piège ! FOUILLE !");
      triggerShakedown();
    }
  };

  // ─── ÉCONOMIE ───────────────────────────────────────────
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
      const idx = newInv.indexOf(itemId);
      if (idx > -1) {
        newInv.splice(idx, 1);
        return [...newInv, ...Array(gain).fill("cigarettes")];
      }
      return prev;
    });
    if (gain > 0) addMessage(`💰 Vendu ${item.name} pour ${gain} 🚬`);
  };

  // ─── FOUILLE ────────────────────────────────────────────
  const triggerShakedown = () => {
    setIsShakedown(true);
    addMessage("🚨 FOUILLE ! Les gardes arrivent !");
    setTimeout(() => {
      setInventory(prev => {
        const illegal = prev.filter(id => ITEMS_DB[id]?.illegal);
        if (illegal.length > 0)
          addMessage(`🚫 Confisqué : ${illegal.map(id => ITEMS_DB[id].name).join(", ")}`);
        return prev.filter(id => !ITEMS_DB[id]?.illegal);
      });
      setIsShakedown(false);
    }, 2000);
  };

  // ─── UTILISATION D'OBJETS ───────────────────────────────
  const useItem = (id, index) => {
    if (id === "livre_adulte") {
      modifyStat("moral",        30);
      modifyStat("intelligence",  1);
      addMessage("📖 Lecture terminée. +30 Moral, +1 Intelligence.");
      progressQuest("use_item", { itemId: "livre_adulte" });
    } else if (id === "cigarettes") {
      modifyStat("moral",       10);
      modifyStat("reputation",   1);
      addMessage("🚬 Pause clope. +10 Moral, +1 Rép.");
    } else if (id === "dopant") {
      modifyStat("force",       5);
      modifyStat("resistance",  3);
      modifyStat("moral",      -5);
      addMessage("🧪 Dopant absorbé. +5 Force, +3 Résistance. −5 Moral.");
    } else if (id === "sedatif") {
      modifyStat("moral",      10);
      setEnergy(e => clamp(e + 30));
      addMessage("💊 Sédatif pris. +10 Moral, +30 Énergie.");
    } else if (id === "photo_famille") {
      modifyStat("moral",      15);
      addMessage("🖼️ Tu regardes la photo. Le moral remonte légèrement.");
      return; // Ne pas consommer
    } else return;

    setInventory(prev => prev.filter((_, i) => i !== index));
  };

  // ─── LOGIQUE PRINCIPALE DES ACTIONS ─────────────────────
  const handleAction = (action) => {
    if (isShakedown || activeEvent) return;
    const now    = time % 1440;
    const isNight = (now > 1320 || now < 360);
    const cfg    = GAME_SETTINGS.PROGRESSION;

    // 1. Déplacements
    if (action.type === "move") {
      if (isNight && !["cell", "solitary"].includes(action.leads_to)) {
        const trust      = relations["garde_corridor"] || 0;
        const riskReduce = trust > 50 ? 0.25 : 0;          // Garde corrompu réduit le risque
        const patrolInfo = quests.some(q => q.id === "quest_rat_network" && q.status === "completed");
        const baseRisk   = patrolInfo ? 0.45 : 0.75;        // Info patrouilles = risque réduit
        const risk       = Math.max(0, baseRisk - (stats.agilite * 0.025) - riskReduce);
        if (Math.random() < risk) {
          addMessage("🚨 PATROUILLE ! Direction le trou !");
          modifyStat("reputation", -5);
          setTime(t => t + 600);
          setCurrentRoom("solitary");
          return;
        }
      }
      if (!isNight && Math.random() < 0.07) triggerShakedown();
      setCurrentRoom(action.leads_to);
      setTime(t => t + 10);
      tryTriggerRandomEvent(action.leads_to);
    }

    // 2. Cantine
    else if (action.type === "eat_event") {
      const sched = WORLD_DATA.schedule;
      const isOpen = (now >= sched.canteen.start && now <= sched.canteen.end) ||
                     (now >= sched.canteen_evening.start && now <= sched.canteen_evening.end);
      if (!isOpen) return addMessage("🚫 La cantine est fermée.");
      setEnergy(e => clamp(e + 40));
      modifyStat("moral", 3);
      setTime(t => t + 30);
      addMessage("🍴 Repas avalé. +40 Énergie, +3 Moral.");
      progressQuest("eat");
    }

    // 3. Entraînement (avec cooldown et gains réduits)
    else if (action.type === "train") {
      const key       = action.cooldownKey || action.stat;
      const lastTrain = trainCooldowns[key] || 0;
      const minWait   = cfg.COOLDOWN_TRAIN_MINUTES;

      if (time - lastTrain < minWait && lastTrain !== 0) {
        const remaining = minWait - (time - lastTrain);
        addMessage(`⏳ Trop tôt pour reprendre. Attends encore ${remaining} min.`);
        return;
      }
      if (energy < action.energy) return addMessage("⚠️ Trop fatigué...");

      const gain = cfg.TRAIN_GAIN; // +1 par défaut
      modifyStat(action.stat, gain);
      setEnergy(e => clamp(e - action.energy));
      setTime(t => t + 45);
      setTrainCooldowns(prev => ({ ...prev, [key]: time }));
      addMessage(`💪 +${gain} ${action.stat}. Énergie −${action.energy}.`);
      progressQuest("train", { stat: action.stat });
    }

    // 4. Parloir
    else if (action.type === "visiting_event") {
      setTime(t => t + 60);
      if (stats.reputation >= 30) {
        const gift = Math.random() > 0.5 ? "cigarettes" : "livre_adulte";
        setInventory(prev => [...prev, gift]);
        addMessage(`🎁 Visite : Ton contact t'a donné : ${ITEMS_DB[gift].name}`);
      } else {
        modifyStat("moral", 15);
        addMessage("👋 Visite : Voir un visage ami remonte le moral. +15 Moral.");
      }
    }

    // 5. Sommeil
    else if (action.type === "sleep") {
      setTime(480);
      setEnergy(100);
      setTrainCooldowns({}); // Reset des cooldowns au réveil
      modifyStat("moral", 3);
      addMessage("🌞 Une nouvelle journée commence. Les cooldowns sont réinitialisés.");
      setCurrentRoom("cell");
      progressQuest("sleep");
    }

    // 6. Fin de punition
    else if (action.type === "wait_punishment") {
      setCurrentRoom("cell");
      setTime(t => t + 60);
      modifyStat("moral", -5);
      addMessage("⏰ Fin de peine. Retour en cellule. −5 Moral.");
    }

    // 7. Douche
    else if (action.type === "shower_event") {
      modifyStat("moral",  8);
      setTime(t => t + 20);
      setEnergy(e => clamp(e + 5));
      addMessage("🚿 Douche froide. +8 Moral, léger regain d'énergie.");
      tryTriggerRandomEvent("showers");
    }

    // 8. Regarder la télé
    else if (action.type === "watch_tv") {
      modifyStat("moral", 5);
      setTime(t => t + 30);
      addMessage("📺 Un show de bas étage. +5 Moral. Le cerveau fond un peu.");
    }

    // 9. Jouer aux cartes
    else if (action.type === "play_cards") {
      const win = Math.random() < 0.45;
      if (win) {
        setInventory(prev => [...prev, "cigarettes"]);
        addMessage("🃏 Tu as gagné la partie ! +1 Cigarette.");
      } else {
        addMessage("🃏 Pas de chance cette fois. Tu perds quelques minutes.");
      }
      setTime(t => t + 20);
    }

    // 10. Infirmerie
    else if (action.type === "infirmary_event") {
      const trust = relations["Jocelyn"] || 0;
      const hpBonus = trust >= 40 ? 30 : 15;
      setEnergy(e => clamp(e + hpBonus));
      modifyStat("moral", 5);
      setTime(t => t + 20);
      addMessage(`🏥 Jocelyn te soigne. +${hpBonus} Énergie, +5 Moral.`);
    }

    else if (action.type === "infirmary_steal") {
      if (Math.random() < 0.5) {
        setInventory(prev => [...prev, "sedatif"]);
        addMessage("💊 Tu as discrètement pris un sédatif. 🤫");
        modifyTrust("Jocelyn", -5);
      } else {
        addMessage("🚨 Jocelyn t'a vu ! Elle est déçue.");
        modifyStat("reputation", -3);
        modifyTrust("Jocelyn", -15);
      }
      setTime(t => t + 15);
    }

    // 11. Bureau — Demander des privilèges
    else if (action.type === "upgrade") {
      if (stats.intelligence >= 20 && stats.reputation >= 20) {
        modifyStat("moral", 15);
        setEnergy(e => clamp(e + 20));
        addMessage("🖊️ Directeur accordé : meilleure literie. +15 Moral, +20 Énergie.");
      } else {
        addMessage("🚫 Le directeur t'ignore. (Intelligence et Réputation ≥ 20 requises)");
      }
      setTime(t => t + 30);
    }

    // 12. Bureau — Balancer
    else if (action.type === "rat_action") {
      modifyStat("reputation",   -10);
      modifyStat("intelligence",   2);
      modifyStat("moral",         -8);
      setTime(t => t + 30);
      addMessage("🐀 Tu as vendu des informations. −10 Rép (si ça se sait), +2 Intelligence.");
    }

    // 13. Hack des caméras
    else if (action.type === "hack") {
      if (stats.intelligence >= 15) {
        addMessage("💻 Tu désactives les caméras pour 2h. La voie est libre.");
        setTime(t => t + 60);
        progressQuest("action", { actionType: "hack" });
      } else {
        addMessage("💻 Trop complexe. Intelligence insuffisante (≥15 requise).");
      }
    }

    // 14. Entrée
    else if (action.type === "entrance_event") {
      addMessage("👮 Le garde d'entrée te dévisage mais ne dit rien.");
      setTime(t => t + 10);
    }

    // 15. Actions sociales
    else if (action.type === "social") {
      handleSocialAction(action);
    }
  };

  // ─── INTERACTIONS SOCIALES (enrichies) ──────────────────
  const handleSocialAction = ({ subType, npc, specialAction }) => {
    const trustLevel  = relations[npc.id] || 0;
    const npcData     = NPCS_DB[npc.id] || npc;
    const isAssocial  = npc.personnality === "associal";

    // Mise à jour du dialogue contextuel selon la confiance
    const getDialog = () => {
      if (!npcData.trustLevels) return (npc.dialogs || ["..."])[Math.floor(Math.random() * ((npc.dialogs || ["..."]).length))];
      const levels = Object.entries(npcData.trustLevels)
        .map(([k, v]) => [parseInt(k), v])
        .sort((a, b) => a[0] - b[0]);
      let bestDialog = levels[0][1];
      for (const [threshold, dialog] of levels) {
        if (trustLevel >= threshold) bestDialog = dialog;
      }
      return bestDialog;
    };

    if (subType === "talk") {
      const successChance = 0.3 + (stats.intelligence / 120);
      if (Math.random() < successChance) {
        modifyStat("reputation", 1);
        modifyTrust(npc.id, 3);
        addMessage(`💬 ${npc.name} : "${getDialog()}" (+1 Rép, +3 Confiance)`);
      } else {
        addMessage(`💬 ${npc.name} : "${getDialog()}"`);
      }
      progressQuest("talk_npc", { npcId: npc.id });
    }

    else if (subType === "charm") {
      if (isAssocial || (npcData.charm_threshold && trustLevel < npcData.charm_threshold)) {
        addMessage(`🚫 ${npc.name} t'envoie balader. Gagne d'abord sa confiance.`);
        modifyTrust(npc.id, -2);
        return;
      }
      const charismeMult = stats.intelligence / 80;
      const gain         = Math.floor(5 + charismeMult * 5);
      modifyTrust(npc.id, gain);
      addMessage(`❤️ Tu charmes ${npc.name}. +${gain} Confiance.`);
      progressQuest("charm_npc", { npcId: npc.id });
    }

    else if (subType === "humiliate") {
      modifyStat("reputation",  4);
      modifyStat("moral",      -5);
      modifyTrust(npc.id,      -15);
      addMessage(`🔥 Humiliation publique de ${npc.name}. +4 Rép. −5 Moral.`);
      progressQuest("humiliate");
      if ((npc.force || 0) > stats.force - 5) {
        addMessage(`😡 ${npc.name} explose de rage et attaque !`);
        setTimeout(() => setCombatNpc(npc), 800);
      }
    }

    else if (subType === "specialAction") {
      handleSpecialNpcAction(npc, specialAction);
    }
  };

  // ─── ACTION SPÉCIALE PNJ ────────────────────────────────
  const handleSpecialNpcAction = (npc, actionType) => {
    const trust = relations[npc.id] || 0;
    const required = NPCS_DB[npc.id]?.specialUnlock?.trust || 999;

    if (trust < required) {
      addMessage(`🔒 Confiance insuffisante avec ${npc.name}. (${trust}/${required})`);
      return;
    }

    if (actionType === "bribe_guard") {
      const cigs = inventory.filter(i => i === "cigarettes").length;
      if (cigs < 5) return addMessage("⚠️ Pas assez de cigarettes pour corrompre Jones. (5 requis)");
      setInventory(prev => {
        let c = 5;
        return prev.filter(i => { if (i === "cigarettes" && c > 0) { c--; return false; } return true; });
      });
      modifyTrust("garde_corridor", 20);
      addMessage("👮 Jones empoche discrètement. Il sera plus souple cette nuit. +20 Confiance.");
    }

    else if (actionType === "recruit_ally") {
      addMessage("🤜 La Brute accepte de couvrir tes arrières. Elle interviendra si tu es attaqué.");
      modifyStat("reputation", 5);
    }

    else if (actionType === "get_plan") {
      if (inventory.includes("plan_prison")) return addMessage("T'as déjà le plan.");
      const cigs = inventory.filter(i => i === "cigarettes").length;
      if (cigs < 8) return addMessage("⚠️ Le Rat veut 8 cigarettes pour le plan.");
      setInventory(prev => {
        let c = 8;
        return [...prev.filter(i => { if (i === "cigarettes" && c > 0) { c--; return false; } return true; }), "plan_prison"];
      });
      addMessage("🗺️ Le Rat t'a remis le plan de la prison. L'évasion se précise.");
    }

    else if (actionType === "learn_secret") {
      modifyStat("intelligence", 3);
      addMessage("📖 Le Vieux te révèle quelque chose que les gardes ne voulaient pas que tu saches. +3 Intelligence.");
    }

    else if (actionType === "escape_help") {
      if (inventory.includes("sedatif")) {
        addMessage("💉 Jocelyn t'explique comment utiliser le sédatif sur un gardien. La voie du couloir est praticable.");
      } else {
        addMessage("💉 Jocelyn peut t'aider, mais il te faut d'abord un sédatif.");
      }
    }
  };

  // ─── GESTION DES CLICS SUR PNJ ──────────────────────────
  const handleNpcClick = (npc) => {
    setInteractingNpc(npc);
    // Backstory au premier clic si confiance = 0
    const trust = relations[npc.id] || 0;
    const npcData = NPCS_DB[npc.id];
    if (npcData && trust === 0 && npcData.backstory) {
      setTimeout(() => addMessage(`📌 ${npc.name} : "${npcData.backstory}"`), 300);
    }
  };

  // ─── COMBAT : VICTOIRE / DÉFAITE ────────────────────────
  const handleCombatWin = () => {
    const npc = combatNpc;
    modifyStat("reputation", 15);
    modifyTrust(npc.id, -20);
    addMessage(`🏆 Victoire contre ${npc.name} ! +15 Rép.`);
    progressQuest("combat_win", { npcId: npc.id });

    // Drop d'objet
    if (npc.inventory && npc.inventory.length > 0) {
      const drop = npc.inventory[Math.floor(Math.random() * npc.inventory.length)];
      setInventory(prev => [...prev, drop]);
      addMessage(`💰 ${npc.name} a lâché : ${ITEMS_DB[drop]?.name || drop}`);
    }
    setCombatNpc(null);
  };

  const handleCombatLose = () => {
    setEnergy(20);
    modifyStat("reputation", -3);
    addMessage("🤕 Tu t'es fait étaler... −3 Rép.");
    setCurrentRoom("infirmary");
    setCombatNpc(null);
  };

  // ─── REJOINDRE UNE FACTION ──────────────────────────────
  const joinFaction = (factionId) => {
    setPlayerFaction(factionId);
    const faction = WORLD_DATA.gangs[factionId];
    modifyStat("reputation", 8);
    addMessage(`⚔️ Tu rejoins "${faction.name}". +8 Rép.`);
    progressQuest("join_faction");
    setInteractingNpc(null);
  };

  // ─── NOTIFICATION QUÊTE (auto-dismiss) ──────────────────
  React.useEffect(() => {
    if (!questNotif) return;
    const t = setTimeout(() => setQuestNotif(null), 4000);
    return () => clearTimeout(t);
  }, [questNotif]);

  // ─── RENDU ──────────────────────────────────────────────
  const faction = WORLD_DATA.gangs[playerFaction];

  return React.createElement("div", {
    className: `min-h-screen p-4 max-w-5xl mx-auto space-y-4 ${isShakedown ? "opacity-40 pointer-events-none" : ""}`
  },

    // ── HUD ─────────────────────────────────────────────
    React.createElement("div", { className: "grid grid-cols-3 md:grid-cols-10 gap-2 bg-gray-900 p-4 rounded-xl border border-blue-900/40 shadow-xl text-white" },
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-green-400 font-bold uppercase" }, "⚡ Énergie"),  React.createElement("p", { className: "text-lg font-black" }, energy + "%")),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-yellow-500 font-bold uppercase" }, "🔥 Rép"),     React.createElement("p", { className: "text-lg font-black" }, stats.reputation)),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-red-500 font-bold uppercase" }, "💪 Force"),    React.createElement("p", { className: "text-lg font-black" }, stats.force)),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-pink-500 font-bold uppercase" }, "❤️ Moral"),    React.createElement("p", { className: "text-lg font-black" }, stats.moral)),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-purple-400 font-bold uppercase" }, "🏃 Agi"),     React.createElement("p", { className: "text-lg font-black" }, stats.agilite)),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-orange-400 font-bold uppercase" }, "🛡️ Rés"),    React.createElement("p", { className: "text-lg font-black" }, stats.resistance)),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-blue-400 font-bold uppercase" }, "🧠 Int"),      React.createElement("p", { className: "text-lg font-black" }, stats.intelligence)),
      React.createElement("div", null, React.createElement("p", { className: "text-[8px] text-blue-300 font-bold uppercase" }, "🕒 Heure"),    React.createElement("p", { className: "text-lg font-black" }, formatTime(time))),
      React.createElement("div", null, React.createElement("p", { className: `text-[8px] font-bold uppercase ${faction.color}` }, "⚔️ Faction"), React.createElement("p", { className: `text-[10px] font-black ${faction.color}` }, faction.name)),
      React.createElement("div", { className: "flex items-end justify-end" },
        React.createElement("button", {
          onClick: () => setShowQuestLog(true),
          className: "px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-black rounded text-[10px] uppercase transition-all"
        }, "📋")
      )
    ),

    // ── VUE DE LA SALLE ─────────────────────────────────
    React.createElement(RoomView, {
      roomId:         currentRoom,
      npcs:           (WORLD_DATA.npcs[currentRoom] || []).filter(n => n && n.id),
      hotspots:       WORLD_DATA.rooms[currentRoom]?.hotspots || [],
      onHotspotClick: handleAction,
      onNpcClick:     handleNpcClick
    }),

    // ── LOGS & INVENTAIRE ────────────────────────────────
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 h-44" },
      React.createElement("div", { className: "bg-black/60 p-4 rounded-xl overflow-y-auto border border-white/5 font-mono text-[11px] text-gray-400" },
        messages.map(m => React.createElement("div", { key: m.id, className: "mb-1 border-l-2 border-blue-900 pl-2" }, `> ${m.text}`))
      ),
      React.createElement("div", { className: "bg-gray-900/50 p-4 rounded-xl border border-white/5" },
        React.createElement("h3", { className: "text-[10px] text-gray-500 uppercase font-black mb-3" }, "Poches"),
        React.createElement("div", { className: "flex flex-wrap gap-2" },
          inventory.map((id, i) =>
            React.createElement("div", {
              key: i,
              onClick:   () => useItem(id, i),
              title:     ITEMS_DB[id]?.name || id,
              className: `item-slot ${ITEMS_DB[id]?.illegal ? "item-illegal" : ""} cursor-pointer`
            }, ITEMS_DB[id]?.icon || "❓")
          )
        )
      )
    ),

    // ── NOTIFICATION QUÊTE ───────────────────────────────
    questNotif && React.createElement("div", {
      className: "fixed top-6 right-6 z-50 bg-green-900 border-2 border-green-500 rounded-xl px-6 py-4 shadow-2xl max-w-xs animate-bounce"
    },
      React.createElement("p", { className: "text-green-300 text-[9px] font-bold uppercase mb-1" }, "✅ Quête terminée !"),
      React.createElement("p", { className: "text-white font-black text-sm" }, `${questNotif.icon} ${questNotif.title}`),
      React.createElement("p", { className: "text-green-400 text-[10px] mt-1" }, questNotif.message)
    ),

    // ── MODALE PNJ ───────────────────────────────────────
    interactingNpc && React.createElement("div", { className: "fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" },
      React.createElement("div", { className: "bg-gray-900 border-2 border-blue-600 p-6 rounded-xl max-w-sm w-full" },

        // En-tête PNJ
        React.createElement("div", { className: "text-center mb-4" },
          React.createElement("div", { className: "text-4xl mb-2" }, NPCS_DB[interactingNpc.id]?.icon || interactingNpc.icon || "👤"),
          React.createElement("h2", { className: "text-white font-black text-2xl" }, interactingNpc.name),
          React.createElement("p", { className: `text-[11px] font-bold uppercase mb-1 ${WORLD_DATA.gangs[NPCS_DB[interactingNpc.id]?.faction]?.color || "text-gray-500"}` },
            WORLD_DATA.gangs[NPCS_DB[interactingNpc.id]?.faction]?.name || "Indépendant"
          ),
          React.createElement("p", { className: "text-pink-500 text-xs" }, `Confiance : ${relations[interactingNpc.id] || 0} pts`)
        ),

        // Boutons d'interaction
        React.createElement("div", { className: "grid grid-cols-1 gap-2" },

          // Trade / Fight
          (interactingNpc.type === "trade" || interactingNpc.type === "hybrid") &&
            React.createElement("button", { onClick: () => { setTradeNpc(interactingNpc); setInteractingNpc(null); }, className: "py-3 bg-yellow-700 hover:bg-yellow-600 text-white font-bold rounded transition-colors" }, "🛒 TROQUER"),

          (interactingNpc.type === "fight" || interactingNpc.type === "hybrid") &&
            React.createElement("button", { onClick: () => { setCombatNpc(interactingNpc); setInteractingNpc(null); }, className: "py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded transition-colors" }, "💀 COMBATTRE"),

          // Actions sociales
          React.createElement("button", { onClick: () => { handleAction({ type: "social", subType: "talk",      npc: interactingNpc }); setInteractingNpc(null); }, className: "py-2 bg-gray-800 hover:bg-gray-700 text-blue-300 rounded transition-colors text-sm" }, "🗣️ Parler"),
          React.createElement("button", { onClick: () => { handleAction({ type: "social", subType: "charm",     npc: interactingNpc }); setInteractingNpc(null); }, className: "py-2 bg-gray-800 hover:bg-gray-700 text-pink-300 rounded transition-colors text-sm" }, "✨ Charmer"),
          React.createElement("button", { onClick: () => { handleAction({ type: "social", subType: "humiliate", npc: interactingNpc }); setInteractingNpc(null); }, className: "py-2 bg-gray-800 hover:bg-gray-700 text-orange-300 rounded transition-colors text-sm" }, "🔥 Humilier"),

          // Action spéciale (si seuil de confiance atteint)
          (() => {
            const npcDef = NPCS_DB[interactingNpc.id];
            if (!npcDef?.specialUnlock) return null;
            const trust    = relations[interactingNpc.id] || 0;
            const unlocked = trust >= npcDef.specialUnlock.trust;
            return React.createElement("button", {
              onClick: () => {
                if (unlocked) {
                  handleAction({ type: "social", subType: "specialAction", npc: interactingNpc, specialAction: npcDef.specialUnlock.action });
                  setInteractingNpc(null);
                }
              },
              className: `py-2 rounded text-sm font-bold border transition-colors ${
                unlocked
                  ? "border-green-600 bg-green-900/30 hover:bg-green-900/60 text-green-300"
                  : "border-gray-800 bg-gray-900/20 text-gray-600 cursor-not-allowed"
              }`
            },
              unlocked
                ? `${npcDef.specialUnlock.label} (DÉVERROUILLÉ)`
                : `🔒 Action spéciale (${trust}/${npcDef.specialUnlock.trust} confiance)`
            );
          })(),

          // Rejoindre faction si applicable
          playerFaction === "neutre" && NPCS_DB[interactingNpc.id]?.faction && NPCS_DB[interactingNpc.id]?.faction !== "guards" && NPCS_DB[interactingNpc.id]?.faction !== "neutre" &&
            React.createElement("button", {
              onClick: () => joinFaction(NPCS_DB[interactingNpc.id].faction),
              className: "py-2 bg-gray-800 hover:bg-gray-700 text-purple-300 rounded transition-colors text-sm border border-purple-900"
            }, `⚔️ Rejoindre "${WORLD_DATA.gangs[NPCS_DB[interactingNpc.id].faction]?.name}"`),

          React.createElement("button", { onClick: () => setInteractingNpc(null), className: "mt-1 text-gray-500 text-[10px] hover:text-gray-400 transition-colors" }, "[ ANNULER ]")
        )
      )
    ),

    // ── MODALES COMBAT & TRADE ───────────────────────────
    combatNpc && React.createElement(CombatModal, {
      npc: combatNpc, stats, inventory,
      onWin:  handleCombatWin,
      onLose: handleCombatLose
    }),

    tradeNpc && React.createElement(TradeModal, {
      npc: tradeNpc, inventory,
      onBuy:   buyItem,
      onSell:  sellItem,
      onClose: () => setTradeNpc(null)
    }),

    // ── ÉVÉNEMENT ALÉATOIRE ──────────────────────────────
    activeEvent && React.createElement(EventModal, {
      event:     activeEvent,
      stats,
      inventory,
      onResolve: handleEventResolution
    }),

    // ── JOURNAL DE QUÊTES ────────────────────────────────
    showQuestLog && React.createElement(QuestLog, {
      quests,
      onClose: () => setShowQuestLog(false)
    })
  );
}
