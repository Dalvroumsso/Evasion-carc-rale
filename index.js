<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="https://base44.com/logo_v2.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prison Riot</title>

  <script src="https://cdn.tailwindcss.com"></script>

  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  
  <style>
    /* Petit correctif pour les barres de défilement du journal */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
  </style>
</head>
<body class="bg-gray-950 text-white selection:bg-blue-500/30">
  <div id="root"></div>

  <script src="gameData.js"></script>
  <script src="introData.js"></script> 
  <script src="StartScreen.js"></script>
  <script src="IntroScene.js"></script> 
  <script src="RoomGraphics.js"></script>
  <script src="RoomView.js"></script>

  <script src="Game.js"></script>

  <script src="main.js"></script>
</body>
</html>