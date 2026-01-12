import state from "../state.js";
import { items } from "../timeline/timeline.js";

/**
 ************************************************************************
 * episodes.js handles adding, modifying and deleting episodes or events
 ************************************************************************
 **/

/**
 *
 * @param {string} text input value of the answer
 * @param {Date} start start date of the episode to add
 * @param {Date} end end date of the episode to add
 * @param {int} group group where the episode belongs to
 * @param {string} questionid string containining the question answered id ex: "q1"
 * @returns
 */
export function ajouterEpisode(text, start, end, group) {
  if (end == 0) {
    end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
  }
  let classColor = group.toString().startsWith("1")
    ? "orange"
    : group.toString().startsWith("2")
    ? "red"
    : group.toString().startsWith("3")
    ? "green"
    : "blue";
  let item = {
    id: crypto.randomUUID(),
    type: "range",
    content: text,
    start: start,
    end: end,
    group: group,
    className: classColor,
  };

  if (state.lastEpisode?.end == item.start) {
    state.previousEpisode = state.lastEpisode;
  }

  items.add(item);
  console.log(item.id);
  console.log(item.content);
  state.lastEpisode = item;
  return item;
}

export function ajouterEvenement(text, icon, start, group) {
  let classColor = group.toString().startsWith("1")
    ? "orange"
    : group.toString().startsWith("2")
    ? "red"
    : group.toString().startsWith("3")
    ? "green"
    : "blue";
  let item = {
    id: crypto.randomUUID(),
    type: "box",
    content: text,
    start: start,
    group: group,
    className: classColor,
    icon: icon,
  };
  items.add(item);
  return item;
}

/* Modify the end of an episode
 * Add an episode with start date = end date of the previous one
 */
export function modifierEpisode(id, modifications, syncViaWebRTC = false) {
  let itemtomodify = items.get(id);
  const convertYearToDate = (year) =>
    year && /^\d{4}$/.test(year) ? new Date(`${year}-01-01`) : year;

  // Apply the conversion on 'start' and 'end'
  if (modifications.start)
    modifications.start = convertYearToDate(modifications.start);
  if (modifications.end)
    modifications.end = convertYearToDate(modifications.end);

  // If we modify only the start date and the new start date is after the end date, we set 1 year
  if (
    modifications.start &&
    !modifications.end &&
    modifications.start >= itemtomodify.end
  ) {
    let newDate = new Date(modifications.start);
    // setFullYear retourne un timestamp (number) — garder un Date
    let endDate = new Date(newDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    modifications.end = endDate;
  }

  // If we modify only the end date and the new end date is before the start date, we set 1 year
  if (
    modifications.end &&
    !modifications.start &&
    modifications.end <= itemtomodify.start
  ) {
    let newDate = new Date(modifications.end);
    // setFullYear retourne un timestamp (number) — garder un Date
    let startDate = new Date(newDate);
    startDate.setFullYear(startDate.getFullYear() + 1);
    modifications.start = startDate;
  }

  Object.assign(itemtomodify, modifications);
  items.update(itemtomodify);

  // Synchronize via WebRTC if needed
  if (syncViaWebRTC && window.webrtcSync && window.webrtcSync.isActive()) {
    try {
      window.webrtcSync.sendMessage({
        type: "UPDATE_ITEMS",
        items: [itemtomodify],
      });
    } catch (e) {
      console.warn(
        "Erreur lors de la synchronisation de la modification d'épisode",
        e
      );
    }
  }
  return itemtomodify;
}

/**
 * Function to search for an episode by its group and if a date is included
 * @param {int} groupId group in which to search for an episode
 * @param {Date} dateRecherchee search for an episode that contains this date
 */
function rechercherEpisode(groupId, dateRecherchee) {
  const date = new Date(dateRecherchee);
  const episodes = items.get();
  const episodesCorrespondants = episodes.filter((item) => {
    return (
      item.group === groupId &&
      new Date(item.start) <= date &&
      new Date(item.end) >= date
    );
  });

  return episodesCorrespondants; // Return the matching episodes
}
