/*
********************************************************************************
* context.js - Contexte par défaut et initialisation                          *
* Définit la structure des données de l'enquête et leur initialisation        *
********************************************************************************
*/

import { items } from "../timeline/timeline.js";
import { loadSavedContext } from "./persistence.js";

/**
 * Contexte par défaut de la machine à états
 * Contient toutes les données collectées pendant l'enquête
 */
export const defaultContext = {
  birthYear: 0,
  birthPlace: '',           // Lieu de naissance des parents
  communes: [],             // Liste des communes
  departements: [],         // Liste des départements/pays associés
  currentCommuneIndex: 0,
  logements: [],            // Liste des logements par commune
  currentLogementIndex: 0,
  group: 13,                // Groupe de départ (communes)
  lastEpisode: null,        // Dernier épisode ajouté à la timeline
};

/**
 * Récupère le dernier épisode depuis la timeline
 * @returns {object|null} Le dernier épisode ou null si aucun
 */
export function getLastEpisodeFromTimeline() {
  try {
    const allItems = items.get();
    if (allItems && allItems.length > 0) {
      // Retourner le dernier item ajouté
      const lastItem = allItems[allItems.length - 1];
      return lastItem;
    }
  } catch (e) {
    console.warn('Impossible de récupérer le dernier épisode:', e);
  }
  return null;
}

/**
 * Initialise le contexte en chargeant les données sauvegardées si disponibles
 * @returns {{ initialContext: object, initialState: string, savedContext: object|null, savedState: string|null }}
 */
export function initializeContext() {
  // Charger le contexte sauvegardé
  const { context: savedContext, savedState } = loadSavedContext();
  
  // Utiliser le contexte sauvegardé si disponible
  let initialContext = savedContext || defaultContext;
  
  // Si on restaure un état, récupérer aussi le lastEpisode depuis la timeline
  if (savedContext) {
    initialContext = {
      ...initialContext,
      lastEpisode: getLastEpisodeFromTimeline()
    };
  }
  
  // Utiliser l'état sauvegardé si disponible, sinon démarrer au début
  const initialState = savedState || 'askBirthYear';
  
  return {
    initialContext,
    initialState,
    savedContext,
    savedState
  };
}
