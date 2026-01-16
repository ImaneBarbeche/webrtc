import React from "react";

export default function Status({ status }) {
  // ← Reçoit status en props

  const statusConfig = {
    offline: { text: "Hors ligne" },
    connecting: { text: "Connexion en cours..." },
    connected: { text: "Connecté" },
    disconnected: { text: "Déconnecté" },
  };

  return (
    <div className="connection-status">
      <div id="status-indicator" className={`status ${status}`}></div>
      <span id="status-text">{statusConfig[status].text}</span>
    </div>
  );
}
