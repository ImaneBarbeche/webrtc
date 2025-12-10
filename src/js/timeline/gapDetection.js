let lastGaps = [];

export function detectGaps(episodes) {
  const gaps = [];

  // Regrouper les épisodes par groupe
  const groupedEpisodes = {};

  episodes.forEach((episode) => {
    const groupId = episode.group; // récupère les groupes depuis les épisodes

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
          group: groupId, // Le gap appartient à ce groupe
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

let isUpdating = false;
let previousGapKeys = []; // ← AJOUTE ÇA

export function updateGapsInTimeline(items, groups) {
  if (isUpdating) return;
  isUpdating = true;

  const allItems = items.get();

  // Supprimer les anciens gaps visuels
  const ancientGaps = allItems.filter((item) => item.id.startsWith("gap-"));
  const idsASupprimer = ancientGaps.map((gap) => gap.id);
  items.remove(idsASupprimer);

  // Récupérer les épisodes
  const episodes = allItems.filter((item) => !item.id.startsWith("gap-"));

  // Détecter les gaps
  const gaps = detectGaps(episodes);
  lastGaps = gaps; // Stocke la liste des gaps à chaque update

  // Créer les clés des gaps actuels
  const currentGapKeys = gaps.map(
    (gap) => `${gap.group}-${gap.start}-${gap.end}`
  );

  // Notifier seulement les NOUVEAUX gaps
  gaps.forEach((gap) => {
    const key = `${gap.group}-${gap.start}-${gap.end}`;
    if (!previousGapKeys.includes(key)) {
      notifyNewGap(gap, groups);
    }
  });

  // Sauvegarder pour la prochaine fois
  previousGapKeys = currentGapKeys;

  // Ajouter les gaps visuels
  const gapItems = createGapItems(gaps);
  items.add(gapItems);

  isUpdating = false;
}

function notifyNewGap(gap, groups) {
  const allGroups = groups.get();

  // Trouver le groupe par son ID
  let groupInfo = allGroups.find((g) => String(g.id) === String(gap.group));
  if (!groupInfo) {
    groupInfo = allGroups.find(
      (g) => g.nestedGroups && g.nestedGroups.includes(Number(gap.group))
    );
  }

  const groupName = groupInfo ? groupInfo.contentText : gap.group;

  // Extraire l'année (si gap.start et gap.end sont des dates, sinon adapte)
  const startYear = new Date(gap.start).getFullYear();
  const endYear = new Date(gap.end).getFullYear();

  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "warning",
    title: "Période non renseignée",
    html: `<b>Pour ${groupName} : ${startYear} → ${endYear}</b><br>
         <span>Veuillez renseigner cette période pour une meilleure précision des données.</span>`,
    showConfirmButton: false,
    timer: 7000,
    timerProgressBar: true,
  });
}

export function getGapCount() {
  return previousGapKeys.length;
}
export function getGapList() {
  return lastGaps;
}