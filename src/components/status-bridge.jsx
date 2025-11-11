import { createRoot } from 'react-dom/client';
import Status from './status.jsx';

let currentStatus = 'offline';
let root = null;

// Attendre que le DOM soit prêt
function initializeStatusComponent() {
  const container = document.getElementById('status-root');
  
  if (!container) {
    console.error('status-root container not found');
    return;
  }
  
  root = createRoot(container);
  root.render(<Status status={currentStatus} />);
}

// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeStatusComponent);
} else {
  initializeStatusComponent();
}

// Exposer la fonction globalement pour que webrtc-onboarding.js puisse l'appeler
window.updateReactStatus = function(newStatus) {
  currentStatus = newStatus;
  if (root) {
    root.render(<Status status={currentStatus} />);
  } else {
    console.warn('React Status called but root not initialized yet');
  }
};

