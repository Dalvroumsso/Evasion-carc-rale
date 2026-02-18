/**
 * Affiche le décor de la salle et les personnages interactifs.
 * @param {string} roomId - L'identifiant de la pièce actuelle.
 * @param {Array} npcs - Liste des PNJ présents dans la pièce.
 * @param {Function} onNpcClick - Fonction déclenchée au clic sur un PNJ.
 */
function RoomGraphics({ roomId, npcs = [], onNpcClick }) {
  // Images de fond associées à chaque pièce [cite: 20]
  const roomBackgrounds = {
    entrance: "images/entrance.png",
    cell: "images/cell.png",
    corridor: "images/corridor.png",
    canteen: "images/canteen.png",
    common: "images/common.png",
    yard: "images/yard.png",
    offices: "images/offices.png",
    security: "images/security.png",
    infirmary: "images/infirmary.png"
  };

  return React.createElement(
    "div",
    { 
      className: "relative w-full h-80 rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl bg-gray-900" 
    },
    // 1. Rendu du décor de fond [cite: 21]
    React.createElement("img", {
      src: roomBackgrounds[roomId] || "images/default.png",
      className: "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
      alt: `Vue de ${roomId}`
    }),

    // 2. Rendu de la couche des personnages (PNJs) [cite: 21]
    npcs.map((npc, i) =>
      React.createElement("div", {
        key: npc.id || i,
        className: "absolute group cursor-pointer transition-all active:scale-95",
        style: { 
          top: npc.y || 0, // Utilise les coordonnées du fichier de données 
          left: npc.x || 0,
          transform: "translate(-50%, -50%)", // Centre le personnage sur ses coordonnées
          zIndex: 10
        },
        // Déclenche l'interaction ou le dialogue au clic
        onClick: () => onNpcClick && onNpcClick(npc)
      }, 
      
      // Image visuelle du PNJ [cite: 21]
      React.createElement("img", {
        src: `images/npcs/${npc.id}.png`,
        className: "w-16 h-24 object-contain hover:brightness-125 hover:scale-110 transition-all",
        // Image de secours si le fichier .png est manquant [cite: 21]
        onError: (e) => { e.target.src = "https://via.placeholder.com/64x96?text=NPC"; }
      }),

      // Étiquette du nom (visible au survol)
      React.createElement("span", {
        className: "absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap border border-gray-600 pointer-events-none transition-opacity"
      }, npc.name)
    ))
  );
}