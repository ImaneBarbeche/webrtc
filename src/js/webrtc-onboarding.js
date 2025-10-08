// WebRTC Onboarding
class WebRTCOnboarding {
  constructor() {
    this.pc = null;
    this.dc = null;
    this.isOfferor = null;
    this.sessionId = null;
    this.state = "off";
    this.connectionEstablished = false;

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

      createBtn: document.getElementById("btn0"),
      scanBtn: document.getElementById("scanBtn"),
      connectBtn: document.getElementById("btn1"),
      copyBtn: document.getElementById("copyBtn"),
      startBtn: document.getElementById("startApp"),

      connectionInput: document.getElementById("connectionInput"),
      connectionCode: document.getElementById("connectionCode"),
      qrCanvas: document.getElementById("qrCanvas"),

      // Response handling for host
      responseSection: document.getElementById("responseSection"),
      scanResponseBtn: document.getElementById("scanResponseBtn"),
      responseInput: document.getElementById("responseInput"),
      processResponseBtn: document.getElementById("processResponseBtn"),

      connectionDetails: document.getElementById("connectionDetails"),
      connectedActions: document.getElementById("connectedActions"),
      debugLog: document.getElementById("debugLog"),
      debugPanel: document.getElementById("debugPanel"),
    };
  }

  setupEventListeners() {
    this.elements.createBtn.addEventListener("click", () => this.btn0Click());
    this.elements.connectBtn.addEventListener("click", () => this.btn1Click());
    this.elements.processResponseBtn.addEventListener("click", () =>
      this.processAnswer()
    );
    this.elements.scanBtn.addEventListener("click", () => this.scanQRCode());
    this.elements.scanResponseBtn.addEventListener("click", () =>
      this.scanResponse()
    );
    this.elements.copyBtn.addEventListener("click", () =>
      this.copyToClipboard()
    );
    this.elements.startBtn.addEventListener("click", () =>
      this.startApplication()
    );

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
    console.log(logMessage);

    if (this.elements.debugLog) {
      this.elements.debugLog.innerHTML += logMessage + "<br>";
      this.elements.debugLog.scrollTop = this.elements.debugLog.scrollHeight;
    }
  }

  // EXACT COPY of original initialize function
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

    this.elements.createBtn.innerText = "Créer une session";
    this.elements.createBtn.disabled = false;
    this.elements.connectBtn.innerText = "Se connecter";
    this.elements.connectBtn.disabled = true;
    this.elements.processResponseBtn.disabled = true;
    this.setStateAndStatus("off", statusText);
  }

  setStateAndStatus(newState, statusText) {
    this.state = newState;
    this.elements.statusText.innerText = statusText;
    this.log(`State: ${newState}, Status: ${statusText}`);
  }

  // btn0Click logic
  async btn0Click() {
    this.log(`Button 0 clicked - state: ${this.state}`);
    switch (this.state) {
      case "off":
        this.elements.connectionCode.placeholder =
          "Une offre est en cours de création.";
        this.elements.createBtn.disabled = true;
        this.elements.connectionInput.disabled = true;
        this.elements.connectBtn.disabled = true;
        this.dc = this.pc.createDataChannel("lifestories");
        this.dc.addEventListener("open", (e) => this.dcOpen(e));
        this.dc.addEventListener("message", (e) => this.dcMessage(e));
        this.log("Creating offer...");
        this.log(
          `ICE Gathering State before offer: ${this.pc.iceGatheringState}`
        );
        const offer = await this.pc.createOffer();
        this.log(`Offer created: ${JSON.stringify(offer).substring(0, 100)}`);
        await this.pc.setLocalDescription(offer);
        this.log(
          `Local description set. ICE Gathering State: ${this.pc.iceGatheringState}`
        );
        this.log("Waiting for ICE candidates...");
        this.state = "offerCreating";
        break;
      case "waitAnswer":
      case "waitConnect":
        await this.copyToClipboard();
        break;
    }
  }

  // btn1Click logic
  async btn1Click() {
    this.log(`Button 1 clicked - state: ${this.state}`);
    switch (this.state) {
      case "off":
        try {
          this.log("Parsing offer JSON...");
          let desc = JSON.parse(this.elements.connectionInput.value);
          this.log(
            `Offer parsed: ${JSON.stringify(desc).substring(0, 100)}...`
          );
          if (!("sessionId" in desc)) {
            this.setStateAndStatus(
              "error",
              "Error: The offer has no sessionId."
            );
            this.log("ERROR: No sessionId in offer");
            break;
          }
          this.sessionId = desc.sessionId;
          this.log(`Session ID: ${this.sessionId}`);
          delete desc.sessionId;
          this.log("Setting remote description (offer)...");
          await this.pc.setRemoteDescription(desc);
          this.log("Remote description set, creating answer...");
          await this.pc.setLocalDescription(await this.pc.createAnswer());
          this.log("Answer created, waiting for ICE candidates...");
          this.elements.connectionCode.placeholder =
            "Une réponse est en cours de création.";
          this.elements.createBtn.disabled = true;
          this.elements.connectionInput.disabled = true;
          this.elements.connectBtn.disabled = true;
          this.isOfferor = false;
          this.state = "answerCreating";
        } catch (err) {
          this.log(`ERROR in btn1Click (off state): ${err.message}`);
          this.log(`Stack: ${err.stack}`);
        }
        break;
    }
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
          this.log(`Tentative génération QR code...`);
          if (
            typeof generateQRCode === "function" &&
            document.getElementById("qrCanvas")
          ) {
            this.log(`Génération QR code pour l'offre`);
            generateQRCode(JSON.stringify(offerData), "qrCanvas");
          } else {
            this.log(
              `Erreur: generateQRCode=${typeof generateQRCode}, canvas=${!!document.getElementById(
                "qrCanvas"
              )}`
            );
          }

          this.log(`Offer complete with sessionId: ${this.sessionId}`);
          this.log(
            `Offer length: ${this.elements.connectionCode.value.length} chars`
          );
          
          // Stocker les références pour le setTimeout
          const elements = this.elements;
          
          // Utiliser setTimeout pour éviter les violations de performance dans le handler ICE
          setTimeout(() => {
            elements.createBtn.innerText = "Copier l'offre";
            elements.createBtn.disabled = false;
            elements.connectionInput.placeholder =
              'Collez la réponse reçue ici, puis cliquez sur "Traiter la réponse" pour établir la connexion.';
            elements.connectionInput.disabled = false;
            elements.processResponseBtn.innerText = "Traiter la réponse";
            elements.processResponseBtn.disabled = true;
            elements.responseSection.classList.remove("hidden");
            elements.connectionDetails.classList.remove("hidden");
            elements.connectionDetails.classList.add('show'); // Ajouter la classe .show pour afficher
          }, 0);
          
          this.isOfferor = true;
          this.state = "waitAnswer";
        }
        break;
      case "answerCreating":
        if (!e.candidate) {
          this.elements.connectionCode.value = JSON.stringify(
            this.pc.localDescription
          );

          // Generate QR Code for the answer
          this.log(`Tentative génération QR code pour réponse...`);
          if (
            typeof generateQRCode === "function" &&
            document.getElementById("qrCanvas")
          ) {
            this.log(`Génération QR code pour la réponse`);
            generateQRCode(
              JSON.stringify(this.pc.localDescription),
              "qrCanvas"
            );
          } else {
            this.log(
              `Erreur: generateQRCode=${typeof generateQRCode}, canvas=${!!document.getElementById(
                "qrCanvas"
              )}`
            );
          }

          this.log(`Answer complete`);
          this.log(
            `Answer length: ${this.elements.connectionCode.value.length} chars`
          );
          
          // Stocker les références pour le setTimeout
          const elements = this.elements;
          
          // Utiliser setTimeout pour éviter les violations de performance dans le handler ICE
          setTimeout(() => {
            elements.createBtn.innerText = "Copier la réponse";
            elements.createBtn.disabled = false;
            elements.connectionInput.placeholder =
              'Cliquez sur "Copier la réponse", puis donnez la réponse à l\'hôte.';
            elements.connectionInput.disabled = true;
            elements.connectBtn.innerText = "Abandonner";
            elements.connectBtn.disabled = false;
            elements.connectionDetails.classList.remove("hidden");
            elements.connectionDetails.classList.add('show'); // Ajouter la classe .show pour afficher
          }, 0);
          
          this.state = "waitConnect";
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
// New modification!! On exporte le data channel pour le récupérer ailleurs pour éviter de réecrire la connexion webrtc
  dcOpen() {
    this.log("Data channel opened");
    this.connectionEstablished = true;
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
    }
  }

  scanQRCode() {
    if (typeof startScanner === "function") {
      this.scanningResponse = false;
      startScanner();
    } else {
      this.showMessage("Scanner QR non disponible", "error");
    }
  }

  scanResponse() {
    if (typeof startScanner === "function") {
      this.scanningResponse = true;
      startScanner();
    } else {
      this.showMessage("Scanner QR non disponible", "error");
    }
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
      // This is a response scan for the host
      this.elements.responseInput.value = data;
      this.elements.processResponseBtn.disabled = false;
      this.showMessage("Réponse scannée !", "success");
      this.scanningResponse = false;
    } else {
      // This is a regular connection scan for guest
      this.elements.connectionInput.value = data;
      this.elements.connectBtn.disabled = false;
      this.showMessage("QR Code scanné !", "success");
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
