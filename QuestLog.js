// ============================================================
//  QuestLog.js — Journal des quêtes
// ============================================================
function QuestLog({ quests, onClose }) {
  const [tab, setTab] = React.useState("active");

  const activeQuests    = quests.filter(q => q.status === "active");
  const completedQuests = quests.filter(q => q.status === "completed");

  const renderObjective = (obj) => {
    const done = obj.progress >= obj.count;
    return React.createElement(
      "div",
      { key: obj.id, className: `flex items-center gap-2 text-[11px] py-1 ${done ? "text-green-400" : "text-gray-400"}` },
      React.createElement("span", { className: `w-4 text-center flex-shrink-0 ${done ? "text-green-400" : "text-gray-600"}` }, done ? "✓" : "○"),
      React.createElement("span", null, obj.label),
      obj.count > 1 && React.createElement("span", { className: "ml-auto text-gray-600" }, `${obj.progress}/${obj.count}`)
    );
  };

  const renderQuest = (quest) => {
    const def = QUESTS_DB[quest.id];
    if (!def) return null;
    const total     = def.objectives.length;
    const done      = quest.objectives.filter(o => o.progress >= o.count).length;
    const pct       = Math.round((done / total) * 100);

    const actColors = { 1: "text-blue-400", 2: "text-orange-400", 3: "text-red-400" };
    const typeColors = { main: "border-yellow-700 bg-yellow-900/10", side: "border-gray-700 bg-gray-900/10" };

    return React.createElement(
      "div",
      { key: quest.id, className: `border rounded-xl p-4 mb-3 ${typeColors[def.type] || "border-gray-800"}` },
      React.createElement("div", { className: "flex items-start justify-between mb-2" },
        React.createElement("div", null,
          React.createElement("div", { className: "flex items-center gap-2 mb-1" },
            React.createElement("span", { className: "text-lg" }, def.icon),
            React.createElement("h3", { className: "text-white font-black text-sm" }, def.title),
            def.type === "main" && React.createElement("span", { className: "text-[8px] text-yellow-500 border border-yellow-700 px-1 rounded font-bold uppercase" }, "PRINCIPAL")
          ),
          React.createElement("p", { className: `text-[9px] font-bold uppercase ${actColors[def.act]}` }, `Acte ${def.act}`)
        ),
        quest.status === "completed"
          ? React.createElement("span", { className: "text-green-400 text-xs font-bold" }, "✓ TERMINÉ")
          : React.createElement("span", { className: "text-[10px] text-gray-500 font-mono" }, `${done}/${total}`)
      ),

      React.createElement("p", { className: "text-gray-400 text-[11px] mb-3 leading-relaxed" }, def.description),

      quest.status === "active" && React.createElement("div", null,
        React.createElement("div", { className: "h-1 bg-gray-800 rounded-full mb-2" },
          React.createElement("div", {
            className: "h-full bg-blue-500 rounded-full transition-all duration-500",
            style: { width: `${pct}%` }
          })
        ),
        def.objectives.map(objDef => {
          const progress = quest.objectives.find(o => o.id === objDef.id) || objDef;
          return renderObjective({ ...objDef, progress: progress.progress });
        })
      ),

      quest.status === "completed" && def.rewards && React.createElement(
        "div",
        { className: "text-[10px] text-green-400/70 italic border-t border-green-900/30 pt-2 mt-1" },
        def.rewards.message
      )
    );
  };

  return React.createElement(
    "div",
    { className: "fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" },
    React.createElement(
      "div",
      { className: "bg-gray-950 border border-blue-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]" },

      // Header
      React.createElement(
        "div",
        { className: "flex items-center justify-between px-6 py-4 border-b border-gray-800" },
        React.createElement("div", null,
          React.createElement("h2", { className: "text-white font-black text-xl" }, "📋 JOURNAL"),
          React.createElement("p", { className: "text-gray-500 text-[10px] uppercase tracking-widest" }, "Objectifs & Missions")
        ),
        React.createElement("button", {
          onClick: onClose,
          className: "text-gray-600 hover:text-white text-xl font-bold transition-colors"
        }, "✕")
      ),

      // Tabs
      React.createElement(
        "div",
        { className: "flex border-b border-gray-800" },
        ["active", "completed"].map(t =>
          React.createElement("button", {
            key: t,
            onClick: () => setTab(t),
            className: `flex-1 py-3 text-[11px] font-bold uppercase transition-colors ${
              tab === t ? "text-white border-b-2 border-blue-500" : "text-gray-600 hover:text-gray-400"
            }`
          },
          t === "active"
            ? `Actives (${activeQuests.length})`
            : `Terminées (${completedQuests.length})`
          )
        )
      ),

      // Contenu
      React.createElement(
        "div",
        { className: "flex-1 overflow-y-auto p-4" },
        tab === "active"
          ? activeQuests.length > 0
            ? activeQuests.map(renderQuest)
            : React.createElement("p", { className: "text-gray-600 text-center py-12 text-sm" }, "Aucune quête active.")
          : completedQuests.length > 0
            ? completedQuests.map(renderQuest)
            : React.createElement("p", { className: "text-gray-600 text-center py-12 text-sm" }, "Aucune quête terminée.")
      )
    )
  );
}
