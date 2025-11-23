import React, { useState } from 'react';

export default function HomePage({ onStart }) {
  const [devMode, setDevMode] = useState(localStorage.getItem('devMode') === 'true');

  const handleToggleDevMode = () => {
    const newMode = !devMode;
    setDevMode(newMode);
    localStorage.setItem('devMode', newMode);
    window.location.reload(); // Recharge pour appliquer le mode
  };

  return (
    <div className="homepage-container" style={{ position: 'relative' }}>
      {/* Bouton mode développeur en haut à droite */}
      <button
        className="devmode-toggle"
        style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: devMode ? '#e0e0e0' : '#fff', border: '1px solid #ccc', borderRadius: 4, padding: '4px 10px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        onClick={handleToggleDevMode}
        title={devMode ? 'Mode standard' : 'Mode développeur'}
      >
        <span style={{ marginRight: 6 }}>🛠️</span>
        {devMode ? 'Mode développeur' : 'Mode standard'}
      </button>

      {/* Section gauche - Fenêtre avec SVG */}
      <div className="homepage-left">
        <div className="svg-window">
          <img src="assets/imgs/welcomegreenwave.svg" alt="Shape 1" className="shape shape-green" />
          <img src="assets/imgs/welcomebluewave.svg" alt="Shape 2" className="shape shape-blue" />
          <img src="assets/imgs/welcomeyellowwave.svg" alt="Shape 3" className="shape shape-yellow" />
        </div>
      </div>

      {/* Section droite - Texte et bouton */}
      <div className="homepage-right">
        <h1 className="homepage-title">
          Partagez.<br />
          Visualisez.
        </h1>
        <p className="homepage-subtitle">Lorem ipsum dolor sit amet consectetur adipisicing elit. Suscipit ullam obcaecati, ad unde recusandae, ut qui alias consectetur voluptatem nobis debitis quod consequuntur, quos maiores laboriosam voluptas repellendus modi consequatur.</p>
        <button className="homepage-start-btn" onClick={onStart}>
          Commencer
        </button>
      </div>
    </div>
  );
}
