import React from 'react';
import '../css/homepage.css';

export default function HomePage({ onStart }) {
  return (
    <div className="homepage-container">
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
          Share.<br />
          Visualize.
        </h1>
        <p className="homepage-subtitle">Your memories are valuable to us.</p>
        <button className="homepage-start-btn" onClick={onStart}>
          Start
        </button>
      </div>
    </div>
  );
}
