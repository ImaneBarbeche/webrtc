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
    g.isLandmark = true;
    if (!String(g.content).includes('<i data-lucide="map-pin" class="lucide landmark-pin"></i>')) {
      g.content = '<i data-lucide="map-pin" class="lucide landmark-pin"></i>' + (g.content || "");
    }
    groups.update(g);
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
  try {
    if (!localStorage.getItem("lifestories_groups")) {
      localStorage.setItem("lifestories_groups", JSON.stringify(groups.get()));
    }
  } catch (e) {
    // silent fail if storage unavailable
  }
}
// Fonctions pour la gestion des landmarks (repères temporels)
export function toggleLandmark(groupId, groups, utils) {
  const group = groups.get(groupId);

  // Vérifier si c'est bien un sous-groupe (qui a nestedInGroup)
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
      // Ajouter à landmarkChildren si pas déjà présent
      if (!parentGroup.landmarkChildren.includes(groupId)) {
        parentGroup.landmarkChildren.push(groupId);
      }
      // Ajouter l'icône Lucide du landmark sans toucher à l'icône du groupe parent
      if (!group.content.includes('data-lucide="map-pin"')) {
        group.content = '<i data-lucide="map-pin" class="lucide landmark-pin"></i> ' + group.content.replace(/^(<i[^>]*data-lucide=["'][^"']+["'][^>]*><\/i>\s*)*/, "").trim();
      }
    } else {
      // Retirer de landmarkChildren
      parentGroup.landmarkChildren = parentGroup.landmarkChildren.filter(
        (id) => id !== groupId
      );
      // Retirer l'icône Lucide du landmark uniquement
      group.content = group.content.replace(/<i[^>]*data-lucide=\"map-pin\"[^>]*><\/i>\s*/g, "").trim();
    }

    // Mettre à jour les groupes
    groups.update(group);
    groups.update(parentGroup);

    // Forcer le redraw et la transformation Lucide pour affichage immédiat
    if (window.timeline && typeof window.timeline.redraw === "function") {
      window.timeline.redraw();
      setTimeout(() => {
        if (window.lucide && typeof window.lucide.createIcons === "function") {
          window.lucide.createIcons();
        }
      }, 50);
    }

    // Feedback visuel avec SweetAlert2
    if (utils && utils.prettyAlert) {
      utils.prettyAlert(
        group.isLandmark ? "📌 Landmark activé" : "Landmark désactivé",
        `${group.content.replace(/<i[^>]*data-lucide=\"map-pin\"[^>]*><\/i>\s*/g, "")} ${
          group.isLandmark ? "restera visible" : "ne sera plus visible"
        } quand le groupe est fermé`,
        "success",
        1500
      );
    }

  // Mettre à jour les groupes
  groups.update(group);
  groups.update(parentGroup);

  // Feedback visuel avec SweetAlert2
  if (utils && utils.prettyAlert) {
    utils.prettyAlert(
      group.isLandmark ? "📌 Landmark activé" : "Landmark désactivé",
      `${group.content.replace("📌 ", "")} ${
        group.isLandmark ? "restera visible" : "ne sera plus visible"
      } quand le groupe est fermé`,
      "success",
      1500
    );
  }
}
