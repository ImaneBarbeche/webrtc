// overlapDetection.js
// Detection of episode overlaps and visual display with background areas

// Prefix to identify inconsistency background items
const OVERLAP_PREFIX = "__overlap_";

// References to DataSets (injected at initialization)
let _items = null;
let _groups = null;

/**
 * Initialize the module with references to DataSets
 * @param {vis.DataSet} items - The items DataSet
 * @param {vis.DataSet} groups - The groups DataSet
 */
export function initOverlapDetection(items, groups) {
  _items = items;
  _groups = groups;
}

const notifiedOverlapKeys = new Set();

/**
 * Detect episode overlaps in the same group
 * and create background items to signal them visually
 */
export function detectAndShowOverlaps() {
  if (!_items || !_groups) {
    console.warn("[OverlapDetection] Module not initialized");
    return;
  }

  // Remove old overlap markers
  clearOverlapMarkers();

  // Retrieve all groups that can have overlaps
  // (subgroups like Municipality, Housing, etc.)
  const subGroups = _groups.get({
    filter: (g) => g.nestedInGroup !== undefined
  });

  // Only handle subgroups explicitly allowed for overlaps
  const allowed = subGroups.filter((g) => g.showOverlaps === true);
  allowed.forEach((group) => {
    detectOverlapsInGroup(group.id);
  });
}

/**
 * Detect overlaps in a specific group
 * @param {number} groupId - The ID of the group to analyze
 */
function detectOverlapsInGroup(groupId) {
  // Retrieve all "range" type items in this group
  const groupItems = _items.get({
    filter: (item) => 
      item.group === groupId && 
      item.type === "range" &&
      !item.id.toString().startsWith(OVERLAP_PREFIX)
  });

  // Sort by start date
  groupItems.sort((a, b) => new Date(a.start) - new Date(b.start));

  // Detect overlaps
  for (let i = 0; i < groupItems.length - 1; i++) {
    const current = groupItems[i];
    const next = groupItems[i + 1];

    const currentEnd = new Date(current.end);
    const nextStart = new Date(next.start);

    // If there is overlap (end of first exceeds start of next)
    if (currentEnd > nextStart) {
      // Calculate the overlap zone
      const overlapStart = nextStart;
      const overlapEnd = currentEnd < new Date(next.end) ? currentEnd : new Date(next.end);

      // Create a background item to mark the overlap
      createOverlapMarker(groupId, overlapStart, overlapEnd, current.id, next.id);
    }
  }
}

/**
 * Create a visual overlap marker (background area)
 */
function createOverlapMarker(groupId, start, end, item1Id, item2Id) {
  const markerId = `${OVERLAP_PREFIX}${groupId}_${item1Id}_${item2Id}`;

  const overlapItem = {
    id: markerId,
    start: start,
    end: end,
    type: "background",
    className: "overlap-warning",
    group: groupId,
    _isOverlapMarker: true,
    _overlappingItems: [item1Id, item2Id],
    _originalGroup: groupId,
    content: "Overlap detected between two episodes.",
    title: `Inconsistency: overlap between episodes from ${formatDate(start)} to ${formatDate(end)}`
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
    title: "Overlap detected",
    html: `<b>For ${groupName}: ${startYear} → ${endYear}</b><br>
         <span>Please notify the respondent of an overlap.</span>`,
    showConfirmButton: false,
    timer: 7000,
    timerProgressBar: true,
  });
}

/**
 * Remove all existing overlap markers
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
 * Format a date for display
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
}

/**
 * Check if a group has overlaps
 * @param {number} groupId - The ID of the group
 * @returns {boolean} - True if there are overlaps
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
 * Return the list of overlaps for a group
 * @param {number} groupId - The ID of the group
 * @returns {Array} - List of overlap markers
 */
export function getOverlaps(groupId) {
  if (!_items) return [];
  
  return _items.get({
    filter: (item) => 
      item._isOverlapMarker === true && 
      (groupId === undefined || item._originalGroup === groupId)
  });
}
