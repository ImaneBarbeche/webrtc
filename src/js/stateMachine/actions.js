/*
********************************************************************************
* actions.js - Actions de la machine à états                                  *
* Fonctions qui modifient le contexte ou produisent des effets secondaires    *
********************************************************************************
*/

import { ajouterEpisode, modifierEpisode } from "../episodes/episodes.js";
import { timeline, groups, items } from "../timeline/timeline.js";
import { setBirthYear, setupBirthYearButton } from "../timeline/birthYear.js";

const { assign } = window.XState;

// =============================================================================
// ACTIONS SIMPLES (modification du contexte)
// =============================================================================

/**
 * Sauvegarde l'année de naissance et met à jour l'affichage de l'âge sur la timeline
 */
export const saveBirthYear = assign({
  birthYear: ({context, event}) => {
    const year = parseInt(event.birthdate);
    // Mettre à jour l'année de naissance pour l'affichage de l'âge côté timeline
    setBirthYear(year);
    setupBirthYearButton(); // brancher le bouton
    return year;
  }
});

/**
 * Sauvegarde le lieu de naissance
 */
export const saveBirthPlace = assign({
  birthPlace: ({context, event}) => event.birthPlace
});

/**
 * Ajoute une commune au tableau
 */
export const addCommune = assign({
  communes: ({context, event}) => {
    return [...context.communes, event.commune];
  }
});

/**
 * Ajoute un département au tableau
 */
export const addDepartement = assign({
  departements: ({context, event}) => {
    return [...context.departements, event.departement];
  }
});

/**
 * Ajoute plusieurs communes d'un coup
 */
export const addMultipleCommunes = assign({
  communes: ({context, event}) => {
    const newCommunes = [...context.communes, ...event.communes];
    return newCommunes;
  },
  currentCommuneIndex: ({context}) => {
    // Positionner l'index sur la première nouvelle commune ajoutée
    const newIndex = context.communes.length;
    return newIndex;
  }
});

/**
 * Ajoute plusieurs logements pour la commune courante
 */
export const addMultipleHousings = assign({
  logements: ({context, event}) => {
    return event.logements || [];
  }
});

// =============================================================================
// ACTIONS DE NAVIGATION (index et groupes)
// =============================================================================

/**
 * Réinitialise l'index des logements à 0
 */
export const resetLogement = assign({
  currentLogementIndex: () => 0
});

/**
 * Passe au logement suivant
 */
export const nextLogement = assign({
  currentLogementIndex: ({context}) => context.currentLogementIndex + 1
});

/**
 * Passe à la commune suivante
 */
export const nextCommune = assign({
  currentCommuneIndex: ({context, event}) => {
    const newIndex = context.currentCommuneIndex + 1;
    return newIndex;
  }
});

/**
 * Réinitialise l'index des communes à 0
 */
export const resetCommune = assign({
  currentCommuneIndex: ({context, event}) => {
    return 0;
  }
});

/**
 * Passe au groupe suivant (13→12→11)
 * TODO: À modifier, ne marche que pour 14,13,12,11
 */
export const nextGroup = assign({
  group: ({context, event}) => {
    return context.group - 1;
  }
});

/**
 * Remonte au groupe précédent (11→12→13)
 */
export const previousGroup = assign({
  group: ({context, event}) => {
    return context.group + 1;
  }
});

// =============================================================================
// ACTIONS TIMELINE - Création et modification d'épisodes
// =============================================================================

/**
 * Parse une valeur (âge ou année) et retourne une Date
 * @param {string|number} value - La valeur à parser
 * @param {number} birthYear - L'année de naissance pour convertir les âges
 * @returns {Date|null}
 */
function parseAgeOrYear(value, birthYear) {
  if (!value) return null;
  
  let strValue = value.toString().trim();
  let match = strValue.match(/\d+/);
  
  if (match) {
    let num = parseInt(match[0]);
    
    // Si < 200, c'est un âge, sinon c'est une année
    if (num < 200) {
      let year = birthYear + num;
      return new Date(`${year}-01-01`);
    } else {
      return new Date(`${num}-01-01`);
    }
  }
  return null;
}

/**
 * Ajoute un épisode au calendrier
 * Gère la logique complexe des dates de début/fin selon le groupe et le contexte
 * IMPORTANT: La date fournie par l'utilisateur (event.start) a priorité sur les valeurs par défaut
 */
export const addCalendarEpisode = assign({
  lastEpisode: ({context, event}, params) => {
    let defaultStart = null;
    let defaultEnd = 0;
    let startDate = null;
    let endDate = 0;
    
    // 1. Parser la date de début depuis l'événement (PRIORITAIRE)
    if (event.start) {
      startDate = parseAgeOrYear(event.start, context.birthYear);
    }
    
    // 2. Gestion du paramètre timeline_init (pour la commune de naissance)
    if (params?.start === "timeline_init") {
      if (!startDate) {
        startDate = window.timeline?.options?.start || new Date();
      }
      // Pour la commune de naissance, la fin sera demandée séparément
      // On met une date par défaut d'1 an après le début
        if (context.birthYear) {
          startDate = new Date(`${context.birthYear}-01-01`);
        } else {
          startDate = new Date();
        }
      defaultEnd = 0; // sera calculé dans ajouterEpisode (+1 an)
    }
    
    // 3. Vérifier les dépendances de groupe (pour les sous-éléments comme logements)
    const currentGroup = groups.get(context.group);
    
    if (currentGroup && currentGroup.dependsOn) {
      // Pour les logements (groupe 12), utiliser currentCommuneIndex
      if (context.group === 12 && currentGroup.dependsOn === 13) {
        let filteritems = items.get().filter(i => i.group === currentGroup.dependsOn);
        let parentItem = filteritems[context.currentCommuneIndex];
        
        if (parentItem) {
          if (!startDate) defaultStart = parentItem.start;
          defaultEnd = parentItem.end;
        }
      }
      // Si lastEpisode est du groupe parent, l'utiliser directement
      else if (context.lastEpisode && context.lastEpisode.group === currentGroup.dependsOn) {
        if (!startDate) defaultStart = context.lastEpisode.start;
        defaultEnd = context.lastEpisode.end;
      } else {
        // Chercher le parent approprié - prendre le dernier item du groupe parent
        let filteritems = items.get().filter(i => i.group === currentGroup.dependsOn);
        let parentItem = filteritems.length > 0 ? filteritems[filteritems.length - 1] : null;
        
        if (parentItem) {
          if (!startDate) defaultStart = parentItem.start;
          defaultEnd = parentItem.end;
        }
      }
    }
    
    // 4. Déterminer le contenu de l'épisode
    let content;
    if (event.type === "ANSWER_BIRTH_COMMUNE") {
      content = event.commune[0];
    } else if (event.commune) {
      content = event.commune;
    } else if (event.statut_res) {
      content = event.statut_res;
    } else if (event.type === "YES" && context.group === 12) {
      content = "Logement unique";
    } else if (context.group === 12 && context.logements && context.logements.length > 0) {
      content = context.logements[context.currentLogementIndex];
    } else {
      content = context.communes[context.currentCommuneIndex];
    }
    
    // Utiliser startDate (de l'événement) en priorité, sinon defaultStart
    let finalStart = startDate || defaultStart;
    const finalEnd = endDate || defaultEnd;
    
    // Fallback: si toujours pas de date de début, utiliser la date actuelle
    if (!finalStart) {
      console.warn('addCalendarEpisode: pas de date de début, utilisation de la date actuelle');
      finalStart = new Date();
    }
    
    return ajouterEpisode(content, finalStart, finalEnd, context.group);
  }
});

/**
 * Modifie un épisode existant sur le calendrier
 * Gère les tokens spéciaux (timeline_end, timeline_init) et la conversion âge→année
 */
export const modifyCalendarEpisode = assign({
  lastEpisode: ({context, event}, params) => {
    if (!context.lastEpisode || !context.lastEpisode.id) {
      console.warn('lastEpisode est null dans modifyCalendarEpisode');
      return null;
    }
    
    // Gestion des paramètres avec tokens spéciaux
    if (params) {
      const normalized = Object.assign({}, params);
      try {
        if (normalized.end === 'timeline_end') {
          normalized.end = window.timeline?.options?.end || new Date();
        }
        if (normalized.start === 'timeline_init') {
          normalized.start = window.timeline?.options?.start || new Date();
        }
      } catch (e) {
        console.warn('Erreur lors de la normalisation des params de modifyCalendarEpisode', e, params);
      }
      return modifierEpisode(context.lastEpisode.id, normalized);
    }
    
    // Parser les modifications de l'événement
    const { type, ...modifs } = event;
    
    // Convertir les dates (âge ou année)
    if (modifs.end && typeof modifs.end === 'string') {
      modifs.end = parseAgeOrYear(modifs.end, context.birthYear) || modifs.end;
    }
    if (modifs.start && typeof modifs.start === 'string') {
      modifs.start = parseAgeOrYear(modifs.start, context.birthYear) || modifs.start;
    }
    
    if (!context.lastEpisode || !context.lastEpisode.id) {
      console.warn('lastEpisode est null, impossible de modifier l\'épisode');
      return null;
    }
    
    return modifierEpisode(context.lastEpisode.id, modifs);
  }
});

/**
 * Ferme l'épisode de la commune précédente à la date d'arrivée dans la nouvelle
 * NOTE: Ne modifie pas la commune de naissance (index 0) car sa date de fin
 * a déjà été définie dans askBirthCommuneDepartureYear
 */
export const closePreviousCommuneEpisode = ({context, event}) => {
  // Ne pas modifier la commune de naissance (première commune, index 0)
  // car sa date de fin a déjà été demandée séparément
  if (context.currentCommuneIndex <= 1) {
    return;
  }
  
  const allItems = items.get();
  const communeEpisodes = allItems.filter(i => i.group === 13);
  
  if (communeEpisodes.length > 0 && event.start) {
    const lastCommuneEpisode = communeEpisodes[communeEpisodes.length - 1];
    const arrivalDate = new Date(`${event.start}-01-01`);
    modifierEpisode(lastCommuneEpisode.id, { end: arrivalDate });
  }
};

/**
 * Étend l'épisode précédent du calendrier
 */
export const extendPreviousCalendarEpisode = ({context, event}) => {
  const { type, ...modifs } = event;
  if (modifs.hasOwnProperty('start')) {
    modifs.end = modifs.start;
    delete modifs.start;
  }
  let previousEp = items.get()[context.currentCommuneIndex - 1];
  return modifierEpisode(previousEp.id, modifs);
};

/**
 * Divise un épisode de logement en deux à une date donnée
 */
export const splitHousingEpisode = assign({
  lastEpisode: ({context, event}) => {
    const episodeToSplit = context.lastEpisode;
    const splitYear = parseInt(event.split);
    
    const startDate = new Date(episodeToSplit.start);
    const endDate = new Date(episodeToSplit.end);
    const splitDate = new Date(splitYear, 0, 1);
    
    // Modifier l'épisode existant (premier logement)
    modifierEpisode(episodeToSplit.id, { end: splitDate });
    
    // Ajouter le second logement
    const secondEpisode = ajouterEpisode(
      episodeToSplit.content,
      splitDate,
      endDate,
      episodeToSplit.group
    );
    
    return secondEpisode;
  }
});

// =============================================================================
// ACTIONS DE CONFIGURATION
// =============================================================================

/**
 * Configure le calendrier avec l'année de naissance
 * Définit les options de la timeline et le format d'affichage de l'âge
 */
export const setupCalendar = ({context, event}) => {
  timeline.setOptions({
    min: new Date(`${event.birthdate -4}-01-01`),
    start: new Date(`${event.birthdate -4}-01-01`)
  });
  
  timeline.setOptions({
    format: {
      minorLabels: function(date, scale, step) {
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
            const age = new Date(date).getFullYear() -4 - new Date(window.timeline?.options?.start || new Date()).getFullYear();
            if (new Date(date) < new Date(`${event.birthdate -1}-01-01`) || new Date(date) > new Date()) {

            } else {

              return '<b>' + new Date(date).getFullYear() + '</b></br><span class="year-age">' + age + ` ${age !== 0 && age !== 1 ? 'ans' : 'an'}</span>`;
            }
          default:
            return '';
        }
      }
    }
  });
  // adding a new bar to show the birthdate
  timeline.addCustomTime(
    new Date(`${event.birthdate}-01-01`),
    "birth-year-bar"
  );
  timeline.setCustomTimeTitle(
    event.birthdate,
    "birth-year-bar"
  )
  
  timeline.setCustomTime(
    new Date(`${event.birthdate}-01-01`),
    "custom-bar"
  );
  timeline.setCustomTimeTitle(
    event.birthdate,
    "custom-bar"
  )
};

    
// =============================================================================
// EXPORT GROUPÉ POUR LA MACHINE
// =============================================================================

/**
 * Objet contenant toutes les actions pour la configuration de la machine
 */
export const actions = {
  saveBirthYear,
  saveBirthPlace,
  addCommune,
  addDepartement,
  addMultipleCommunes,
  addMultipleHousings,
  resetLogement,
  nextLogement,
  nextCommune,
  resetCommune,
  nextGroup,
  previousGroup,
  addCalendarEpisode,
  modifyCalendarEpisode,
  closePreviousCommuneEpisode,
  extendPreviousCalendarEpisode,
  splitHousingEpisode,
  setupCalendar
};
