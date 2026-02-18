function StartScreen(props) {
  return React.createElement(
    "div",
    { className: "flex flex-col items-center justify-center h-screen" },
    React.createElement("h1", { className: "text-3xl font-bold" }, "Évasion"),
    React.createElement(
      "button",
      {
        className: "mt-4 px-4 py-2 bg-blue-600 rounded",
        onClick: props.onStart
      },
      "Commencer"
    )
  );
}