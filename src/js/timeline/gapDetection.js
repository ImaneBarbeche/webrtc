export function detectGaps(episodes) {
  const gaps = [];

  episodes.sort((a, b) => a.start - b.start);

  // boucler à partir de 1

  for (let i = 1; i < episodes.length; i++) {
    const actuel = episodes[i];
    const precedent = episodes[i - 1];

    if (actuel.start > precedent.end) {
      const gap = {
        start: precedent.end, // le trou commence où l'épisode précédent finit
        end: actuel.start, // le trou finit où l'épisode actuel commence
        duration: actuel.start - precedent.end, // la durée du trou
      };

      gaps.push(gap);
    }
  }

  return gaps;
}

export function createGapItems(gaps) {
  return gaps.map((gap, index) => {
    return {
      id: `gap-${index}-${gap.start}-${gap.end}`, // 'gap-0', 'gap-1..
      start: gap.start, // Le début du gap
      end: gap.end, // La fin du gap
      type: "background", // Le type spécial pour les fonds
      className: "timeline-gap",
      content: "", // Optionnel
    };
  });
}

let isUpdating = false; // Flag pour éviter la boucle

export function updateGapsInTimeline(items) {
  // Éviter la boucle infinie
  if (isUpdating) return;
  isUpdating = true;
  // récupérer tous les items
  const allItems = items.get();

  // Trouver et supprimer les anciens gaps
  const ancientGaps = allItems.filter((item) => item.id.startsWith("gap-"));
  const idsASupprimer = ancientGaps.map((gap) => gap.id);
  items.remove(idsASupprimer);

  // 2. Récupérer les épisodes (sans les gaps)
  const episodes = allItems.filter((item) => !item.id.startsWith("gap-"));

  // 3. Détecter les nouveaux gaps
  const gaps = detectGaps(episodes);
  // 4. Créer les gap items
  const gapItems = createGapItems(gaps);
  // 5. Les ajouter à la timeline
  items.add(gapItems);
  isUpdating = false;
}
