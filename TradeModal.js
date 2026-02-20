function CombatModal({ npc, stats, inventory, onWin, onLose }) {
  const [playerHp, setPlayerHp] = React.useState(20 + (stats.resistance));
  const [enemyHp, setEnemyHp] = React.useState(20 + (npc.force));
  const [target, setTarget] = React.useState(null); // {x, y, type}
  const [isGameOver, setIsGameOver] = React.useState(false);

  // Détection du bonus d'arme
  const weaponBonus = inventory.includes("shivan") ? 8 : (inventory.includes("savon_corde") ? 4 : 0);
  const playerDamage = 5 + Math.floor(stats.force / 5) + weaponBonus;

  // Apparition des cibles
  React.useEffect(() => {
    if (isGameOver) return;

    const spawnTarget = () => {
      const types = ["attack", "attack", "block"]; // 2 chances sur 3 d'avoir une attaque
      const newType = types[Math.floor(Math.random() * types.length)];
      setTarget({
        x: Math.floor(Math.random() * 80) + 10 + "%",
        y: Math.floor(Math.random() * 60) + 20 + "%",
        type: newType,
        id: Math.random()
      });
    };

    const interval = setInterval(spawnTarget, 1200 - Math.min(800, stats.agilite * 10));

    return () => clearInterval(interval);
  }, [isGameOver, stats.agilite]);

  // Gestion de la disparition automatique (pour le blocage raté)
  React.useEffect(() => {
    if (!target || isGameOver) return;

    const timeout = setTimeout(() => {
      if (target.type === "block") {
        // Si on rate une parade, on prend cher
        setPlayerHp(prev => prev - 10);
      }
      setTarget(null);
    }, 1000); // Temps pour cliquer

    return () => clearTimeout(timeout);
  }, [target, isGameOver]);

  // Vérification victoire/défaite
  React.useEffect(() => {
    if (playerHp <= 0 && !isGameOver) {
      setIsGameOver(true);
      setTimeout(onLose, 1000);
    }
    if (enemyHp <= 0 && !isGameOver) {
      setIsGameOver(true);
      setTimeout(onWin, 1000);
    }
  }, [playerHp, enemyHp]);

  const handleTargetClick = (e) => {
    e.stopPropagation();
    if (target.type === "attack") {
      setEnemyHp(prev => prev - playerDamage);
    }
    setTarget(null);
  };

  return React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center combat-overlay bg-black/80 backdrop-blur-sm" },
    React.createElement("div", { className: "relative w-[600px] h-[400px] bg-gray-900 border-4 border-red-900 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(220,38,38,0.3)]" },
      
      // Header : Barres de vie
      React.createElement("div", { className: "p-4 grid grid-cols-2 gap-4 bg-black/50" },
        React.createElement("div", null,
          React.createElement("p", { className: "text-[10px] text-blue-400 font-bold uppercase mb-1" }, "Toi (Résistance)"),
          React.createElement("div", { className: "h-4 bg-gray-800 rounded-full overflow-hidden border border-blue-900" },
            React.createElement("div", { style: { width: `${(playerHp / (20 + stats.resistance)) * 100}%` }, className: "h-full bg-blue-600 transition-all duration-300" })
          )
        ),
        React.createElement("div", { className: "text-right" },
          React.createElement("p", { className: "text-[10px] text-red-500 font-bold uppercase mb-1" }, npc.name),
          React.createElement("div", { className: "h-4 bg-gray-800 rounded-full overflow-hidden border border-red-900" },
            React.createElement("div", { style: { width: `${(enemyHp / (20 + npc.force)) * 100}%` }, className: "h-full bg-red-600 transition-all duration-300" })
          )
        )
      ),

      // Zone de jeu
      React.createElement("div", { className: "flex-1 relative" },
        !isGameOver && target && React.createElement("button", {
          onClick: handleTargetClick,
          style: { left: target.x, top: target.y },
          className: `absolute w-16 h-16 rounded-full border-4 animate-ping flex items-center justify-center transition-transform active:scale-150 ${
            target.type === "attack" ? "border-red-500 bg-red-500/20" : "border-blue-500 bg-blue-500/20"
          }`
        }, target.type === "attack" ? "🥊" : "🛡️"),
        
        isGameOver && React.createElement("div", { className: "absolute inset-0 flex items-center justify-center bg-black/60 z-10" },
          React.createElement("h2", { className: "text-4xl font-black italic text-white" }, playerHp <= 0 ? "K.O." : "VICTOIRE !")
        )
      ),

      // Message d'aide
      React.createElement("div", { className: "p-2 text-center bg-black/40" },
        React.createElement("p", { className: "text-[9px] text-gray-400 uppercase tracking-tighter" }, 
          inventory.includes("shivan") ? "⚔️ Bonus Shivan actif" : "👊 Combat à mains nues"
        )
      )
    )
  );
}
