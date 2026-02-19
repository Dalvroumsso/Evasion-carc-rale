function RoomView({ roomId, npcs = [], hotspots = [], onHotspotClick, onNpcClick }) {
  // Traduction propre du nom de la salle via WORLD_DATA
  const roomName = (WORLD_DATA.rooms[roomId] && WORLD_DATA.rooms[roomId].name) || roomId;

  return React.createElement(
    "div",
    { className: "flex flex-col items-center gap-4 w-full" },
    
    // Titre de la salle stylisé
    React.createElement(
      "h2",
      { className: "text-white text-2xl font-black uppercase tracking-widest border-b-2 border-blue-900 px-4" },
      roomName
    ),
    
    // Zone visuelle
    React.createElement(RoomGraphics, { 
      roomId, 
      npcs, 
      onNpcClick 
    }),

    // Zone des boutons d'interaction (Hotspots)
    React.createElement(
      "div",
      { className: "flex gap-3 flex-wrap justify-center mt-2 w-full" },
      hotspots.map(h =>
        React.createElement(
          "button",
          {
            key: h.id,
            onClick: () => onHotspotClick(h.action),
            className: "px-5 py-2 bg-blue-800 hover:bg-blue-700 border-b-4 border-blue-950 active:border-b-0 active:mt-1 text-white font-black rounded transition-all text-xs uppercase tracking-tighter shadow-lg"
          },
          h.label
        )
      )
    )
  );
}
