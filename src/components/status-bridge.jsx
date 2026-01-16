import { createRoot } from "react-dom/client";
import Status from "./status.jsx";

let currentStatus = "offline";
let root = null;

// Wait for DOM to be ready
function initializeStatusComponent() {
  const container = document.getElementById("status-root");

  if (!container) {
    console.error("status-root container not found");
    return;
  }

  root = createRoot(container);
  root.render(<Status status={currentStatus} />);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeStatusComponent);
} else {
  initializeStatusComponent();
}

// Expose function globally so webrtc-onboarding.js can call it
window.updateReactStatus = function (newStatus) {
  currentStatus = newStatus;
  if (root) {
    root.render(<Status status={currentStatus} />);
  } else {
    console.warn("React Status called but root not initialized yet");
  }
};
