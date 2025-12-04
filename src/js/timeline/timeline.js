import { initTimeline } from "./timelineInit.js";
import { exportTimelineData, importTimelineData } from "./importExportUtils.js";
import { activateInitialLandmarks } from "./landmarkUtils.js";
import * as utils from "../utils.js";
import { test_items } from "../dataset.js";
import { setBirthYear } from "./birthYear.js";
import { toggleLandmark } from "./landmarkUtils.js";
import { handleDragStart, handleDragEnd } from "./dragHandlers.js";
import { setupSummaryHandlers } from "./summaryUtils.js";
import { setupZoomNavigation } from "./zoomNavigation.js";
import { groupsData } from "./timelineData.js";
import { setupInteractions } from "./timelineInteractions.js";
import { setupVerticalBar } from "./verticalBar.js";
import { scheduleRedraw } from "./timelineUtils.js";
import { detectAndShowOverlaps, initOverlapDetection } from "./overlapDetection.js";

// ===============================
// VARIABLES GLOBALES
// ===============================
let timeline;
const items = new vis.DataSet();
const groups = new vis.DataSet(groupsData);
const stepSize = 1000 * 60 * 60 * 24; // 1 jour en ms

// ===============================
// DOM
// ===============================
const summaryContainer = document.getElementById("bricks");
const viewSummaryBtn = document.getElementById("view-summary");
const closeSummaryBtn = document.getElementById("close-summary");
const toggleChaptersBtn = document.getElementById("toggle-chapters");
const zoomInBtns = document.querySelectorAll("#zoom-in");
const zoomOutBtns = document.querySelectorAll("#zoom-out");
const moveBackwardsBtns = document.querySelectorAll("#move-backwards");
const moveForwardsBtns = document.querySelectorAll("#move-forwards");

// Boutons Load / Export
document.getElementById("load").addEventListener("click", () => {
  importTimelineData(items, test_items, utils);
});
document.getElementById("export").addEventListener("click", async () => {
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
  height: "85vh",
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
        item.end = new Date(item.start).setFullYear(
          item.start.getFullYear() + 1
        ); //1 année

// Création de la timeline
document.addEventListener("DOMContentLoaded", () => {
  timeline = initTimeline();
  if (!timeline) return;

  window.timeline = timeline;

  // Initialiser le module de détection des chevauchements
  initOverlapDetection(items, groups);

  if (window.lucide?.createIcons) window.lucide.createIcons();

  // Flag pour éviter les appels récursifs lors de l'ajout de marqueurs de chevauchement
  let isDetectingOverlaps = false;

  // Fit/redraw sur ajout/update + détection des chevauchements
  items.on("add", (event, properties) => {
    // Ignorer les marqueurs de chevauchement pour éviter la boucle infinie
    const addedItems = properties?.items || [];
    const isOverlapMarker = addedItems.some(id => id.toString().startsWith("__overlap_"));
    
    if (!isOverlapMarker) {
      try {
        timeline.fit();
      } catch {}
    }
    
    scheduleRedraw(timeline);
    
    // Détecter les chevauchements (sauf si c'est un marqueur ou si déjà en cours)
    if (!isOverlapMarker && !isDetectingOverlaps) {
      isDetectingOverlaps = true;
      setTimeout(() => {
        detectAndShowOverlaps();
        isDetectingOverlaps = false;
      }, 100);
    }
  });

  items.on("update", (event, properties) => {
    // Ignorer les marqueurs de chevauchement
    const updatedItems = properties?.items || [];
    const isOverlapMarker = updatedItems.some(id => id.toString().startsWith("__overlap_"));
    
    scheduleRedraw(timeline);
    
    // Détecter les chevauchements après modification
    if (!isOverlapMarker && !isDetectingOverlaps) {
      isDetectingOverlaps = true;
      setTimeout(() => {
        detectAndShowOverlaps();
        isDetectingOverlaps = false;
      }, 100);
    }
  });

  items.on("remove", (event, properties) => {
    // Ignorer les marqueurs de chevauchement
    const removedItems = properties?.items || [];
    const isOverlapMarker = removedItems.some(id => id.toString().startsWith("__overlap_"));
    
    // Détecter les chevauchements après suppression
    if (!isOverlapMarker && !isDetectingOverlaps) {
      isDetectingOverlaps = true;
      setTimeout(() => {
        detectAndShowOverlaps();
        isDetectingOverlaps = false;
      }, 100);
    }
  });

  document.dispatchEvent(new CustomEvent("timelineReady"));

  // Interactions et barre verticale
  setupInteractions(timeline, utils);
  setupVerticalBar(timeline, stepSize);
  
  // Résumé
  setupSummaryHandlers({ summaryContainer, viewSummaryBtn, closeSummaryBtn });
  
  // Landmarks init
  activateInitialLandmarks(groups);

  // Initialisation de la date de naissance
  try {
    let birthYearStored = localStorage.getItem("birthYear");
    if (!birthYearStored) {
      const answeredRaw = localStorage.getItem("lifestories_answered_questions");
      if (answeredRaw) {
        try {
          const answeredArr = JSON.parse(answeredRaw);
          const found =
            answeredArr.find(
              (obj) =>
                (obj.answer?.type === "ANSWER_BIRTH_YEAR" &&
                  obj.answer.birthdate) ||
                (obj.answer?.key === "birthYear" && obj.answer.value) ||
                /^\d{4}$/.test(obj.answer?.value)
            )?.answer?.birthdate ||
            answeredArr.find((obj) => obj.answer?.value)?.answer?.value;
          if (found) birthYearStored = found;
        } catch (e) {
          console.warn("Could not parse lifestories_answered_questions:", e);
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
    if (group.id === 1) iconHtml = '<i data-lucide="map-pin-house"></i> ';
    if (group.id === 2) iconHtml = '<i data-lucide="school"></i> ';
    if (group.id === 3) iconHtml = '<i data-lucide="briefcase"></i> ';

      // Icons for nested groups (Migratoire)
    if (group.id === 11) iconHtml = '<i data-lucide="key-round"></i> '; // Statut résidentiel
    if (group.id === 12) iconHtml = '<i data-lucide="house"></i> '; // Logement
    if (group.id === 13) iconHtml = '<i data-lucide="map-pinned"></i> '; // Commune
    
    // Icons for nested groups (Scolaire)
    if (group.id === 21) iconHtml = '<i data-lucide="building-2"></i> '; // Établissements
    if (group.id === 22) iconHtml = '<i data-lucide="book-marked"></i> '; // Formations
    if (group.id === 23) iconHtml = '<i data-lucide="graduation-cap"></i> '; // Diplômes
    
    // Icons for nested groups (Professionnelle)
    if (group.id === 31) iconHtml = '<i data-lucide="contact-round"></i> '; // Postes
    if (group.id === 32) iconHtml = '<i data-lucide="file-text"></i> '; // Contrats

    // Icône Landmark si activé
    if (group.isLandmark) {
      iconHtml += '<i data-lucide="pin" class="lucide landmark-pin"></i> ';
    }
    // Texte du groupe
    wrapper.innerHTML = iconHtml + (`<span class="trajectory-title">${group.contentText}</span>` || "");
    return wrapper;
  },
};

// Utilisation des fonctions du module timelineStorage.js
restoreItems(items);
restoreGroups(groups);
restoreOptions(options);

// Persister automatiquement les items dès qu'ils changent (utile si la timeline
// n'est pas initialisée sur la page où les items sont ajoutés — ex: questionnaire)

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
    if (birthYearStored) setBirthYear(birthYearStored);
  } catch (e) {}

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
             new Date(yearStart).getFullYear(),
             "custom-bar"
          )

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
                      item._originalGroup === landmarkId,
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

    let chaptersHidden = false;

    function applyChapterVisibility() {
      const chapterTitles = document.querySelectorAll(".trajectory-title");
      chapterTitles.forEach((chapter) => {
        if (chaptersHidden) {
          chapter.classList.add('closed');
        } else {
          chapter.classList.remove('closed');
        }
      });
    }

    toggleChaptersBtn.addEventListener("click", () => {
      chaptersHidden = !chaptersHidden;
      applyChapterVisibility();

      // waiting for the transition to finish
      setTimeout(() => {
        timeline.redraw()
      }, 400)
    });

    // Watch for timeline DOM changes and reapply state
    const observer = new MutationObserver(() => {
      applyChapterVisibility();
    });

    observer.observe(document.getElementById("timeline"), {
      childList: true,
      subtree: true
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

      let timechangeDebounce = null;
      timeline.on("timechange", function (event) {
        isCustomBarMoving = true;

        if(timechangeDebounce) {
          clearTimeout(timechangeDebounce)
        }

        var selectedTime = event.time.getTime();
        var snappedTime = Math.round(selectedTime / stepSize) * stepSize;

        // Déplacer la barre à la position ajustée
        timeline.setCustomTime(new Date(snappedTime), customTimeId);
        timeline.setCustomTimeTitle(
          new Date(snappedTime).getFullYear(),
          "custom-bar"
        )

        timechangeDebounce = setTimeout(() => {

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
              console.log("moved")
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
        ${age !== "" ? `<div>${age} ans</div>` : ""}
      `;
      }, 20);
    });
    }, 100)

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

// Exports
export {
  timeline,
  items,
  groups,
  handleDragStart,
  handleDragEnd,
  toggleLandmark,
  stepSize,
};
