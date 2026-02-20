function CombatModal({ npc, stats, inventory, onWin, onLose }) {
  // On utilise tes réglages globaux
  const cfg = GAME_SETTINGS.COMBAT;
  
  const [playerHp, setPlayerHp] = React.useState(cfg.BASE_HP + stats.resistance);
  const [enemyHp, setEnemyHp] = React.useState(cfg.BASE_HP + npc.force);
  const [target, setTarget] = React.useState(null);
  const [isGameOver, setIsGameOver] = React.useState(false);

  // Calcul des dégâts avec tes multiplicateurs
  const weaponBonus = inventory.includes("shivan") ? 10 : (inventory.includes("savon_corde") ? 5 : 0);
  const playerDamage = cfg.BASE_DAMAGE + Math.floor(stats.force / 5) + weaponBonus;

  // Apparition des cibles (Vitesse liée à l'agilité)
  React.useEffect(() => {
    if (isGameOver) return;
    
    const spawnTarget = () => {
      const isBlock = Math.random() > 0.7; // 30% de chance de devoir parer
      setTarget({
        x: Math.floor(Math.random() * 70) + 15 + "%",
        y: Math.floor(Math.random() * 60) + 20 + "%",
        type: isBlock ? "block" : "attack",
        id: Math.random()
      });
    };

    const speed = Math.max(cfg.SPAWN_SPEED_MIN, cfg.SPAWN_SPEED_BASE - (stats.agilite * 15));
    const interval = setInterval(spawnTarget, speed);
    return () => clearInterval(interval);
  }, [isGameOver, stats.agilite]);

  // Gestion du temps limite pour cliquer
  React.useEffect(() => {
    if (!target || isGameOver) return;
    const timer = setTimeout(() => {
      if (target.type === "block") {
          setPlayerHp(prev => prev - 8); // Dégâts si on rate la parade
      }
      setTarget(null);
    }, cfg.TARGET_TIMEOUT);
    return () => clearTimeout(timer);
  }, [target, isGameOver]);

  // Vérification de l'état du combat
  React.useEffect(() => {
    if (playerHp <= 0 && !isGameOver) { 
        setIsGameOver(true); 
        setTimeout(onLose, 800); 
    }
    if (enemyHp <= 0 && !isGameOver) { 
        setIsGameOver(true); 
        setTimeout(onWin, 800); 
    }
  }, [playerHp, enemyHp]);

  return React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm combat-overlay" },
    React.createElement("div", { className: "w-full max-w-xl h-96 relative border-4 border-red-600 rounded-3xl overflow-hidden bg-gray-900 shadow-[0_0_50px_rgba(220,38,38,0.5)]" },
      
      // BARRES DE VIE (Top UI)
      React.createElement("div", { className: "absolute top-0 w-full p-4 flex justify-between bg-black/50 border-b border-red-900/50" },
        React.createElement("div", { className: "w-1/3" },
          React.createElement("p", { className: "text-[9px] text-blue-400 font-bold uppercase mb-1" }, "Toi"),
          React.createElement("div", { className: "h-3 bg-gray-800 rounded-full border border-blue-900" },
            React.createElement("div", { 
                className: "h-full bg-blue-500 transition-all duration-300", 
                style: { width: `${(playerHp / (cfg.BASE_HP + stats.resistance)) * 100}%` } 
            })
          )
        ),
        React.createElement("div", { className: "w-1/3 text-right" },
          React.createElement("p", { className: "text-[9px] text-red-500 font-bold uppercase mb-1" }, npc.name),
          React.createElement("div", { className: "h-3 bg-gray-800 rounded-full border border-red-900" },
            React.createElement("div", { 
                className: "h-full bg-red-500 transition-all duration-300", 
                style: { width: `${(enemyHp / (cfg.BASE_HP + npc.force)) * 100}%` } 
            })
          )
        )
      ),

      // ZONE DE JEU (Cibles)
      !isGameOver && target && React.createElement("button", {
        onClick: (e) => {
            e.stopPropagation();
            if (target.type === "attack") setEnemyHp(prev => prev - playerDamage);
            setTarget(null);
        },
        style: { left: target.x, top: target.y },
        className: `absolute w-16 h-16 rounded-full border-4 animate-ping flex items-center justify-center transition-transform active:scale-150 ${
            target.type === "attack" ? "border-red-500 bg-red-500/20" : "border-blue-500 bg-blue-500/20"
        }`
      }, target.type === "attack" ? "🥊" : "🛡️"),

      // ECRAN DE FIN
      isGameOver && React.createElement("div", { className: "absolute inset-0 flex items-center justify-center bg-black/60 z-10" },
        React.createElement("h2", { className: "text-5xl font-black italic text-white animate-bounce" }, 
            playerHp <= 0 ? "K.O." : "VICTOIRE !"
        )
      )
    )
  );
}
