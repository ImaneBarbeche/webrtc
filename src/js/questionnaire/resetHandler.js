/**
 * Handler for resetting questionnaire and timeline data with WebRTC sync
 * Handles the reset of questionnaire + timeline data with WebRTC sync
 */

/**
 * Initializes the reset handler
 * 
 */
export function initResetHandler() {
  const resetButton = document.getElementById("resetButton");
  
  if (!resetButton) {
    return;
  }

  resetButton.addEventListener("click", handleReset);
}

/**
 * Handles the reset action when the reset button is clicked
 */
function handleReset() {
  const confirmed = confirm(
    "Êtes-vous sûr de vouloir tout réinitialiser ? Toutes les données (questionnaire + timeline) seront perdues."
  );

  if (!confirmed) {
    return;
  }

  // If the device is connected via WebRTC, send a reset message to the other device
  if (window.webrtcSync && window.webrtcSync.connected) {
    window.webrtcSync.sendMessage({
      type: "RESET_ALL_DATA",
    });
  }

  // Reinitialize locally
  import("../stateMachine/stateMachine.js").then((module) => {
    module.resetAllData();
  });
}
