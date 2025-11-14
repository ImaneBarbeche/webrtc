import React from 'react';

function Dashboard() {
    return (
        <div className="dashboard">
            <header className="dashboard-header">
            <h1>Bonjour, enquêteur</h1>
            <button className="btn-new-interview">
                Créer une nouvelle interview
            </button>
            </header>
        </div>
    );
}

export default Dashboard;
