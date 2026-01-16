import React from "react";

// Shows the status during the onboarding
// TODO: Can be removed in favor of the proper WebRTCStatus component
export default function Status({ status }) {
  // ← Reçoit status en props

  const statusConfig = {
    offline: { text: "Hors ligne" },
    connecting: { text: "Connexion en cours..." },
    connected: { text: "Connecté" },
  };

  return (
    <div className="connection-status">
      <div id="status-indicator" className={`status ${status}`}></div>
      <span id="status-text">{statusConfig[status].text}</span>
    </div>
  );
}
