// timelineEvents.js
import * as utils from "../utils.js";

export function onAdd(item, callback, isEditingEpisode) {
  if (isEditingEpisode) {
    callback(null);
    return;
  }
  utils.prettyEpisode(item.content, function (value) {
    if (value) {
      item.content = value;
      item.start = new Date(`${item.start.getFullYear()}-01-01`);
      let endDate = new Date(item.start);
      endDate.setFullYear(endDate.getFullYear() + 1);
      item.end = endDate;

      if (String(item.group).startsWith(1)) item.className = "green";
      else if (String(item.group).startsWith(2)) item.className = "blue";
      else if (String(item.group).startsWith(3)) item.className = "red";

      callback(item);
    } else {
      callback(null);
    }
  });
}

export function onMove(item, callback) {
  let title = `Do you really want to move the item to\nstart: ${item.start}\nend: ${item.end}?`;
  utils.prettyConfirm("Move item", title).then((ok) => {
    if (ok) callback(item);
    else callback(null);
  });
}

export function onMoving(item, callback) {
  callback(item);
}

export function onUpdate(item, callback) {
  let attributes = utils.getAttributes(item.content);
  if (item.type == "point") {
    if (attributes === "erreur") {
      console.error("Attributs non définis pour cet item");
      callback(null);
      return;
    }
    utils.prettyPrompt(item, attributes, function (formData) {
      if (formData) {
        item.attributes = formData;
        callback(item);
      } else {
        callback(null);
      }
    });
  } else if (item.type == "range") {
    utils.prettyEpisode(item.content, function (value) {
      if (value) {
        item.content = value;
        callback(item);
      } else {
        callback(null);
      }
    });
  }
}

export function onRemove(item, callback) {
  utils.prettyConfirm("Remove item", `Do you really want to remove item ${item.content}?`)
    .then((ok) => {
      if (ok) callback(item);
      else callback(null);
    });
}

export function snap(date, scale, stepSize, isCustomBarMoving) {
  if (isCustomBarMoving) {
    return new Date(Math.round(date.getTime() / stepSize) * stepSize);
  } else {
    return new Date(date.getFullYear(), 0, 1);
  }
}

export function groupTemplate(group) {
  const wrapper = document.createElement("span");
  let iconHtml = "";

  // Icônes pour groupes racine
  if (group.id === 1) iconHtml = '<i data-lucide="map-pin-house"></i> ';
  if (group.id === 2) iconHtml = '<i data-lucide="school"></i> ';
  if (group.id === 3) iconHtml = '<i data-lucide="briefcase"></i> ';

  // Icônes pour nested groups (Migratoire)
  if (group.id === 11) iconHtml = '<i data-lucide="key-round"></i> '; // Statut résidentiel
  if (group.id === 12) iconHtml = '<i data-lucide="house"></i> '; // Logement
  if (group.id === 13) iconHtml = '<i data-lucide="map-pinned"></i> '; // Commune

  // Icônes pour nested groups (Scolaire)
  if (group.id === 21) iconHtml = '<i data-lucide="building-2"></i> '; // Établissements
  if (group.id === 22) iconHtml = '<i data-lucide="book-marked"></i> '; // Formations
  if (group.id === 23) iconHtml = '<i data-lucide="graduation-cap"></i> '; // Diplômes

  // Icônes pour nested groups (Professionnelle)
  if (group.id === 31) iconHtml = '<i data-lucide="contact-round"></i> '; // Postes
  if (group.id === 32) iconHtml = '<i data-lucide="file-text"></i> '; // Contrats

  // Icône Landmark si activé
  if (group.isLandmark) {
    iconHtml += '<i data-lucide="pin" class="lucide landmark-pin"></i> ';
  }

  // Texte du groupe avec classe trajectory-title
  wrapper.innerHTML = iconHtml + `<span class="trajectory-title">${group.contentText || ""}</span>`;
  return wrapper;
}

