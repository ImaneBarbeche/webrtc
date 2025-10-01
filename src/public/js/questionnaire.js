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
                let eventData = { type: eventType };
                eventData[eventKey] = eventKey == "commune" ?  [input.value] : input.value//cas special pour commune 
                console.log(eventData)
                surveyService.send(eventData); // On envoie l'événement correct
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
              surveyService.send(eventData); // "YES" ou "NO"
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
              console.log(list_communes)
            let eventData = { type: "ANSWER_NEW_COMMUNE" };
              eventData[eventKey] = list_communes;
            surveyService.send(eventData);
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

