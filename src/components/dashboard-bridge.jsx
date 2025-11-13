import React from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './Dashboard';

function initializeDashboardComponent() {
    const container = document.getElementById('dashboard-root');
    root = createRoot(container);
    root.render(<Dashboard />);
}