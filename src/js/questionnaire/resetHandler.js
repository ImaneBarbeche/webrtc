/**
 * Gestionnaire du bouton de réinitialisation
 * Gère le reset des données questionnaire + timeline avec sync WebRTC
 */

/**
 * Initialise le gestionnaire du bouton reset
 * À appeler au DOMContentLoaded
 */
export function initResetHandler() {
  const resetButton = document.getElementById("resetButton");
  
  if (!resetButton) {
    return;
  }

  resetButton.addEventListener("click", handleReset);
}

/**
 * Gère le clic sur le bouton reset
 */
function handleReset() {
  // Demander confirmation
  const confirmed = confirm(
    "Êtes-vous sûr de vouloir tout réinitialiser ? Toutes les données (questionnaire + timeline) seront perdues."
  );

  if (!confirmed) {
    return;
  }

  // Si on est connecté en WebRTC, envoyer un message de reset à l'autre appareil
  if (window.webrtcSync && window.webrtcSync.connected) {
    window.webrtcSync.sendMessage({
      type: "RESET_ALL_DATA",
    });
  }

  // Réinitialiser localement
  import("../stateMachine/stateMachine.js").then((module) => {
    module.resetAllData();
  });
}
