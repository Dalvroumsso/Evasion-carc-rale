function RoomView({ roomId, npcs = [], hotspots = [], onHotspotClick, onNpcClick }) {
  return React.createElement(
    "div",
    { className: "flex flex-col items-center gap-4" },
    // Titre de la salle
    React.createElement(
      "h2",
      { className: "text-white text-2xl font-black uppercase tracking-tighter" },
      roomId
    ),
    
    // Zone visuelle (Graphismes + PNJs)
    React.createElement(RoomGraphics, { 
      roomId, 
      npcs, 
      onNpcClick // Transmission de la fonction de clic
    }),

    // Zone des boutons d'interaction (Hotspots)
    React.createElement(
      "div",
      { className: "flex gap-3 flex-wrap justify-center mt-2" },
      hotspots.map(h =>
        React.createElement(
          "button",
          {
            key: h.id,
            onClick: () => onHotspotClick(h.action),
            className: "px-4 py-2 bg-blue-700 hover:bg-blue-600 border-b-4 border-blue-900 active:border-b-0 active:mt-1 text-white font-bold rounded transition-all text-sm"
          },
          h.label
        )
      )
    )
  );
}