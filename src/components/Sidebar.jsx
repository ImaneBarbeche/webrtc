import React, { useState, useRef } from 'react';

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [currentView, setCurrentView] = useState('questionnaire'); // 'dashboard', 'questionnaire', 'calendar', 'split'
  const splitInstanceRef = useRef(null);
  
  const handleNavigation = (view) => {
    setCurrentView(view);
    
    const questionnaireSection = document.getElementById('questionnaire');
    const trajectoriesSection = document.getElementById('trajectories');
    
    // Détruire l'instance Split.js si elle existe
    if (splitInstanceRef.current) {
      splitInstanceRef.current.destroy();
      splitInstanceRef.current = null;
    }
    
    switch(view) {
      case 'dashboard':
        // TODO: Afficher le dashboard (à créer)
        if (questionnaireSection) questionnaireSection.style.display = 'none';
        if (trajectoriesSection) trajectoriesSection.style.display = 'none';
        console.log('Navigation vers Dashboard (à implémenter)');
        break;
        
      case 'questionnaire':
        // Afficher uniquement le questionnaire
        if (questionnaireSection) {
          questionnaireSection.style.display = 'block';
          questionnaireSection.style.width = '100%';
        }
        if (trajectoriesSection) trajectoriesSection.style.display = 'none';
        break;
        
      case 'calendar':
        // Afficher calendrier + synthèse
        if (questionnaireSection) questionnaireSection.style.display = 'none';
        if (trajectoriesSection) {
          trajectoriesSection.style.display = 'block';
          trajectoriesSection.style.width = '100%';
        }
        // Forcer le redraw de la timeline
        if (window.timeline && typeof window.timeline.redraw === 'function') {
          setTimeout(() => window.timeline.redraw(), 100);
        }
        break;
        
      case 'split':
        // Vue split : questionnaire + calendrier côte à côte
        if (questionnaireSection) {
          questionnaireSection.style.display = 'block';
          questionnaireSection.style.width = ''; // Retirer la largeur forcée
        }
        if (trajectoriesSection) {
          trajectoriesSection.style.display = 'block';
          trajectoriesSection.style.width = ''; // Retirer la largeur forcée
        }
        
        // Réinitialiser Split.js
        if (window.Split) {
          setTimeout(() => {
            splitInstanceRef.current = window.Split(["#questionnaire", "#trajectories"], {
              sizes: [20, 80],
              minSize: 100,
              gutterSize: 8,
              cursor: "col-resize",
            });
            
            // Forcer le redraw de la timeline
            if (window.timeline && typeof window.timeline.redraw === 'function') {
              window.timeline.redraw();
            }
          }, 100);
        }
        break;
    }
  };
  
  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <img src="./assets/imgs/LFlogo.png" alt="Logo" className="sidebar-logo" />
        <h3>LifeStories</h3>
        <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
          <img 
            src={isOpen ? "./assets/icon/sidebar-icon-open.svg" : "./assets/icon/sidebar-icon-closed.svg"} 
            alt="Toggle" 
            className="toggle-icon-svg" 
          />
        </button>
      </div>
      
      {isOpen && <div className="sidebar-divider"></div>}
      
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          <button 
            className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigation('dashboard')}
            title="Dashboard"
          >
            <span className="nav-icon">📊</span>
            {isOpen && <span className="nav-text">Dashboard</span>}
          </button>
          
          <button 
            className={`nav-button ${currentView === 'questionnaire' ? 'active' : ''}`}
            onClick={() => handleNavigation('questionnaire')}
            title="Questionnaire"
          >
            <span className="nav-icon">📝</span>
            {isOpen && <span className="nav-text">Questionnaire</span>}
          </button>
          
          <button 
            className={`nav-button ${currentView === 'calendar' ? 'active' : ''}`}
            onClick={() => handleNavigation('calendar')}
            title="Calendrier & Synthèse"
          >
            <span className="nav-icon">📅</span>
            {isOpen && <span className="nav-text">Calendrier</span>}
          </button>
          
          <button 
            className={`nav-button ${currentView === 'split' ? 'active' : ''}`}
            onClick={() => handleNavigation('split')}
            title="Vue Divisée"
          >
            <img src="./assets/icon/split-view-icon.svg" alt="Split" className="nav-icon-img" />
            {isOpen && <span className="nav-text">Split View</span>}
          </button>
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;