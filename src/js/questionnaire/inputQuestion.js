// Function to create questions with a simple input (e.g., city, year, status)
import { setBirthYear } from "../timeline/birthYear.js";
import { sendEvent } from "./eventHandlers.js";
import { saveAnsweredQuestion } from "../stateMachine/persistence.js";

/**
 * Creates a simple input field with edit management
 * @param {HTMLElement} questionDiv - The question container
 * @param {object} state - The current state of the state machine
 * @param {string} eventType - The event type to send (e.g., "ANSWER_BIRTH_YEAR")
 * @param {string} eventKey - The key for the data (e.g., "birthdate", "commune", "start")
 * @param {function} sendEvent - Function to send the event to the state machine
 * @param {boolean} isHost - If the user is the host (to disable controls)
 */
export function renderInputQuestion(
  questionDiv,
  state,
  eventType,
  eventKey,
  sendEvent,
  isHost = true
) {
  const input = document.createElement("input");
  input.className = "question-input";
  // Determine if the question is about time (years, months, day, hour)
  const qText = questionDiv.querySelector("p")?.textContent || "";
  const isTimeQuestion = /ann(e|ée)|année|âge|age|date|jour|naiss|né|née|heure|h:/i.test(qText);

  if (isTimeQuestion) {
    // Use a number input for year (simple YYYY entry)
    input.type = "number";
    input.placeholder = "YYYY";
    input.min = 1800;
    input.max = new Date().getFullYear();
  } else {
    input.type = "text";
    input.placeholder = "Votre réponse";
  }

  // If a value already exists in the context, pre-fill and disable
  if (state.context[eventKey]) {
    const stored = state.context[eventKey];
    try {
      if (input.type === "number") {
        // Normalize stored values to a year number when possible
        if (typeof stored === "number") {
          input.value = stored;
        } else if (stored instanceof Date) {
          input.value = stored.getFullYear();
        } else {
          // Try extracting a year from string values using helper if available
          const maybeYear =
            typeof extractYearFromDateString === "function"
              ? extractYearFromDateString(String(stored))
              : null;
          input.value = maybeYear === null ? String(stored) : maybeYear;
        }
      } else {
        input.value = stored;
      }
    } catch (e) {
      input.value = state.context[eventKey];
    }
    input.disabled = true;
  }

  const editBtn = document.createElement("button");
  editBtn.innerHTML = '<i data-lucide="pencil"></i>';
  editBtn.className = "edit-btn";
  editBtn.style.display = "none"; // hidden until there is an answer

  // Edit button management
  editBtn.addEventListener("click", () => {
    input.disabled = false;
    input.focus();

    // Listener to validate the modification with Enter
    function onEditKey(event) {
      if (event.key === "Enter" && String(input.value).trim() !== "") {
        handleEditUpdate(input, eventKey);
        input.disabled = true;
        cleanupEditListeners();
      }
    }

    function onEditChange() {
      if (String(input.value).trim() !== "") {
        handleEditUpdate(input, eventKey);
        input.disabled = true;
        cleanupEditListeners();
      }
    }

    function cleanupEditListeners() {
      input.removeEventListener("keypress", onEditKey);
      input.removeEventListener("change", onEditChange);
    }

    input.addEventListener("keypress", onEditKey);
    input.addEventListener("change", onEditChange);
  });

  // Listener for the first answer (Enter) and for changes (date picker)
  function submitAnswer(value) {
    if (!eventType) return;
    const eventData = { type: eventType };
    // Normalize selected dates: send only the year to preserve existing logic
    if (input.type === "number") {
      const num = Number(value);
      eventData[eventKey] = isNaN(num) ? value : num;
    } else {
      eventData[eventKey] = value;
    }
    sendEvent(eventData);
    input.disabled = true;
    editBtn.style.display = "inline-block";
    if (isHost) disableQuestionControls(questionDiv, editBtn);
  }

  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && String(input.value).trim() !== "") {
      let val = input.value;
      if (input.type === "number") val = Number(val);
      submitAnswer(val);
    }
  });
  // No special change handler required for numeric year input; Enter will submit.

  questionDiv.appendChild(input);
  questionDiv.appendChild(editBtn);

  // Update Lucide icons
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

/**
 * Handles updating an existing answer
 * @param {HTMLInputElement} input - The input field
 * @param {string} eventKey - The key for the data
 */
function handleEditUpdate(input, eventKey) {
  // Normalize the value for `date` inputs: send only the year
  let outVal = input.value;
  if (input.type === 'number') {
    const rawYear = String(input.value).trim();
    const y = Number(rawYear);
    if (["start","end","statut_res"].includes(eventKey)) {
      const dateObj = new Date(`${y}-01-01`);
      outVal = dateObj;
    } else {
      outVal = isNaN(y) ? rawYear : y;
    }
  }

  const updateEvent = {
    type: "UPDATE_ANSWER",
    key: eventKey,
    value: outVal,
    updateEpisode: ["start", "end", "statut_res"].includes(eventKey),
  };
  sendEvent(updateEvent);
  // Save the modified answer
  saveAnsweredQuestion(eventKey, updateEvent);

  // Special case for birth year - update the timeline
  if (eventKey === "birthdate" || eventKey === "birthYear") {
    // Update the fixed display (use the normalized value)
    setBirthYear(outVal);

    if (window.timeline) {
      const birthYear = Number(outVal);
      const nowYear = new Date().getFullYear();
      const birthDate = new Date(birthYear, 0, 1);

      // Update the black vertical bar
      window.timeline.setCustomTime(birthDate, "custom-bar");
      window.timeline.setCustomTimeTitle(birthYear, "custom-bar");

      window.timeline.setCustomTime(
        new Date(`${birthYear}-01-01`),
        "birth-year-bar"
      );
      window.timeline.setCustomTimeTitle(birthYear, "birth-year-bar");

      window.timeline.setOptions({
        min: new Date(birthYear - 4, 0, 1),
        start: new Date(birthYear - 4, 0, 1),
        format: {
          minorLabels: function (date, scale, step) {
            if (scale === "year") {
              const currentYear = new Date(date).getFullYear();
              const age = currentYear - birthYear;

              // Toujours afficher l'année
              let label = `<b>${currentYear}</b>`;

              // Ajouter l'âge seulement si cohérent
              if (currentYear >= birthYear && currentYear <= nowYear) {
                label += `<br><span class="year-age">${age} ${
                  age > 1 ? "ans" : "an"
                }</span>`;
              }

              return label;
            }
            // Map vis-timeline scale names to moment format tokens
            // Avoid passing the raw `scale` string to moment.format
            let fmt;
            switch (scale) {
              case "millisecond":
                fmt = "SSS";
                break;
              case "second":
                fmt = "s";
                break;
              case "minute":
              case "hour":
                fmt = "HH:mm";
                break;
              case "weekday":
                fmt = "ddd D";
                break;
              case "day":
                fmt = "D";
                break;
              case "week":
                fmt = "w";
                break;
              case "month":
                fmt = "MMM";
                break;
              case "year":
                fmt = "YYYY";
                break;
              default:
                fmt = "D";
            }

            return vis.moment(date).format(fmt);
          },
        },
      });

      // Force a redraw to apply the new logic
      window.timeline.redraw();
      window.timeline.fit();
    }
  }
}

/**
 * Disables all controls of a question except the edit button
 * @param {HTMLElement} questionDiv - The question container
 * @param {HTMLElement} editBtn - The edit button not to disable
 */
function disableQuestionControls(questionDiv, editBtn) {
  try {
    const controls = questionDiv.querySelectorAll(
      "input, button, textarea, select"
    );
    controls.forEach((c) => {
      if (c !== editBtn) c.disabled = true; // do not disable the ✏️ button
    });
  } catch (e) {
    console.warn("Unable to disable controls", e);
  }
}