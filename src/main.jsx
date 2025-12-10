// Point d'entrée principal pour Vite
// Ce fichier charge les bridges React
import './components/status-bridge.jsx';
import './components/webrtc-status-bridge.jsx';
import './components/homepage-bridge.jsx';
import './components/sidebar-bridge.jsx';
import './components/dashboard-bridge.jsx';

import React from "react";
import ReactDOM from "react-dom/client";
import GapListModal from "./components/GapListModal.jsx";
import { items } from "./js/timeline/timeline.js";

// Switch d'affichage selon le mode développeur
function showStandardView() {
	// Masquer l'onboarding et la homepage
	const homepage = document.getElementById('homepage-root');
	if (homepage) homepage.style.display = 'none';
	const onboarding = document.querySelector('.onboarding-container');
	if (onboarding) onboarding.style.display = 'none';
	// Afficher la vue standard
	const lifestories = document.getElementById('lifestoriesContainer');
	if (lifestories) lifestories.style.display = 'block';
}

function showOnboardingView() {
	// Afficher uniquement la homepage, masquer l'onboarding et la vue standard
	const homepage = document.getElementById('homepage-root');
	if (homepage) homepage.style.display = 'block';
	const onboarding = document.querySelector('.onboarding-container');
	if (onboarding) onboarding.style.display = 'none';
	const lifestories = document.getElementById('lifestoriesContainer');
	if (lifestories) lifestories.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
	const devMode = localStorage.getItem('devMode') === 'true';
	if (devMode) {
		showStandardView();
	} else {
		showOnboardingView();
	}
});


const episodes = items.get(); // Récupérer tous les items (épisodes et gaps)
const container = document.getElementById("react-gap-list");
const root = ReactDOM.createRoot(container);
root.render(<GapListModal episodes={episodes} />);