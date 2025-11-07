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

// Variables pour la synchronisation WebRTC
let syncEnabled = false;
let isHost = true; // Par défaut, mode standalone = hôte

/**
 * Gérer les messages reçus de l'autre tablette
 */
function handleRemoteMessage(message) {    
    if (message.type === 'SURVEY_EVENT') {
        // Appliquer l'événement reçu à notre machine à états
        surveyService.send(message.event);
    } else if (message.type === 'SURVEY_STATE') {
        // Synchroniser l'état complet (utile pour rattrapage)
        // Note: XState v5 n'a pas de méthode simple pour forcer un état
        // On pourrait recréer le service ou envoyer des événements pour arriver au bon état
    }
}

// Fonction pour activer la synchronisation WebRTC
function enableWebRTCSync() {
    if (window.webrtcSync && window.webrtcSync.isActive()) {
        // N'activer qu'une seule fois
        if (syncEnabled) {
            return true;
        }
        
        syncEnabled = true;
        isHost = window.webrtcSync.getRole() === 'host';        
        // Écouter les événements reçus de l'autre tablette (une seule fois)
        if (!window.webrtcSyncListenerAdded) {
            window.webrtcSync.onMessage((message) => {
                handleRemoteMessage(message);
            });
            window.webrtcSyncListenerAdded = true;
        }
        
        return true;
    } else {
        return false;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("questions");
    
    // Essayer d'activer WebRTC au chargement
    enableWebRTCSync();
    
    // Ré-essayer lors de l'affichage de LifeStories
    document.addEventListener('lifestoriesShown', () => {
        enableWebRTCSync();
    });
    
    // Initialisation de la machine à états
    surveyService.start();
    surveyService.subscribe((state) => {
        renderQuestion(state); // Mise à jour à chaque transition
    });
    
    renderQuestion(surveyService.getSnapshot()); // Utilisation de .getSnapshot()

    /**
     * Envoyer un événement (local + remote si WebRTC activé)
     */
    function sendEvent(eventData) {
        // Vérifier si on est hôte
        if (!isHost) {
            console.warn('⛔ VIEWER ne peut pas envoyer d\'événements');
            return; // Bloquer l'envoi
        }        
        // Envoyer localement
        surveyService.send(eventData);
    
        
        if (syncEnabled && window.webrtcSync) {
            const sent = window.webrtcSync.sendEvent(eventData);
        } else {
            console.warn('⚠️ WebRTC non disponible pour envoi');
        }
    }
    

    
    
    function renderQuestion(state) {
        //container.innerHTML = ""; // Efface la question précédente
        let questionText = "";
        let responseType = "input";
        let choices = [];
        let eventType = null;
        let eventKey = "commune";

        const questionDiv = document.createElement("div");
      
        switch (state.value) {
          case "askBirthYear":
            questionText = "Quelle est votre année de naissance ?";
            responseType = "input";
            eventType = "ANSWER_BIRTH_YEAR";
            eventKey = "birthdate";
            break;

          case "birthPlaceIntro":
            questionText = "Où habitaient vos parents à votre naissance ? Dans quelle commune et département (France) ou pays (étranger) ?";
            responseType = "info";  // Nouveau type pour afficher un texte + bouton suivant
            eventType = "NEXT";
            break;

          case "askCurrentCommune":
            questionText = "Dans quelle commune (ville) ?";
            responseType = "input";
            eventType = "ANSWER_CURRENT_COMMUNE";
            eventKey = "commune";
            break;

          case "askDepartementOrPays":
            questionText = "Dans quel département (France) ou pays (étranger) ?";
            responseType = "input";
            eventType = "ANSWER_DEPARTEMENT";
            eventKey = "departement";
            break;

          case "askAlwaysLivedInCommune":
            questionText = `Avez-vous toujours vécu à ${state.context.communes[state.context.currentCommuneIndex]} ?`;
            responseType = "choice";
            choices = ["Yes", "No"];
            break;

          case "askMultipleCommunes":
            questionText = `Pouvez-vous citer les communes dans lesquelles vous avez vécu ?`;
            responseType = "inputlist";
            eventType = "ANSWER_MULTIPLE_COMMUNES";
            eventKey = "communes";
            break;

          case "askCommuneArrivalYear":
            questionText = `En quelle année êtes-vous arrivé à ${state.context.communes[state.context.currentCommuneIndex]} ?`;
            responseType = "input";
            eventType = "ANSWER_COMMUNE_ARRIVAL";
            eventKey = "start";
            break;

          case "askCommuneDepartureYear":
            questionText = `En quelle année avez-vous quitté ${state.context.communes[state.context.currentCommuneIndex]} ?`;
            responseType = "input";
            eventType = "ANSWER_COMMUNE_DEPARTURE";
            eventKey = "end";
            break;

          case "askSameHousingInCommune":
            questionText = `Avez-vous toujours vécu dans le même logement à ${state.context.communes[state.context.currentCommuneIndex]} ?`;
            responseType = "choice";
            choices = ["Yes", "No"];
            break;

          case "askMultipleHousings":
            questionText = `Nous allons faire la liste des logements successifs que vous avez occupés dans ${state.context.communes[state.context.currentCommuneIndex]} depuis votre arrivée.`;
            responseType = "inputlist";
            eventType = "ANSWER_MULTIPLE_HOUSINGS";
            eventKey = "logements";
            break;

          case "askHousingArrivalAge":
            questionText = `Quel âge ou en quelle année avez-vous emménagé dans le logement ${state.context.currentLogementIndex + 1} ?`;
            responseType = "input";
            eventType = "ANSWER_HOUSING_ARRIVAL";
            eventKey = "start";
            break;

          case "askHousingDepartureAge":
            questionText = `À quel âge ou en quelle année avez-vous quitté ce logement ?`;
            responseType = "input";
            eventType = "ANSWER_HOUSING_DEPARTURE";
            eventKey = "end";
            break;

          case "askHousingOccupationStatusEntry":
            questionText = `Quel était votre statut d'occupation à l'arrivée dans le logement (début) ?`;
            responseType = "input";
            eventType = "ANSWER_STATUS_ENTRY";
            eventKey = "statut_res";
            break;

          case "askHousingOccupationStatusExit":
            questionText = `Quel était votre statut d'occupation au départ du logement / actuellement (fin) ?`;
            responseType = "input";
            eventType = "ANSWER_STATUS_EXIT";
            eventKey = "statut_res";
            break;

          case "surveyComplete":
            questionText = "Merci, vous avez terminé l'enquête !";
            responseType = "none";
            break;
        }
      
        
        questionDiv.classList.add("question");
        questionDiv.innerHTML += `<p>${questionText}</p>`;

        // Gestion du type INFO (texte informatif + bouton suivant)
        if (responseType === "info") {
            const nextBtn = document.createElement("button");
            nextBtn.innerText = "Suivant";
            nextBtn.addEventListener("click", () => {
              sendEvent({ type: eventType });
              nextBtn.disabled = true;
            });
            questionDiv.appendChild(nextBtn);
        }

        // Gestion des réponses INPUT (ex: une commune, une année)
        else if (responseType === "input") {
            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Votre réponse";
            input.addEventListener("keypress", (event) => {
              if (event.key === "Enter" && input.value.trim() !== "" && eventType) {
                let eventData = { type: eventType };
                eventData[eventKey] = input.value;
                sendEvent(eventData); // Utiliser sendEvent au lieu de surveyService.send
                event.target.closest('.question').querySelectorAll('input').forEach(input => {
                  input.disabled = true; 
                });
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
              let eventData = { type: choice.toUpperCase() };
              eventData[eventKey] = choice;  
              sendEvent(eventData); // Utiliser sendEvent au lieu de surveyService.send
                event.target.closest('.question').querySelectorAll('button').forEach(btn => {
                  btn.disabled = true; 
                });

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
            let list_communes_not_sorted = [];
            responseList.querySelectorAll('li').forEach(e=> list_communes_not_sorted.push(e.innerHTML))
            let list_communes = items.get().filter(i => list_communes_not_sorted.includes(i.content))
              list_communes.sort((a, b) => (new Date(a.start)) - (new Date(b.start)) )
              list_communes = list_communes.map(i => i.content)
            let eventData = { type: "ANSWER_NEW_COMMUNE" };
              eventData[eventKey] = list_communes;
            sendEvent(eventData); // Utiliser sendEvent au lieu de surveyService.send
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

