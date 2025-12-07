export function detectGaps(episodes) {
  const gaps = [];

  // Regrouper les épisodes par groupe
  const groupedEpisodes = {};
  
  episodes.forEach(episode => {
    const groupId = episode.group;
    if (!groupedEpisodes[groupId]) {
      groupedEpisodes[groupId] = [];
    }
    groupedEpisodes[groupId].push(episode);
  });

  // Pour chaque groupe, détecter les gaps
  for (const groupId in groupedEpisodes) {
    const groupEpisodes = groupedEpisodes[groupId];
    
    // Trier par date de début
    groupEpisodes.sort((a, b) => a.start - b.start);

    // Boucler et détecter les gaps
    for (let i = 1; i < groupEpisodes.length; i++) {
      const actuel = groupEpisodes[i];
      const precedent = groupEpisodes[i - 1];

      if (actuel.start > precedent.end) {
        const gap = {
          start: precedent.end,
          end: actuel.start,
          duration: actuel.start - precedent.end,
          group: groupId,  // Le gap appartient à ce groupe
        };
        gaps.push(gap);
      }
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
      group: gap.group,
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
  notifyNewGap();
  isUpdating = false;
}

function notifyNewGap(gap) {
    // Utilise SweetAlert2 en mode "toast"
    Swal.fire({
        toast: true,
        position: 'top-end',      // En haut à droite
        icon: 'warning',
        title: 'Période non renseignée',
        text: `${gap.group} : ${gap.start} → ${gap.end}`,
        showConfirmButton: false,
        timer: 5000,              // Disparaît après 5 sec
        timerProgressBar: true,
    });
}
