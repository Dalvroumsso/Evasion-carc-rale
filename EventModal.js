// ============================================================
//  EventModal.js — Gestion des événements aléatoires
// ============================================================
function EventModal({ event, stats, inventory, onResolve }) {
  if (!event) return null;

  const canTakeChoice = (choice) => {
    if (!choice.condition) return true;
    const { stat, min, item, count } = choice.condition;
    if (stat && stats[stat] !== undefined) return stats[stat] >= min;
    if (item) return inventory.filter(i => i === item).length >= (count || 1);
    return true;
  };

  return React.createElement(
    "div",
    { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm" },
    React.createElement(
      "div",
      { className: "bg-gray-950 border-2 border-yellow-700 rounded-2xl max-w-lg w-full mx-4 shadow-[0_0_60px_rgba(161,98,7,0.3)] overflow-hidden" },

      // En-tête
      React.createElement(
        "div",
        { className: "bg-yellow-900/30 border-b border-yellow-800/50 px-6 py-4" },
        React.createElement("p", { className: "text-yellow-500 text-[9px] font-bold uppercase tracking-widest mb-1" }, "⚡ ÉVÉNEMENT"),
        React.createElement("h2", { className: "text-white font-black text-xl" }, event.title)
      ),

      // Description
      React.createElement(
        "div",
        { className: "px-6 py-5" },
        React.createElement("p", { className: "text-gray-300 text-sm leading-relaxed mb-6" }, event.description),

        // Choix
        React.createElement(
          "div",
          { className: "space-y-3" },
          event.choices.map((choice, i) => {
            const available = canTakeChoice(choice);
            return React.createElement(
              "button",
              {
                key: i,
                onClick: () => available && onResolve(choice.effect),
                className: `w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  available
                    ? "border-yellow-700/60 bg-yellow-900/10 hover:bg-yellow-900/30 text-white hover:border-yellow-500"
                    : "border-gray-800 bg-gray-900/30 text-gray-600 cursor-not-allowed"
                }`
              },
              React.createElement("div", { className: "flex items-start gap-3" },
                React.createElement("span", { className: "text-yellow-500 font-black mt-0.5" }, "›"),
                React.createElement("div", null,
                  React.createElement("span", null, choice.text),
                  !available && React.createElement("span", {
                    className: "block text-[10px] text-red-500 mt-1"
                  }, "⛔ Prérequis non remplis")
                )
              )
            );
          })
        )
      )
    )
  );
}
