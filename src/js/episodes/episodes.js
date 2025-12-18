import state from "../state.js";
import { items } from "../timeline/timeline.js";

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
    // normalize start
    const startDate = start instanceof Date ? new Date(start) : new Date(start);
    if (Number.isNaN(startDate.getTime())) throw new Error('ajouterEpisode: invalid start date');

    // determine endDate according to 3 options:
    // 1) if end provided (not null/undefined/0) use it
    // 2) else try to use the start of the next episode in same group
    // 3) otherwise default to start + 1 year
    let endDate;
    if (end !== undefined && end !== null && end !== 0) {
        endDate = end instanceof Date ? new Date(end) : new Date(end);
        if (Number.isNaN(endDate.getTime())) {
            endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
    } else {
        const all = items.get() || [];
        const next = all
            .map(i => ({ item: i, _start: new Date(i.start) }))
            .filter(i => !Number.isNaN(i._start.getTime()))
            .filter(i => String(i.item.group) === String(group) && i._start.getTime() > startDate.getTime())
            .sort((a,b) => a._start - b._start)[0];

        if (next) endDate = new Date(next._start);
        else {
            endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
    }

    let classColor = group.toString().startsWith('1') ? 'green' : (group.toString().startsWith('2') ? 'blue' : 'red')
    let item = {
        "id": new Date().toString(),
        "type": "range",
        "content": text,
        "start": startDate,
        "end": endDate,
        "group": group,
        "className":classColor
    }

    if(state.lastEpisode && new Date(state.lastEpisode.end).getTime() === startDate.getTime()){
        state.previousEpisode = state.lastEpisode
    }
    items.add(item)
    state.lastEpisode = item;
    return item
    
}

export function ajouterEvenement(text, icon, start, group){
    let classColor = group.toString().startsWith('1') ? 'green' : (group.toString().startsWith('2') ? 'blue' : 'red')
    let item = {
        "id": new Date().toString(),
        "type": "box",
        "content": text,
        "start": start,
        "group": group,
        "className":classColor,
        "icon": icon
    }
    items.add(item)
    return item
    
}

/* Modifier fin d'un épisode 
* Ajouter un épisode avec date de début = date de fin du précedent
* 
*
*/

export function modifierEpisode(id, modifications, syncViaWebRTC = false){
    let itemtomodify = items.get(id)
    const convertYearToDate = (year) => {
        if (year === null || year === undefined) return year;
        // If already a Date, keep it
        if (year instanceof Date) return year;
        // If number like 1980
        if (typeof year === 'number' && /^\d{4}$/.test(String(year))) {
            return new Date(`${String(year)}-01-01`);
        }
        // If string: YYYY, YYYY-MM, YYYY-MM-DD, or ISO
        if (typeof year === 'string') {
            if (/^\d{4}$/.test(year)) return new Date(`${year}-01-01`);
            if (/^\d{4}-\d{2}$/.test(year)) return new Date(`${year}-01-01`);
            if (/^\d{4}-\d{2}-\d{2}/.test(year)) return new Date(year.split('T')[0]);
            // Fallback: try Date parse
            const d = new Date(year);
            if (!Number.isNaN(d.getTime())) return d;
            return year; // leave as-is (caller will handle)
        }
        return year;
    };

    // Appliquer la conversion sur 'start' et 'end'
    if (modifications.start) modifications.start = convertYearToDate(modifications.start);
    if (modifications.end) modifications.end = convertYearToDate(modifications.end);

    // Si une conversion a produit une Date invalide, retirer la modification pour éviter NaN
    if (modifications.start instanceof Date && Number.isNaN(modifications.start.getTime())) {
        console.warn('modifierEpisode: start conversion produced invalid Date, ignoring start', modifications.start);
        delete modifications.start;
    }
    if (modifications.end instanceof Date && Number.isNaN(modifications.end.getTime())) {
        console.warn('modifierEpisode: end conversion produced invalid Date, ignoring end', modifications.end);
        delete modifications.end;
    }
    
    
    // Si on modifie seulement date de début et que la nv date de début est après la date de fin, on met 1 an
    if((modifications.start && !modifications.end) && modifications.start >= itemtomodify.end){
        let newDate = new Date(modifications.start)
        // setFullYear retourne un timestamp (number) — garder un Date
        let endDate = new Date(newDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        modifications.end = endDate;
    }

    // Si on modifie seulement date de fin et que la nv date de fin est avant la date de debut, on met 1 an PASTESTER
    if((modifications.end && !modifications.start) && modifications.end <= itemtomodify.start){
        let newDate = new Date(modifications.end)
        // setFullYear retourne un timestamp (number) — garder un Date
        let startDate = new Date(newDate);
        startDate.setFullYear(startDate.getFullYear() + 1);
        modifications.start = startDate;
    }
    
    Object.assign(itemtomodify, modifications);
    items.update(itemtomodify)
    
    // Synchroniser via WebRTC si explicitement demandé (pour modifications directes depuis l'UI)
    if (syncViaWebRTC && window.webrtcSync && window.webrtcSync.isActive()) {
        try {
            window.webrtcSync.sendMessage({
                type: "UPDATE_ITEMS",
                items: [itemtomodify]
            });
        } catch (e) {
            console.warn("Erreur lors de la synchronisation de la modification d'épisode", e);
        }
    }
    
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
    const episodes = items.get();
    const episodesCorrespondants = episodes.filter(item => {
        return item.group === groupId && new Date(item.start) <= date && new Date(item.end) >= date;
    });

    return episodesCorrespondants; // Retourne la liste des épisodes trouvés
}

// TODO : Verifier que le logement lorsqu'on divise la cellule a un minimum de un an