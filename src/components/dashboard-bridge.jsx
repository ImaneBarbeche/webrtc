import React from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './Dashboard';

function initializeDashboardComponent() {
    const container = document.getElementById('dashboard-root');
    const root = createRoot(container);
    root.render(<Dashboard />);
}

// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboardComponent);
} else {
    initializeDashboardComponent();
}