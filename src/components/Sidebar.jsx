import React, { useState, useRef, useEffect } from 'react';
import { House, NotebookText, CalendarRange, Columns2, PanelLeft, PanelRight } from 'lucide-react';


function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [currentView, setCurrentView] = useState('questionnaire'); // 'dashboard', 'questionnaire', 'calendar', 'split'
  const splitInstanceRef = useRef(null);

  // Gérer la classe sur le body quand l'état open/closed change
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('sidebar-open');
      document.body.classList.remove('sidebar-closed');
    } else {
      document.body.classList.add('sidebar-closed');
      document.body.classList.remove('sidebar-open');
    }
    
    // Mettre à jour la classe sur le dashboard-root pour adapter le padding
    const dashboardRoot = document.getElementById('dashboard-root');
    if (dashboardRoot) {
      if (!isOpen) {
        dashboardRoot.classList.add('sidebar-closed');
      } else {
        dashboardRoot.classList.remove('sidebar-closed');
      }
    }
  }, [isOpen]);

  const handleNavigation = (view) => {
    setCurrentView(view);

    const questionnaireSection = document.getElementById('questionnaire');
    const trajectoriesSection = document.getElementById('trajectories');
    const dashboardSection = document.getElementById('dashboard-root');
    const splitContainer = document.querySelector('.split');

    // Détruire l'instance Split.js si elle existe
    if (splitInstanceRef.current) {
      splitInstanceRef.current.destroy();
      splitInstanceRef.current = null;
    }

    switch (view) {
      case 'dashboard':
        if (splitContainer) splitContainer.style.display = 'none';
        if (dashboardSection) dashboardSection.style.display = 'block';
        if (questionnaireSection) questionnaireSection.style.display = 'none';
        if (trajectoriesSection) trajectoriesSection.style.display = 'none';
        break;
      
      case 'questionnaire':
        // Afficher uniquement le questionnaire
        if (splitContainer) splitContainer.style.display = 'block';
        if (dashboardSection) dashboardSection.style.display = 'none';
        if (questionnaireSection) {
          questionnaireSection.style.display = 'block';
          questionnaireSection.style.width = '100%';
        }
        if (trajectoriesSection) trajectoriesSection.style.display = 'none';
        break;

      case 'calendar':
        // Afficher calendrier + synthèse
        if (splitContainer) splitContainer.style.display = 'block';
        if (dashboardSection) dashboardSection.style.display = 'none';
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
        if (splitContainer) splitContainer.style.display = 'flex';
        if (dashboardSection) dashboardSection.style.display = 'none';
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
        break;
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <img src="./assets/imgs/logo.png" alt="Logo" className="sidebar-logo" />
        <h3>LifeStories</h3>
        <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? (
            <PanelRight strokeWidth={1.5} />
          ) : (
            <PanelLeft strokeWidth={1.5} />
          )}
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
            <span className="nav-icon">
              <House strokeWidth={1.5}/>
            </span>
            {isOpen && <span className="nav-text">Dashboard</span>}
          </button>

          <button
            className={`nav-button ${currentView === 'questionnaire' ? 'active' : ''}`}
            onClick={() => handleNavigation('questionnaire')}
            title="Questionnaire"
          >
            <span className="nav-icon">
              <NotebookText  strokeWidth={1.5}/>
              </span>
            {isOpen && <span className="nav-text">Questionnaire</span>}
          </button>

          <button
            className={`nav-button ${currentView === 'calendar' ? 'active' : ''}`}
            onClick={() => handleNavigation('calendar')}
            title="Calendrier & Synthèse"
          >
            <span className="nav-icon">
              <CalendarRange  strokeWidth={1.5}/>
              </span>
            {isOpen && <span className="nav-text">Calendrier</span>}
          </button>

          <button
            className={`nav-button ${currentView === 'split' ? 'active' : ''}`}
            onClick={() => handleNavigation('split')}
            title="Vue Divisée"
          >
            <span className="nav-icon">
                <Columns2  strokeWidth={1.5}/>
              </span>
            {isOpen && <span className="nav-text">Split View</span>}
          </button>
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;