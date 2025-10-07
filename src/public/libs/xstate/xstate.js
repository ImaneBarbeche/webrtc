// XState Fallback - Simple state machine implementation
export function createMachine(config, options) {
  console.log("XState fallback: Creating machine:", config.id);
  return {
    id: config.id || "machine",
    initial: config.initial || "idle",
    states: config.states || {},
    context: config.context || {},
    config: {
      ...config,
      actions: options?.actions || {},
      guards: options?.guards || {}
    },
  };
}

export function interpret(machine) {
  let currentState = machine.initial || "idle";
  let currentContext = { ...machine.context } || {};
  let subscribers = [];

  console.log(
    "XState fallback: Interpreting machine with initial state:",
    currentState
  );

  const service = {
    machine: machine,

    start: function () {
      console.log("XState fallback: Service started");
      return this;
    },

    send: function (event) {
      console.log("XState fallback: Event sent:", event);

      // Handle event and state transitions
      const eventType = typeof event === "string" ? event : event.type;
      const eventData = typeof event === "object" ? event : {};

      // Check if current state has this event handler
      const currentStateConfig = machine.states[currentState];
      if (
        currentStateConfig &&
        currentStateConfig.on &&
        currentStateConfig.on[eventType]
      ) {
        let transition = currentStateConfig.on[eventType];

        // 🆕 GESTION DES TABLEAUX DE TRANSITIONS AVEC GUARDS
        if (Array.isArray(transition)) {
          console.log(
            "XState fallback: Multiple transitions detected, checking guards..."
          );

          // Trouver la première transition dont le guard passe (ou sans guard)
          let selectedTransition = null;

          for (let i = 0; i < transition.length; i++) {
            const t = transition[i];

            // Si pas de guard, on la prend
            if (!t.guard) {
              console.log("XState fallback: No guard, selecting transition", i);
              selectedTransition = t;
              break;
            }

            // Si guard défini, le tester
            const guardName = t.guard;
            const guardFn =
              machine.config.guards && machine.config.guards[guardName];

            if (guardFn) {
              const guardResult = guardFn({
                context: currentContext,
                event: eventData,
              });
              console.log(
                `XState fallback: Guard "${guardName}" = ${guardResult}`
              );

              if (guardResult) {
                selectedTransition = t;
                break;
              }
            } else {
              console.warn(
                `XState fallback: Guard "${guardName}" not found in config.guards`
              );
            }
          }

          if (selectedTransition) {
            transition = selectedTransition;
            console.log("XState fallback: Selected transition:", transition);
          } else {
            console.warn("XState fallback: No transition matched");
            return this;
          }
        }

        // Execute actions if any
        if (transition.actions && machine.config.actions) {
          const actionsList = Array.isArray(transition.actions)
            ? transition.actions
            : [transition.actions];
          console.log("XState fallback: Executing actions:", actionsList);

          actionsList.forEach((actionItem) => {
            // Gérer les actions avec params (objets)
            let actionName = actionItem;
            let actionParams = null;

            if (typeof actionItem === 'object' && actionItem.type) {
              actionName = actionItem.type;
              actionParams = actionItem.params;
            }

            const actionFn = machine.config.actions[actionName];
            
            if (actionFn) {
              console.log("XState fallback: Executing action:", actionName, actionParams);
              try {
                // Vérifier si c'est une fonction assign() ou une action normale
                if (typeof actionFn === 'function') {
                  const result = actionFn(
                    {
                      context: currentContext,
                      event: eventData,
                    },
                    actionParams
                  );
                  
                  // Si l'action retourne un objet (assign), mettre à jour le context
                  if (result && typeof result === 'object') {
                    // Les valeurs de result peuvent être des fonctions (assign)
                    // Il faut les appeler pour obtenir les vraies valeurs
                    const updatedContext = {};
                    for (const key in result) {
                      if (typeof result[key] === 'function') {
                        // C'est une fonction assign, l'appeler
                        updatedContext[key] = result[key]({
                          context: currentContext,
                          event: eventData
                        }, actionParams);
                      } else {
                        // C'est une valeur directe
                        updatedContext[key] = result[key];
                      }
                    }
                    currentContext = { ...currentContext, ...updatedContext };
                    console.log("XState fallback: Context updated:", currentContext);
                  }
                } else {
                  // Action simple sans retour
                  actionFn({
                    context: currentContext,
                    event: eventData,
                  });
                }
              } catch (error) {
                console.error(
                  "XState fallback: Action execution error:",
                  error
                );
              }
            }
          });
        }

        // Transition to target state
        if (transition.target) {
          currentState = transition.target;
          console.log("XState fallback: Transitioned to:", currentState);
          
          // 🆕 Après transition, vérifier les transitions automatiques (always)
          this.checkAlwaysTransitions();
        }

        // Update context with event data
        if (eventData) {
          currentContext = { ...currentContext, ...eventData };
        }
      }

      // Trigger subscribers with new state
      const snapshot = this.getSnapshot();
      subscribers.forEach((callback) => callback(snapshot));
      return this;
    },

    checkAlwaysTransitions: function () {
      const currentStateConfig = machine.states[currentState];
      
      // Vérifier si l'état actuel a des transitions "always"
      if (!currentStateConfig || !currentStateConfig.always) {
        return;
      }

      console.log("XState fallback: Checking always transitions for state:", currentState);

      const alwaysTransitions = Array.isArray(currentStateConfig.always)
        ? currentStateConfig.always
        : [currentStateConfig.always];

      // Trouver la première transition always dont le guard passe
      for (let i = 0; i < alwaysTransitions.length; i++) {
        const transition = alwaysTransitions[i];

        // Vérifier le guard si présent
        let shouldTransition = true;
        if (transition.guard) {
          const guardFn = machine.config.guards && machine.config.guards[transition.guard];
          if (guardFn) {
            shouldTransition = guardFn({ context: currentContext, event: {} });
            console.log(`XState fallback: Always guard "${transition.guard}" = ${shouldTransition}`);
          } else {
            console.warn(`XState fallback: Guard "${transition.guard}" not found`);
            shouldTransition = false;
          }
        }

        if (shouldTransition) {
          console.log("XState fallback: Executing always transition:", transition);

          // Exécuter les actions
          if (transition.actions && machine.config.actions) {
            const actionsList = Array.isArray(transition.actions)
              ? transition.actions
              : [transition.actions];

            actionsList.forEach((actionName) => {
              const actionFn = machine.config.actions[actionName];
              if (actionFn) {
                console.log("XState fallback: Executing always action:", actionName);
                try {
                  const result = actionFn({ context: currentContext, event: {} });
                  if (result && typeof result === 'object') {
                    const updatedContext = {};
                    for (const key in result) {
                      if (typeof result[key] === 'function') {
                        updatedContext[key] = result[key]({ context: currentContext, event: {} });
                      } else {
                        updatedContext[key] = result[key];
                      }
                    }
                    currentContext = { ...currentContext, ...updatedContext };
                  }
                } catch (error) {
                  console.error("XState fallback: Always action error:", error);
                }
              }
            });
          }

          // Transition vers le target
          if (transition.target) {
            currentState = transition.target;
            console.log("XState fallback: Always transitioned to:", currentState);

            // Notifier les subscribers
            const snapshot = this.getSnapshot();
            subscribers.forEach((callback) => callback(snapshot));

            // Vérifier récursivement si le nouvel état a aussi des always
            this.checkAlwaysTransitions();
          }

          break; // On prend seulement la première transition qui passe
        }
      }
    },

    getSnapshot: function () {
      return {
        value: currentState,
        context: currentContext,
        done: false,
        event: null,
        historyValue: {},
        matches: function (state) {
          return currentState === state;
        },
        can: function (event) {
          return true;
        },
      };
    },

    onTransition: function (callback) {
      subscribers.push(callback);
      return this;
    },

    subscribe: function (callback) {
      subscribers.push(callback);
      // Call immediately with current state
      callback(this.getSnapshot());

      return {
        unsubscribe: function () {
          const index = subscribers.indexOf(callback);
          if (index > -1) {
            subscribers.splice(index, 1);
          }
        },
      };
    },
  };

  return service;
}

export function assign(updater) {
  return function (context, event) {
    if (typeof updater === "function") {
      return updater(context, event);
    }
    return { ...context, ...updater };
  };
}

// Global fallback
window.XState = { createMachine, interpret, assign };
