import { createRoot } from 'react-dom/client';
import HomePage from './HomePage';

let root = null;

// Attendre que le DOM soit prêt
function initializeHomePageComponent() {
    const container = document.getElementById('homepage-root');
    root = createRoot(container);
    root.render(<HomePage onStart={() => hideHomePage()} />);
}

// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHomePageComponent);
} else {
    initializeHomePageComponent();
}

// fonction pour cacher le composant au clic sur "Commencer"
window.hideHomePage = function() {
    const container = document.getElementById('homepage-root');
    if (container) {
        container.style.display = 'none';
    }
    const onboardingContainer = document.querySelector('.onboarding-container');
    if (onboardingContainer) {
        onboardingContainer.style.display = 'block';
    }
}