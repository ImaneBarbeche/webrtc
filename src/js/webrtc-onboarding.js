// WebRTC Onboarding
class WebRTCOnboarding {
  constructor() {
    this.pc = null;
    this.dc = null;
    this.isOfferor = null; // true for host, false for guest
    this.sessionId = null; // Unique session ID for the connection
    this.state = "off"; // off, offerCreating, waitAnswer, answerCreating, waitConnect, connected, disconnected, failed, closed
    this.connectionEstablished = false; // True when data channel is open

    this.initializeElements();
    this.setupEventListeners();
    this.initialize("Ready to start connection");
  }

  initializeElements() {
    this.elements = {
      statusIndicator: document.getElementById("status-indicator"),
      statusText: document.getElementById("status-text"),
      statusMessage: document.getElementById("statusMessage"),
      progressBar: document.getElementById("progressBar"),

      // Role selection
      roleSelection: document.getElementById("roleSelection"),
      selectInterviewer: document.getElementById("selectInterviewer"),
      selectInterviewee: document.getElementById("selectInterviewee"),

      // Interviewer flow (Host)
      interviewerFlow: document.getElementById("interviewerFlow"),
      offerDisplay: document.getElementById("offerDisplay"),
      waitResponse: document.getElementById("waitResponse"),
      codeBadge: document.getElementById("codeBadge"),
      qrCanvas: document.getElementById("qrCanvas"),
      connectionCode: document.getElementById("connectionCode"),
      copyBtn: document.getElementById("copyBtn"),
      scanResponseBtn: document.getElementById("scanResponseBtn"),
      responseInput: document.getElementById("responseInput"),
      processResponseBtn: document.getElementById("processResponseBtn"),

      // Interviewee flow (Guest)
      intervieweeFlow: document.getElementById("intervieweeFlow"),
      scanOffer: document.getElementById("scanOffer"),
      answerDisplay: document.getElementById("answerDisplay"),
      scanBtn: document.getElementById("scanBtn"),
      connectionInput: document.getElementById("connectionInput"),
      connectBtn: document.getElementById("btn1"),
      qrCanvasAnswer: document.getElementById("qrCanvasAnswer"),
      answerCode: document.getElementById("answerCode"),
      copyAnswerBtn: document.getElementById("copyAnswerBtn"),

      // Common
      connectedActions: document.getElementById("connectedActions"),
      debugLog: document.getElementById("debugLog"),
      debugPanel: document.getElementById("debugPanel"),
    };
  }

  setupEventListeners() {
    // Role selection
    this.elements.selectInterviewer.addEventListener("click", () => this.selectInterviewerRole());
    this.elements.selectInterviewee.addEventListener("click", () => this.selectIntervieweeRole());

    // Interviewer (Host) actions
    this.elements.scanResponseBtn.addEventListener("click", () => this.scanResponse());
    this.elements.processResponseBtn.addEventListener("click", () => this.processAnswer());
    this.elements.copyBtn.addEventListener("click", () => this.copyToClipboard());

    // Interviewee (Guest) actions
    this.elements.scanBtn.addEventListener("click", () => this.scanQRCode());
    this.elements.connectBtn.addEventListener("click", () => this.receiveOffer());
    this.elements.copyAnswerBtn.addEventListener("click", () => this.copyAnswerToClipboard());

    // Input validation
    this.elements.connectionInput.addEventListener("input", (e) => {
      this.elements.connectBtn.disabled = !e.target.value.trim();
    });

    this.elements.responseInput.addEventListener("input", (e) => {
      this.elements.processResponseBtn.disabled = !e.target.value.trim();
    });
  }

  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    if (this.elements.debugLog) {
      this.elements.debugLog.innerHTML += logMessage + "<br>";
      this.elements.debugLog.scrollTop = this.elements.debugLog.scrollHeight;
    }
  }

  // Role selection methods
  selectInterviewerRole() {
    this.log("=== INTERVIEWER ROLE SELECTED ===");
    this.isOfferor = true;
    this.elements.roleSelection.classList.add("hidden");
    this.elements.interviewerFlow.classList.remove("hidden");
    this.setStateAndStatus("offerCreating", "Création de la session...");
    this.createOffer();
  }

  selectIntervieweeRole() {
    this.log("=== INTERVIEWEE ROLE SELECTED ===");
    this.isOfferor = false;
    this.elements.roleSelection.classList.add("hidden");
    this.elements.intervieweeFlow.classList.remove("hidden");
    this.setStateAndStatus("off", "En attente du code de l'enquêteur");
  }

  // Interviewer: Create offer automatically
  async createOffer() {
    try {
      this.dc = this.pc.createDataChannel("lifestories");
      this.dc.addEventListener("open", (e) => this.dcOpen(e));
      this.dc.addEventListener("message", (e) => this.dcMessage(e));
      this.log("Creating offer...");
      this.log(`ICE Gathering State before offer: ${this.pc.iceGatheringState}`);
      
      const offer = await this.pc.createOffer();
      this.log(`Offer created: ${JSON.stringify(offer).substring(0, 100)}`);
      await this.pc.setLocalDescription(offer);
      this.log(`Local description set. ICE Gathering State: ${this.pc.iceGatheringState}`);
      this.log("Waiting for ICE candidates...");
      this.state = "offerCreating";
    } catch (err) {
      this.log(`ERROR creating offer: ${err.message}`);
      this.showMessage("Erreur lors de la création de l'offre", "error");
    }
  }

  // Interviewee: Receive and process offer
  async receiveOffer() {
    try {
      this.log("Parsing offer JSON...");
      let desc = JSON.parse(this.elements.connectionInput.value);
      this.log(`Offer parsed: ${JSON.stringify(desc).substring(0, 100)}...`);
      
      if (!("sessionId" in desc)) {
        this.setStateAndStatus("error", "Erreur: l'offre n'a pas de sessionId.");
        this.log("ERROR: No sessionId in offer");
        return;
      }
      
      this.sessionId = desc.sessionId;
      this.log(`Session ID: ${this.sessionId}`);
      delete desc.sessionId;
      
      this.log("Setting remote description (offer)...");
      await this.pc.setRemoteDescription(desc);
      this.log("Remote description set, creating answer...");
      await this.pc.setLocalDescription(await this.pc.createAnswer());
      this.log("Answer created, waiting for ICE candidates...");
      
      this.elements.connectBtn.disabled = true;
      this.elements.scanBtn.disabled = true;
      this.elements.connectionInput.disabled = true;
      this.state = "answerCreating";
      this.setStateAndStatus("answerCreating", "Création de votre réponse...");
    } catch (err) {
      this.log(`ERROR receiving offer: ${err.message}`);
      this.log(`Stack: ${err.stack}`);
      this.showMessage("Erreur lors du traitement de l'offre", "error");
    }
  }

  // initialize function
  initialize(statusText) {
    this.log("=== INITIALIZE ===");
    if (this.pc) {
      this.pc.removeEventListener("connectionstatechange", (e) =>
        this.pcConnectionStateChange(e)
      );
      this.pc.close();
    }
    this.dc = null;
    this.pc = new RTCPeerConnection({
      iceServers: [
        // helpers for NAT traversal, can be empty for local network
        // { urls: 'stun:stun.l.google.com:19302' }
      ],
      iceTransportPolicy: "all",
      iceCandidatePoolSize: 0,
    });

    // Debug event listeners
    this.pc.addEventListener("icecandidate", (e) => this.pcIceCandidate(e));
    this.pc.addEventListener("connectionstatechange", (e) =>
      this.pcConnectionStateChange(e)
    );
    this.pc.addEventListener("datachannel", (e) => this.pcDataChannel(e));

    this.pc.addEventListener("iceconnectionstatechange", () => {
      this.log(`ICE Connection State: ${this.pc.iceConnectionState}`);
    });

    this.pc.addEventListener("icegatheringstatechange", () => {
      this.log(`ICE Gathering State: ${this.pc.iceGatheringState}`);
    });

    this.pc.addEventListener("signalingstatechange", () => {
      this.log(`Signaling State: ${this.pc.signalingState}`);
    });

    // Note: Old createBtn and connectBtn removed in new UI
    // Buttons are now role-specific (selectInterviewer, selectInterviewee, etc.)
    this.setStateAndStatus("off", statusText);
  }

  setStateAndStatus(newState, statusText) {
    this.state = newState;
    this.elements.statusText.innerText = statusText;
    this.log(`State: ${newState}, Status: ${statusText}`);
  }

  // New function for processing answer from guest
  async processAnswer() {
    try {
      this.log("Parsing answer JSON...");
      let answerDesc = JSON.parse(this.elements.responseInput.value);
      this.log(
        `Answer parsed: ${JSON.stringify(answerDesc).substring(0, 100)}...`
      );
      this.log("Setting remote description (answer)...");
      await this.pc.setRemoteDescription(answerDesc);
      this.log("Remote description set - connection should establish");
      this.elements.processResponseBtn.disabled = true;
      this.setStateAndStatus("waitConnect", "Connecting...");
    } catch (err) {
      this.log(`ERROR processing answer: ${err.message}`);
      this.showMessage("Erreur lors du traitement de la réponse", "error");
    }
  }

  // pcIceCandidate logic
  async pcIceCandidate(e) {
    if (e.candidate) {
      this.log(`ICE Candidate: ${e.candidate.candidate.substring(0, 50)}...`);
    } else {
      this.log("ICE Candidate: null (gathering complete)");
    }

    switch (this.state) {
      case "offerCreating":
        if (!e.candidate) {
          this.sessionId = this.makeId();
          const offerData = {
            ...this.pc.localDescription.toJSON(),
            sessionId: this.sessionId,
          };
          this.elements.connectionCode.value = JSON.stringify(offerData);

          // Generate QR Code for the offer
          this.log(`Génération QR code pour l'offre`);
          if (typeof generateQRCode === "function" && this.elements.qrCanvas) {
            generateQRCode(JSON.stringify(offerData), "qrCanvas");
          } else {
            this.log(`Erreur: generateQRCode non disponible`);
          }

          this.log(`Offer complete with sessionId: ${this.sessionId}`);
          this.log(`Offer length: ${this.elements.connectionCode.value.length} chars`);
          
          // Auto-show wait response section after QR code is displayed
          // This happens automatically so it works on tablets (scan only, no copy)
          setTimeout(() => {
            this.minimizeOfferAndShowWaitResponse();
          }, 800); // Small delay to let QR code render
          
          this.isOfferor = true;
          this.state = "waitAnswer";
          this.setStateAndStatus("waitAnswer", "Partagez le code avec l'enquêté");
        }
        break;

      case "answerCreating":
        if (!e.candidate) {
          const answerData = this.pc.localDescription.toJSON();
          this.elements.answerCode.value = JSON.stringify(answerData);

          // Generate QR Code for the answer
          this.log(`Génération QR code pour la réponse`);
          if (typeof generateQRCode === "function" && this.elements.qrCanvasAnswer) {
            generateQRCode(JSON.stringify(answerData), "qrCanvasAnswer");
          } else {
            this.log(`Erreur: generateQRCode non disponible`);
          }

          this.log(`Answer complete`);
          this.log(`Answer length: ${this.elements.answerCode.value.length} chars`);
          
          // Hide scan offer section and show answer display
          setTimeout(() => {
            this.hideScanOfferAndShowAnswer();
          }, 0);
          
          this.state = "waitConnect";
          this.setStateAndStatus("waitConnect", "Partagez votre réponse avec l'enquêteur");
        }
        break;
    }
  }

  // pcConnectionStateChange
  pcConnectionStateChange() {
    this.log(`Connection state: ${this.pc.connectionState}`);

    switch (this.pc.connectionState) {
      case "connected":
        this.log("=== CONNECTION ESTABLISHED ===");
        this.connectionEstablished = true;
        this.setStateAndStatus("connected", "Connexion établie !");
        this.elements.connectedActions.classList.remove("hidden");
        
        // Auto-start for interviewee (guest), they don't need to click
        if (!this.isOfferor) {
          this.log("Auto-starting application for interviewee");
          setTimeout(() => {
            this.startApplication();
          }, 1000); // Small delay to show success message
        } else {
          // For interviewer, auto-start after short delay
          this.log("Auto-starting application for interviewer");
          setTimeout(() => {
            this.startApplication();
          }, 1500); // Slightly longer delay for interviewer to see status
        }
        break;

      case "disconnected":
        this.log("Connection disconnected");
        this.setStateAndStatus("disconnected", "Connexion interrompue");
        break;

      case "failed":
        this.log("Connection failed");
        this.setStateAndStatus("failed", "Échec de la connexion");
        break;

      case "closed":
        this.log("Connection closed");
        this.setStateAndStatus("closed", "Connexion fermée");
        break;
    }
  }

  // pcDataChannel
  pcDataChannel(e) {
    this.log("=== DATA CHANNEL RECEIVED ===");
    if (!this.dc) {
      this.dc = e.channel;
      this.dc.addEventListener("open", (e) => this.dcOpen(e));
      this.dc.addEventListener("message", (e) => this.dcMessage(e));
    }
  }
  // On exporte le data channel pour le récupérer ailleurs pour éviter de réecrire la connexion webrtc
  dcOpen() {
    this.log("Data channel opened");
    this.connectionEstablished = true; // Marquer la connexion comme établie
    this.setStateAndStatus(
      "connected",
      "Connexion établie - Canal de données ouvert !"
    );

    // IMPORTANT: Sauvegarder le rôle AVANT de configurer webrtcSync
    sessionStorage.setItem("webrtc_connected", "true");
    sessionStorage.setItem("webrtc_isOfferor", this.isOfferor ? "true" : "false");
    sessionStorage.setItem("webrtc_sessionId", this.sessionId || "");
    this.log(`📝 SessionStorage sauvegardé: isOfferor=${this.isOfferor}, sessionId=${this.sessionId}`);

    // Enregistrer le data channel globalement pour webrtc-sync.js
    if (typeof window !== "undefined") {
      window.webrtcDataChannel = this.dc;
      this.log("Data channel exporté globalement (window.webrtcDataChannel)");
      
      // Notifier webrtc-sync que le data channel est prêt
      this.log(`DEBUG: window.webrtcSync existe? ${!!window.webrtcSync}`);
      this.log(`DEBUG: window.webrtcSync.setDataChannel existe? ${!!(window.webrtcSync && typeof window.webrtcSync.setDataChannel === 'function')}`);
      
      if (window.webrtcSync && typeof window.webrtcSync.setDataChannel === 'function') {
        window.webrtcSync.setDataChannel(this.dc);
        this.log("Data channel transmis à webrtcSync");
      } else {
        this.log("ERREUR: webrtcSync non disponible ou setDataChannel manquant!");
      }
    }
    
    // Utiliser setTimeout + ajouter la classe .show
    const elements = this.elements;
    setTimeout(() => {
      elements.connectedActions.classList.remove("hidden");
      elements.connectedActions.classList.add('show');
    }, 0);
  }

  dcMessage(e) {
    this.log(`Message received: ${e.data}`);
    // Handle messages here if needed
  }

  // Helper function from original
  makeId() {
    var now = new Date();
    return `${now.getFullYear()}:${now.getMonth()}:${now.getDate()}:${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}:${now.getMilliseconds()}:${Math.ceil(
      Math.random() * 0x100000000
    )}`;
  }

  async copyToClipboard() {
    try {
      let result = await navigator.permissions.query({
        name: "clipboard-write",
      });
      switch (result.state) {
        case "granted":
        case "prompt":
          await navigator.clipboard.writeText(
            this.elements.connectionCode.value
          );
          this.log("Copied to clipboard");
          this.showMessage("Copié dans le presse-papiers", "success");
          
          // Minimize offer and show wait response after copy (interviewer only)
          if (this.isOfferor && this.state === "waitAnswer") {
            this.minimizeOfferAndShowWaitResponse();
          }
          break;
      }
    } catch (err) {
      this.log(`Clipboard error: ${err.message}`);
      let disabled = this.elements.connectionCode.disabled;
      this.elements.connectionCode.disabled = false;
      try {
        this.elements.connectionCode.select();
      } catch (err2) {
        this.elements.connectionCode.setSelectionRange(
          0,
          this.elements.connectionCode.value.length
        );
      }
      document.execCommand("copy");
      this.elements.connectionCode.disabled = disabled;
      this.showMessage("Code sélectionné (Ctrl+C pour copier)", "info");
      
      // Minimize offer and show wait response after copy (interviewer only)
      if (this.isOfferor && this.state === "waitAnswer") {
        this.minimizeOfferAndShowWaitResponse();
      }
    }
  }

  async copyAnswerToClipboard() {
    try {
      let result = await navigator.permissions.query({
        name: "clipboard-write",
      });
      switch (result.state) {
        case "granted":
        case "prompt":
          await navigator.clipboard.writeText(
            this.elements.answerCode.value
          );
          this.log("Answer copied to clipboard");
          this.showMessage("Réponse copiée dans le presse-papiers", "success");
          break;
      }
    } catch (err) {
      this.log(`Clipboard error: ${err.message}`);
      let disabled = this.elements.answerCode.disabled;
      this.elements.answerCode.disabled = false;
      try {
        this.elements.answerCode.select();
      } catch (err2) {
        this.elements.answerCode.setSelectionRange(
          0,
          this.elements.answerCode.value.length
        );
      }
      document.execCommand("copy");
      this.elements.answerCode.disabled = disabled;
      this.showMessage("Réponse sélectionnée (Ctrl+C pour copier)", "info");
    }
  }

  scanQRCode() {
    this.log(`scanQRCode called, startScanner type: ${typeof startScanner}`);
    if (typeof startScanner === "function") {
      this.scanningResponse = false;
      this.log("Starting QR scanner for offer");
      startScanner();
    } else {
      this.log(`ERROR: startScanner is ${typeof startScanner}`);
      this.showMessage("Scanner QR non disponible", "error");
    }
  }

  scanResponse() {
    this.log(`scanResponse called, startScanner type: ${typeof startScanner}`);
    if (typeof startScanner === "function") {
      this.scanningResponse = true;
      this.log("Starting QR scanner for response");
      startScanner();
    } else {
      this.log(`ERROR: startScanner is ${typeof startScanner}`);
      this.showMessage("Scanner QR non disponible", "error");
    }
  }

  // Minimize offer display and show wait response section (interviewer)
  minimizeOfferAndShowWaitResponse() {
    // Avoid double minimization - check if already minimized
    if (this.elements.offerDisplay.classList.contains("minimized")) {
      this.log("Offer already minimized, skipping");
      return;
    }
    
    this.log("Minimizing offer and showing wait response");
    this.elements.offerDisplay.classList.add("minimized");
    this.elements.waitResponse.classList.remove("hidden");
    if (this.elements.codeBadge) {
      this.elements.codeBadge.classList.remove("hidden");
    }
  }

  // Hide scan offer and show answer display (interviewee)
  hideScanOfferAndShowAnswer() {
    this.log("Hiding scan offer and showing answer");
    this.elements.scanOffer.classList.add("hidden");
    this.elements.answerDisplay.classList.remove("hidden");
  }

  // quand on passe de la page onboarding à la page lifestories, permet de garder une mémoire temporaire de la connexion afin de vérifier qu'on vient bien du process onboarding
  startApplication() {
    if (!this.connectionEstablished) {
      this.showMessage("Connexion non établie", "error");
      return;
    }

    this.log("Starting LifeStories application...");

    // SessionStorage déjà sauvegardé dans dcOpen(), juste vérifier
    this.log(`DEBUG startApp: window.webrtcSync existe? ${!!window.webrtcSync}`);
    this.log(`DEBUG startApp: window.webrtcDataChannel existe? ${!!window.webrtcDataChannel}`);
    
    // Pas besoin de re-transmettre le data channel, déjà fait dans dcOpen()

    // Cacher l'onboarding et afficher LifeStories
    const onboarding = document.querySelector('.onboarding-container');
    const debugPanel = document.getElementById('debugPanel');
    const lifestories = document.getElementById('lifestoriesContainer');
    
    if (onboarding) onboarding.classList.add('hidden');
    if (debugPanel) debugPanel.style.display = 'none';
    if (lifestories) {
      lifestories.classList.add('active');
      
      // Si c'est le viewer (pas l'offeror), activer le mode viewer
      if (!this.isOfferor) {
        lifestories.classList.add('viewer-mode');
        this.log("Mode VIEWER activé - questionnaire masqué");
      } else {
        this.log("Mode HÔTE activé - questionnaire visible");
      }
    }
    
    // Dispatcher un événement pour initialiser Split.js
    document.dispatchEvent(new Event('lifestoriesShown'));
    
    this.log("LifeStories UI activated, onboarding hidden");
  }

  // Méthode pour obtenir l'instance active
  getDataChannel() {
    return this.dc;
  }

  // Méthode pour vérifier si la connexion est établie
  isConnected() {
    return this.connectionEstablished;
  }

  showMessage(message, type = "info") {
    this.elements.statusMessage.textContent = message;
    this.elements.statusMessage.className = `status-message ${type}`;
    this.log(`[${type.toUpperCase()}] ${message}`);
  }

  handleScannedData(data) {
    this.log(`QR Code scanned: ${data.substring(0, 50)}...`);

    if (this.scanningResponse) {
      // This is a response scan for the host (interviewer)
      this.elements.responseInput.value = data;
      this.elements.processResponseBtn.disabled = false;
      this.showMessage("Réponse scannée ! Traitement en cours...", "success");
      this.scanningResponse = false;
      
      // Auto-process the answer after scan
      setTimeout(() => {
        this.processAnswer();
      }, 500); // Small delay to show success message
    } else {
      // This is a regular connection scan for guest (interviewee)
      this.elements.connectionInput.value = data;
      this.elements.connectBtn.disabled = false;
      this.showMessage("QR Code scanné ! Connexion en cours...", "success");
      
      // Auto-receive the offer after scan
      setTimeout(() => {
        this.receiveOffer();
      }, 500); // Small delay to show success message
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.webrtcOnboarding = new WebRTCOnboarding();

  // Export for QR scanner
  window.handleScannedData = (data) => {
    window.webrtcOnboarding.handleScannedData(data);
  };
});

// Export for potential external use
if (typeof module !== "undefined" && module.exports) {
  module.exports = WebRTCOnboarding;
}
