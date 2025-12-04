// episodeEdit.js

/**
 * Ouvre une fenêtre d'édition pour un épisode (item) de la timeline.
 * @param {Object} item - L'item à éditer.
 * @param {Function} onSave - Callback à appeler avec l'item modifié.
 */
export function openEpisodeEditModal(item, onSave) {
  // Créer l'overlay semi-transparent
  const overlay = document.createElement('div');
  overlay.className = 'episode-edit-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.zIndex = '3000';
  overlay.style.background = 'rgba(0,0,0,0.15)';
  overlay.style.transition = 'background 0.2s';

  // Drawer latéral
  const drawer = document.createElement('div');
  drawer.className = 'episode-edit-drawer';
  drawer.style.position = 'fixed';
  drawer.style.top = '0';
  drawer.style.right = '0';
  drawer.style.height = '100vh';
  drawer.style.width = '400px';
  drawer.style.maxWidth = '90vw';
  drawer.style.background = 'white';
  drawer.style.boxShadow = '-4px 0 24px rgba(0,0,0,0.12)';
  drawer.style.borderRadius = '16px 0 0 16px';
  drawer.style.display = 'flex';
  drawer.style.flexDirection = 'column';
  drawer.style.padding = '2em 2.5em';
  drawer.style.transform = 'translateX(100%)';
  drawer.style.transition = 'transform 0.3s cubic-bezier(.4,0,.2,1)';
  drawer.innerHTML = `
    <h2 style="margin-bottom:1em;">Modifier l'épisode</h2>
    <label style="display:block;margin-bottom:1em;">Contenu : <input type="text" id="edit-content" value="${item.content || ''}" style="width:100%;padding:0.5em;margin-top:0.5em;"></label>
    <label style="display:block;margin-bottom:1em;">Début : <input type="date" id="edit-start" value="${item.start ? new Date(item.start).toISOString().slice(0,10) : ''}" style="width:100%;padding:0.5em;margin-top:0.5em;"></label>
    <label style="display:block;margin-bottom:1.5em;">Fin : <input type="date" id="edit-end" value="${item.end ? new Date(item.end).toISOString().slice(0,10) : ''}" style="width:100%;padding:0.5em;margin-top:0.5em;"></label>
    <div style="display:flex;gap:1em;justify-content:flex-end;">
      <button id="save-edit" style="background:#2E2E2E;color:white;padding:0.6em 1.4em;border:none;border-radius:2em;cursor:pointer;font-size:1em;">Enregistrer</button>
      <button id="cancel-edit" style="background:#e0e0e0;color:#2E2E2E;padding:0.6em 1.4em;border:none;border-radius:2em;cursor:pointer;font-size:1em;">Annuler</button>
    </div>
  `;
  overlay.appendChild(drawer);
  document.body.appendChild(overlay);

  // Animation effet drawer
  setTimeout(() => {
    drawer.style.transform = 'translateX(0)';
  }, 10);

  // Gestion des boutons
  drawer.querySelector('#save-edit').onclick = () => {
    item.content = drawer.querySelector('#edit-content').value;
    item.start = new Date(drawer.querySelector('#edit-start').value);
    item.end = drawer.querySelector('#edit-end').value ? new Date(drawer.querySelector('#edit-end').value) : undefined;
    document.body.removeChild(overlay);
    if (typeof window.isEditingEpisode !== 'undefined') window.isEditingEpisode = false;
    if (onSave) onSave(item);
  };
  drawer.querySelector('#cancel-edit').onclick = () => {
    document.body.removeChild(overlay);
    if (typeof window.isEditingEpisode !== 'undefined') window.isEditingEpisode = false;
  };
}
