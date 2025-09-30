// Leaflet Fallback - Simple map implementation
window.L = {
    map: function(id, options) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<div style="padding: 20px; text-align: center; background: #f0f0f0; border: 1px solid #ccc;">Carte non disponible hors ligne</div>';
        }
        return {
            setView: function() { return this; },
            addLayer: function() { return this; }
        };
    },
    tileLayer: function() {
        return {
            addTo: function() { return this; }
        };
    }
};