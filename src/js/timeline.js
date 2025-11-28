import { exportTimelineData } from "./importExportUtils.js";
import { importTimelineData } from "./importExportUtils.js";
import { activateInitialLandmarks } from "./landmarkUtils.js";
import * as utils from "./utils.js";
import { test_items } from "./dataset.js";
import { setBirthYear, getBirthYear } from "./birthYear.js";
import { toggleLandmark } from "./landmarkUtils.js";
import {
  restoreItems,
  restoreGroups,
  restoreOptions,
  persistItems,
  persistGroups,
  persistOptions,
} from "./timelineStorage.js";
import { setupLongPressHandlers } from "./landmarkUtils.js";
import { handleDragStart, handleDragEnd } from "./dragHandlers.js";
import { toggleSummary, setupSummaryHandlers } from "./summaryUtils.js";
import { setupZoomNavigation } from "./zoomNavigation.js";
import { openEpisodeEditModal } from "./episodeEdit.js";

/**
 *****************************************************************************************************
 * timeline.js gère l'initialisation, le rendu graphique et les interactions possibles du calendrier *
 *****************************************************************************************************
 */

// Données des groupes

const groupsData = [
  // MIGRATOIRE
  {
    id: 1,
    contentText: "Migratoire", // texte brut
    nestedGroups: [11, 12, 13],
    showNested: true,
    className: "vert",
  },
  {
    id: 11,
    contentText: "Statut résidentiel",
    dependsOn: 12,
    className: "line_11",
  },
  { id: 12, contentText: "Logement", dependsOn: 13, className: "line_12" },
  { id: 13, contentText: "Commune", nestedInGroup: 1, className: "line_13" },

  // SCOLAIRE
  {
    id: 2,
    contentText: "Scolaire",
    nestedGroups: [21, 22, 23],
    showNested: false,
    className: "bleu",
  },
  {
    id: 21,
    contentText: "Établissements",
    dependsOn: 23,
    className: "line_21",
  },
  { id: 22, contentText: "Formations", dependsOn: 23, className: "line_22" },
  { id: 23, contentText: "Diplômes", nestedInGroup: 2, className: "line_23" },

  // PROFESSIONNELLE
  {
    id: 3,
    contentText: "Professionnelle",
    nestedGroups: [31, 32],
    showNested: false,
    className: "rouge",
  },
  { id: 31, contentText: "Postes", nestedInGroup: 3, className: "line_31" },
  { id: 32, contentText: "Contrats", dependsOn: 31, className: "line_32" },
];

// ===============================
// VARIABLES GLOBALES ET CONSTANTES
// ===============================
let longPressTarget = undefined;
let stepSize = 1000 * 60 * 60 * 24; // 1 jour en millisecondes
let timeline;
let isCustomBarMoving = false;
let isEditingEpisode = false;
const items = new vis.DataSet();
const groups = new vis.DataSet(groupsData);

// ===============================
// CONSTANTES ET SÉLECTIONS DOM
// ===============================
const summaryContainer = document.getElementById("bricks");
const viewSummaryBtn = document.getElementById("view-summary");
const closeSummaryBtn = document.getElementById("close-summary");
const zoomInBtns = document.querySelectorAll("#zoom-in");
const zoomOutBtns = document.querySelectorAll("#zoom-out");
const moveBackwardsBtns = document.querySelectorAll("#move-backwards");
const moveForwardsBtns = document.querySelectorAll("#move-forwards");

// Bouton 'Load' pour importer les items de test
document.getElementById("load").addEventListener("click", function () {
  importTimelineData(items, test_items, utils);
});
// Bouton 'Export' pour exporter les items de la timeline
document.getElementById("export").addEventListener("click", async function () {
  await exportTimelineData(items);
});
// Appeler setupZoomNavigation APRÈS l'initialisation de timeline
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    setupZoomNavigation({
      timeline,
      zoomInBtns,
      zoomOutBtns,
      moveBackwardsBtns,
      moveForwardsBtns,
    });
  }, 100);
});

// ===============================
// OPTIONS DE LA TIMELINE
// ===============================
const options = {
  editable: true,
  zoomMin: 1000 * 60 * 60 * 24 * 365 * 1, // 5 years in ms
  zoomMax: 1000 * 60 * 60 * 24 * 365 * 50, // 50 years in ms
  min: new Date(),
  max: new Date(`${new Date().getFullYear() + 5}-12-31`),
  showCurrentTime: false, // Ne pas afficher la ligne de temps actuelle
  orientation: "top", // Option pour définir l'orientation (top/bottom)
  margin: { item: { vertical: 30, horizontal: 0 } },
  align: "center",
  stack: true,
  end: new Date(`${new Date().getFullYear()}-12-31`),
  verticalScroll: true,
  height: "80vh",
  zoomable: true,
  zoomFriction: 40,
  // timeAxis: {scale: 'year', step: 5},
  showMinorLabels: true,
  showMajorLabels: true,
  xss: {
    filterOptions: {
      allowList: {
        span: ["class"],
        p: ["class"],
        b: [],
        br: [],
        div: ["class", "title"],
        img: ["src", "alt", "class", "width", "height"],
      },
    },
  },
  format: {
    minorLabels: function (date, scale, step) {
      switch (scale) {
        case "millisecond":
          return vis.moment(date).format("SSS");
        case "second":
          return vis.moment(date).format("s");
        case "minute":
          return vis.moment(date).format("HH:mm");
        case "hour":
          return vis.moment(date).format("HH:mm");
        case "weekday":
          return vis.moment(date).format("ddd D");
        case "day":
          return vis.moment(date).format("D");
        case "week":
          return vis.moment(date).format("w");
        case "month":
          return vis.moment(date).format("MMM");
        case "year":
          const year = new Date(date).getFullYear();
          const birthYear = getBirthYear();
          const age = birthYear ? year - birthYear : "";
          return `<div style="display:flex;flex-direction:column;align-items:center;">
                    <b>${year}</b>
                    <span style="font-size:12px;color:#888;">${
                      age !== "" ? age + " ans" : ""
                    }</span>
                  </div>`;
        default:
          return "";
      }
    },
  },
  template: function (item, element, data) {
    if (!item) return "";
    if (item.type === "box" && item.category === "degree") {
      return `
            <img src="./assets/icon/degree.svg" alt="${item.content}" />
                `;
    }
    // fallback: original content (keeps existing behaviour)
    return item.content;
  },
  onAdd: function (item, callback) {
    if (isEditingEpisode) {
      callback(null); // Annule l'ajout si on est en édition
      return;
    }
    // Appel à prettyEpisode pour les éléments de type "range"
    utils.prettyEpisode(item.content, function (value) {
      if (value) {
        item.content = value;
        item.start = new Date(`${item.start.getFullYear()}-01-01`); // remise à l'echelle année
        // garder `item.end` comme Date (setFullYear retourne un timestamp)
        let endDate = new Date(item.start);
        endDate.setFullYear(endDate.getFullYear() + 1);
        item.end = endDate; // 1 année

        if (String(item.group).startsWith(1)) item.className = "green";
        else if (String(item.group).startsWith(2)) item.className = "blue";
        else if (String(item.group).startsWith(3)) item.className = "red";

        let retrieveUlGroup = document.getElementById(`ulgroup_${item.group}`);
        if (retrieveUlGroup) {
          let arr = Array.from(retrieveUlGroup.querySelectorAll("li")).find(
            (e) => e.innerHTML == item.content
          );
          arr.style.textDecoration = "line-through";
          arr.style.opacity = "0.2";
        }

        callback(item); // Retourner l'item modifi
      } else {
        let retrieveUlGroup = document.getElementById(`ulgroup_${item.group}`);
        if (retrieveUlGroup) {
          let arr = Array.from(retrieveUlGroup.querySelectorAll("li")).find(
            (e) => e.style.opacity == "0.2"
          );
          arr.style.opacity = "1";
        }

        callback(null); // Annuler si l'utilisateur n'a pas confirmé
      }
    });
  },

  onMove: function (item, callback) {
    let title = `Do you really want to move the item to\nstart: ${item.start}\nend: ${item.end}?`;

    utils.prettyConfirm("Move item", title).then((ok) => {
      if (ok) {
        callback(item); // Confirmer le déplacement
      } else {
        callback(null); // Annuler le mouvement
      }
    });
  },

  onMoving: function (item, callback) {
    callback(item); // send back the (possibly) changed item
  },

  onUpdate: function (item, callback) {
    let attributes = utils.getAttributes(item.content); // Obtenir les attributs en fonction du type d'événement
    if (item.type == "point") {
      if (attributes === "erreur") {
        console.error("Attributs non définis pour cet item");
        callback(null); // Annuler si les attributs sont incorrects
        return;
      }

      utils.prettyPrompt(item, attributes, function (formData) {
        if (formData) {
          // Ajouter les valeurs des inputs comme attributs à l'item
          item.attributes = formData;
          callback(item); // Retourner l'item modifié
        } else {
          callback(null); // Annuler l'update'
        }
      });
    } else if (item.type == "range") {
      // Appel à prettyEpisode pour les éléments de type "range"
      utils.prettyEpisode(item.content, function (value) {
        if (value) {
          item.content = value;
          callback(item); // Retourner l'item modifié
        } else {
          callback(null); // Annuler si l'utilisateur n'a pas confirmé
        }
      });
    }
  },

  onRemove: function (item, callback) {
    utils
      .prettyConfirm(
        "Remove item",
        `Do you really want to remove item ${item.content}?`
      )
      .then((ok) => {
        if (ok) {
          callback(item); // Confirmer la suppression
        } else {
          callback(null); // Annuler la suppression
        }
      });
  },

  // Utile pour la custom barre
  snap: function (date, scale, step) {
    if (isCustomBarMoving) {
      return new Date(Math.round(date.getTime() / stepSize) * stepSize);
    } else {
      return new Date(date.getFullYear(), 0, 1);
    }
  },
  groupTemplate: function (group) {
    const wrapper = document.createElement("span");
    // Icône principale pour les groupes racine
    let iconHtml = "";
    if (group.id === 1) iconHtml = '<i data-lucide="house"></i> ';
    if (group.id === 2) iconHtml = '<i data-lucide="school"></i> ';
    if (group.id === 3) iconHtml = '<i data-lucide="briefcase"></i> ';
    // Icône Landmark si activé
    if (group.isLandmark) {
      iconHtml += '<i data-lucide="pin" class="lucide landmark-pin"></i> ';
    }
    // Texte du groupe
    wrapper.innerHTML = iconHtml + (group.contentText || "");
    return wrapper;
  },
};

// Utilisation des fonctions du module timelineStorage.js
restoreItems(items);
restoreGroups(groups);
restoreOptions(options);

// Persister automatiquement les items dès qu'ils changent (utile si la timeline
try {
  if (items && typeof items.on === "function") {
    items.on("add", function () {
      persistItems(items);
    });
    items.on("update", function () {
      persistItems(items);
    });
    items.on("remove", function () {
      persistItems(items);
    });
  }
} catch (e) {
  console.warn(
    "[LifeStories] failed to attach persistence listeners to items",
    e
  );
}

activateInitialLandmarks(groups);

// Initialisation de la date de naissance au démarrage
try {
  let birthYearStored = localStorage.getItem("birthYear"); // Récupère la date de naissance enregistrée
  if (!birthYearStored) {
    const answeredRaw = localStorage.getItem("lifestories_answered_questions"); // Récupère toutes les réponses du questionnaire
    if (answeredRaw) {
      try {
        const answeredArr = JSON.parse(answeredRaw);
        let found = null;
        for (const obj of answeredArr) {
          const answer = obj.answer || {};
          // Différents formats possibles selon la structure des réponses
          if (answer.type === "ANSWER_BIRTH_YEAR" && answer.birthdate) {
            found = answer.birthdate;
            break;
          }
          if (answer.key === "birthYear" && answer.value) {
            found = answer.value;
            break;
          }
          if (answer.value && /^\d{4}$/.test(answer.value)) {
            found = answer.value;
            break;
          }
        }
        if (found) {
          birthYearStored = found;
        }
      } catch (e) {
        console.warn("Could not parse lifestories_answered_questions:", e);
      }
    }
  }
  // Si une date de naissance est trouvée, on initialise l'affichage birthyear et le calcul de l'âge
  if (birthYearStored) {
    setBirthYear(birthYearStored);
  }
} catch (e) {}

// Création de la timeline avec les données chargées - attendre que tout soit chargé
document.addEventListener(
  "DOMContentLoaded",
  function () {
    const container = document.getElementById("timeline");

    // Attendre que les styles soient appliqués
    setTimeout(() => {
      timeline = new vis.Timeline(container, items, groups, options);
      // Exporter la timeline globalement
      window.timeline = timeline;

      // Transformer les balises Lucide en SVG après le rendu initial
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }

      // Si des items sont ajoutés après l'initialisation (ex: via WebRTC),
      // s'assurer que la timeline s'ajuste automatiquement pour les afficher.
      try {
        items.on &&
          items.on("add", function (added) {
            try {
              timeline.fit();
            } catch (e) {}
            // Redraw utile après ajout d'item pour corriger certains bugs d'affichage
            setTimeout(() => {
              try {
                timeline.redraw();
                // Transformer les balises Lucide en SVG après chaque redraw
                if (
                  window.lucide &&
                  typeof window.lucide.createIcons === "function"
                ) {
                  window.lucide.createIcons();
                }
              } catch (e) {}
            }, 0);
          });
        items.on &&
          items.on("update", function (updated) {
            // Redraw utile après modification d'un item (ex: édition via modal)
            setTimeout(() => {
              try {
                timeline.redraw();
                // Transformer les balises Lucide en SVG après chaque redraw
                if (
                  window.lucide &&
                  typeof window.lucide.createIcons === "function"
                ) {
                  window.lucide.createIcons();
                }
              } catch (e) {}
            }, 0);
          });
      } catch (e) {
        console.warn("[LifeStories] cannot attach items listeners", e);
      }

      // Émettre un événement personnalisé pour signaler que la timeline est prête
      document.dispatchEvent(new CustomEvent("timelineReady"));

      // Sauvegarder automatiquement à chaque changement
      timeline.on("changed", () => {
        localStorage.setItem("lifestories_items", JSON.stringify(items.get()));
        localStorage.setItem(
          "lifestories_groups",
          JSON.stringify(groups.get())
        );

        // Sauvegarder aussi les options importantes de la timeline
        const currentOptions = {
          min: timeline.options.min,
          max: timeline.options.max,
          start: timeline.options.start,
          end: timeline.options.end,
        };
        localStorage.setItem(
          "lifestories_options",
          JSON.stringify(currentOptions)
        );
      });

      // Initialiser la gestion d'appui long pour landmarks ET items
      let longPressTimer = null;
      let longPressStartPos = null;
      let longPressTargetItem = null;
      const LONG_PRESS_DURATION = 500;
      const LONG_PRESS_MOVE_THRESHOLD = 5;

      timeline.on("mouseDown", function (properties) {
        if (properties.what === "item" && properties.item) {
          longPressTargetItem = properties.item;
          longPressStartPos = {
            x: properties.event.clientX,
            y: properties.event.clientY,
          };
          longPressTimer = setTimeout(() => {
            isEditingEpisode = true;
            const item = items.get(longPressTargetItem);
            openEpisodeEditModal(item, function (updatedItem) {
              items.update(updatedItem);
              // Redraw après édition via modal pour corriger l'affichage
              setTimeout(() => {
                timeline.redraw();
              }, 0);
              isEditingEpisode = false;
            });
            longPressTargetItem = null;
            longPressStartPos = null;
          }, LONG_PRESS_DURATION);
        }
      });

      timeline.on("mouseMove", function (properties) {
        if (longPressTimer && longPressStartPos && properties.event) {
          const dx = Math.abs(properties.event.clientX - longPressStartPos.x);
          const dy = Math.abs(properties.event.clientY - longPressStartPos.y);
          if (
            dx > LONG_PRESS_MOVE_THRESHOLD ||
            dy > LONG_PRESS_MOVE_THRESHOLD
          ) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
            longPressStartPos = null;
          }
        }
      });

      timeline.on("mouseUp", function (properties) {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
          longPressStartPos = null;
        }
      });

      // Initialiser la gestion d'appui long pour landmarks (group-label)
      setupLongPressHandlers(timeline, groups, utils);

      timeline.on("click", function (properties) {
        // ACCESSIBILITÉ : Clic sur l'axe temporel pour déplacer la barre verticale
        if (properties.what === "axis" && properties.time) {
          // Déplacer la barre custom à la date cliquée
          const clickedTime = new Date(properties.time);
          // Arrondir à l'année pour cohérence avec le snap
          const yearStart = new Date(clickedTime.getFullYear(), 0, 1);
          timeline.setCustomTime(yearStart, customTimeId);

          // Déclencher manuellement la mise à jour de la synthèse
          // (normalement géré par l'événement timechange, mais on le force ici)
          timeline.emit("timechange", { id: customTimeId, time: yearStart });
          timeline.setCustomTimeTitle(
            new Date(snappedTime).getFullYear(),
            "custom-bar"
          );

          return; // Sortir pour ne pas traiter d'autres clics
        }

        // Vérifier si c'est un clic sur un label de groupe
        if (properties.what === "group-label" && properties.group) {
          const clickedGroup = groups.get(properties.group);

          // Si c'était un appui long traité, ne pas continuer
          if (
            longPressTarget === null &&
            clickedGroup &&
            clickedGroup.nestedInGroup
          ) {
            // On vient de traiter un appui long, réinitialiser
            longPressTarget = undefined;
            return;
          }
          longPressTarget = undefined;

          // Vérifier si ce groupe a des landmarks définis (logique normale de fermeture/ouverture)
          if (
            clickedGroup &&
            clickedGroup.landmarkChildren &&
            clickedGroup.landmarkChildren.length > 0
          ) {
            // Petit délai pour que vis.js finisse de toggle le groupe
            setTimeout(() => {
              const updatedGroup = groups.get(properties.group);
              const isClosed = !updatedGroup.showNested;
              // Pour chaque landmark défini
              updatedGroup.landmarkChildren.forEach((landmarkId) => {
                let landmarkItems;

                if (isClosed) {
                  // Fermeture : chercher les items qui sont actuellement dans le landmark
                  landmarkItems = items.get({
                    filter: (item) => item.group === landmarkId,
                  });
                } else {
                  // Ouverture : chercher les items qui ÉTAIENT dans le landmark (actuellement sur le parent)
                  landmarkItems = items.get({
                    filter: (item) =>
                      item.group === properties.group &&
                      item.__originalGroup === landmarkId,
                  });
                }

                landmarkItems.forEach((item) => {
                  if (isClosed) {
                    // Groupe fermé : afficher les items sur le parent
                    item._originalGroup = item.group; // Sauvegarder le groupe d'origine
                    item.group = properties.group; // Déplacer vers le parent
                  } else {
                    // Groupe ouvert : remettre les items dans leur groupe d'origine
                    if (item._originalGroup) {
                      item.group = item._originalGroup;
                      delete item._originalGroup; // Nettoyer la propriété temporaire
                    }
                  }
                  items.update(item);
                });
              });
              // Re-transformer les balises Lucide après ouverture/fermeture de groupe
              if (
                window.lucide &&
                typeof window.lucide.createIcons === "function"
              ) {
                window.lucide.createIcons();
              }
            }, 50); // Délai court pour laisser vis.js finir son rendu
          } else {
            // Pas de landmarks → quand même recréer les icônes principales
            setTimeout(() => {
              if (
                window.lucide &&
                typeof window.lucide.createIcons === "function"
              ) {
                window.lucide.createIcons();
              }
            }, 50);
          }
        }
      });

      timeline.on("timechanged", function (event) {
        isCustomBarMoving = false;
      });

      /**
       * VERTICAL BAR COMPONENT
       */
      let customTimeId = timeline.addCustomTime(
        `${timeline.options.end.getFullYear() - 10}-01-01`,
        "custom-bar"
      );
      timeline.on("timechange", function (event) {
        isCustomBarMoving = true;
        var selectedTime = event.time.getTime();
        var snappedTime = Math.round(selectedTime / stepSize) * stepSize;

        // Déplacer la barre à la position ajustée
        timeline.setCustomTime(new Date(snappedTime), customTimeId);
        timeline.setCustomTimeTitle(
          new Date(snappedTime).getFullYear(),
          "custom-bar"
        );

        // Réinitialiser le style des items uniquement si nécessaire
        items.forEach((item) => {
          let isInRange;
          if (item.type === "point" || item.type === "box") {
            const itemYear = new Date(item.start).getFullYear();
            const barYear = new Date(snappedTime).getFullYear();
            isInRange = itemYear === barYear;
          } else {
            const itemStart = new Date(item.start).getTime();
            const itemEnd = item.end ? new Date(item.end).getTime() : itemStart;
            isInRange = snappedTime >= itemStart && snappedTime < itemEnd;
          }

          const alreadyHighlighted = item.className.includes("highlight");
          if (isInRange) {
            if (!alreadyHighlighted) {
              item.className += " highlight";
              items.update(item);
            }
          } else {
            if (alreadyHighlighted) {
              item.className = item.className
                .replace("highlight", "")
                .replace(/  +/g, " ")
                .trim();
              items.update(item);
            }
          }
        });

        const themeData = {};

        // getting parent groups
        groups.get().forEach((group) => {
          if (group.nestedGroups && group.nestedGroups.length > 0) {
            themeData[group.id] = {
              name: group.contentText,
              items: [],
              className: group.className,
            };
          }
        });

        let existingThemeSections = document.querySelectorAll(".theme-section");

        document.getElementById("moreInfos").innerHTML = "";

        // Vérifier si la barre verticale passe sur un item
        items.forEach((item) => {
          var itemStart = new Date(item.start).getTime();
          var itemEnd = item.end ? new Date(item.end).getTime() : itemStart;

          // Pour les événements ponctuels, vérifier si on est dans la même année
          // Pour les périodes, vérifier si on est dans l'intervalle
          let isInRange;
          if (item.type === "point" || item.type === "box") {
            // Pour les points et box, comparer les années
            const itemYear = new Date(item.start).getFullYear();
            const barYear = new Date(snappedTime).getFullYear();
            isInRange = itemYear === barYear;
          } else {
            // Pour les périodes, vérifier l'intervalle classique
            isInRange = snappedTime >= itemStart && snappedTime < itemEnd;
          }

          // Si la barre verticale passe sur l'item, on le surligne
          if (isInRange) {
            // Ajouter une classe CSS pour surligner l'item
            item.className += item.className.includes("highlight")
              ? ""
              : " highlight";
            items.update(item);
            //details
            let groupObject = groups.get(item.group);
            let themeId = groupObject.nestedInGroup || item.group;

            // checking if a theme already exists before adding it into the array
            if (themeData[themeId]) {
              themeData[themeId].items.push({
                item: item,
                groupObject: groupObject,
              });
            }
          }
        });

        let html = "";

        const totalMatches = Object.values(themeData).reduce(
          (sum, t) => sum + (t.items?.length || 0),
          0
        );

        if (totalMatches <= 0) {
          html += `<p class="no-info">Aucune information disponible pour l'année sélectionnée. Veuillez en sélectionner une autre.</p>`;
          let pourApres = `Selectioner une date ou utiliser la bar pour naviger entre les annés`;
        } else {
          Object.keys(themeData).forEach((themeId) => {
            const theme = themeData[themeId];

            if (theme.items.length > 0) {
              html += `<div class='theme-section ${
                theme.className
              } data-year="${new Date(snappedTime).getFullYear()}"'>

                          <h3>${renderGroupLabel(
                            groups.get(Number(themeId))
                          )}</h3>
                          
                          <div class="card-wrapper">`;

              theme.items.forEach(({ item, groupObject }) => {
                let groupName = groupObject.contentText || "";

                if (item.type === "point" || item.type === "box") {
                  html += `<div class='card'>
                              <h4>${item.content}</h4>
                              <p>${renderGroupLabel(groupObject)}</p>
                            </div>`;
                } else {
                  html += `<div class='card'>
                              <h4>${item.content} 
                              <!-- ${new Date(snappedTime).getFullYear()} -->
                              </h4>
                              <p>${renderGroupLabel(groupObject)}</p>
                            </div>`;
                }
              });

              html += `</div> </div>`; // Close theme-section
            }
          });
        }
        document.getElementById("moreInfos").innerHTML += html;

        let themeSections = document.querySelectorAll(".theme-section");

        requestAnimationFrame(() => {
          themeSections.forEach((section) => {
            section.classList.add("visible");
          });
        });

        const selectedYear = new Date(snappedTime).getFullYear();
        const birthYear = getBirthYear();
        const age = birthYear ? selectedYear - birthYear : "";
        document.getElementById("year").innerHTML = `
  <div>${selectedYear}</div>
  ${age !== "" ? `<div>${age} ans</div>` : ""}`;
      });
    });
  },
  100
); // Fin du setTimeout
// Fin du DOMContentLoaded pour la timeline

setupSummaryHandlers({ summaryContainer, viewSummaryBtn, closeSummaryBtn });
// fonction utilitaire pour gérer les icones et les landmarks icons
function renderGroupLabel(group) {
  if (!group) return "";

  let iconHtml = "";
  if (group.id === 1) iconHtml = '<i data-lucide="house"></i> ';
  if (group.id === 2) iconHtml = '<i data-lucide="school"></i> ';
  if (group.id === 3) iconHtml = '<i data-lucide="briefcase"></i> ';

  if (group.isLandmark) {
    iconHtml += '<i data-lucide="pin" class="lucide landmark-pin"></i> ';
  }

  return iconHtml + (group.contentText || "");
}
// Exposer timeline et les datasets pour les autres fichiers
export {
  timeline,
  items,
  groups,
  handleDragStart,
  handleDragEnd,
  toggleLandmark,
  renderGroupLabel,
};
