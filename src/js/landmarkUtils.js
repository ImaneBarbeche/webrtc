// Gestion d'appui long pour les landmarks
let longPressTimer = null;
let longPressTarget = null;
let longPressStartPos = null;
const LONG_PRESS_DURATION = 500; // 500ms pour déclencher l'appui long
const LONG_PRESS_MOVE_THRESHOLD = 5; //px

export function setupLongPressHandlers(timeline, groups, utils) {
  timeline.on("mouseDown", function (properties) {
    if (properties.what === "group-label" && properties.group) {
      const clickedGroup = groups.get(properties.group);
      // Seulement pour les sous-groupes
      if (clickedGroup && clickedGroup.nestedInGroup) {
        longPressTarget = properties.group;
        longPressStartPos = {
          x: properties.event.clientX,
          y: properties.event.clientY,
        };
        // Démarrer le timer d'appui long
        longPressTimer = setTimeout(() => {
          // Appui long détecté : basculer le landmark
          toggleLandmark(longPressTarget, groups, utils);
          longPressTarget = null;
          longPressStartPos = null;
        }, LONG_PRESS_DURATION);
      }
    }
  });

  timeline.on("mouseMove", function (properties) {
    if (longPressTimer && longPressStartPos && properties.event) {
      const dx = Math.abs(properties.event.clientX - longPressStartPos.x);
      const dy = Math.abs(properties.event.clientY - longPressStartPos.y);
      if (dx > LONG_PRESS_MOVE_THRESHOLD || dy > LONG_PRESS_MOVE_THRESHOLD) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        longPressStartPos = null;
      }
    }
  });

  timeline.on("mouseUp", function (properties) {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      longPressStartPos = null;
    }
  });
}
export function activateInitialLandmarks(groups) {
  const initialLandmarks = [13, 23, 31];

  initialLandmarks.forEach((id) => {
    const g = groups.get(id);
    if (!g) return;

    // Activer le landmark
    g.isLandmark = true;
    groups.update(g);

    // Mettre à jour le parent
    const parentId = g.keyof || g.nestedInGroup || null;
    if (parentId) {
      const parent = groups.get(parentId);
      if (parent) {
        parent.landmarkChildren = parent.landmarkChildren || [];
        if (!parent.landmarkChildren.includes(id)) {
          parent.landmarkChildren.push(id);
        }
        groups.update(parent);
      }
    }
  });

  // Sauvegarde initiale dans localStorage
  try {
    if (!localStorage.getItem("lifestories_groups")) {
      localStorage.setItem("lifestories_groups", JSON.stringify(groups.get()));
    }
  } catch (e) {
    // silent fail si storage indisponible
  }

  // Re-transformer les icônes Lucide
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

// Fonctions pour la gestion des landmarks (repères temporels)
export function toggleLandmark(groupId, groups, utils) {
  const group = groups.get(groupId);

  // Vérifier si c'est bien un sous-groupe
  if (!group || !group.nestedInGroup) {
    console.warn("Ce groupe n'est pas un sous-groupe");
    return;
  }

  const parentGroup = groups.get(group.nestedInGroup);
  if (!parentGroup) return;

  // Initialiser landmarkChildren si nécessaire
  if (!parentGroup.landmarkChildren) {
    parentGroup.landmarkChildren = [];
  }

  // Basculer le statut landmark
  const isCurrentlyLandmark = group.isLandmark || false;
  group.isLandmark = !isCurrentlyLandmark;

  // Mettre à jour landmarkChildren du parent
  if (group.isLandmark) {
    if (!parentGroup.landmarkChildren.includes(groupId)) {
      parentGroup.landmarkChildren.push(groupId);
    }
  } else {
    parentGroup.landmarkChildren = parentGroup.landmarkChildren.filter(
      (id) => id !== groupId
    );
  }

  // Mettre à jour les groupes
  groups.update(group);
  groups.update(parentGroup);

  // Re-transformer les icônes Lucide
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  // Feedback visuel avec SweetAlert2
  if (utils && utils.prettyAlert) {
    utils.prettyAlert(
      group.isLandmark ? "📌 Landmark activé" : "Landmark désactivé",
      `${renderGroupLabel(group)} ${
        group.isLandmark ? "restera visible" : "ne sera plus visible"
      } quand le groupe est fermé`,
      "success",
      1500
    );
  }
}

