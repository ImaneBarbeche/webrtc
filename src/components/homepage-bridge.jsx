import { createRoot } from "react-dom/client";
import HomePage from "./HomePage";

let root = null;

// Wait for the DOM to load
function initializeHomePageComponent() {
  const container = document.getElementById("homepage-root");
  root = createRoot(container);
  root.render(<HomePage onStart={() => hideHomePage()} />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeHomePageComponent);
} else {
  initializeHomePageComponent();
}

// Function to hide the component when you click on "commencer"
window.hideHomePage = function () {
  const container = document.getElementById("homepage-root");
  if (container) {
    container.style.display = "none";
  }
  const onboardingContainer = document.querySelector(".onboarding-container");
  if (onboardingContainer) {
    onboardingContainer.style.display = "block";
  }
};
