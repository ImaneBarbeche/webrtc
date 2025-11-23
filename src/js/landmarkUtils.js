export function activateInitialLandmarks(groups) {
  const initialLandmarks = [13, 23, 31];
  initialLandmarks.forEach((id) => {
    const g = groups.get(id);
    if (!g) return;
    g.isLandmark = true;
    if (!String(g.content).includes("📌")) {
      g.content = "📌 " + (g.content || "");
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
    // Ajouter l'icône 📌 si pas présent
    if (!group.content.includes("📌")) {
      group.content = "📌 " + group.content.trim();
    }
  } else {
    // Retirer de landmarkChildren
    parentGroup.landmarkChildren = parentGroup.landmarkChildren.filter(
      (id) => id !== groupId
    );
    // Retirer l'icône 📌
    group.content = group.content.replace("📌 ", "").trim();
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
