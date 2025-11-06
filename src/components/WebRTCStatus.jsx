import React from 'react';

export default function WebRTCStatus({ role, status }) {  // ← Reçoit role et status en props

    const roleConfig = {
        offeror: 'Enquêteur',
        answerer: 'Enquêté'
    };

    const statusConfig = {
        offline: 'Mode hors ligne',
        connecting: 'Connexion en cours...',
        connected: 'Connecté'
    };

    const getStatusText = () => {
        if (status === 'connected' && role) {
            return `${statusConfig[status]} (${roleConfig[role]})`;
        }
        return statusConfig[status] || 'Mode hors ligne';
    };

    return (
        <div id="webrtc-status" className={status}>
            <span className="dot"></span>
            <span id="webrtc-status-text">{getStatusText()}</span>
        </div>
    );
}