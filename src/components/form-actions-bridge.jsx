import { createRoot } from 'react-dom/client';
import FormActions from './FormActions'

function initializeFormActionsComponent() {
    const container = document.getElementById('form-actions-root');
    const root = createRoot(container);
    root.render(<FormActions />);
}

// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFormActionsComponent);
} else {
    initializeFormActionsComponent();
}