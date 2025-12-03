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

  initialLandmarks.forEach((id) => {
    const g = groups.get(id);
    if (!g) return;

    // Activer le landmark sur le sous-groupe
    g.isLandmark = true;
    groups.update(g);

    // Mettre à jour le parent
    const parentId = g.nestedInGroup || null;
    if (!parentId) return;

    const parent = groups.get(parentId);
    if (!parent) return;

    parent.landmarkChildren = parent.landmarkChildren || [];
    if (!parent.landmarkChildren.includes(id)) {
      parent.landmarkChildren.push(id);
    }
    groups.update(parent);
  });

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
  group.isLandmark = !isCurrentlyLandmark;

  // Maintenir la liste des enfants landmarks du parent
  parentGroup.landmarkChildren = parentGroup.landmarkChildren || [];
  if (group.isLandmark) {
    if (!parentGroup.landmarkChildren.includes(groupId)) {
      parentGroup.landmarkChildren.push(groupId);
    }
  } else {
    parentGroup.landmarkChildren = parentGroup.landmarkChildren.filter((id) => id !== groupId);
  }

  // Mettre à jour les groupes
  groups.update(group);
  groups.update(parentGroup);

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
