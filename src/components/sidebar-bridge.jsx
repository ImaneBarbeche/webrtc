import React from "react";
import { createRoot } from "react-dom/client";
import Sidebar from "./Sidebar.jsx";

let root = null;

// Fonction pour initialiser la sidebar
function initializeSidebar() {
  // Vérifier si c'est l'enquêteur (host)
  const isInterviewer = sessionStorage.getItem("webrtc_isOfferor") === "true";

  if (!isInterviewer) {
    return; // Ne rien faire si ce n'est pas l'enquêteur
  }

  // Créer le conteneur si nécessaire
  let container = document.getElementById("sidebar-root");
  // using the first element of the page to insert
  let firstElement = document.querySelector(".dev-speed-dial");
  if (!container) {
    container = document.createElement("div");
    container.id = "sidebar-root";
    // document.body.appendChild(container);
    document.body.insertBefore(container, firstElement);
  }

  // Monter le composant React
  if (!root) {
    root = createRoot(container);
    root.render(<Sidebar />);
  }
}

// Écouter l'événement qui indique que l'app est affichée
document.addEventListener("lifestoriesShown", initializeSidebar);
