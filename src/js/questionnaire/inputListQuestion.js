// Fonction pour créer les questions avec input et liste (ex: communes, logements)

import { handleDragStart, handleDragEnd, items } from "../timeline/timeline.js";
import { surveyService, navigateToState } from "../stateMachine/stateMachine.js";

/**
 * Crée un champ input avec une liste dynamique où l'utilisateur peut ajouter des éléments
 * @param {HTMLElement} questionDiv - Le conteneur de la question
 * @param {object} state - L'état actuel de la machine
 * @param {string} eventType - Le type d'événement à envoyer (ex: "ANSWER_MULTIPLE_COMMUNES")
 * @param {string} eventKey - La clé pour les données (ex: "communes", "logements")
 * @param {function} sendEvent - Fonction pour envoyer l'événement à la machine
 * @param {boolean} isHost - Si l'utilisateur est l'hôte (pour désactiver les contrôles)
 */
export function renderInputListQuestion(questionDiv, state, eventType, eventKey, sendEvent, isHost = true) {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Votre réponse";

  const responseList = document.createElement("ul");
  responseList.id = `ulgroup_${state.context.group}`;

  // Bouton d'édition (caché au départ)
  const editBtn = document.createElement("button");
  editBtn.innerHTML = '<i data-lucide="pencil"></i>';
  editBtn.className = "edit-btn";
  editBtn.style.display = "none";
  editBtn.dataset.editing = "false"; // Initialiser explicitement

  // Ajouter un élément à la liste quand on appuie sur Entrée
  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && input.value.trim() !== "") {
      addListItem(responseList, input.value.trim(), false); // false = mode non-édition
      input.value = ""; // Effacer après ajout
    }
  });

  questionDiv.appendChild(input);
  questionDiv.appendChild(responseList);

  // Bouton pour passer à la question suivante
  const nextQBtn = document.createElement("button");
  nextQBtn.innerHTML = "Suivant";

  nextQBtn.addEventListener("click", () => {
    // Récupérer tous les éléments de la liste (texte seulement, pas les boutons)
    const listItems = getListItems(responseList);

    // Créer et envoyer l'événement
    const eventData = { type: eventType };
    eventData[eventKey] = listItems;
    sendEvent(eventData);

    // Désactiver les contrôles pour éviter le double envoi
    if (isHost) {
      disableQuestionControls(questionDiv, editBtn);
      editBtn.style.display = "inline-block"; // Afficher le bouton d'édition
    }
  });

  // Gestion du bouton d'édition
  editBtn.addEventListener("click", () => {
    const isEditing = editBtn.dataset.editing === "true";
    
    if (isEditing) {
      // Terminer l'édition - sauvegarder les modifications
      const listItems = getListItems(responseList);
      
      // Si c'est une liste de communes, nettoyer et redémarrer le flux
      if (eventKey === "communes") {
        // Supprimer les questions suivantes dans le DOM
        cleanupFollowingQuestions(questionDiv);
        
        // Nettoyer aussi l'historique des réponses dans localStorage
        cleanupAnsweredQuestionsAfterCommunes();
        
        // Nettoyer les épisodes de la timeline (garder le premier = commune de naissance)
        const allItems = items.get();
        const communeEpisodes = allItems.filter(item => item.group === 13);
        // Supprimer toutes les communes sauf la première (naissance)
        if (communeEpisodes.length > 1) {
          communeEpisodes.slice(1).forEach(ep => items.remove(ep.id));
        }
        // Supprimer tous les logements et statuts
        allItems.filter(item => item.group === 12 || item.group === 11)
          .forEach(ep => items.remove(ep.id));
        
        // Préserver la commune de naissance (première commune du contexte)
        const currentContext = surveyService.getSnapshot().context;
        const birthCommune = currentContext.communes[0]; // Lyon
        const allCommunes = [birthCommune, ...listItems]; // [Lyon, Londres, Nantes]
        
        
        // Naviguer vers l'état de placement des communes avec le nouveau contexte
        // IMPORTANT: Commencer à l'index 1 pour sauter la commune de naissance (pas de dates à demander)
        navigateToState("placeNextCommuneOnTimeline", {
          communes: allCommunes,
          currentCommuneIndex: 1, // Commencer à la première commune APRÈS la naissance
          logements: [],
          currentLogementIndex: 0,
          group: 13
        });
        
        // Désactiver les contrôles
        setEditMode(responseList, input, nextQBtn, false);
        editBtn.innerHTML = '<i data-lucide="pencil"></i>';
        editBtn.dataset.editing = "false";
        
        // Transformer les icônes Lucide
        if (window.lucide && typeof window.lucide.createIcons === "function") {
          window.lucide.createIcons();
        }
        return;
      }
      
      // Pour les autres listes (logements), juste mettre à jour le contexte
      surveyService.send({
        type: "UPDATE_ANSWER",
        key: eventKey,
        value: listItems,
        updateEpisode: false
      });
      
      // Désactiver les contrôles et cacher les boutons de suppression
      setEditMode(responseList, input, nextQBtn, false);
      editBtn.innerHTML = '<i data-lucide="pencil"></i>';
      editBtn.dataset.editing = "false";
      
      // Transformer les icônes Lucide
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    } else {
      // Activer l'édition
      setEditMode(responseList, input, nextQBtn, true);
      editBtn.innerHTML = '<i data-lucide="check"></i>';
      editBtn.dataset.editing = "true";
      
      // Transformer les icônes Lucide
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    }
  });

  questionDiv.appendChild(nextQBtn);
  questionDiv.appendChild(editBtn);

  // Transformer les icônes Lucide
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

/**
 * Récupère les textes des éléments de la liste (sans les boutons)
 * @param {HTMLElement} list - L'élément UL
 * @returns {string[]} - Tableau des textes
 */
function getListItems(list) {
  const items = [];
  list.querySelectorAll("li").forEach((li) => {
    // Récupérer uniquement le texte, pas le contenu des boutons
    const textSpan = li.querySelector(".item-text");
    if (textSpan) {
      items.push(textSpan.textContent);
    } else {
      // Fallback si pas de span (ancien format)
      items.push(li.firstChild?.textContent || li.textContent);
    }
  });
  return items;
}

/**
 * Ajoute un élément à la liste avec drag & drop et bouton de suppression
 * @param {HTMLElement} list - L'élément UL
 * @param {string} text - Le texte de l'élément
 * @param {boolean} editMode - Si true, affiche le bouton de suppression
 */
function addListItem(list, text, editMode = false) {
  const listItem = document.createElement("li");
  listItem.classList.add("item");
  listItem.draggable = true;
  listItem.addEventListener("dragstart", handleDragStart);
  listItem.addEventListener("dragend", handleDragEnd);
  
  // Span pour le texte (permet de séparer du bouton)
  const textSpan = document.createElement("span");
  textSpan.className = "item-text";
  textSpan.textContent = text;
  listItem.appendChild(textSpan);
  
  // Bouton de suppression
  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = '<i data-lucide="x"></i>';
  deleteBtn.className = "delete-item-btn";
  deleteBtn.type = "button"; // Éviter le comportement submit
  deleteBtn.style.display = editMode ? "inline-block" : "none";
  deleteBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    listItem.remove();
  });
  listItem.appendChild(deleteBtn);
  
  list.appendChild(listItem);
  
  // Transformer les icônes Lucide
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

/**
 * Active ou désactive le mode édition
 * @param {HTMLElement} list - L'élément UL
 * @param {HTMLElement} input - Le champ input
 * @param {HTMLElement} nextBtn - Le bouton suivant
 * @param {boolean} enable - true pour activer, false pour désactiver
 */
function setEditMode(list, input, nextBtn, enable) {
  // Activer/désactiver l'input
  input.disabled = !enable;
  nextBtn.disabled = !enable;
  
  // Afficher/cacher les boutons de suppression
  list.querySelectorAll(".delete-item-btn").forEach((btn) => {
    btn.style.display = enable ? "inline-block" : "none";
  });
  
  // En mode édition, permettre d'ajouter de nouveaux éléments
  if (enable) {
    input.focus();
    
    // S'assurer que le listener pour ajouter fonctionne
    const existingListener = input._editKeyListener;
    if (existingListener) {
      input.removeEventListener("keypress", existingListener);
    }
    
    const keyListener = (event) => {
      if (event.key === "Enter" && input.value.trim() !== "") {
        addListItem(list, input.value.trim(), true); // true = mode édition
        input.value = "";
      }
    };
    input._editKeyListener = keyListener;
    input.addEventListener("keypress", keyListener);
  }
}

/**
 * Désactive tous les contrôles d'une question sauf le bouton d'édition et les boutons de suppression
 * @param {HTMLElement} questionDiv - Le conteneur de la question
 * @param {HTMLElement} editBtn - Le bouton d'édition à ne pas désactiver
 */
function disableQuestionControls(questionDiv, editBtn) {
  try {
    const controls = questionDiv.querySelectorAll("input, button, textarea, select");
    controls.forEach((c) => {
      // Ne pas désactiver le bouton d'édition ni les boutons de suppression
      if (c !== editBtn && !c.classList.contains("delete-item-btn")) {
        c.disabled = true;
      }
    });
  } catch (e) {
    console.warn("Impossible de désactiver les contrôles", e);
  }
}

/**
 * Supprime toutes les questions qui suivent celle-ci dans le DOM
 * Utilisé quand on modifie une liste (communes, logements) pour éviter les incohérences
 * @param {HTMLElement} currentQuestionDiv - La question actuelle
 */
function cleanupFollowingQuestions(currentQuestionDiv) {
  const container = currentQuestionDiv.parentElement;
  if (!container) return;

  let foundCurrent = false;
  const questionsToRemove = [];

  // Parcourir toutes les questions et marquer celles à supprimer
  container.querySelectorAll('.question[data-state]').forEach((q) => {
    if (q === currentQuestionDiv) {
      foundCurrent = true;
    } else if (foundCurrent) {
      questionsToRemove.push(q);
    }
  });

  // Supprimer les questions marquées
  questionsToRemove.forEach((q) => q.remove());
}

/**
 * Nettoie l'historique des réponses dans localStorage après la question des communes multiples
 * Cela évite que displayPreviousAnswers réaffiche des questions obsolètes
 */
function cleanupAnsweredQuestionsAfterCommunes() {
  try {
    const answeredRaw = localStorage.getItem('lifestories_answered_questions');
    if (!answeredRaw) return;
    
    const answered = JSON.parse(answeredRaw);
    
    // États à conserver (avant et incluant askMultipleCommunes)
    const statesToKeep = [
      'askBirthYear',
      'birthPlaceIntro', 
      'askCurrentCommune',
      'askDepartementOrPays',
      'askAlwaysLivedInCommune',
      'askMultipleCommunes'
    ];
    
    // Filtrer pour ne garder que les réponses avant/incluant les communes multiples
    const filteredAnswers = answered.filter(item => 
      statesToKeep.includes(item.state)
    );
    
    localStorage.setItem('lifestories_answered_questions', JSON.stringify(filteredAnswers));
  } catch (e) {
    console.warn('Erreur lors du nettoyage de l\'historique:', e);
  }
}
