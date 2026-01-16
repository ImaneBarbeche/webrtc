import React, { useState, useRef, useEffect } from "react";
import {
  House,
  NotebookText,
  CalendarRange,
  Columns2,
  PanelLeft,
  PanelRight,
} from "lucide-react";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [currentView, setCurrentView] = useState("questionnaire"); // 'dashboard', 'questionnaire', 'calendar', 'split'
  const splitInstanceRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Manage body class when open/closed state changes
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("sidebar-open");
      document.body.classList.remove("sidebar-closed");
    } else {
      document.body.classList.add("sidebar-closed");
      document.body.classList.remove("sidebar-open");
    }

    // Update class on dashboard-root to adapt padding
    const dashboardRoot = document.getElementById("dashboard-root");
    if (dashboardRoot) {
      if (!isOpen) {
        dashboardRoot.classList.add("sidebar-closed");
      } else {
        dashboardRoot.classList.remove("sidebar-closed");
      }
    }
  }, [isOpen]);

  const handleNavigation = (view) => {
    setCurrentView(view);

    const questionnaireSection = document.getElementById("questionnaire");
    const trajectoriesSection = document.getElementById("trajectories");
    const dashboardSection = document.getElementById("dashboard-root");
    const splitContainer = document.querySelector(".split");

    // Destroy Split.js instance if it exists
    if (splitInstanceRef.current) {
      splitInstanceRef.current.destroy();
      splitInstanceRef.current = null;
    }

    switch (view) {
      case "dashboard":
        if (splitContainer) splitContainer.style.display = "none";
        if (dashboardSection) dashboardSection.style.display = "block";
        if (questionnaireSection) questionnaireSection.style.display = "none";
        if (trajectoriesSection) trajectoriesSection.style.display = "none";
        break;

      case "questionnaire":
        // Display only the questionnaire
        if (splitContainer) splitContainer.style.display = "block";
        if (dashboardSection) dashboardSection.style.display = "none";
        if (questionnaireSection) {
          questionnaireSection.style.display = "block";
          questionnaireSection.style.width = "100%";
        }
        if (trajectoriesSection) trajectoriesSection.style.display = "none";
        break;

      case "calendar":
        // Display calendar + summary
        if (splitContainer) splitContainer.style.display = "block";
        if (dashboardSection) dashboardSection.style.display = "none";
        if (questionnaireSection) questionnaireSection.style.display = "none";
        if (trajectoriesSection) {
          trajectoriesSection.style.display = "flex";
          trajectoriesSection.style.width = "100%";
        }
        // Force timeline redraw
        if (window.timeline && typeof window.timeline.redraw === "function") {
          setTimeout(() => window.timeline.redraw(), 100);
        }
        break;

      case "split":
        // Split view: questionnaire + calendar side by side
        if (splitContainer) splitContainer.style.display = "flex";
        if (dashboardSection) dashboardSection.style.display = "none";
        if (questionnaireSection) {
          questionnaireSection.style.display = "block";
          questionnaireSection.style.width = ""; // Remove forced width
        }
        if (trajectoriesSection) {
          trajectoriesSection.style.display = "flex";
          trajectoriesSection.style.width = ""; // Remove forced width
        }

        // Reinitialize Split.js
        if (window.Split) {
          setTimeout(() => {
            splitInstanceRef.current = window.Split(
              ["#questionnaire", "#trajectories"],
              {
                sizes: [20, 80],
                minSize: 100,
                gutterSize: 8,
                cursor: "col-resize",
              }
            );

            // Force timeline redraw
            if (
              window.timeline &&
              typeof window.timeline.redraw === "function"
            ) {
              window.timeline.redraw();
            }
          }, 100);
        }
        break;
    }
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
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
            className={`nav-button ${
              currentView === "dashboard" ? "active" : ""
            }`}
            onClick={() => handleNavigation("dashboard")}
            title="Dashboard"
          >
            <span className="nav-icon">
              <House strokeWidth={1.5} />
            </span>
            {isOpen && <span className="nav-text">Dashboard</span>}
          </button>

          <button
            className={`nav-button ${
              currentView === "questionnaire" ? "active" : ""
            }`}
            onClick={() => handleNavigation("questionnaire")}
            title="Questionnaire"
          >
            <span className="nav-icon">
              <NotebookText strokeWidth={1.5} />
            </span>
            {isOpen && <span className="nav-text">Questionnaire</span>}
          </button>

          <button
            className={`nav-button ${
              currentView === "calendar" ? "active" : ""
            }`}
            onClick={() => handleNavigation("calendar")}
            title="Calendrier & Synthèse"
          >
            <span className="nav-icon">
              <CalendarRange strokeWidth={1.5} />
            </span>
            {isOpen && <span className="nav-text">Calendrier</span>}
          </button>

          <button
            className={`nav-button ${currentView === "split" ? "active" : ""}`}
            onClick={() => handleNavigation("split")}
            title="Vue Divisée"
          >
            <span className="nav-icon">
              <Columns2 strokeWidth={1.5} />
            </span>
            {isOpen && <span className="nav-text">Split View</span>}
          </button>
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;
