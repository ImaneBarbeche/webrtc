// Point d'entrée principal pour Vite
// Ce fichier charge les bridges React
import './components/status-bridge.jsx';
import './components/webrtc-status-bridge.jsx';

// TEST TEMPORAIRE - HomePage
import { createRoot } from 'react-dom/client';
import HomePage from './components/HomePage.jsx';

const testHomePage = () => {
  const container = document.createElement('div');
  container.id = 'homepage-test';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.zIndex = '9999';
  document.body.appendChild(container);
  
  const root = createRoot(container);
  root.render(<HomePage onStart={() => console.log('Start clicked!')} />);
};

// Appeler au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testHomePage);
} else {
  testHomePage();
}
