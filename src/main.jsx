// Vite entry point
// This file loads the React Bridges
import "./components/status-bridge.jsx";
import "./components/webrtc-status-bridge.jsx";
import "./components/homepage-bridge.jsx";
import "./components/sidebar-bridge.jsx";
import "./components/dashboard-bridge.jsx";
import "./components/form-actions-bridge.jsx";

function showStandardView() {
  const homepage = document.getElementById("homepage-root");
  if (homepage) homepage.style.display = "none";
  const onboarding = document.querySelector(".onboarding-container");
  if (onboarding) onboarding.style.display = "none";

  const lifestories = document.getElementById("lifestoriesContainer");
  if (lifestories) lifestories.style.display = "block";
  const formActions = document.getElementById("form-actions-root");
  formActions ? (formActions.style.display = "block") : "";
}

function showOnboardingView() {
  const homepage = document.getElementById("homepage-root");
  if (homepage) homepage.style.display = "block";
  const onboarding = document.querySelector(".onboarding-container");
  if (onboarding) onboarding.style.display = "none";
  const lifestories = document.getElementById("lifestoriesContainer");
  if (lifestories) lifestories.style.display = "none";
  const formActions = document.getElementById("form-actions-root");
  formActions ? (formActions.style.display = "block") : "";
}

document.addEventListener("DOMContentLoaded", () => {
  const devMode = localStorage.getItem("devMode") === "true";
  if (devMode) {
    showStandardView();
  } else {
    showOnboardingView();
  }
});
