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
            // Trigger subscribers with current state
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