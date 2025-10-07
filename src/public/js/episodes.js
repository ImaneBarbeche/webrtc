import state from "./state.js";
import { timeline, items, groups } from "./timeline.js";

/**
 ************************************************************************
 * episodes.js gère l'ajout, la modification, la suppression d'épisodes *
 *                                                                      *
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
export function ajouterEpisode(text, start, end, group){
    if(end == 0){
        end = new Date(start);
        end.setFullYear(end.getFullYear() + 1);
        console.log(end)
    }
    let classColor = group.toString().startsWith('1') ? 'green' : (group.toString().startsWith('2') ? 'blue' : 'red')
    let item = {
        "id": new Date().toString(),
        "type": "range",
        "content": text,
        "start": start,
        "end": end,
        "group": group,
        "className":classColor
    }

    if(state.lastEpisode?.end == item.start){
        state.previousEpisode = state.lastEpisode
    }
    console.log(item)
    items.add(item)
    state.lastEpisode = item;
    return item
    
}

/* Modifier fin d'un épisode 
* Ajouter un épisode avec date de début = date de fin du précedent
* 
*
*/

export function modifierEpisode(id, modifications){
    let itemtomodify = items.get(id)
    const convertYearToDate = year => year && /^\d{4}$/.test(year) ? new Date(`${year}-01-01`) : year; //TODO, faire la vérif de si c'est pas une année
    
    // Appliquer la conversion sur 'start' et 'end'
    if (modifications.start) modifications.start = convertYearToDate(modifications.start);
    if (modifications.end) modifications.end = convertYearToDate(modifications.end);
    
    
    // Si on modifie seulement date de début et que la nv date de début est après la date de fin, on met 1 an
    if((modifications.start && !modifications.end) && modifications.start >= itemtomodify.end){
        let newDate = new Date(modifications.start)
        modifications.end = newDate.setFullYear(newDate.getFullYear() + 1);
    }

    // Si on modifie seulement date de fin et que la nv date de fin est avant la date de debut, on met 1 an PASTESTER
    if((modifications.end && !modifications.start) && modifications.end <= itemtomodify.start){
        let newDate = new Date(modifications.end)
        modifications.start = newDate.setFullYear(newDate.getFullYear() + 1);
    }
    
    Object.assign(itemtomodify, modifications);
    timeline.itemsData.update(itemtomodify)
    /*if(state.lastEpisode.end < itemtomodify.end)
        state.lastEpisode = itemtomodify*/ //decommenter pour extend
    return itemtomodify;
}

/**
 * Fonction de recherche d'un épisode par son groupe et si une date incluse
 * @param {int} groupId groupe dans lequel rechercher un episode
 * @param {Date} dateRecherchee rechercher un episode qui contient cette date
 */
function rechercherEpisode(groupId, dateRecherchee) {
    
    const date = new Date(dateRecherchee);
    const episodes = timeline.itemsData.get();
    const episodesCorrespondants = episodes.filter(item => {
        return item.group === groupId && new Date(item.start) <= date && new Date(item.end) >= date;
    });

    return episodesCorrespondants; // Retourne la liste des épisodes trouvés
}

// TODO : Verifier que le logement lorsqu'on divise la cellule a un minimum de un an