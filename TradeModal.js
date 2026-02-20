function TradeModal({ npc, inventory, onBuy, onSell, onClose }) {
  if (!npc) return null;

  return React.createElement("div", { className: "fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" },
    React.createElement("div", { className: "bg-gray-900 border-2 border-yellow-600 p-6 rounded-xl max-w-2xl w-full grid grid-cols-2 gap-8 shadow-2xl" },
      
      // Colonne Achat
      React.createElement("div", null,
        React.createElement("h2", { className: "text-yellow-500 font-black text-xl mb-4 border-b border-yellow-900 pb-2" }, `🛒 ACHETER À ${npc.name}`),
        React.createElement("div", { className: "space-y-2 h-64 overflow-y-auto pr-2" },
          npc.inventory.map(itemId => {
            const item = ITEMS_DB[itemId];
            const cost = Math.ceil(item.value / 5);
            return React.createElement("div", { key: itemId, className: "flex items-center justify-between bg-black/40 p-2 rounded border border-white/5" },
              React.createElement("span", { className: "text-sm text-white" }, `${item.icon} ${item.name}`),
              React.createElement("button", { 
                onClick: () => onBuy(itemId),
                className: "bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded text-[10px] font-bold transition-colors"
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
                onClick: () => onSell(itemId, idx),
                className: "bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-[10px] font-bold transition-colors"
              }, `+${gain} 🚬`) : React.createElement("span", { className: "text-[10px] text-gray-500 italic" }, "Sans valeur")
            );
          })
        )
      ),

      // Bouton Quitter
      React.createElement("div", { className: "col-span-2 mt-4" },
        React.createElement("button", { 
          onClick: onClose,
          className: "w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg uppercase tracking-widest text-xs transition-colors"
        }, "Quitter le troc")
      )
    )
  );
}
