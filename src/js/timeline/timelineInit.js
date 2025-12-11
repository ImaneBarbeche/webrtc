import { items, groups } from "./timeline.js";
import { options } from "./timelineConfig.js";
import {
  restoreItems,
  restoreGroups,
  restoreOptions,
} from "./timelineStorage.js";
import { attachPersistenceListeners } from "./timelinePersistence.js";
import {
  detectGaps,
  createGapItems,
  updateGapsInTimeline,
} from "./gapDetection.js";

// Garde pour eviter la double initialisation
let _timelineInstance = null;

export function initTimeline() {
  // Eviter la double initialisation
  if (_timelineInstance) {
    console.warn("Timeline deja initialisee, retour de l'instance existante");
    return _timelineInstance;
  }

  // Restaurer depuis localStorage
  restoreItems(items);
  restoreGroups(groups);
  restoreOptions(options);

  // Définir editable selon le rôle (enqueté = viewer) conservé en sessionStorage
  try {
    const isViewer = sessionStorage.getItem("webrtc_isOfferor") === "false";
    // Si isViewer true -> utilisateur est enquêté -> désactiver édition
    options.editable = !isViewer;
  } catch (e) {}

  // Creer la timeline
  const container = document.getElementById("timeline");
  if (!container) {
    console.error("Element #timeline introuvable");
    return null;
  }

  const timeline = new vis.Timeline(container, items, groups, options);
  _timelineInstance = timeline;

  // S'assurer que lorsque LifeStories est affiché (après onboarding),
  // l'option editable est mise à jour en fonction du rôle courant.
  document.addEventListener("lifestoriesShown", () => {
    try {
      const isViewer = sessionStorage.getItem("webrtc_isOfferor") === "false";
      timeline.setOptions({ editable: !isViewer });
      try { timeline.redraw(); } catch (e) {}
    } catch (e) {}
  });

  // Attacher la persistance automatique
  attachPersistenceListeners(items, groups, timeline);

  // 1. Récupérer les épisodes
  const episodes = items.get();

  // 2. Détecter les gaps
  const gaps = detectGaps(episodes);

  // 3. Créer les items visuels
  const gapItems = createGapItems(gaps);

  // 4. Ajouter à la timeline
  items.add(gapItems);

  // Après la création de la timeline, ajoute les écouteurs :
  items.on("add", () => updateGapsInTimeline(items, groups));
  items.on("update", () => updateGapsInTimeline(items, groups));
  items.on("remove", () => updateGapsInTimeline(items, groups));

  // Retourner l'instance pour l'utiliser ailleurs
  return timeline;
}
