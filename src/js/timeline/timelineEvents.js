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

  if (group.id === 1) iconHtml = '<span class="icon-wrapper"><i data-lucide="house"></i></span> ';
  if (group.id === 2) iconHtml = '<span class="icon-wrapper"><i data-lucide="school"></i></span> ';
  if (group.id === 3) iconHtml = '<span class="icon-wrapper"><i data-lucide="briefcase"></i></span> ';

  if (group.isLandmark) {
    iconHtml += '<span class="icon-wrapper"><i data-lucide="pin" class="lucide landmark-pin"></i></span> ';
  }

  wrapper.innerHTML = iconHtml + (group.contentText || "");
  return wrapper;
}

