import React from "react";

export default function WebRTCStatus({ role, status }) {
  // ← Reçoit role et status en props

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
