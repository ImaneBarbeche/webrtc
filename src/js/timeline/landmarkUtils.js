// landmarkUtils.js

// Gestion d'appui long pour les landmarks (labels des sous-groupes)
// Détecte un appui long sur un label de sous-groupe pour activer/désactiver le landmark.

const LONG_PRESS_DURATION = 500; // ms pour déclencher l'appui long
const LONG_PRESS_MOVE_THRESHOLD = 5; // px de tolérance avant annulation

export function setupLongPressHandlers(timeline, groups, utils) {
  let longPressTimer = null;
  let longPressTarget = null;
  let longPressStartPos = null;

  // Démarrage de la détection d'appui long sur les labels de groupe
  timeline.on("mouseDown", (properties) => {
    if (properties.what !== "group-label" || !properties.group) return;

    const clickedGroup = groups.get(properties.group);
    // Seulement pour les sous-groupes
    if (!clickedGroup || !clickedGroup.nestedInGroup) return;

    longPressTarget = properties.group;
    longPressStartPos = {
      x: properties.event?.clientX ?? 0,
      y: properties.event?.clientY ?? 0,
    };

    // Démarrer le timer d'appui long
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      toggleLandmark(longPressTarget, groups, utils);
      longPressTarget = null;
      longPressStartPos = null;
    }, LONG_PRESS_DURATION);
  });

  // Annulation si mouvement trop grand pendant l'appui
  timeline.on("mouseMove", (properties) => {
    if (!longPressTimer || !longPressStartPos || !properties.event) return;

    const dx = Math.abs(properties.event.clientX - longPressStartPos.x);
    const dy = Math.abs(properties.event.clientY - longPressStartPos.y);
    if (dx > LONG_PRESS_MOVE_THRESHOLD || dy > LONG_PRESS_MOVE_THRESHOLD) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      longPressStartPos = null;
      longPressTarget = null;
    }
  });

  // Annulation à la fin de l’appui
  timeline.on("mouseUp", () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      longPressStartPos = null;
      longPressTarget = null;
    }
  });
}

/**
 * Active certains sous-groupes comme landmarks au démarrage.
 * Met à jour le parent pour suivre ses children landmarks.
 */
export function activateInitialLandmarks(groups) {
  const initialLandmarks = [13, 23, 31];

  // Persistance: clé pour stocker un mapping parentId -> landmarkId
  const LANDMARKS_STORAGE_KEY = "landmarksByParent";

  function loadLandmarksByParent() {
    try {
      const raw = localStorage.getItem(LANDMARKS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // Tenter de restaurer depuis le localStorage (un seul par parent)
  const stored = loadLandmarksByParent();
  if (stored && typeof stored === "object") {
    Object.entries(stored).forEach(([parentIdStr, childId]) => {
      const parentId = Number(parentIdStr);
      const g = groups.get(childId);
      if (!g) return;
      if (g.nestedInGroup !== parentId) return;

      // Activer le landmark sur le sous-groupe
      g.isLandmark = true;
      groups.update(g);

      // Mettre à jour le parent
      const parent = groups.get(parentId);
      if (!parent) return;
      parent.landmarkChildren = [childId];
      groups.update(parent);
    });
  } else {
    // S'assurer d'activer au plus un landmark par parent (prendre le premier trouvé)
    const seenParents = new Set();
    initialLandmarks.forEach((id) => {
      const g = groups.get(id);
      if (!g) return;
      const parentId = g.nestedInGroup || null;
      if (!parentId) return;
      if (seenParents.has(parentId)) return; // déjà un activé pour ce parent

      // Activer le landmark sur le sous-groupe
      g.isLandmark = true;
      groups.update(g);

      // Mettre à jour le parent
      const parent = groups.get(parentId);
      if (!parent) return;

      parent.landmarkChildren = parent.landmarkChildren || [];
      if (!parent.landmarkChildren.includes(id)) {
        parent.landmarkChildren.push(id);
      }
      groups.update(parent);

      seenParents.add(parentId);
    });
  }

  // Sauvegarde initiale dans localStorage si aucune sauvegarde n’existe
  try {
    if (!localStorage.getItem("lifestories_groups")) {
      localStorage.setItem("lifestories_groups", JSON.stringify(groups.get()));
    }
  } catch {
    // silent fail si storage indisponible (par ex. mode privé strict)
  }

  // Re-transformer les icônes Lucide
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  // Écouteur pour synchroniser entre onglets (applique la map stockée)
  try {
    window.addEventListener("storage", (e) => {
      if (e.key !== LANDMARKS_STORAGE_KEY) return;
      let raw = null;
      try {
        raw = localStorage.getItem(LANDMARKS_STORAGE_KEY);
        raw = raw ? JSON.parse(raw) : null;
      } catch {
        raw = null;
      }
      if (!raw) return;

      Object.entries(raw).forEach(([pIdStr, childId]) => {
        const pId = Number(pIdStr);
        const g = groups.get(childId);
        if (!g) return;
        if (g.nestedInGroup !== pId) return;
        deactivateSiblingLandmarks(groups, pId, childId);
        g.isLandmark = true;
        groups.update(g);
        const parent = groups.get(pId);
        if (parent) {
          parent.landmarkChildren = [childId];
          groups.update(parent);
        }
      });

      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    });
  } catch {
    // ignore si window/storage inaccessible
  }
}

/**
 * Désactive tous les landmarks frères (mêmes enfants du même parent), sauf `exceptId`.
 */
function deactivateSiblingLandmarks(groups, parentId, exceptId = null) {
  if (!parentId) return;

  const parent = groups.get(parentId);
  const all = groups.get();
  all.forEach((g) => {
    if (g.nestedInGroup === parentId && g.id !== exceptId && g.isLandmark) {
      g.isLandmark = false;
      groups.update(g);
    }
  });

  if (parent) {
    parent.landmarkChildren = (parent.landmarkChildren || []).filter((id) => id === exceptId);
    groups.update(parent);
  }
}

// Helpers pour persister la map parent -> activeLandmark
const LANDMARKS_STORAGE_KEY = "landmarksByParent";

function saveLandmarksByParent(groups) {
  try {
    const map = {};
    const all = groups.get();
    all.forEach((g) => {
      if (g.isLandmark && g.nestedInGroup) {
        map[g.nestedInGroup] = g.id;
      }
    });
    localStorage.setItem(LANDMARKS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function loadLandmarksByParent() {
  try {
    const raw = localStorage.getItem(LANDMARKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Bascule le statut landmark d’un sous-groupe et maintient la liste landmarkChildren du parent.
 */
export function toggleLandmark(groupId, groups, utils) {
  const group = groups.get(groupId);
  if (!group) {
    console.warn("Groupe introuvable pour toggleLandmark:", groupId);
    return;
  }

  // Vérifier que c’est bien un sous-groupe
  const parentId = group.nestedInGroup;
  if (!parentId) {
    console.warn("Ce groupe n'est pas un sous-groupe, toggleLandmark ignoré:", groupId);
    return;
  }

  const parentGroup = groups.get(parentId);
  if (!parentGroup) {
    console.warn("Parent introuvable pour le groupe:", groupId);
    return;
  }

  // Basculer le statut landmark
  const isCurrentlyLandmark = Boolean(group.isLandmark);

  // Si on active, désactiver les autres sous-groupes du même parent
  if (!isCurrentlyLandmark) {
    deactivateSiblingLandmarks(groups, parentId, groupId);
  }

  group.isLandmark = !isCurrentlyLandmark;

  // Maintenir la liste des enfants landmarks du parent (un seul autorisé)
  parentGroup.landmarkChildren = parentGroup.landmarkChildren || [];
  if (group.isLandmark) {
    parentGroup.landmarkChildren = [groupId];
  } else {
    parentGroup.landmarkChildren = parentGroup.landmarkChildren.filter((id) => id !== groupId);
  }

  // Mettre à jour les groupes
  groups.update(group);
  groups.update(parentGroup);

  // Persister l'état des landmarks par parent
  try {
    saveLandmarksByParent(groups);
  } catch {
    // ignore
  }

  // Re-transformer les icônes Lucide
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  // Feedback visuel (optionnel)
  if (utils && typeof utils.prettyAlert === "function") {
    utils.prettyAlert(
      group.isLandmark ? "Landmark activé" : "Landmark désactivé",
      `${group.contentText || "Ce sous-groupe"} ${
        group.isLandmark ? "restera visible" : "ne sera plus visible"
      } quand le groupe est fermé`,
      "success",
      1500
    );
  } else {
    // Fallback discret en console si pas d’UI de feedback
    console.log(
      `[Landmark] ${group.contentText || groupId}:`,
      group.isLandmark ? "activé" : "désactivé"
    );
  }
}
