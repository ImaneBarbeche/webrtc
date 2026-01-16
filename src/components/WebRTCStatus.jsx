import React from "react";

// Handles the status badge after the onboarding phase is complete
export default function WebRTCStatus({ role, status }) {
  const roleConfig = {
    offeror: "Enquêteur",
    answerer: "Enquêté",
  };

  const statusConfig = {
    standalone: "Hors ligne",
    connecting: "Connexion en cours...",
    connected: "Connecté",
    disconnected: "Déconnecté",
  };

  return (
    <div id="webrtc-status" className={status}>
      <span className="dot"></span>
      <span id="webrtc-status-text">
        {statusConfig[status]}
        <span className="role">{roleConfig[role]}</span>
      </span>
    </div>
  );
}
