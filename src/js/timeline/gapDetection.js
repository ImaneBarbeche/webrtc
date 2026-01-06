import { items, groups } from "./timeline.js";

export function detectGaps(episodes, groups) {
  const gaps = [];

  // Group episodes by group
  const groupedEpisodes = {};

  episodes.forEach((episode) => {
    const groupId = episode.group; // retrieve groups from episodes

    if (!groupedEpisodes[groupId]) {
      groupedEpisodes[groupId] = [];
    }
    groupedEpisodes[groupId].push(episode);
  });

  // For each group, detect gaps
  for (const groupId in groupedEpisodes) {
    // If a DataSet `groups` is provided, only analyze groups
    // explicitly allowed via `showGaps: true`.
    if (groups) {
      const allGroups = groups.get();
      const groupInfo = allGroups.find((g) => String(g.id) === String(groupId));
      if (!groupInfo || groupInfo.showGaps !== true) {
        continue; // skip this group
      }
    }
    const groupEpisodes = groupedEpisodes[groupId];

    // Sort by start date (accept string/number/Date)
    groupEpisodes.sort((a, b) => new Date(a.start) - new Date(b.start));

    // Loop and detect gaps
    for (let i = 1; i < groupEpisodes.length; i++) {
      const actuel = groupEpisodes[i];
      const precedent = groupEpisodes[i - 1];

      if (!isValidDate(actuel.start) || !isValidDate(precedent.end)) continue;
      const startDate = new Date(actuel.start);
      const endDate = new Date(precedent.end);
      if (startDate > endDate) {
        const gap = {
          start: endDate,
          end: startDate,
          duration: startDate - endDate,
          group: groupId, // The gap belongs to this group
        };
        if (gap.duration <= 0) continue;

        gaps.push(gap);
      }
    }
  }

  return gaps;
}

export function createGapItems(gaps) {
  return gaps.map((gap, index) => {
    return {
      id: `gap-${index}-${gap.start}-${gap.end}`,
      start: new Date(gap.start),
      end: new Date(gap.end),
      type: "background",
      className: "timeline-gap",
      group: gap.group,
      content: "No data for this period (missing period).",
    };
  });
}

let isUpdating = false;
let previousGapKeys = []; // Keys of previous gaps for comparison

export function updateGapsInTimeline(items, groups) {
  if (isUpdating) return;
  isUpdating = true;

  const allItems = items.get();

  // Remove old visual gaps
  const ancientGaps = allItems.filter((item) => item.id.startsWith("gap-"));
  const idsASupprimer = ancientGaps.map((gap) => gap.id);
  items.remove(idsASupprimer);

  // Retrieve episodes
  const episodes = allItems.filter(
    (item) =>
      !item.id.startsWith("gap-") &&
      item.start &&
      item.end &&
      item.group &&
      item.type === "range"
  );

  // Detect gaps
  const gaps = detectGaps(episodes, groups);

  // Create keys for current gaps
  const currentGapKeys = gaps.map(
    (gap) => `${gap.group}-${gap.start}-${gap.end}`
  );

  // Notify only NEW gaps
  gaps.forEach((gap) => {
    const key = `${gap.group}-${gap.start}-${gap.end}`;
    if (!previousGapKeys.includes(key)) {
      notifyNewGap(gap, groups);
    }
  });

  // Save for next time
  previousGapKeys = currentGapKeys;

  // Add visual gaps
  const gapItems = createGapItems(gaps);
  items.add(gapItems);

  isUpdating = false;
}

const notifiedGapKeys = new Set();

function notifyNewGap(gap, groups) {
  const key = `${gap.group}-${gap.start}-${gap.end}`;
  if (notifiedGapKeys.has(key)) return; // already notified
  notifiedGapKeys.add(key);
  const allGroups = groups.get();

  // Find the group by its ID
  let groupInfo = allGroups.find((g) => String(g.id) === String(gap.group));
  if (!groupInfo) {
    groupInfo = allGroups.find(
      (g) => g.nestedGroups && g.nestedGroups.includes(Number(gap.group))
    );
  }

  const groupName = groupInfo ? groupInfo.contentText : gap.group;

  // Extract the year (if gap.start and gap.end are dates, otherwise adapt)
  const startYear = new Date(gap.start).getFullYear();
  const endYear = new Date(gap.end).getFullYear();

  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "warning",
    title: "Missing period",
    html: `<b>For ${groupName}: ${startYear} → ${endYear}</b><br>
         <span>Please fill in this period for better data accuracy.</span>`,
    showConfirmButton: false,
    timer: 7000,
    timerProgressBar: true,
  });
}

// Helpers for questionnaire.js
export function getGapList() {
  const episodes = items.get().filter((i) => i.type === "range");
  return detectGaps(episodes, groups);
}

export function getGapCount() {
  return getGapList().length;
}

function isValidDate(value) {
  const d = new Date(value);
  return d instanceof Date && !isNaN(d);
}
