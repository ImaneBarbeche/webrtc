import { ajouterEpisode, modifierEpisode } from "./episodes.js"
import { timeline, items, groups, handleDragStart, handleDragEnd } from "./timeline.js";
import state from "./state.js"

import { surveyMachine, surveyService } from "./stateMachine.js";

/**
 ************************************************************************************************************
 * questionnaire.js gère l'affichage des questions et transition vers les états suivant                     *
 * Chaque question a un type d'evenement, correspondant à un état ou une transition dans la machine à états *
 ************************************************************************************************************
 */

/**
 * EVENT NORMALIZATION HELPER
 * Crée un événement standardisé pour la state machine
 * 
 * @param {string} type - Type de l'événement (ex: "ANSWER_BIRTH_YEAR", "YES", "NO")
 * @param {Object} data - Données de l'événement
 * @returns {Object} Événement normalisé et validé
 */
function createNormalizedEvent(type, data = {}) {
    // Validation du type
    if (!type || typeof type !== 'string') {
        console.error('❌ Event type invalide:', type);
        return null;
    }

    // Normalisation des données selon le type d'événement
    const event = { type: type.toUpperCase() };

    // Normalisation spécifique par type d'événement
    switch (type.toUpperCase()) {
        case 'ANSWER_BIRTH_YEAR':
            // Toujours stocker l'année comme string YYYY
            if (data.birthdate) {
                const yearMatch = String(data.birthdate).trim().match(/^(\d{4})/);
                event.birthdate = yearMatch ? yearMatch[1] : String(data.birthdate).trim();
                console.log('📅 Année de naissance normalisée:', event.birthdate);
            }
            break;

        case 'ANSWER_BIRTH_COMMUNE':
        case 'ANSWER_NEW_COMMUNE':
            // Toujours stocker les communes comme array
            if (data.commune) {
                event.commune = Array.isArray(data.commune) ? data.commune : [data.commune];
                console.log('🏘️ Commune(s) normalisée(s):', event.commune);
            }
            break;

        case 'ANSWER_ARRIVAL_YEAR':
        case 'ANSWER_HOUSING_ARRIVAL_YEAR':
            // Année d'arrivée comme string YYYY
            if (data.start) {
                const yearMatch = String(data.start).trim().match(/^(\d{4})/);
                event.start = yearMatch ? yearMatch[1] : String(data.start).trim();
                console.log('📍 Année d\'arrivée normalisée:', event.start);
            }
            break;

        case 'ANSWER_HOUSING_DEPARTURE_YEAR':
            // Année de départ comme string YYYY
            if (data.end) {
                const yearMatch = String(data.end).trim().match(/^(\d{4})/);
                event.end = yearMatch ? yearMatch[1] : String(data.end).trim();
                console.log('🚪 Année de départ normalisée:', event.end);
            }
            break;

        case 'ANSWER_HOUSING_SPLIT_YEAR':
            // Année de split comme string YYYY
            if (data.split) {
                const yearMatch = String(data.split).trim().match(/^(\d{4})/);
                event.split = yearMatch ? yearMatch[1] : String(data.split).trim();
                console.log('✂️ Année de déménagement normalisée:', event.split);
            }
            break;

        case 'LOCATAIRE':
        case 'PROPRIETAIRE':
            // Statut résidentiel
            event.statut_res = type;
            console.log('🏠 Statut résidentiel:', event.statut_res);
            break;

        case 'YES':
        case 'NO':
            // Pas de données supplémentaires pour YES/NO
            console.log('✅/❌ Réponse binaire:', type);
            break;

        default:
            // Pour tout autre type, copier les données telles quelles
            Object.assign(event, data);
            console.log('📦 Événement générique:', type, data);
    }

    // Log de l'événement final pour debug
    console.log('🚀 Événement normalisé envoyé:', event);
    
    return event;
}

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("questions");
    // Initialisation de la machine à états
    surveyService.start();
    surveyService.subscribe((state) => {
        console.log("=====================================")
        console.log('État actuel:', state.value);
        console.log('Context actuel:', state.context);
        console.log("=====================================")

        renderQuestion(state); // Mise à jour à chaque transition
    });
    
    // Le subscribe() appelle déjà renderQuestion() avec l'état initial
    // renderQuestion(surveyService.getSnapshot()); // Supprimé pour éviter le doublon

    
    
    function renderQuestion(state) {
        // Vérifier si cette question a déjà été affichée
        const existingQuestion = container.querySelector(`[data-state="${state.value}"]`);
        if (existingQuestion) {
            console.log('Question déjà affichée pour l\'état:', state.value);
            return; // Ne pas afficher la même question deux fois
        }
        
        // Ne pas effacer - les questions s'empilent
        // container.innerHTML = ""; 
        let questionText = "";
        let responseType = "input";
        let choices = [];
        let eventType = null;
        let eventKey = "commune";

        const questionDiv = document.createElement("div");
        questionDiv.setAttribute('data-state', state.value); // Marquer la question avec son état
        questionDiv.className = 'question'; // Classe CSS pour le style
      
        switch (state.value) {
          case "askBirthYear":
            questionText = "Quelle est votre année de naissance ?";
            responseType = "input";
            eventType = "ANSWER_BIRTH_YEAR";
            eventKey = "birthdate";
            break;
          case "askBirthCommune":
            questionText = "Où habitaient vos parents à votre naissance ?";
            responseType = "input";
            eventType = "ANSWER_BIRTH_COMMUNE";
            eventKey = "commune";
            break;
          case "askAlwaysLivedThere":
            questionText = `Avez-vous toujours vécu à ${state.context.communes[state.context.currentCommuneIndex]} ?`;
            responseType = "choice";
            choices = ["Yes", "No"];
            break;
          case "askNewCommune":
            questionText = "Pouvez-vous nous indiquer les communes et départements (ou pays si étranger) de vos différents lieux de résidence puis les placer ?";
            responseType = "inputlist";
            eventType = "ANSWER_NEW_COMMUNE";
            eventKey = "commune";
            break;
          case "askArrivalYear":
            questionText = `En quelle année êtes-vous arrivé à ${state.context.communes[state.context.currentCommuneIndex]} ?`;
            responseType = "input";
            eventType = "ANSWER_ARRIVAL_YEAR";
            eventKey = "start";
            break;
          case "askSameHousing":
            questionText = `Avez-vous toujours vécu dans le même logement à ${state.context.communes[state.context.currentCommuneIndex]} ?`;
            responseType = "choice";
            choices = ["Yes", "No"];
            break;
          case "askSplitHousing":
            questionText = "En quelle année avez-vous déménagé ?";
            responseType = "input";
            eventType = "ANSWER_HOUSING_SPLIT_YEAR";
            eventKey = "split";
            break;
          case "askHousingArrivalYear":
            questionText = "En quelle année êtes-vous entré dans ce logement ?";
            responseType = "input";
            eventType = "ANSWER_HOUSING_ARRIVAL_YEAR"
            eventKey = "start";
            break;
          case "askHousingDepartureYear":
            questionText = "En quelle année avez-vous quitté ce logement ?";
            responseType = "input";
            eventType = "ANSWER_HOUSING_DEPARTURE_YEAR"
            eventKey = "end";
            break;
          case "askHousingStatus":
            questionText =  "Quel a été votre statut dans ce logement ?";
            responseType = "choice";
            choices = ["Locataire", "Proprietaire"];
            eventKey = "statut_res";
            break;
          case "askChangeHousingStatus":
            questionText =  "Avez-vous changé de statut d'occupation entre l'entrée et la sortie du logement ?";
            responseType = "choice";
            choices = ["Yes", "No"];
            break;
          case "surveyComplete":
            questionText = "Merci, vous avez terminé l'enquête !";
            responseType = "none";
            break;
        }
      
        
        questionDiv.classList.add("question");
        questionDiv.innerHTML += `<p>${questionText}</p>`;

        // Gestion des réponses INPUT (ex: une commune, une année)
        if (responseType === "input") {
            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Votre réponse";
            input.addEventListener("keypress", (event) => {
              if (event.key === "Enter" && input.value.trim() !== "" && eventType) {
                // Préparation des données brutes
                const rawData = {};
                rawData[eventKey] = eventKey === "commune" ? [input.value] : input.value;
                
                // Normalisation et envoi
                const normalizedEvent = createNormalizedEvent(eventType, rawData);
                if (normalizedEvent) {
                  surveyService.send(normalizedEvent);
                  event.target.closest('.question').querySelectorAll('input').forEach(input => {
                    input.disabled = true; 
                  });
                }
              }
            });
            questionDiv.appendChild(input);
        }

        // Gestion des boutons choix ("Oui", "Non")
        else if (responseType === "choice") {
            choices.forEach(choice => {
            const button = document.createElement("button");
            button.innerText = choice;
            button.addEventListener("click", (event) => {
              // Préparation des données selon le choix
              const rawData = {};
              if (eventKey && eventKey !== "commune") {
                rawData[eventKey] = choice;
              }
              
              // Normalisation et envoi
              const normalizedEvent = createNormalizedEvent(choice.toUpperCase(), rawData);
              if (normalizedEvent) {
                surveyService.send(normalizedEvent);
                event.target.closest('.question').querySelectorAll('button').forEach(btn => {
                  btn.disabled = true; 
                });
              }
            });
            questionDiv.appendChild(button);
            });
        }

        // Gestion des réponses avec un input et une liste
        else if(responseType === "inputlist"){
          const input = document.createElement("input");
          input.type = "text";
          input.placeholder = "Commune/Département ou pays";

          const responseList = document.createElement("ul");
          responseList.id = `ulgroup_${state.context.group}`;  

          input.addEventListener("keypress", (event) => {
            if (event.key === "Enter" && input.value.trim() !== "") {
                const listItem = document.createElement("li");
                listItem.textContent = input.value;
                listItem.classList.add("item");
                listItem.draggable = true;
                listItem.addEventListener("dragstart", handleDragStart);
                listItem.addEventListener("dragend", handleDragEnd);

    
                responseList.appendChild(listItem);
    
                input.value = ""; // Effacer après ajout
            }
          });
        
          questionDiv.appendChild(input);
          questionDiv.appendChild(responseList);
      
          const nextQBtn = document.createElement("button");
          nextQBtn.innerHTML = "Suivant";
          
          nextQBtn.addEventListener("click", () => {
            // Récupération des communes saisies
            let list_communes_not_sorted = [];
            responseList.querySelectorAll('li').forEach(e => list_communes_not_sorted.push(e.innerHTML));
            
            // FIXME: Cette logique dépend des items existants - à améliorer pour mode live
            // Pour l'instant, si items vides, garder l'ordre de saisie
            let list_communes;
            const existingItems = items.get().filter(i => list_communes_not_sorted.includes(i.content));
            
            if (existingItems.length > 0) {
              // Tri par date de début si items trouvés
              existingItems.sort((a, b) => (new Date(a.start)) - (new Date(b.start)));
              list_communes = existingItems.map(i => i.content);
              console.log('🗂️ Communes triées par dates existantes:', list_communes);
            } else {
              // Garder l'ordre de saisie si pas d'items existants (mode live)
              list_communes = list_communes_not_sorted;
              console.log('📝 Communes dans l\'ordre de saisie:', list_communes);
            }
            
            // Normalisation et envoi
            const normalizedEvent = createNormalizedEvent(eventType, { commune: list_communes });
            if (normalizedEvent) {
              surveyService.send(normalizedEvent);
            }
          });
      
          questionDiv.appendChild(nextQBtn);
        }

      

        container.appendChild(questionDiv);
      }
});

function initWithTimeline(timelineInstance) {
    console.log("Timeline reçue :", timelineInstance);
    // Utilisation de timelineInstance ici
}

