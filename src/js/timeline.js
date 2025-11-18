import * as utils from "./utils.js"
import state from "./state.js"
import { ajouterEpisode } from "./episodes.js";
import { test_items } from "./dataset.js";

/**
 *****************************************************************************************************
 * timeline.js gère l'initialisation, le rendu graphique et les interactions possibles du calendrier *
 *                                                                                                   *
 * FONCTIONNALITÉS LANDMARKS :                                                                       *
 * - Clic simple sur un groupe parent : ouvre/ferme les sous-groupes                                *
 * - Appui long (500ms) sur un sous-groupe : bascule son statut landmark                            *
 *   → Fonctionne aussi bien sur desktop que sur tablette/mobile                                    *
 * - Les landmarks sont les sous-groupes dont les items restent visibles sur la ligne parent        *
 *   même quand le groupe parent est fermé                                                          *
 * - Un feedback visuel (toast) confirme l'activation/désactivation du landmark                     *
 *                                                                                                   *
 *****************************************************************************************************
*/


// Données des groupes

const groupsData = [
    // MIGRATOIRE
    { id: 1, content: "Migratoire", nestedGroups: [11,12,13], showNested: true, className: "vert"},
    { id: 11, content: "Statut résidentiel", dependsOn: 12, className: "line_11"},
    { id: 12, content: "Logement", dependsOn: 13, className: "line_12"},
    { id: 13, content: "Commune", keyof: 1, className: "line_13"},
    
    // SCOLAIRE
    { id: 2, content: "Scolaire", nestedGroups: [21,22,23], showNested: false, className: "bleu"},
    { id: 21, content: "Établissements", dependsOn: 23, className: "line_21"},
    { id: 22, content: "Formations", dependsOn: 23, className: "line_22"},
    { id: 23, content: "Diplômes", keyof: 2, className: "line_23"},
    
    // PROFESSIONNELLE
    { id: 3, content: "Professionnelle", nestedGroups: [31,32], showNested: false, className: "rouge"},
    { id: 31, content: "Postes", keyof: 3, className: "line_31"},
    { id: 32, content: "Contrats", dependsOn: 31, className: "line_32"}
];

// Ajout d'icônes sur certains groupes (exemple)
groupsData.forEach(group => {
    if (group.type === "primary") {
        group.content = `<span>🔑${group.content}</span>`;
    }
});

// Création des jeux de données pour la timeline
const items = new vis.DataSet();
const groups = new vis.DataSet(groupsData);
let isCustomBarMoving = false

// Options principales pour la timeline
const options = {
    // editable: {
    //     add: true,         // Permettre l'ajout d'items
    //     updateTime: true,  // Permet de modifier la durée des items (drag)
    //     updateGroup: true, // Permet de changer un item de groupe (drag)
    //     remove: true,      // Permet de supprimer un item
    //     overrideItems: false  // Autoriser ces options à remplacer les paramètres "editable" de l'élément
    // },
    editable: false,
    zoomMin: 1000 * 60 * 60 * 24 * 365 * 1,  // 5 years in ms
    zoomMax: 1000 * 60 * 60 * 24 * 365 * 50, // 50 years in ms
    min: new Date(),
    max: new Date(`${new Date().getFullYear() + 5}-12-31`),
    showCurrentTime: false, // Ne pas afficher la ligne de temps actuelle
    orientation: 'top', // Option pour définir l'orientation (top/bottom)
    margin: {item:{vertical: 30, horizontal: 0}},
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
    xss:{
        filterOptions:{
            allowList: {
            span: ['class'],
            p: ['class'],
            b: [],
            br:[],
            div: ['class','title'],
            img: ['src','alt','class','width','height']
            }
        }
    },
    format: {
      minorLabels: function(date,scale,step){
        
        switch (scale) {
          case 'millisecond':
            return vis.moment(date).format('SSS');
          case 'second':
            return vis.moment(date).format('s');
          case 'minute':
            return vis.moment(date).format('HH:mm');
          case 'hour':
            return vis.moment(date).format('HH:mm');
          case 'weekday':
            return vis.moment(date).format('ddd D');
          case 'day':
            return vis.moment(date).format('D');
          case 'week':
            return vis.moment(date).format('w');
          case 'month':
            return vis.moment(date).format('MMM');
          case 'year':
            const age = new Date(date).getFullYear() - new Date(options.start).getFullYear()
            return '<b>'+new Date(date).getFullYear() + '</b>'
            
          default:
            return '';
        }
      }
    },
    template: function (item, element, data) {
      if (!item) return '';
      if (item.type === 'box' && item.category === 'degree') {
        return `
            <img src="./assets/icon/degree.svg" alt="${item.content}" />
                `;
      }
      // fallback: original content (keeps existing behaviour)
      return item.content;
    },
    // TODO: format, affichage année
    // TODO: tooltip
    onAdd: function (item, callback) {
          // Appel à prettyEpisode pour les éléments de type "range"
          utils.prettyEpisode(item.content, function(value) {
              if (value) {
                  item.content = value;
                  item.start = new Date(`${item.start.getFullYear()}-01-01`) // remise à l'echelle année
                  item.end = new Date(item.start).setFullYear(item.start.getFullYear() + 1); //1 année
                  
                  if(String(item.group).startsWith(1)) item.className = "green";
                  else if(String(item.group).startsWith(2)) item.className = "blue";
                  else if(String(item.group).startsWith(3)) item.className = "red";
                  
                  let retrieveUlGroup = document.getElementById(`ulgroup_${item.group}`);
                  if(retrieveUlGroup){
                    let arr = Array.from(retrieveUlGroup.querySelectorAll('li')).find(e=> e.innerHTML == item.content)
                    arr.style.textDecoration = 'line-through';
                    arr.style.opacity = "0.2"
                  }

                  callback(item); // Retourner l'item modifi                  
              } else {

                  let retrieveUlGroup = document.getElementById(`ulgroup_${item.group}`);
                  if(retrieveUlGroup){
                    let arr = Array.from(retrieveUlGroup.querySelectorAll('li')).find(e=> e.style.opacity == '0.2')
                    arr.style.opacity = '1';
                  }

                  callback(null); // Annuler si l'utilisateur n'a pas confirmé
              }
          });
      },
    
      onMove: function (item, callback) {
        let title = `Do you really want to move the item to\nstart: ${item.start}\nend: ${item.end}?`;
        
        utils.prettyConfirm('Move item', title).then(ok => {
          if (ok) {
            callback(item); // Confirmer le déplacement
          } else {
            callback(null); // Annuler le mouvement
          }
        });
      },
    
      onMoving: function (item, callback) {
        /*if (item.start < timeline.min) item.start = timeline.min;
        if (item.start > timeline.max) item.start = timeline.max;
        if (item.end   > timeline.max) item.end   = timeline.max;*/
        
    
        callback(item); // send back the (possibly) changed item
      },
    
      onUpdate: function (item, callback) {
        let attributes = utils.getAttributes(item.content); // Obtenir les attributs en fonction du type d'événement
        if(item.type == "point"){
          if (attributes === 'erreur') {
              console.error('Attributs non définis pour cet item');
              callback(null); // Annuler si les attributs sont incorrects
              return;
          }
        
          utils.prettyPrompt(item, attributes, function(formData) {
            if (formData) {
              // Ajouter les valeurs des inputs comme attributs à l'item
              item.attributes = formData;
              callback(item); // Retourner l'item modifié
          } else {
              callback(null); // Annuler l'update'
          }
          });
        }else if (item.type == "range") {
          // Appel à prettyEpisode pour les éléments de type "range"
          utils.prettyEpisode(item.content, function(value) {
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
        utils.prettyConfirm('Remove item', `Do you really want to remove item ${item.content}?`).then(ok => {
          if (ok) {
            callback(item); // Confirmer la suppression
          } else {
            callback(null); // Annuler la suppression
          }
        });
      },

      // Utile pour la custom barre
      snap: function (date, scale, step) {
        if(isCustomBarMoving){
          return new Date(Math.round(date.getTime() / stepSize) * stepSize);
        }else{
          return new Date(date.getFullYear(), 0, 1);
        }
        
      }
    

};

// Charger les données sauvegardées AVANT de créer la timeline
const savedItems = localStorage.getItem('lifestories_items');
const savedGroups = localStorage.getItem('lifestories_groups');
const savedOptions = localStorage.getItem('lifestories_options');

if (savedItems) {
  try {
    const parsedItems = JSON.parse(savedItems);
    items.clear();
    items.add(parsedItems);
  } catch (e) {
    console.error('❌ Erreur lors du chargement des items:', e);
  }
}

if (savedGroups) {
  try {
    const parsedGroups = JSON.parse(savedGroups);
    // On restaure uniquement l'état dynamique (showNested, landmarks, etc.)
    parsedGroups.forEach(savedGroup => {
      const existingGroup = groups.get(savedGroup.id);
      if (existingGroup) {
        groups.update({
          id: savedGroup.id,
          showNested: savedGroup.showNested,
          landmark: savedGroup.landmark
        });
      }
    });
  } catch (e) {
    console.error('❌ Erreur lors du chargement des groupes:', e);
  }
}

// Restaurer les options de la timeline (min, max, start, end)
// Ajuster `min`/`max` pour s'assurer qu'ils couvrent `start`/`end`
// afin d'éviter que vis.js ne "clamp" la fenêtre visible sur la
// date courante si `min` est trop récent.
if (savedOptions) {
  try {
    const parsedOptions = JSON.parse(savedOptions);

    // Restaurer min/max si présents
    if (parsedOptions.min) options.min = new Date(parsedOptions.min);
    if (parsedOptions.max) options.max = new Date(parsedOptions.max);

    // Restaurer start en s'assurant que options.min <= start
    if (parsedOptions.start) {
      const startDate = new Date(parsedOptions.start);
      if (!isNaN(startDate.getTime())) {
        // Si pas de min défini ou si min est après start, le remonter
        if (!options.min || options.min.getTime() > startDate.getTime()) {
          options.min = new Date(startDate.getFullYear(), 0, 1);
        }
        options.start = startDate;
      }
    }

    // Restaurer end en s'assurant que options.max >= end
    if (parsedOptions.end) {
      const endDate = new Date(parsedOptions.end);
      if (!isNaN(endDate.getTime())) {
        if (!options.max || options.max.getTime() < endDate.getTime()) {
          // Étendre la borne max pour inclure la fin (on ajoute 1 an de marge)
          options.max = new Date(endDate.getFullYear() + 1, 11, 31);
        }
        options.end = endDate;
      }
    }

  } catch (e) {
    console.error('❌ Erreur lors du chargement des options:', e);
  }
}

// Déclarer timeline en dehors pour pouvoir l'exporter
let timeline;

/**
 * GESTION DES LANDMARKS (REPÈRES TEMPORELS)
 * Permet d'afficher certains sous-groupes sur la ligne parent quand celui-ci est fermé
 */

/**
 * Bascule le statut landmark d'un sous-groupe
 * @param {number} groupId - ID du sous-groupe à basculer
 */
function toggleLandmark(groupId) {
    const group = groups.get(groupId);
    
    // Vérifier si c'est bien un sous-groupe (qui a nestedInGroup)
    if (!group || !group.nestedInGroup) {
        console.warn('Ce groupe n\'est pas un sous-groupe');
        return;
    }
    
    const parentGroup = groups.get(group.nestedInGroup);
    if (!parentGroup) return;
    
    // Initialiser landmarkChildren si nécessaire
    if (!parentGroup.landmarkChildren) {
        parentGroup.landmarkChildren = [];
    }
    
    // Basculer le statut landmark
    const isCurrentlyLandmark = group.isLandmark || false;
    group.isLandmark = !isCurrentlyLandmark;
    
    // Mettre à jour landmarkChildren du parent
    if (group.isLandmark) {
        // Ajouter à landmarkChildren si pas déjà présent
        if (!parentGroup.landmarkChildren.includes(groupId)) {
            parentGroup.landmarkChildren.push(groupId);
        }
        // Ajouter l'icône 📌 si pas présent
        if (!group.content.includes('📌')) {
            group.content = '📌 ' + group.content.trim();
        }
    } else {
        // Retirer de landmarkChildren
        parentGroup.landmarkChildren = parentGroup.landmarkChildren.filter(id => id !== groupId);
        // Retirer l'icône 📌
        group.content = group.content.replace('📌 ', '').trim();
    }
    
    // Mettre à jour les groupes
    groups.update(group);
    groups.update(parentGroup);
        
    // Feedback visuel avec SweetAlert2
    utils.prettyAlert(
        group.isLandmark ? '📌 Landmark activé' : 'Landmark désactivé',
        `${group.content.replace('📌 ', '')} ${group.isLandmark ? 'restera visible' : 'ne sera plus visible'} quand le groupe est fermé`,
        'success',
        1500
    );
}

// Variables globales pour l'appui long
let longPressTimer = null;
let longPressTarget = null;
let longPressStartPos = null;
const LONG_PRESS_DURATION = 500; // 500ms pour déclencher l'appui long
const LONG_PRESS_MOVE_THRESHOLD = 5; //px

// Variable pour la barre verticale
let stepSize = 1000 * 60 * 60 * 24; // 1 jour en millisecondes

// Création de la timeline avec les données chargées - attendre que tout soit chargé
document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('timeline');
  
  // Attendre que les styles soient appliqués
  setTimeout(() => {
    timeline = new vis.Timeline(container, items, groups, options);
    
    // Exporter la timeline globalement
    window.timeline = timeline;

    // Forcer un redraw pour appliquer les styles CSS
    timeline.redraw();

    // Émettre un événement personnalisé pour signaler que la timeline est prête
    document.dispatchEvent(new CustomEvent('timelineReady'));

    // Sauvegarder automatiquement à chaque changement
  timeline.on('changed', () => {
    localStorage.setItem('lifestories_items', JSON.stringify(items.get()));
    localStorage.setItem('lifestories_groups', JSON.stringify(groups.get()));
    
    // Sauvegarder aussi les options importantes de la timeline
    const currentOptions = {
      min: timeline.options.min,
      max: timeline.options.max,
      start: timeline.options.start,
      end: timeline.options.end
    };
    localStorage.setItem('lifestories_options', JSON.stringify(currentOptions));
  });

  // Gestion de l'appui long pour les landmarks
  timeline.on('mouseDown', function(properties) {
    if (properties.what === 'group-label' && properties.group) {
        const clickedGroup = groups.get(properties.group);
        
        // Seulement pour les sous-groupes
        if (clickedGroup && clickedGroup.nestedInGroup) {
            longPressTarget = properties.group;
            longPressStartPos = { x: properties.event.clientX, y: properties.event.clientY };
            
            // Démarrer le timer d'appui long
            longPressTimer = setTimeout(() => {
                // Appui long détecté : basculer le landmark
                toggleLandmark(longPressTarget);
                longPressTarget = null; // Marquer comme traité
                longPressStartPos = null;
            }, LONG_PRESS_DURATION);
        }
    }
  });

  timeline.on('mouseMove', function(properties) {
    if (longPressTimer && longPressStartPos && properties.event) {
        const dx = Math.abs(properties.event.clientX - longPressStartPos.x);
        const dy = Math.abs(properties.event.clientY - longPressStartPos.y);
        if (dx > LONG_PRESS_MOVE_THRESHOLD || dy > LONG_PRESS_MOVE_THRESHOLD) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
            longPressStartPos = null;
        }
    }
  });

  timeline.on('mouseUp', function(properties) {
    // Annuler le timer si on relâche avant la durée requise
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        longPressStartPos = null;
    }
  });

  timeline.on('click', function(properties) {
    // ACCESSIBILITÉ : Clic sur l'axe temporel pour déplacer la barre verticale
    if (properties.what === 'axis' && properties.time) {
        // Déplacer la barre custom à la date cliquée
        const clickedTime = new Date(properties.time);
        // Arrondir à l'année pour cohérence avec le snap
        const yearStart = new Date(clickedTime.getFullYear(), 0, 1);
        timeline.setCustomTime(yearStart, customTimeId);
        
        // Déclencher manuellement la mise à jour de la synthèse
        // (normalement géré par l'événement timechange, mais on le force ici)
        timeline.emit('timechange', { id: customTimeId, time: yearStart });
        
        return; // Sortir pour ne pas traiter d'autres clics
    }
    
    // Vérifier si c'est un clic sur un label de groupe
    if (properties.what === 'group-label' && properties.group) {
        const clickedGroup = groups.get(properties.group);
        
        // Si c'était un appui long traité, ne pas continuer
        if (longPressTarget === null && clickedGroup && clickedGroup.nestedInGroup) {
            // On vient de traiter un appui long, réinitialiser
            longPressTarget = undefined;
            return;
        }
        longPressTarget = undefined;
        
        // Vérifier si ce groupe a des landmarks définis (logique normale de fermeture/ouverture)
        if (clickedGroup && clickedGroup.landmarkChildren && clickedGroup.landmarkChildren.length > 0) {
            
            // Petit délai pour que vis.js finisse de toggle le groupe
            setTimeout(() => {
                const updatedGroup = groups.get(properties.group);
                const isClosed = !updatedGroup.showNested;                
                // Pour chaque landmark défini
                updatedGroup.landmarkChildren.forEach(landmarkId => {
                    let landmarkItems;
                    
                    if (isClosed) {
                        // Fermeture : chercher les items qui sont actuellement dans le landmark
                        landmarkItems = items.get({ filter: item => item.group === landmarkId });
                    } else {
                        // Ouverture : chercher les items qui ÉTAIENT dans le landmark (actuellement sur le parent)
                        landmarkItems = items.get({ 
                            filter: item => item.group === properties.group && item._originalGroup === landmarkId 
                        });
                    }
                                      
                    landmarkItems.forEach(item => {
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
                
            }, 50); // Délai court pour laisser vis.js finir son rendu
        }
    }
  });

  timeline.on('timechanged', function (event) {
    isCustomBarMoving = false;
  });

  /**
   * VERTICAL BAR COMPONENT
   */
  let customTimeId = timeline.addCustomTime(`${timeline.options.end.getFullYear() - 10}-01-01`, "custom-bar");
  timeline.on("timechange", function (event) {
    isCustomBarMoving = true
    var selectedTime = event.time.getTime();
    var snappedTime = Math.round(selectedTime / stepSize) * stepSize;

    // Déplacer la barre à la position ajustée
    timeline.setCustomTime(new Date(snappedTime), customTimeId);

    // Réinitialiser le style des items
    items.forEach((item) => {
      if (item.className.includes("highlight")) { 
        item.className = item.className.replace("highlight","")
        items.update(item)
      }
    });

    document.getElementById('moreInfos').innerHTML = ''
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
        isInRange = snappedTime >= itemStart && snappedTime <= itemEnd;
      }
      
      // Si la barre verticale passe sur l'item, on le surligne
      if (isInRange) {
        // Ajouter une classe CSS pour surligner l'item
        item.className += item.className.includes('highlight') ? '' : ' highlight'
        items.update(item)
        //details
        let groupObject = groups.get(item.group)
        let groupName = groupObject.nestedInGroup ? `${groups.get(groupObject.nestedInGroup).content} --> ${groupObject.content}` : groupObject.content
        let ageDebut = new Date(item.start).getFullYear() - new Date(timeline.options.start).getFullYear()
        
        let html;
        if (item.type === "point" || item.type === "box") {
          // Pour les événements ponctuels (brevet, diplômes, etc.)
          html = `<div class='card'>
                    <h3>${groupName}</h3>
                    <h4>${item.content}</h4>
                    <ul>
                      <li>Année: ${new Date(item.start).getFullYear()}</li>
                      <li>Âge: ${ageDebut} an(s)</li>
                    </ul>
                  </div>`
        } else {
          // Pour les périodes (range)
          let ageFin = new Date(item.end).getFullYear() - new Date(timeline.options.start).getFullYear()
          let duration = new Date(item.end).getFullYear() - new Date(item.start).getFullYear()
          html = `<div class='card'>
                    <h3>${groupName}</h3>
                    <h4>${item.content}</h4>
                    <ul>
                      <li>De ${new Date(item.start).getFullYear()} à ${new Date(item.end).getFullYear()}</li>
                      <li>De ${ageDebut} an(s) à ${ageFin} an(s)</li>
                      <li>Durée: ${duration} an(s)</li>
                    </ul>
                  </div>`
        }
        
        document.getElementById('moreInfos').innerHTML += html
      }
    });
  });
//---------------- DOWNLOADING THE INTERVIEW DATA-------------//
  document.getElementById('export').addEventListener('click', function () {
    var data = items.get({
        type: {
        start: 'ISODate',
        end: 'ISODate'
        }
    });

    // On convertit en JSON
    let jsonString = JSON.stringify(data, null, 2);

    // Créer un Blob
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Créer une URL temporaire
    const url = URL.createObjectURL(blob);

    // Créer et déclencher le téléchargement
    const link = document.createElement('a');
    link.href = url;
    link.download = `timeline-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link); // ajouter le lien à la page (invisible)
    link.click(); // simuler un click dessus
    document.body.removeChild(link); // retirer le lien

    // Nettoyer - libérer la mémoire
    URL.revokeObjectURL(url);
  });

  document.getElementById('load').addEventListener('click', function () {
    test_items.forEach(i => items.add(i))
  });

  }, 100); // Fin du setTimeout

}); // FIN du DOMContentLoaded

function handleDragStart(event) {
  
  event.dataTransfer.effectAllowed = 'move';

  const isEvent = event.target.id.split("_")[0] == "ev";
  let item;
  if (isEvent) {
    item = {
      id: new Date(),
      type: (isEvent ? "point" : "range"),
      content: event.target.innerHTML,
    };
  } else {
    item = {
      id: new Date(),
      type: (isEvent ? "point" : "range"),
      content: event.target.innerHTML, //event.target.value si input
      end: timeline.options.end
    };
  }
  
  //changer le css pour hint
  //retrouver la classe de la ligne à faire briller
  let line = `line_${event.target.closest("ul").id.split('_')[1]}`
  event.target.style.opacity = "0.2";

  
  // set event.target ID with item ID
  //event.target.id = new Date(item.id).toISOString();
  event.dataTransfer.setData("text", JSON.stringify(item));
}

function handleDragEnd(event){
  let line = `line_${event.target.closest("ul").id.split('_')[1]}`
  event.target.style.opacity = "initial";
}
let summaryOpen = false;
const summaryContainer = document.getElementById("bricks")

const toggleSummary = (() => {

  if(!summaryOpen) {
    summaryContainer.style.visibility = "visible"
    requestAnimationFrame(() => {
      summaryContainer.classList.add("show-summary")
    })
    summaryOpen = true
  }
  else {
    summaryContainer.classList.remove("show-summary")
    summaryOpen = false
  }
  })

const viewSummaryBtn = document.getElementById('view-summary') 
const closeSummaryBtn = document.getElementById('close-summary') 

viewSummaryBtn.addEventListener('click', toggleSummary);

closeSummaryBtn.addEventListener('click', toggleSummary);  

const zoomInBtn = document.getElementById('zoom-in') 
const zoomOutBtn = document.getElementById('zoom-out') 

zoomInBtn?.addEventListener('click', () => {
  timeline.zoomIn(0.5)
});

zoomOutBtn?.addEventListener('click', () => {
  timeline.zoomOut(0.5)
});

function move(percentage) {
  var range = timeline.getWindow();
  var interval = range.end - range.start;

  timeline.setWindow({
    start: range.start.valueOf() - interval * percentage,
    end: range.end.valueOf() - interval * percentage,
  });
}

const moveBackwardsBtn = document.getElementById('move-backwards') 
const moveForwardsBtn = document.getElementById('move-forwards') 

moveBackwardsBtn?.addEventListener('click', () => {
  move(0.5)
});
moveForwardsBtn?.addEventListener('click', () => {
  move(-0.5)
});

// Exposer timeline et les datasets pour les autres fichiers
export { timeline, items, groups, handleDragStart, handleDragEnd, toggleLandmark };