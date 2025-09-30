
import * as utils from "./utils.js"
import state from "./state.js"
import { ajouterEpisode } from "./episodes.js";
import { test_items } from "./dataset.js";

/**
 *****************************************************************************************************
 * timeline.js gère l'initialisation, le rendu graphique et les interactions possibles du calendrier *
 *                                                                                                   *
 *****************************************************************************************************
*/


// Données des groupes

const groupsData = [
    { id: 1, content: "Migratoire", nestedGroups: [11,12,13],showNested: true, className: "vert"},
    { id: 2, content: "Scolaire", showNested: false, className: "bleu" },
    { id: 3, content: "Professionnelle", showNested: false, className: "rouge"},
    { id: 11, content: "Statut résidentiel",dependsOn: 12,className: "line_11"},
    /*{ id: 12, content: "Type",dependsOn: 13},*/
    { id: 12, content: "Logement",dependsOn: 13,className: "line_12"},
    { id: 13, content: "Commune",keyof: 1,className: "line_13"} // ou pays si étranger
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
    editable: {
        add: true,         // Permettre l'ajout d'items
        updateTime: true,  // Permet de modifier la durée des items (drag)
        updateGroup: true, // Permet de changer un item de groupe (drag)
        remove: true,      // Permet de supprimer un item
        overrideItems: false  // Autoriser ces options à remplacer les paramètres "editable" de l'élément
    },
    zoomMin:365 * 24 * 60 * 60 * 1000 * 12, //zoom min à l'année et max 5 années
    min: new Date(),
    max: new Date(),
    showCurrentTime: false, // Ne pas afficher la ligne de temps actuelle
    orientation: 'both', // Option pour définir l'orientation (top/bottom)
    margin: {item:{vertical: 30, horizontal: 0}},
    align: "center",
    stack: true,
    end: new Date(`${new Date().getFullYear()}-12-31`)/*new Date(2040, 11, 31)*/,
    xss:{
        filterOptions:{
            allowList: {
            span: ['class'],
            p: ['class'],
            b: [],
            br:[]
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
    // TODO: format, affichage année
    // TODO: tooltip
    onAdd: function (item, callback) {
          // Appel à prettyEpisode pour les éléments de type "range"
          console.log(item)
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
              console.log(item);
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
                  console.log("Range ajouté : ", item);
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

// Création de la timeline
const container = document.getElementById('timeline');
const timeline = new vis.Timeline(container, items, groups, options);

function getTimelineStartYear() {
  try {
    if (timeline && timeline.options && timeline.options.start) {
      const s = timeline.options.start;
      const date = (typeof s === 'string') ? new Date(s) : s;
      if (date && !isNaN(date.getTime())) return date.getFullYear();
    }
    if (timeline && typeof timeline.getWindow === 'function') {
      const w = timeline.getWindow();
      if (w && w.start) return new Date(w.start).getFullYear();
    }
  } catch (e) {
    console.warn('getTimelineStartYear fallback:', e);
  }
  return new Date().getFullYear();
}
function handleDragStart(event) {
  
  event.dataTransfer.effectAllowed = 'move';

  const isEvent = event.target.id.split("_")[0] == "ev";
  let item;
  if(isEvent){
    item = {
      id: new Date(),
      type: (isEvent ? "point" : "range"),
      content: event.target.innerHTML,
    };
  }else{
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
  console.log(line)
  event.target.style.opacity = "0.2";

  
  console.log(item)
  // set event.target ID with item ID
  //event.target.id = new Date(item.id).toISOString();
  event.dataTransfer.setData("text", JSON.stringify(item));
}

function handleDragEnd(event){
  let line = `line_${event.target.closest("ul").id.split('_')[1]}`
  console.log(line)
  event.target.style.opacity = "initial";
}

timeline.on('timechanged',function (event){
  isCustomBarMoving = false;
})

/*timeline.on('dragover',function (event) {
  console.log(event)
  items.remove('temp')
  let startDate = new Date(event.snappedTime)
  let endDate = new Date(`${startDate.getFullYear()+1}-01-01`)
  let group = event.group
  let content = "drop"
  let id = 'temp'
  let item = {start: startDate, group: group, content: content, end: endDate, id: id}
  items.add(item)
})*/

/**
 * VERTICAL BAR COMPONENT
 */
var stepSize = 1000 * 60 * 60 * 24; // 1 jour en millisecondes
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
    var itemEnd = item.end ? new Date(item.end).getTime() : itemStart + stepSize; // Si pas de fin, un jour par défaut
    console.log(item)
    // Si la barre verticale est dans l'intervalle de l'item, on le surligne
    if (snappedTime >= itemStart && snappedTime <= itemEnd) {
      // Ajouter une classe CSS pour surligner l'item
      item.className += item.className.includes('highlight') ? '' : ' highlight'
      items.update(item)
      //details
      let groupObject = groups.get(item.group)
      let groupName = groupObject.nestedInGroup ? `${groups.get(groupObject.nestedInGroup).content} --> ${groupObject.content}` : groupObject.content
      let ageDebut = new Date(item.start).getFullYear() - new Date(timeline.options.start).getFullYear()
      let ageFin = new Date(item.end).getFullYear() - new Date(timeline.options.start).getFullYear()
      let duration = new Date(item.end).getFullYear() - new Date(item.start).getFullYear()
      let html = `<div class='card'>
                    <h3>${groupName}</h3>
                    <h4>${item.content}</h4>
                    <ul>
                      <li>De ${new Date(item.start).getFullYear()} à ${new Date(item.end).getFullYear()}</li>
                      <li>De ${ageDebut} an(s) à ${ageFin} an(s)</li>
                      <li>Durée: ${duration} an(s)</li>
                    </ul>
                  </div>`
      console.log(groups.get(item.group))
      document.getElementById('moreInfos').innerHTML += html
    }
  });
});


console.log(timeline)
document.getElementById('save').addEventListener('click',function (){
  console.log(items.get())
  var data = items.get({
      type: {
      start: 'ISODate',
      end: 'ISODate'
      }
  });
  let temp = JSON.stringify(data, null, 2);
  console.log(temp)
  });

document.getElementById('load').addEventListener('click',function (){
  const existing = items.get();
  const timelineStartYear = getTimelineStartYear();
  if (timelineStartYear !== 2001) {
    if (!confirm(`La timeline commence en ${timelineStartYear}. Charger les données 2001 peut donner un affichage inattendu. Continuer?`)) return;
  }
  test_items.forEach(i => {
    try {
      const item = Object.assign({}, i);
      if (item.start && typeof item.start === 'string') item.start = new Date(item.start);
      if (item.end && typeof item.end === 'string') item.end = new Date(item.end);
      const duplicate = existing.find(e => (e.id === item.id) || (e.content === item.content && new Date(e.start).getTime() === new Date(item.start).getTime()));
      if (!duplicate) items.add(item);
    } catch (err) {
      console.error('Error adding test item', i, err);
    }
  });
  // Adjust timeline to dataset min year
  try {
    const years = test_items.map(i => {
      const s = i.start;
      if (!s) return Infinity;
      const date = (typeof s === 'string') ? new Date(s) : s;
      return date.getFullYear();
    }).filter(y => Number.isFinite(y));
    if (years.length) {
      const minYear = Math.min(...years);
      if (getTimelineStartYear() !== minYear) {
          timeline.setOptions({ min: new Date(`${minYear}-01-01`), start: new Date(`${minYear}-01-01`) });
        }
    }
  } catch (e) {
    console.error('Error adjusting timeline start to dataset min year', e);
  }
  console.log(items.get())
  });
//wrapper

// Exposer timeline et les datasets pour les autres fichiers
export { timeline, items, groups, handleDragStart, handleDragEnd };