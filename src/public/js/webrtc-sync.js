/**
 * WebRTC Synchronization Module
 * Gère la synchronisation en temps réel du questionnaire entre tablettes
 */

class WebRTCSync {
    constructor() {
        this.dc = null;
        this.isOfferor = null;
        this.sessionId = null;
        this.connected = false;
        this.messageHandlers = [];
        
        // Vérifier si on vient de l'onboarding
        this.checkOnboardingConnection();
    }
    
    checkOnboardingConnection() {
        const wasConnected = sessionStorage.getItem('webrtc_connected');
        
        if (wasConnected === 'true') {
            this.isOfferor = sessionStorage.getItem('webrtc_isOfferor') === 'true';
            this.sessionId = sessionStorage.getItem('webrtc_sessionId') || null;
            this.connected = true;
            
            console.log('✅ WebRTC connexion restaurée:', {
                isOfferor: this.isOfferor,
                sessionId: this.sessionId
            });
            
            // Essayer de récupérer le data channel depuis window
            this.tryConnectDataChannel();
        } else {
            console.log('⚠️ Pas de connexion WebRTC détectée');
        }
    }
    
    /**
     * Tenter de récupérer le data channel depuis window
     */
    tryConnectDataChannel() {
        // Vérifier immédiatement
        if (window.webrtcDataChannel) {
            this.setDataChannel(window.webrtcDataChannel);
            return;
        }
        
        // Sinon, attendre qu'il soit disponible (max 5 secondes)
        let attempts = 0;
        const maxAttempts = 50;
        const interval = setInterval(() => {
            attempts++;
            
            if (window.webrtcDataChannel) {
                console.log('✅ Data channel récupéré après', attempts * 100, 'ms');
                this.setDataChannel(window.webrtcDataChannel);
                clearInterval(interval);
            } else if (attempts >= maxAttempts) {
                console.warn('⚠️ Data channel non trouvé après 5 secondes');
                clearInterval(interval);
            }
        }, 100);
    }
    
    /**
     * Initialiser avec un data channel existant
     * @param {RTCDataChannel} dataChannel - Le canal de données WebRTC
     */
    setDataChannel(dataChannel) {
        if (!dataChannel) {
            console.warn('⚠️ Data channel null fourni à WebRTCSync');
            return;
        }
        
        this.dc = dataChannel;
        this.connected = dataChannel.readyState === 'open';
        
        // Écouter les messages entrants
        this.dc.addEventListener('message', (e) => this.handleMessage(e));
        
        // Surveiller l'état du canal
        this.dc.addEventListener('open', () => {
            this.connected = true;
            console.log('✅ Data channel prêt pour la synchronisation');
        });
        
        this.dc.addEventListener('close', () => {
            this.connected = false;
            console.log('❌ Data channel fermé');
        });
        
        this.dc.addEventListener('error', (e) => {
            console.error('❌ Erreur data channel:', e);
        });
        
        console.log('📡 WebRTCSync initialisé avec data channel');
    }
    
    /**
     * Enregistrer un gestionnaire de messages
     * @param {Function} handler - Fonction appelée à la réception d'un message
     */
    onMessage(handler) {
        if (typeof handler === 'function') {
            this.messageHandlers.push(handler);
        }
    }
    
    /**
     * Gérer les messages reçus
     * @param {MessageEvent} event - Événement message
     */
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            console.log('📥 Message reçu:', data);
            
            // Appeler tous les gestionnaires enregistrés
            this.messageHandlers.forEach(handler => {
                try {
                    handler(data);
                } catch (err) {
                    console.error('❌ Erreur dans le gestionnaire de message:', err);
                }
            });
        } catch (err) {
            console.error('❌ Erreur parsing message:', err);
        }
    }
    
    /**
     * Envoyer un événement XState
     * @param {Object} event - L'événement XState { type: '...', data: {...} }
     */
    sendEvent(event) {
        if (!this.connected || !this.dc) {
            console.warn('⚠️ Impossible d\'envoyer l\'événement: data channel non connecté');
            return false;
        }
        
        try {
            const message = {
                type: 'SURVEY_EVENT',
                event: event,
                timestamp: Date.now(),
                sender: this.isOfferor ? 'host' : 'guest'
            };
            
            this.dc.send(JSON.stringify(message));
            console.log('📤 Événement envoyé:', event);
            return true;
        } catch (err) {
            console.error('❌ Erreur envoi événement:', err);
            return false;
        }
    }
    
    /**
     * Envoyer l'état complet du questionnaire
     * @param {Object} state - L'état XState complet
     */
    sendState(state) {
        if (!this.connected || !this.dc) {
            console.warn('⚠️ Impossible d\'envoyer l\'état: data channel non connecté');
            return false;
        }
        
        try {
            const message = {
                type: 'SURVEY_STATE',
                state: {
                    value: state.value,
                    context: state.context
                },
                timestamp: Date.now(),
                sender: this.isOfferor ? 'host' : 'guest'
            };
            
            this.dc.send(JSON.stringify(message));
            console.log('📤 État complet envoyé:', state.value);
            return true;
        } catch (err) {
            console.error('❌ Erreur envoi état:', err);
            return false;
        }
    }
    
    /**
     * Vérifier si la synchronisation est active
     */
    isActive() {
        return this.connected && this.dc !== null;
    }
    
    /**
     * Obtenir le rôle (host/guest)
     */
    getRole() {
        return this.isOfferor ? 'host' : 'guest';
    }
}

// Créer une instance globale
window.webrtcSync = new WebRTCSync();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebRTCSync;
}
