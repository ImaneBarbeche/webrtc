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
    // Vérifie si on vient d'un onboarding WebRTC
    const wasConnected = sessionStorage.getItem("webrtc_connected");

    if (wasConnected === "true") {
      // Récupère les infos
      this.isOfferor = sessionStorage.getItem("webrtc_isOfferor") === "true"; // Suis-je l'hôte ou l'invité ?
      this.sessionId = sessionStorage.getItem("webrtc_sessionId") || null;
      this.connected = true; // ID de session
      // Essayer de récupérer le data channel depuis window
      this.tryConnectDataChannel();
    } else {
      this.updateStatusIndicator(); // Afficher "Mode standalone"
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
        this.setDataChannel(window.webrtcDataChannel);
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        console.warn("⚠️ Data channel non trouvé après 5 secondes");
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
      console.warn("⚠️ Data channel null fourni à WebRTCSync");
      return;
    }

    // Si on a déjà un data channel, ne pas le réinitialiser
    if (this.dc && this.dc.readyState === "open") {
      return;
    }

    this.dc = dataChannel;
    this.connected = dataChannel.readyState === "open";

    // Récupérer les infos de session si pas encore fait
    if (this.isOfferor === null) {
      const storedIsOfferor = sessionStorage.getItem("webrtc_isOfferor");
      this.isOfferor = storedIsOfferor === "true";
      this.sessionId = sessionStorage.getItem("webrtc_sessionId") || null;
    } else {
      console.log("Rôle déjà défini:", {
        isOfferor: this.isOfferor,
        sessionId: this.sessionId,
      });
    }

    this.updateStatusIndicator(); // Mettre à jour l'indicateur APRÈS avoir lu le rôle

    // Écouter les messages entrants
    this.dc.addEventListener("message", (e) => this.handleMessage(e));

    // Surveiller l'état du canal
    this.dc.addEventListener("open", () => {
      this.connected = true;
      this.updateStatusIndicator();
    });

    this.dc.addEventListener("close", () => {
      this.connected = false;
      this.updateStatusIndicator(); // Badge rouge
      this.showReconnectButton(); // Afficher bouton
    });

    this.dc.addEventListener("error", (e) => {
      console.error("❌ Erreur data channel:", e);
    });
  }

  /**
   * Enregistrer un gestionnaire de messages
   * @param {Function} handler - Fonction appelée à la réception d'un message
   */
  onMessage(handler) {
    if (typeof handler === "function") {
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
      // Appeler tous les gestionnaires enregistrés
      this.messageHandlers.forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error("❌ Erreur dans le gestionnaire de message:", err);
        }
      });
    } catch (err) {
      console.error(
        "❌ Erreur parsing message WebRTC:",
        err,
        "Data brute:",
        event.data
      );
    }
  }

  /**
   * Envoyer un événement XState
   * @param {Object} event - L'événement XState { type: '...', data: {...} }
   */
  sendEvent(event) {
    if (!this.connected || !this.dc) {
      console.warn(
        "⚠️ Impossible d'envoyer l'événement: data channel non connecté"
      );
      console.warn("   État:", {
        connected: this.connected,
        dc: !!this.dc,
        readyState: this.dc?.readyState,
      });
      return false;
    }

    try {
      const message = {
        type: "SURVEY_EVENT",
        event: event,
        timestamp: Date.now(),
        sender: this.isOfferor ? "host" : "guest",
      };

      this.dc.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error("❌ Erreur envoi événement WebRTC:", err);
      return false;
    }
  }

  /**
   * Envoyer l'état complet du questionnaire
   * @param {Object} state - L'état XState complet
   */
  sendState(state) {
    if (!this.connected || !this.dc) {
      console.warn("⚠️ Impossible d'envoyer l'état: data channel non connecté");
      return false;
    }

    try {
      const message = {
        type: "SURVEY_STATE",
        state: {
          value: state.value,
          context: state.context,
        },
        timestamp: Date.now(),
        sender: this.isOfferor ? "host" : "guest",
      };

      this.dc.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error("❌ Erreur envoi état:", err);
      return false;
    }
  }

  /**
   * Envoyer un message générique
   * @param {Object} messageData - Les données du message
   */
  sendMessage(messageData) {
    if (!this.connected || !this.dc) {
      console.warn("⚠️ Impossible d'envoyer le message: data channel non connecté");
      return false;
    }

    try {
      const message = {
        ...messageData,
        timestamp: Date.now(),
        sender: this.isOfferor ? "host" : "guest",
      };

      this.dc.send(JSON.stringify(message));
      console.log('📤 Message envoyé:', message.type);
      return true;
    } catch (err) {
      console.error("❌ Erreur envoi message:", err);
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
   * Mettre à jour l'indicateur visuel de statut WebRTC
   */
  updateStatusIndicator() {
    // Vérifier si on a été connecté avant (pour distinguer "jamais connecté" vs "déconnecté")
    const wasConnected = sessionStorage.getItem('webrtc_connected') === 'true';

    let status, role;

    if (this.connected && this.dc && this.dc.readyState === 'open') {
      // ✅ CONNECTÉ
      status = "connected";
      role = this.isOfferor ? "offeror" : "answerer";
    } else if (wasConnected && !this.connected) {
      // ❌ DÉCONNECTÉ (était connecté avant, plus maintenant)
      status = "disconnected";
      role = this.isOfferor ? "offeror" : "answerer";
    } else {
      // ⚪ Hors ligne (jamais connecté)
      status = "standalone";
      role = null;
    }

    // Appeler la fonction React si disponible
    if (window.updateWebRTCStatus) {
      window.updateWebRTCStatus(role, status);
    }
  }

  /**
   * Show reconnect button when connection is lost
   */
  showReconnectButton() {
    const reconnectContainer = document.getElementById("reconnect-container");
    const reconnectBtn = document.getElementById("reconnect-btn");
    
    if (reconnectContainer && reconnectBtn) {
      reconnectContainer.classList.remove("hidden");
      
      // Add click listener to redirect to onboarding
      reconnectBtn.onclick = () => {        
        // Clear WebRTC state
        sessionStorage.setItem("webrtc_connected", "false");
        
        // Reload the page to restart onboarding
        window.location.reload();
      };
    }
  }

  /**
   * Obtenir le rôle (host/guest)
   */
  getRole() {
    const role = this.isOfferor ? "host" : "guest";
    return role;
  }
}

// Créer une instance globale
window.webrtcSync = new WebRTCSync();

// Export pour modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = WebRTCSync;
}
