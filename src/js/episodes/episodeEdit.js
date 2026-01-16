// episodeEdit.js

/**
 * Opens an edit window for an episode (item) from the timeline.
 * @param {Object} item - The item to edit.
 * @param {Function} onSave - Callback to call with the modified item.
 */
export function openEpisodeEditModal(item, onSave) {
  // Create semi-transparent overlay
  const overlay = document.createElement("div");
  overlay.className = "episode-edit-overlay";

  // Side drawer
  const drawer = document.createElement("div");
  drawer.className = "episode-edit-drawer default-card";
  drawer.innerHTML = `
    <h2>Edit episode</h2>
    <label>Content: <input type="text" id="edit-content" class="question-input" value="${
      item.content || ""
    }" ></label>
    <label>Start: <input type="date" id="edit-start" class="question-input" value="${
      item.start ? new Date(item.start).toISOString().slice(0, 10) : ""
    }"></label>
    <label>End: <input type="date" id="edit-end" class="question-input" value="${
      item.end ? new Date(item.end).toISOString().slice(0, 10) : ""
    }"></label>
    <div class="episode-edit-actions">
      <button id="save-edit" class="primary-button">Save</button>
      <button id="cancel-edit" class="secondary-button">Cancel</button>
    </div>
  `;
  overlay.appendChild(drawer);
  document.body.appendChild(overlay);

  // Drawer animation effect
  setTimeout(() => {
    drawer.classList.add("open");
  }, 10);

  // Handle button clicks
  drawer.querySelector("#save-edit").onclick = () => {
    item.content = drawer.querySelector("#edit-content").value;
    item.start = new Date(drawer.querySelector("#edit-start").value);
    item.end = drawer.querySelector("#edit-end").value
      ? new Date(drawer.querySelector("#edit-end").value)
      : undefined;
    document.body.removeChild(overlay);
    if (typeof window.isEditingEpisode !== "undefined")
      window.isEditingEpisode = false;
    if (onSave) onSave(item);
  };
  drawer.querySelector("#cancel-edit").onclick = () => {
    document.body.removeChild(overlay);
    if (typeof window.isEditingEpisode !== "undefined")
      window.isEditingEpisode = false;
  };
}
