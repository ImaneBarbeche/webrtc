// overlapDetection.js
// Détection des chevauchements d'épisodes et affichage visuel avec des background areas

// Préfixe pour identifier les items de background d'incohérence
const OVERLAP_PREFIX = "__overlap_";

// Références aux DataSets (injectées à l'initialisation)
let _items = null;
let _groups = null;

/**
 * Initialise le module avec les références aux DataSets
 * @param {vis.DataSet} items - Le DataSet des items
 * @param {vis.DataSet} groups - Le DataSet des groupes
 */
export function initOverlapDetection(items, groups) {
  _items = items;
  _groups = groups;
}

const notifiedOverlapKeys = new Set();

/**
 * Détecte les chevauchements d'épisodes dans un même groupe
 * et crée des items de background pour les signaler visuellement
 */
export function detectAndShowOverlaps() {
  if (!_items || !_groups) {
    console.warn("[OverlapDetection] Module non initialisé");
    return;
  }

  // Supprimer les anciens marqueurs de chevauchement
  clearOverlapMarkers();

  // Récupérer tous les groupes qui peuvent avoir des chevauchements
  // (sous-groupes comme Commune, Logement, etc.)
  const subGroups = _groups.get({
    filter: (g) => g.nestedInGroup !== undefined
  });

  // Ne traiter que les sous-groupes explicitement autorisés pour les overlaps
  const allowed = subGroups.filter((g) => g.showOverlaps === true);
  allowed.forEach((group) => {
    detectOverlapsInGroup(group.id);
  });
}

/**
 * Détecte les chevauchements dans un groupe spécifique
 * @param {number} groupId - L'ID du groupe à analyser
 */
function detectOverlapsInGroup(groupId) {
  // Récupérer tous les items de type "range" dans ce groupe
  const groupItems = _items.get({
    filter: (item) => 
      item.group === groupId && 
      item.type === "range" &&
      !item.id.toString().startsWith(OVERLAP_PREFIX)
  });

  // Trier par date de début
  groupItems.sort((a, b) => new Date(a.start) - new Date(b.start));

  // Détecter les chevauchements
  for (let i = 0; i < groupItems.length - 1; i++) {
    const current = groupItems[i];
    const next = groupItems[i + 1];

    const currentEnd = new Date(current.end);
    const nextStart = new Date(next.start);

    // S'il y a chevauchement (la fin du premier dépasse le début du suivant)
    if (currentEnd > nextStart) {
      // Calculer la zone de chevauchement
      const overlapStart = nextStart;
      const overlapEnd = currentEnd < new Date(next.end) ? currentEnd : new Date(next.end);

      // Créer un item de background pour marquer le chevauchement
      createOverlapMarker(groupId, overlapStart, overlapEnd, current.id, next.id);
    }
  }
}

/**
 * Crée un marqueur visuel de chevauchement (background area)
 */
function createOverlapMarker(groupId, start, end, item1Id, item2Id) {
  const markerId = `${OVERLAP_PREFIX}${groupId}_${item1Id}_${item2Id}`;

  const overlapItem = {
    id: markerId,
    start: start,
    end: end,
    type: "background",
    className: "overlap-warning",
    // Le background s'applique directement au sous-groupe concerné
    group: groupId,
    // Métadonnées pour identifier les items concernés
    _isOverlapMarker: true,
    _overlappingItems: [item1Id, item2Id],
    _originalGroup: groupId,
    content: "", // Pas de contenu textuel
    title: `Incohérence : chevauchement entre épisodes du ${formatDate(start)} au ${formatDate(end)}`
  };

  _items.add(overlapItem);

  // Notifier l'utilisateur pour les nouveaux chevauchements (une seule fois)
  notifyNewOverlap(overlapItem);
}

function notifyNewOverlap(overlapItem) {
  if (!overlapItem || !overlapItem._originalGroup) return;
  const key = overlapItem.id;
  if (notifiedOverlapKeys.has(key)) return;
  notifiedOverlapKeys.add(key);

  const allGroups = _groups ? _groups.get() : [];
  const groupInfo = allGroups.find((g) => String(g.id) === String(overlapItem._originalGroup));
  const groupName = groupInfo ? groupInfo.contentText : overlapItem._originalGroup;

  const startYear = new Date(overlapItem.start).getFullYear();
  const endYear = new Date(overlapItem.end).getFullYear();

  Swal.fire({
    toast: true,
    position: "top-start",
    icon: "error",
    title: "Chevauchement détecté",
    html: `<b>Pour ${groupName} : ${startYear} → ${endYear}</b><br>
         <span>Veuillez notifier l'enquêté d'un chevauchement.</span>`,
    showConfirmButton: false,
    timer: 7000,
    timerProgressBar: true,
  });
}

/**
 * Supprime tous les marqueurs de chevauchement existants
 */
export function clearOverlapMarkers() {
  if (!_items) return;
  
  const overlapItems = _items.get({
    filter: (item) => item._isOverlapMarker === true
  });
  
  if (overlapItems.length > 0) {
    _items.remove(overlapItems.map(item => item.id));
  }
}

/**
 * Formate une date pour l'affichage
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
}

/**
 * Vérifie si un groupe a des chevauchements
 * @param {number} groupId - L'ID du groupe
 * @returns {boolean} - True s'il y a des chevauchements
 */
export function hasOverlaps(groupId) {
  if (!_items) return false;
  
  const overlapItems = _items.get({
    filter: (item) => 
      item._isOverlapMarker === true && 
      item._originalGroup === groupId
  });
  return overlapItems.length > 0;
}

/**
 * Retourne la liste des chevauchements pour un groupe
 * @param {number} groupId - L'ID du groupe
 * @returns {Array} - Liste des marqueurs de chevauchement
 */
export function getOverlaps(groupId) {
  if (!_items) return [];
  
  return _items.get({
    filter: (item) => 
      item._isOverlapMarker === true && 
      (groupId === undefined || item._originalGroup === groupId)
  });
}
