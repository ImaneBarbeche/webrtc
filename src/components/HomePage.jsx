import React from 'react';

export default function HomePage({ onStart }) {

  return (
    <div className="homepage-container" style={{ position: 'relative' }}>

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
