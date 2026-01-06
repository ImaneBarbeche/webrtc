// Function to create questions with input and dynamic list (e.g., cities, accommodations)

import { handleDragStart, handleDragEnd, items } from "../timeline/timeline.js";
import { surveyService, navigateToState } from "../stateMachine/stateMachine.js";

/**
 * Creates an input field with a dynamic list where the user can add items
 * @param {HTMLElement} questionDiv - The container for the question
 * @param {object} state - The current state of the state machine
 * @param {string} eventType - The event type to send (e.g., "ANSWER_MULTIPLE_COMMUNES")
 * @param {string} eventKey - The key for the data (e.g., "communes", "logements")
 * @param {function} sendEvent - Function to send the event to the state machine
 * @param {boolean} isHost - If the user is the host (to disable controls)
 */
export function renderInputListQuestion(questionDiv, state, eventType, eventKey, sendEvent, isHost = true) {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Votre réponse";

  const responseList = document.createElement("ul");
  responseList.id = `ulgroup_${state.context.group}`;

  // Edit button (hidden by default)
  const editBtn = document.createElement("button");
  editBtn.innerHTML = '<i data-lucide="pencil"></i>';
  editBtn.className = "edit-btn";
  editBtn.style.display = "none";
  editBtn.dataset.editing = "false"; // Explicitly initialize

  // Add an item to the list when Enter is pressed
  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && input.value.trim() !== "") {
      addListItem(responseList, input.value.trim(), false); // false = non-edit mode
      input.value = ""; // Clear after adding
    }
  });

  questionDiv.appendChild(input);
  questionDiv.appendChild(responseList);

  // Button to go to the next question
  const nextQBtn = document.createElement("button");
  nextQBtn.innerHTML = "Suivant";

  nextQBtn.addEventListener("click", () => {
    // Get all items in the list (text only, not buttons)
    const listItems = getListItems(responseList);

    // Create and send the event
    const eventData = { type: eventType };
    eventData[eventKey] = listItems;
    sendEvent(eventData);

    // Disable controls to prevent double submission
    if (isHost) {
      disableQuestionControls(questionDiv, editBtn);
      editBtn.style.display = "inline-block"; // Show the edit button
    }
  });

  // Edit button management
  editBtn.addEventListener("click", () => {
    const isEditing = editBtn.dataset.editing === "true";
    
    if (isEditing) {
      // Finish editing - save changes
      const listItems = getListItems(responseList);

      // If this is a list of cities, clean up and restart the flow
      if (eventKey === "communes") {
        // Remove all following questions in the DOM
        cleanupFollowingQuestions(questionDiv);

        // Also clean up the answer history in localStorage
        cleanupAnsweredQuestionsAfterCommunes();

        // Clean up timeline episodes (keep the first = birth city)
        const allItems = items.get();
        const communeEpisodes = allItems.filter(item => item.group === 13);
        // Remove all cities except the first (birth)
        if (communeEpisodes.length > 1) {
          communeEpisodes.slice(1).forEach(ep => items.remove(ep.id));
        }
        // Remove all accommodations and statuses
        allItems.filter(item => item.group === 12 || item.group === 11)
          .forEach(ep => items.remove(ep.id));

        // Preserve the birth city (first city in context)
        const currentContext = surveyService.getSnapshot().context;
        const birthCommune = currentContext.communes[0]; // e.g., Lyon
        const allCommunes = [birthCommune, ...listItems]; // [Lyon, London, Nantes]

        // Navigate to the state for placing the next city on the timeline with the new context
        // IMPORTANT: Start at index 1 to skip the birth city (no dates to ask)
        navigateToState("placeNextCommuneOnTimeline", {
          communes: allCommunes,
          currentCommuneIndex: 1, // Start at the first city AFTER birth
          logements: [],
          currentLogementIndex: 0,
          group: 13
        });

        // Disable controls
        setEditMode(responseList, input, nextQBtn, false);
        editBtn.innerHTML = '<i data-lucide="pencil"></i>';
        editBtn.dataset.editing = "false";

        // Update Lucide icons
        if (window.lucide && typeof window.lucide.createIcons === "function") {
          window.lucide.createIcons();
        }
        return;
      }

      // For other lists (e.g., accommodations), just update the context
      sendEvent({
        type: "UPDATE_ANSWER",
        key: eventKey,
        value: listItems,
        updateEpisode: false
      });

      // Disable controls and hide delete buttons
      setEditMode(responseList, input, nextQBtn, false);
      editBtn.innerHTML = '<i data-lucide="pencil"></i>';
      editBtn.dataset.editing = "false";

      // Update Lucide icons
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    } else {
      // Enable editing
      setEditMode(responseList, input, nextQBtn, true);
      editBtn.innerHTML = '<i data-lucide="check"></i>';
      editBtn.dataset.editing = "true";

      // Update Lucide icons
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    }
  });

  questionDiv.appendChild(nextQBtn);
  questionDiv.appendChild(editBtn);

  // Update Lucide icons
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

/**
 * Gets the text of the list items (without the buttons)
 * @param {HTMLElement} list - The UL element
 * @returns {string[]} - Array of text values
 */
function getListItems(list) {
  const items = [];
  list.querySelectorAll("li").forEach((li) => {
    // Get only the text, not the button content
    const textSpan = li.querySelector(".item-text");
    if (textSpan) {
      items.push(textSpan.textContent);
    } else {
      // Fallback if no span (old format)
      items.push(li.firstChild?.textContent || li.textContent);
    }
  });
  return items;
}

/**
 * Adds an item to the list with drag & drop and a delete button
 * @param {HTMLElement} list - The UL element
 * @param {string} text - The item's text
 * @param {boolean} editMode - If true, shows the delete button
 */
function addListItem(list, text, editMode = false) {
  const listItem = document.createElement("li");
  listItem.classList.add("item");
  listItem.draggable = true;
  listItem.addEventListener("dragstart", handleDragStart);
  listItem.addEventListener("dragend", handleDragEnd);
  
  // Span for the text (allows separation from the button)
  const textSpan = document.createElement("span");
  textSpan.className = "item-text";
  textSpan.textContent = text;
  listItem.appendChild(textSpan);
  
  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = '<i data-lucide="x"></i>';
  deleteBtn.className = "delete-item-btn";
  deleteBtn.type = "button"; // Prevent submit behavior
  deleteBtn.style.display = editMode ? "inline-block" : "none";
  deleteBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    listItem.remove();
  });
  listItem.appendChild(deleteBtn);
  
  list.appendChild(listItem);
  
  // Update Lucide icons
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

/**
 * Enables or disables edit mode
 * @param {HTMLElement} list - The UL element
 * @param {HTMLElement} input - The input field
 * @param {HTMLElement} nextBtn - The next button
 * @param {boolean} enable - true to enable, false to disable
 */
function setEditMode(list, input, nextBtn, enable) {
  // Enable/disable the input
  input.disabled = !enable;
  nextBtn.disabled = !enable;
  
  // Show/hide delete buttons
  list.querySelectorAll(".delete-item-btn").forEach((btn) => {
    btn.style.display = enable ? "inline-block" : "none";
  });
  
  // In edit mode, allow adding new items
  if (enable) {
    input.focus();
    
    // Ensure the add listener works
    const existingListener = input._editKeyListener;
    if (existingListener) {
      input.removeEventListener("keypress", existingListener);
    }
    
    const keyListener = (event) => {
      if (event.key === "Enter" && input.value.trim() !== "") {
        addListItem(list, input.value.trim(), true); // true = edit mode
        input.value = "";
      }
    };
    input._editKeyListener = keyListener;
    input.addEventListener("keypress", keyListener);
  }
}

/**
 * Disables all controls of a question except the edit button and delete buttons
 * @param {HTMLElement} questionDiv - The question container
 * @param {HTMLElement} editBtn - The edit button not to disable
 */
function disableQuestionControls(questionDiv, editBtn) {
  try {
    const controls = questionDiv.querySelectorAll("input, button, textarea, select");
    controls.forEach((c) => {
      // Do not disable the edit button or delete buttons
      if (c !== editBtn && !c.classList.contains("delete-item-btn")) {
        c.disabled = true;
      }
    });
  } catch (e) {
    console.warn("Impossible de désactiver les contrôles", e);
  }
}

/**
 * Removes all questions that follow this one in the DOM
 * Used when editing a list (cities, accommodations) to avoid inconsistencies
 * @param {HTMLElement} currentQuestionDiv - The current question
 */
function cleanupFollowingQuestions(currentQuestionDiv) {
  const container = currentQuestionDiv.parentElement;
  if (!container) return;

  let foundCurrent = false;
  const questionsToRemove = [];

  // Go through all questions and mark those to remove
  container.querySelectorAll('.question[data-state]').forEach((q) => {
    if (q === currentQuestionDiv) {
      foundCurrent = true;
    } else if (foundCurrent) {
      questionsToRemove.push(q);
    }
  });

  // Remove the marked questions
  questionsToRemove.forEach((q) => q.remove());
}

/**
 * Cleans up the answer history in localStorage after the multiple cities question
 * This prevents displayPreviousAnswers from showing obsolete questions
 */
function cleanupAnsweredQuestionsAfterCommunes() {
  try {
    const answeredRaw = localStorage.getItem('lifestories_answered_questions');
    if (!answeredRaw) return;
    
    const answered = JSON.parse(answeredRaw);
    
    // States to keep (before and including askMultipleCommunes)
    const statesToKeep = [
      'askBirthYear',
      'birthPlaceIntro', 
      'askCurrentCommune',
      'askDepartementOrPays',
      'askAlwaysLivedInCommune',
      'askMultipleCommunes'
    ];
    
    // Filter to keep only answers before/including multiple cities
    const filteredAnswers = answered.filter(item => 
      statesToKeep.includes(item.state)
    );
    
    localStorage.setItem('lifestories_answered_questions', JSON.stringify(filteredAnswers));
  } catch (e) {
    console.warn('Erreur lors du nettoyage de l\'historique:', e);
  }
}
