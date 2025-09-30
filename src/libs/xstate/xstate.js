// XState Fallback - Simple state machine implementation
export function createMachine(config) {
    console.log('XState fallback: Creating machine:', config.id);
    return {
        id: config.id || 'machine',
        initial: config.initial || 'idle',
        states: config.states || {},
        context: config.context || {},
        config: config
    };
}

export function interpret(machine) {
    let currentState = machine.initial || 'idle';
    let currentContext = { ...machine.context } || {};
    let subscribers = [];
    
    console.log('XState fallback: Interpreting machine with initial state:', currentState);
    
    const service = {
        machine: machine,
        
        start: function() { 
            console.log('XState fallback: Service started');
            return this; 
        },
        
        send: function(event) {
            console.log('XState fallback: Event sent:', event);
            
            // Handle event and state transitions
            const eventType = typeof event === 'string' ? event : event.type;
            const eventData = typeof event === 'object' ? event : {};
            
            // Check if current state has this event handler
            const currentStateConfig = machine.states[currentState];
            if (currentStateConfig && currentStateConfig.on && currentStateConfig.on[eventType]) {
                const transition = currentStateConfig.on[eventType];
                
                // Execute actions if any
                if (transition.actions && machine.config.actions) {
                    console.log('XState fallback: Executing actions:', transition.actions);
                    transition.actions.forEach(actionName => {
                        if (machine.config.actions[actionName]) {
                            console.log('XState fallback: Executing action:', actionName);
                            try {
                                machine.config.actions[actionName]({
                                    context: currentContext,
                                    event: eventData
                                });
                            } catch (error) {
                                console.error('XState fallback: Action execution error:', error);
                            }
                        }
                    });
                }
                
                // Transition to target state
                if (transition.target) {
                    currentState = transition.target;
                    console.log('XState fallback: Transitioned to:', currentState);
                }
                
                // Update context with event data
                if (eventData) {
                    currentContext = { ...currentContext, ...eventData };
                }
            }
            
            // Trigger subscribers with new state
            const snapshot = this.getSnapshot();
            subscribers.forEach(callback => callback(snapshot));
            return this;
        },
        
        getSnapshot: function() {
            return {
                value: currentState,
                context: currentContext,
                done: false,
                event: null,
                historyValue: {},
                matches: function(state) {
                    return currentState === state;
                },
                can: function(event) {
                    return true;
                }
            };
        },
        
        onTransition: function(callback) {
            subscribers.push(callback);
            return this;
        },
        
        subscribe: function(callback) {
            subscribers.push(callback);
            // Call immediately with current state
            callback(this.getSnapshot());
            
            return {
                unsubscribe: function() {
                    const index = subscribers.indexOf(callback);
                    if (index > -1) {
                        subscribers.splice(index, 1);
                    }
                }
            };
        }
    };
    
    return service;
}

export function assign(updater) {
    return function(context, event) {
        if (typeof updater === 'function') {
            return updater(context, event);
        }
        return { ...context, ...updater };
    };
}

// Global fallback
window.XState = { createMachine, interpret, assign };