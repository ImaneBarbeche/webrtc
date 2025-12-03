import {
  timeline,
  items,
  groups,
  handleDragStart,
  handleDragEnd,
} from "./timeline.js";
import { setBirthYear } from "./birthYear.js";
import {
  surveyMachine,
  surveyService,
  initializeSurveyService,
  saveAnsweredQuestion,
  loadAnsweredQuestions,
  getQuestionFromState,
} from "./stateMachine.js";

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
  if (message.type === "SURVEY_EVENT") {
    // Appliquer l'événement reçu à notre machine à états
    surveyService.send(message.event);
  } else if (message.type === "LOAD_ITEMS") {
    // L'enquêteur a envoyé un lot d'items à charger dans la timeline
    try {
      if (message.items && Array.isArray(message.items)) {
        // Convertir les dates ISO en objets Date si nécessaire
        const parsed = message.items.map((i) => ({
          ...i,
          start: i.start ? new Date(i.start) : undefined,
          end: i.end ? new Date(i.end) : undefined,
        }));
        // items est importé depuis timeline.js
        // Ajouter en évitant les doublons et forcer un fit/redraw si la timeline est prête
        const toAdd = [];
        parsed.forEach((i) => {
          try {
            if (items.get(i.id)) {
              // Générer un id unique si conflit
              const newId = `${i.id}_${Date.now()}`;
              toAdd.push(Object.assign({}, i, { id: newId }));
            } else {
              toAdd.push(i);
            }
          } catch (e) {
            console.warn("Erreur vérif item existant", e, i);
            toAdd.push(i);
          }
        });

        if (toAdd.length) {
          try {
            // Si la timeline est déjà initialisée, ajouter et ajuster la vue
            if (window.timeline && typeof window.timeline.fit === "function") {
              items.add(toAdd);
              try {
                window.timeline.redraw();
              } catch (e) {}
              try {
                window.timeline.fit();
              } catch (e) {}
            } else {
              // Persister temporairement pour traitement lorsque la timeline sera prête
              try {
                const existing = JSON.parse(
                  localStorage.getItem("lifestories_pending_load_items") || "[]"
                );
                const merged = existing.concat(toAdd);
                localStorage.setItem(
                  "lifestories_pending_load_items",
                  JSON.stringify(merged)
                );
              } catch (e) {
                // si localStorage indisponible, essayer d'ajouter directement (peut échouer si timeline non initialisée)
                try {
                  items.add(toAdd);
                } catch (err) {
                  console.warn(
                    "Impossible d'ajouter les items (timeline non prête)",
                    err
                  );
                }
              }
            }
          } catch (e) {
            console.error("Erreur lors de l'ajout des items distants", e);
          }
        }
      }
    } catch (e) {
      console.error("Erreur lors du chargement des items distants", e);
    }
  } else if (message.type === "SURVEY_STATE") {
    // Synchroniser l'état complet (utile pour rattrapage)
    // Note: XState v5 n'a pas de méthode simple pour forcer un état
    // On pourrait recréer le service ou envoyer des événements pour arriver au bon état
  } else if (message.type === "RESET_ALL_DATA") {
    // L'enquêteur a demandé une réinitialisation complète
    import("./stateMachine.js").then((module) => {
      module.resetAllData();
    });
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
    isHost = window.webrtcSync.getRole() === "host";
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
  let isInitialized = false;

  // Essayer d'activer WebRTC au chargement
  enableWebRTCSync();

  // Ré-essayer lors de l'affichage de LifeStories
  document.addEventListener("lifestoriesShown", () => {
    enableWebRTCSync();
  });

  // Initialisation de la machine à états avec restauration si nécessaire
  initializeSurveyService();

  // Fonction pour afficher les réponses précédentes
  function displayPreviousAnswers() {
    const answeredQuestions = loadAnsweredQuestions();

    if (answeredQuestions.length === 0) return; // Rien à afficher

    // Créer un conteneur pour les réponses précédentes
    const previousAnswersDiv = document.createElement("div");
    previousAnswersDiv.className = "previous-answers-section";
    previousAnswersDiv.innerHTML = "<h3>Historique des réponses</h3>";

    answeredQuestions.forEach((item, index) => {
      const answerDiv = document.createElement("div");
      answerDiv.className = "previous-answer";

      // Obtenir la question à partir de l'état
      const question = getQuestionFromState(item.state);

      // Formater la réponse selon le type
      let answerText = JSON.stringify(
        item.answer.value || item.answer,
        null,
        2
      );
      if (typeof item.answer === "object") {
        // Extraire la valeur réelle de la réponse
        const key = Object.keys(item.answer).find((k) => k !== "type");
        answerText = item.answer[key] || JSON.stringify(item.answer);
      }

      // Formater comme un tableau
      if (Array.isArray(answerText)) {
        answerText = answerText.join(", ");
      }

      answerDiv.innerHTML = `
                <p class="question-text"><strong>Q${
                  index + 1
                }:</strong> ${question}</p>
                <p class="answer-content"><strong>${answerText}</strong></p>
                <small>${new Date(item.timestamp).toLocaleTimeString(
                  "fr-FR"
                )}</small>
            `;

      previousAnswersDiv.appendChild(answerDiv);
    });

    // Ajouter un séparateur
    const separator = document.createElement("hr");
    separator.className = "questions-separator";

    // Insérer au début du conteneur
    container.insertBefore(separator, container.firstChild);
    container.insertBefore(previousAnswersDiv, container.firstChild);
  }

  // Tracker le dernier état pour éviter les re-renders inutiles
  let lastRenderedState = null;

  // S'abonner aux changements d'état
  surveyService.subscribe((state) => {
    renderQuestion(state); // Mise à jour à chaque transition
  });

  // IMPORTANT : Attendre le prochain tick pour que l'état soit restauré
  setTimeout(() => {
    const currentState = surveyService.getSnapshot();
    // Afficher les réponses précédentes AVANT la question actuelle
    displayPreviousAnswers();
    renderQuestion(currentState);
    // Si des items ont été stockés en attente (LOAD_ITEMS arrivés avant que la timeline
    // ait été initialisée), les ajouter maintenant et ajuster la timeline.
    try {
      const pendingRaw = localStorage.getItem("lifestories_pending_load_items");
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        if (pending && pending.length) {
          try {
            items.add(pending);
          } catch (e) {
            console.warn("items.add pending failed", e);
          }
          try {
            window.timeline &&
              window.timeline.redraw &&
              window.timeline.redraw();
          } catch (e) {}
          try {
            window.timeline && window.timeline.fit && window.timeline.fit();
          } catch (e) {}
          localStorage.removeItem("lifestories_pending_load_items");
        }
      }
    } catch (e) {
      console.warn("Erreur en traitant les pending_load_items", e);
    }
  }, 0);

  /**
   *  Vérifie si on est sur la question actuelle (pas une modification d'historique)
   */
  function isCurrentQuestion(eventType) {
    const currentState = surveyService.getSnapshot();
    const currentValue = currentState.value;

    // Mapping complet des événements vers leurs états attendus
    const eventToStateMap = {
      // Naissance
      ANSWER_BIRTH_YEAR: "askBirthYear",
      NEXT: null, // NEXT peut venir de plusieurs états
      ANSWER_CURRENT_COMMUNE: "askCurrentCommune",
      ANSWER_DEPARTEMENT: "askDepartementOrPays",

      // Commune
      YES: null, // YES/NO peuvent venir de plusieurs états
      NO: null,
      ANSWER_MULTIPLE_COMMUNES: "askMultipleCommunes",
      ANSWER_COMMUNE_ARRIVAL_YEAR: "askCommuneArrivalYear",
      ANSWER_COMMUNE_DEPARTURE_YEAR: "askCommuneDepartureYear",

      // Logement
      ANSWER_MULTIPLE_HOUSINGS: "askMultipleHousings",
      ANSWER_HOUSING_ARRIVAL_AGE: "askHousingArrivalAge",
      ANSWER_HOUSING_DEPARTURE_AGE: "askHousingDepartureAge",
      ANSWER_HOUSING_OCCUPATION_STATUS_ENTRY: "askHousingOccupationStatusEntry",
      ANSWER_HOUSING_OCCUPATION_STATUS_EXIT: "askHousingOccupationStatusExit",
      ANSWER_STATUS_ENTRY: "askHousingOccupationStatusEntry",
      ANSWER_STATUS_EXIT: "askHousingOccupationStatusExit",

      // Épisodes
      ADD_EPISODE: "recapEpisode",
      MODIFY_EPISODE: "recapEpisode",
      CREATE_NEW_EPISODE: "recapEpisode",
    };

    const expectedState = eventToStateMap[eventType];

    // Si l'événement n'a pas de mapping strict (NEXT, YES, NO), on considère que c'est OK
    if (expectedState === null || expectedState === undefined) {
      return true;
    }

    const isCurrent = expectedState === currentValue;
    return isCurrent;
  }

  /**
   * Envoyer un événement (local + remote si WebRTC activé)
   * Protection anti-double soumission : distingue modification vs nouvelle réponse
   */
  function sendEvent(eventData, allowAdvance = true) {
    // Vérifier si on est hôte
    if (!isHost) {
      console.warn("VIEWER ne peut pas envoyer d'événements");
      return; // Bloquer l'envoi
    }

    // Protection : si c'est une modification d'historique, envoyer UPDATE_ANSWER
    if (!allowAdvance || !isCurrentQuestion(eventData.type)) {
      // Extraire la clé et la valeur de l'événement original
      const originalEvent = eventData;
      let key = null;
      let value = null;
      let updateEpisode = false;

      // Déterminer la clé selon le type d'événement
      if (originalEvent.statut_res !== undefined) {
        key = "statut_res";
        value = originalEvent.statut_res;
        updateEpisode = true;
      } else if (originalEvent.start !== undefined) {
        key = "start";
        value = originalEvent.start;
        updateEpisode = true;
      } else if (originalEvent.end !== undefined) {
        key = "end";
        value = originalEvent.end;
        updateEpisode = true;
      } else if (originalEvent.commune !== undefined) {
        key = "commune";
        value = originalEvent.commune;
      } else if (originalEvent.birthYear !== undefined) {
        key = "birthYear";
        value = originalEvent.birthYear;
      }

      // Envoyer l'événement UPDATE_ANSWER au lieu de l'événement original
      const updateEvent = {
        type: "UPDATE_ANSWER",
        key: key,
        value: value,
        updateEpisode: updateEpisode,
      };

      surveyService.send(updateEvent);

      if (syncEnabled && window.webrtcSync) {
        window.webrtcSync.sendEvent(updateEvent);
      }

      return; // Ne pas continuer avec l'événement normal
    }

    // Envoyer localement
    // IMPORTANT: capturer l'état courant AVANT d'envoyer l'événement
    // car l'envoi provoque une transition et la snapshot après envoi
    // correspondra à l'état suivant (d'où un mauvais mapping dans l'historique).
    const currentStateBefore = surveyService.getSnapshot().value;
    setTimeout;
    surveyService.send(eventData);

    // Sauvegarder la réponse dans l'historique en l'associant
    // à l'état courant AVANT la transition (question posée)
    saveAnsweredQuestion(currentStateBefore, eventData);
    if (syncEnabled && window.webrtcSync) {
      window.webrtcSync.sendEvent(eventData);
    } else {
      console.warn("WebRTC non disponible pour envoi");
    }
  }

  function renderQuestion(state) {
    // Vérifier si une question avec le même état existe déjà
    const existingQuestion = container.querySelector(`[data-state="${state.value}"]`);
    
    // Si la question existe déjà, mettre à jour uniquement le texte (pour refléter les modifications de commune)
    if (existingQuestion) {
      // Mettre à jour le texte de la question si elle contient une référence à une commune
      const questionP = existingQuestion.querySelector("p");
      if (questionP && state.context.communes) {
        const currentCommune = state.context.communes[state.context.currentCommuneIndex] || "cette commune";
        
        // Mettre à jour le texte selon le type de question
        if (state.value === "askAlwaysLivedInCommune") {
          questionP.textContent = `Avez-vous toujours vécu à ${currentCommune} ?`;
        } else if (state.value === "askSameHousingInCommune") {
          questionP.textContent = `Avez-vous toujours vécu dans le même logement à ${currentCommune} ?`;
        } else if (state.value === "askMultipleHousings") {
          questionP.textContent = `Nous allons faire la liste des logements successifs que vous avez occupés dans ${currentCommune} depuis votre arrivée.`;
        } else if (state.value === "askCommuneArrivalYear") {
          questionP.textContent = `En quelle année êtes-vous arrivé à ${currentCommune} ?`;
        } else if (state.value === "askCommuneDepartureYear") {
          questionP.textContent = `En quelle année avez-vous quitté ${currentCommune} ?`;
        }
      }
      return; // Ne pas créer de nouvelle question
    }
    
    let questionText = "";
    let responseType = "input";
    let choices = [];
    let eventType = null;
    let eventKey = "commune";

    const questionDiv = document.createElement("div");
    questionDiv.classList.add("question");
    questionDiv.dataset.state = state.value; // ← identifiant unique

    switch (state.value) {
      case "askBirthYear":
        questionText = "Quelle est votre année de naissance ?";
        responseType = "input";
        eventType = "ANSWER_BIRTH_YEAR";
        eventKey = "birthdate";
        break;

      case "birthPlaceIntro":
        questionText =
          "Où habitaient vos parents à votre naissance ? Dans quelle commune et département (France) ou pays (étranger) ?";
        responseType = "info"; // Nouveau type pour afficher un texte + bouton suivant
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
        questionText = `Avez-vous toujours vécu à ${
          state.context.communes[state.context.currentCommuneIndex]
        } ?`;
        responseType = "choice";
        choices = ["Yes", "No"];
        eventKey = "alwaysLivedInCommune"; // ← Clé spécifique pour ne pas confondre avec 'commune'
        break;

      case "askMultipleCommunes":
        questionText = `Pouvez-vous citer les communes dans lesquelles vous avez vécu ?`;
        responseType = "inputlist";
        eventType = "ANSWER_MULTIPLE_COMMUNES";
        eventKey = "communes";
        break;

      case "askCommuneArrivalYear":
        questionText = `En quelle année êtes-vous arrivé à ${
          state.context.communes[state.context.currentCommuneIndex]
        } ?`;
        responseType = "input";
        eventType = "ANSWER_COMMUNE_ARRIVAL";
        eventKey = "start";
        break;

      case "askCommuneDepartureYear":
        questionText = `En quelle année avez-vous quitté ${
          state.context.communes[state.context.currentCommuneIndex]
        } ?`;
        responseType = "input";
        eventType = "ANSWER_COMMUNE_DEPARTURE";
        eventKey = "end";
        break;

      case "askSameHousingInCommune":
        // currentCommuneIndex pointe sur la commune qu'on est en train de traiter
        const currentCommune =
          state.context.communes[state.context.currentCommuneIndex] ||
          "cette commune";
        questionText = `Avez-vous toujours vécu dans le même logement à ${currentCommune} ?`;
        responseType = "choice";
        choices = ["Yes", "No"];
        eventKey = "response"; // ← Changer la clé pour YES/NO
        break;

      case "askMultipleHousings":
        // currentCommuneIndex pointe sur la commune qu'on est en train de traiter
        const communeForHousings =
          state.context.communes[state.context.currentCommuneIndex] ||
          "cette commune";
        questionText = `Nous allons faire la liste des logements successifs que vous avez occupés dans ${communeForHousings} depuis votre arrivée.`;
        responseType = "inputlist";
        eventType = "ANSWER_MULTIPLE_HOUSINGS";
        eventKey = "logements";
        break;

      case "askHousingArrivalAge":
        questionText = `À quel âge ou en quelle année avez-vous emménagé dans le logement ${
          state.context.currentLogementIndex + 1
        } ?`;
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
        // Retiré : nextBtn.disabled = true;
      });
      questionDiv.appendChild(nextBtn);
    }

    // Gestion des réponses INPUT (ex: une commune, une année)
    else if (responseType === "input") {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Votre réponse";

      if (state.context[eventKey]) {
        input.value = state.context[eventKey];
        input.disabled = true;
      }

      const editBtn = document.createElement("button");
      editBtn.innerHTML = "✏️";
      editBtn.style.display = "none"; // caché tant que pas de réponse

      editBtn.addEventListener("click", () => {
        input.disabled = false;
        input.focus();
        input.addEventListener("keypress", (event) => {
          if (event.key === "Enter" && input.value.trim() !== "") {
            const updateEvent = {
              type: "UPDATE_ANSWER",
              key: eventKey,
              value: input.value,
              updateEpisode: ["start", "end", "statut_res"].includes(eventKey),
            };
            surveyService.send(updateEvent);

            if (eventKey === "birthdate" || eventKey === "birthYear") {
              if (window.timeline) {
                window.timeline.setOptions({
                  min: new Date(`${input.value}-01-01`),
                  start: new Date(`${input.value}-01-01`),
                });
                window.timeline.redraw();
                window.timeline.fit();
              }
            }
            input.disabled = true;
          }
        });
      });

      input.addEventListener("keypress", (event) => {
        if (event.key === "Enter" && input.value.trim() !== "" && eventType) {
          let eventData = { type: eventType };
          eventData[eventKey] = input.value;
          if (eventType === "ANSWER_BIRTH_YEAR") {
            setBirthYear(input.value);
          }
          sendEvent(eventData);
          input.disabled = true;
          editBtn.style.display = "inline-block"; // afficher le bouton après validation

          try {
            if (isHost) {
              const controls = questionDiv.querySelectorAll(
                "input, button, textarea, select"
              );
              controls.forEach((c) => {
                if (c !== editBtn) c.disabled = true; // ne pas désactiver le bouton ✏️
              });
            }
          } catch (e) {
            console.warn("Impossible de désactiver les contrôles", e);
          }
        }
      });

      questionDiv.appendChild(input);
      questionDiv.appendChild(editBtn);
    }

    // Gestion des boutons choix ("Oui", "Non")
    else if (responseType === "choice") {
      // conteneur pour afficher la réponse actuelle
      const answerSpan = document.createElement("span");
      // pr-remplir avec la valeur du contexte si elle existe
      if (state.context[eventKey]) {
        answerSpan.textContent = `Réponse actuelle : ${state.context[eventKey]}`;
      }
      // tableau pour stocker les boutons Yes/No
      const choicesButtons = [];
      // boutons yes/no
      choices.forEach((choice) => {
        const button = document.createElement("button");
        button.innerText = choice;

        button.addEventListener("click", () => {
          let eventData;
          if (state.value === "birthPlaceIntro") {
            // On envoie un événement spécifique selon le choix
            eventData = { type: choice === "France" ? "FRANCE" : "ETRANGER" };
          } else {
            // Cas classique pour les autres questions à choix
            eventData = { type: choice.toUpperCase() };
            eventData[eventKey] = choice;
          }
          sendEvent(eventData);
          answerSpan.textContent = `Réponse actuelle : ${choice}`;
          choicesButtons.forEach((btn) => (btn.disabled = true));
          editBtn.style.display = "inline-block";
        });
        questionDiv.appendChild(button);
        choicesButtons.push(button);
      });
      // Bouton édition
      const editBtn = document.createElement("button");
      editBtn.innerHTML = "✏️";
      editBtn.style.display = "none"; // caché tant qu’aucune réponse

      editBtn.addEventListener("click", () => {
        // Réactiver les boutons Yes/No pour permettre un nouveau choix
        choicesButtons.forEach((btn) => (btn.disabled = false));
        // appuyer pour UPDATE_ANSWER quand on arrive au delà de cet etat
        choicesButtons.forEach((btn) => {
          const choice = btn.innerText;
          btn.onclick = () => {
            const currentState = surveyService.getSnapshot().value;
            const questionState = state.value; // L'état de CETTE question (pas l'état actuel)
            
            // Si on est encore sur la même question, envoyer une transition normale
            if (currentState === questionState) {
              sendEvent({ type: choice.toUpperCase() });
            } else {
              // On est au-delà de cette question -> UPDATE_ANSWER sans modifier l'épisode
              // Les réponses Yes/No ne doivent JAMAIS modifier le contenu de l'épisode (qui contient le nom de la commune)
              const updateEvent = {
                type: "UPDATE_ANSWER",
                key: eventKey,
                value: choice,
                updateEpisode: false, // Ne pas modifier l'épisode de la timeline
              };
              surveyService.send(updateEvent);
              
              // Supprimer toutes les questions qui viennent APRÈS cette question
              const allQuestions = container.querySelectorAll('.question[data-state]');
              let foundCurrentQuestion = false;
              allQuestions.forEach((q) => {
                if (q.dataset.state === questionState) {
                  foundCurrentQuestion = true;
                } else if (foundCurrentQuestion) {
                  // Supprimer les questions après celle qu'on modifie
                  q.remove();
                }
              });
              
              // Afficher un message indiquant que le questionnaire doit reprendre depuis cette question
              // Pour simplifier, on force une transition vers l'état approprié
              if (questionState === "askAlwaysLivedInCommune") {
                // Envoyer la transition pour aller au bon état
                surveyService.send({ type: choice.toUpperCase() });
              } else if (questionState === "askSameHousingInCommune") {
                surveyService.send({ type: choice.toUpperCase() });
              }
            }
            answerSpan.textContent = `Réponse actuelle : ${choice}`;
            choicesButtons.forEach((b) => (b.disabled = true));
          };
        });
      });

      questionDiv.appendChild(answerSpan);
      questionDiv.appendChild(editBtn);
    }

    // Gestion des réponses avec un input et une liste
    else if (responseType === "inputlist") {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Votre réponse";

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
        responseList
          .querySelectorAll("li")
          .forEach((e) => list_communes_not_sorted.push(e.innerHTML));

        // Utiliser eventType défini dans le switch au lieu de "ANSWER_NEW_COMMUNE" codé en dur
        let eventData = { type: eventType };
        eventData[eventKey] = list_communes_not_sorted;
        sendEvent(eventData);
        // Désactiver les contrôles (inputs + boutons) pour éviter le double envoi
        try {
          if (isHost) {
            const controls = questionDiv.querySelectorAll(
              "input, button, textarea, select"
            );
            controls.forEach((c) => (c.disabled = true));
            // (global buttons left enabled) only per-question controls are disabled
          }
        } catch (e) {
          console.warn("Impossible de désactiver les contrôles", e);
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

// Gestionnaire du bouton de réinitialisation
document.addEventListener("DOMContentLoaded", () => {
  const resetButton = document.getElementById("resetButton");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      // Demander confirmation
      if (
        confirm(
          "Êtes-vous sûr de vouloir tout réinitialiser ? Toutes les données (questionnaire + timeline) seront perdues."
        )
      ) {
        // Si on est connecté en WebRTC, envoyer un message de reset à l'autre appareil
        if (window.webrtcSync && window.webrtcSync.connected) {
          window.webrtcSync.sendMessage({
            type: "RESET_ALL_DATA",
          });
        }

        // Réinitialiser localement
        import("./stateMachine.js").then((module) => {
          module.resetAllData();
        });
      }
    });
  }
});
