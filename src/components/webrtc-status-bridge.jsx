import { createRoot } from 'react-dom/client';
import WebRTCStatus from './WebRTCStatus.jsx';

let currentRole = null;
let currentStatus = 'offline';
let root = null;


function initializeStatusComponent() {
    const container = document.getElementById('webrtc-status-root');
    if (!container) {
        console.error('webrtc-status container not found');
        return;
    }
    root = createRoot(container);
    root.render(<WebRTCStatus role={currentRole} status={currentStatus} />);
}

window.updateWebRTCStatus = function(role, status) {
    currentRole = role;
    currentStatus = status;
    if (root) {
        root.render(<WebRTCStatus role={currentRole} status={currentStatus} />);
    } else {
        console.warn('WebRTC Status called but root not initialized yet');
    }
};


// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeStatusComponent);
} else {
  initializeStatusComponent();
}