import React from "react";
import { useState } from "react";

function Dashboard() {
  const message = "Feature to be added";
  const [showMessage, setShowMessage] = useState(false);

  return (
    <div className="dashboard">
      <h1>Bonjour, enquêteur</h1>
      <button className="primary-button" onClick={() => setShowMessage(true)}>
        Créer une nouvelle interview
      </button>

      {showMessage && (
        <div>
          <p>{message}</p>
          <img
            src="https://media4.giphy.com/media/dTRSvKr60spWi5d0H5/giphy.gif"
            alt="a cute red panda!"
            className="surprise-gif"
          />
        </div>
      )}
    </div>
  );
}

export default Dashboard;
