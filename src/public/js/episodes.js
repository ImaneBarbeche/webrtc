import state from "./state.js";
import { timeline, items, groups } from "./timeline.js";

/**
 ************************************************************************
 * episodes.js gère l'ajout, la modification, la suppression d'épisodes *
 *                                                                      *
 ************************************************************************ 
 **/

/**
 * HELPER: Convertit n'importe quel format de date en objet Date
 * Formats acceptés:
 * - Date object → retourné tel quel
 * - String YYYY → new Date("YYYY-01-01")
 * - String ISO → new Date(string)
 * - Timestamp number → new Date(timestamp)
 * - null/undefined → null
 * 
 * @param {Date|string|number|null} value - Valeur à convertir
 * @returns {Date|null} Date object ou null
 */
function normalizeToDate(value) {
    // Déjà null/undefined → garder null
    if (value === null || value === undefined) {
        return null;
    }

    // Déjà un objet Date valide → retourner tel quel
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }

    // String format YYYY (ex: "2001")
    if (typeof value === 'string') {
        const trimmed = value.trim();
        
        // Format YYYY uniquement
        if (/^\d{4}$/.test(trimmed)) {
            const date = new Date(`${trimmed}-01-01T00:00:00.000Z`);
            console.log(`📅 Date normalisée: "${trimmed}" → ${date.toISOString()}`);
            return date;
        }
        
        // Format ISO ou autre format string
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
            console.log(`📅 Date normalisée: "${trimmed}" → ${date.toISOString()}`);
            return date;
        }
        
        console.warn(`⚠️ Format de date invalide: "${trimmed}"`);
        return null;
    }

    // Timestamp numérique
    if (typeof value === 'number' && !isNaN(value)) {
        const date = new Date(value);
        console.log(`📅 Timestamp normalisé: ${value} → ${date.toISOString()}`);
        return date;
    }

    console.warn(`⚠️ Type de date non reconnu:`, typeof value, value);
    return null;
}

/**
 * HELPER: Ajoute 1 an à une date
 * @param {Date} date - Date de départ
 * @returns {Date} Date + 1 an
 */
function addOneYear(date) {
    const newDate = new Date(date);
    newDate.setFullYear(newDate.getFullYear() + 1);
    return newDate;
}

/**
 * Ajoute un épisode à la timeline
 * 
 * @param {string} text - Contenu de l'épisode (ex: "Paris", "Locataire")
 * @param {Date|string|number} start - Date de début (sera normalisée en Date)
 * @param {Date|string|number|null} end - Date de fin (sera normalisée en Date, null = calculé automatiquement)
 * @param {number} group - Groupe auquel appartient l'épisode
 * @returns {Object} L'item créé
 */
export function ajouterEpisode(text, start, end, group) {
    // 🔧 NORMALISATION: Convertir toutes les dates en objets Date
    const normalizedStart = normalizeToDate(start);
    let normalizedEnd = normalizeToDate(end);

    // Validation: start doit être valide
    if (!normalizedStart) {
        console.error('❌ ajouterEpisode: start invalide', start);
        return null;
    }

    // ✅ Si end est null/undefined/0, calculer automatiquement +1 an
    if (!normalizedEnd) {
        normalizedEnd = addOneYear(normalizedStart);
        console.log(`⏰ End auto-calculé: ${normalizedStart.toISOString()} +1an → ${normalizedEnd.toISOString()}`);
    }

    // Déterminer la couleur selon le groupe
    const classColor = group.toString().startsWith('1') ? 'green' : 
                       (group.toString().startsWith('2') ? 'blue' : 'red');

    // Créer l'item avec dates normalisées
    const item = {
        "id": new Date().toString(),
        "type": "range",
        "content": text,
        "start": normalizedStart,  // ✅ Toujours Date object
        "end": normalizedEnd,      // ✅ Toujours Date object
        "group": group,
        "className": classColor
    };

    // Gestion de l'état pour épisode précédent
    if (state.lastEpisode?.end && normalizedStart) {
        const lastEndTime = new Date(state.lastEpisode.end).getTime();
        const currentStartTime = normalizedStart.getTime();
        
        if (lastEndTime === currentStartTime) {
            state.previousEpisode = state.lastEpisode;
        }
    }

    console.log('✅ Épisode ajouté:', {
        content: text,
        start: normalizedStart.toISOString(),
        end: normalizedEnd.toISOString(),
        group
    });

    items.add(item);
    state.lastEpisode = item;
    return item;
}

/**
 * Modifie un épisode existant
 * 
 * @param {string} id - ID de l'épisode à modifier
 * @param {Object} modifications - Objet contenant les modifications (start, end, content, etc.)
 * @returns {Object} L'item modifié
 */
export function modifierEpisode(id, modifications) {
    const itemToModify = items.get(id);
    
    if (!itemToModify) {
        console.error('❌ modifierEpisode: item introuvable', id);
        return null;
    }

    // 🔧 NORMALISATION: Convertir les dates des modifications
    const normalizedModifs = { ...modifications };
    
    if (modifications.start !== undefined) {
        normalizedModifs.start = normalizeToDate(modifications.start);
        if (!normalizedModifs.start) {
            console.error('❌ modifierEpisode: start invalide', modifications.start);
            delete normalizedModifs.start; // Ne pas appliquer modification invalide
        }
    }
    
    if (modifications.end !== undefined) {
        normalizedModifs.end = normalizeToDate(modifications.end);
        if (!normalizedModifs.end) {
            console.error('❌ modifierEpisode: end invalide', modifications.end);
            delete normalizedModifs.end; // Ne pas appliquer modification invalide
        }
    }

    // Récupérer les dates actuelles (normalisées)
    const currentStart = normalizeToDate(itemToModify.start);
    const currentEnd = normalizeToDate(itemToModify.end);

    // 🛡️ PROTECTION: Si on modifie seulement start et que start >= end actuel
    if (normalizedModifs.start && !normalizedModifs.end && currentEnd) {
        if (normalizedModifs.start.getTime() >= currentEnd.getTime()) {
            normalizedModifs.end = addOneYear(normalizedModifs.start);
            console.log(`⚠️ Start >= End détecté, end auto-ajusté: ${normalizedModifs.end.toISOString()}`);
        }
    }

    // 🛡️ PROTECTION: Si on modifie seulement end et que end <= start actuel
    if (normalizedModifs.end && !normalizedModifs.start && currentStart) {
        if (normalizedModifs.end.getTime() <= currentStart.getTime()) {
            // FIXME: Logique à revoir - pour l'instant on ajuste start
            normalizedModifs.start = new Date(normalizedModifs.end);
            normalizedModifs.start.setFullYear(normalizedModifs.start.getFullYear() - 1);
            console.log(`⚠️ End <= Start détecté, start auto-ajusté: ${normalizedModifs.start.toISOString()}`);
        }
    }

    // Appliquer les modifications normalisées
    Object.assign(itemToModify, normalizedModifs);
    timeline.itemsData.update(itemToModify);

    console.log('✅ Épisode modifié:', {
        id,
        modifications: normalizedModifs,
        result: {
            start: itemToModify.start?.toISOString?.() || itemToModify.start,
            end: itemToModify.end?.toISOString?.() || itemToModify.end
        }
    });

    return itemToModify;
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