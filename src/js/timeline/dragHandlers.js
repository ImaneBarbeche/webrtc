// Fonctions de gestion du drag & drop pour la timeline

export function handleDragStart(event) {
  event.dataTransfer.effectAllowed = "move";

  const isEvent = event.target.id.split("_")[0] == "ev";
  let item;
  if (isEvent) {
    item = {
      id: new Date(),
      type: isEvent ? "point" : "range",
      content: event.target.innerHTML,
    };
  } else {
    item = {
      id: new Date(),
      type: isEvent ? "point" : "range",
      content: event.target.innerHTML, //event.target.value si input
      end: window.timeline.options.end,
    };
  }

  //changer le css pour hint
  //retrouver la classe de la ligne à faire briller
  let line = `line_${event.target.closest("ul").id.split("_")[1]}`;
  event.target.style.opacity = "0.2";

  event.dataTransfer.setData("text", JSON.stringify(item));
}

export function handleDragEnd(event) {
  let line = `line_${event.target.closest("ul").id.split("_")[1]}`;
  event.target.style.opacity = "initial";
}
