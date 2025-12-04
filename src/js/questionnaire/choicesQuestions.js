// Fonction pour créer les questions Yes/No et gérer leur modification

import { surveyService, navigateToState } from "../stateMachine/stateMachine.js";

export function renderYesNoQuestion(questionDiv, state, eventKey, choices = ["Yes", "No"]) {
  const questionState = state.value; // Capturer l'état au moment du rendu
  const choicesButtons = [];
  const answerSpan = document.createElement("span");
  const editBtn = document.createElement("button");
  editBtn.innerHTML = '<i data-lucide="pencil"></i>';
  editBtn.className = "edit-btn";
  editBtn.style.display = "none";

  choices.forEach((choice) => {
    const button = document.createElement("button");
    button.innerText = choice;
    button.addEventListener("click", () => {
      // On envoie simplement l’événement à la machine
      surveyService.send({ type: choice.toUpperCase() });
      answerSpan.textContent = `Réponse actuelle : ${choice}`;
      choicesButtons.forEach((btn) => (btn.disabled = true));
      editBtn.style.display = "inline-block";
    });
    questionDiv.appendChild(button);
    choicesButtons.push(button);
  });

  // Bouton édition
  editBtn.addEventListener("click", () => {
    // Réactiver les boutons pour permettre un nouveau choix
    choicesButtons.forEach((btn) => (btn.disabled = false));
    choicesButtons.forEach((btn) => {
      btn.onclick = () => {
        const choice = btn.innerText;
        const currentState = surveyService.getSnapshot().value;
        
        // Si on est encore sur la même question, envoyer une transition normale
        if (currentState === questionState) {
          surveyService.send({ type: choice.toUpperCase() });
          answerSpan.textContent = `Réponse actuelle : ${choice}`;
          choicesButtons.forEach((b) => (b.disabled = true));
          return;
        }
        
        // On est au-delà de cette question, il faut "revenir en arrière"
        const container = window._questionnaireContainer;
        const items = window._timelineItems;
        
        // 1. Supprimer toutes les questions qui viennent APRÈS cette question dans le DOM
        if (container) {
          const allQuestions = container.querySelectorAll('.question[data-state]');
          let foundCurrentQuestion = false;
          allQuestions.forEach((q) => {
            if (q.dataset.state === questionState) {
              foundCurrentQuestion = true;
              q.remove(); // Supprimer aussi cette question, elle sera re-rendue
            } else if (foundCurrentQuestion) {
              q.remove();
            }
          });
        }
        
        // 2. Nettoyer les épisodes de la timeline
        if (items) {
          if (questionState === "askAlwaysLivedInCommune") {
            const allItems = items.get();
            const itemsToRemove = allItems.filter(item => item.group === 12 || item.group === 11);
            itemsToRemove.forEach(item => items.remove(item.id));
          } else if (questionState === "askSameHousingInCommune") {
            const allItems = items.get();
            const itemsToRemove = allItems.filter(item => item.group === 11);
            itemsToRemove.forEach(item => items.remove(item.id));
          }
        }
        
        // 3. Préparer les mises à jour du contexte
        let contextUpdates = {};
        if (questionState === "askAlwaysLivedInCommune") {
          contextUpdates = {
            group: 13,
            logements: [],
            currentLogementIndex: 0
          };
        } else if (questionState === "askSameHousingInCommune") {
          contextUpdates = {
            group: 12,
            logements: [],
            currentLogementIndex: 0
          };
        }
        
        // 4. Naviguer vers l'état cible (recrée la machine)
        navigateToState(questionState, contextUpdates);
        
        // 5. Après un court délai, envoyer la nouvelle réponse
        setTimeout(() => {
          surveyService.send({ type: choice.toUpperCase() });
        }, 100);
      };
    });
  });

  questionDiv.appendChild(answerSpan);
  questionDiv.appendChild(editBtn);

  // Transformer les icônes Lucide
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}