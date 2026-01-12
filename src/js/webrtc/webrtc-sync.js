/**
 * WebRTC Synchronization Module
 * Manages real-time synchronization of the questionnaire between tablets
 */

class WebRTCSync {
  constructor() {
    this.dc = null;
    this.isOfferor = null;
    this.sessionId = null;
    this.connected = false;
    this.messageHandlers = [];

    // Check if coming from onboarding
    this.checkOnboardingConnection();
  }

  checkOnboardingConnection() {
    // Check if coming from WebRTC onboarding
    const wasConnected = sessionStorage.getItem("webrtc_connected");

    if (wasConnected === "true") {
      // Retrieve connection info
      this.isOfferor = sessionStorage.getItem("webrtc_isOfferor") === "true"; // Am I the host or guest?
      this.sessionId = sessionStorage.getItem("webrtc_sessionId") || null;
      this.connected = true; // Session ID
      // Try to retrieve the data channel from window
      this.tryConnectDataChannel();
    } else {
      this.updateStatusIndicator(); // Show "Standalone Mode"
    }
  }

  /**
   * Try to retrieve the data channel from window
   */
  tryConnectDataChannel() {
    // Check immediately
    if (window.webrtcDataChannel) {
      this.setDataChannel(window.webrtcDataChannel);
      return;
    }

    // Otherwise, wait for it to become available (max 5 seconds)
    let attempts = 0;
    const maxAttempts = 50;
    const interval = setInterval(() => {
      attempts++;

      if (window.webrtcDataChannel) {
        this.setDataChannel(window.webrtcDataChannel);
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        console.warn("⚠️ Data channel not found after 5 seconds");
        clearInterval(interval);
      }
    }, 100);
  }

  /**
   * Initialize with an existing data channel
   * @param {RTCDataChannel} dataChannel - The WebRTC data channel
   */
  setDataChannel(dataChannel) {
    if (!dataChannel) {
      console.warn("⚠️ Null data channel provided to WebRTCSync");
      return;
    }

    // If we already have a data channel, do not reinitialize it
    if (this.dc && this.dc.readyState === "open") {
      return;
    }

    this.dc = dataChannel;
    this.connected = dataChannel.readyState === "open";

    // Retrieve session info if not already done
    if (this.isOfferor === null) {
      const storedIsOfferor = sessionStorage.getItem("webrtc_isOfferor");
      this.isOfferor = storedIsOfferor === "true";
      this.sessionId = sessionStorage.getItem("webrtc_sessionId") || null;
    } else {
      console.log("Role already defined:", {
        isOfferor: this.isOfferor,
        sessionId: this.sessionId,
      });
    }

    this.updateStatusIndicator(); // Update the indicator AFTER reading the role

    // Listen for incoming messages
    this.dc.addEventListener("message", (e) => this.handleMessage(e));

    // Monitor the channel state
    this.dc.addEventListener("open", () => {
      this.connected = true;
      this.updateStatusIndicator();
    });

    this.dc.addEventListener("close", () => {
      this.connected = false;
      this.updateStatusIndicator(); // Red badge
      this.showReconnectButton(); // Show button
    });

    this.dc.addEventListener("error", (e) => {
      console.error("❌ Data channel error:", e);
    });
  }

  /**
   * Register a message handler
   * @param {Function} handler - Function called when a message is received
   */
  onMessage(handler) {
    if (typeof handler === "function") {
      this.messageHandlers.push(handler);
    }
  }

  /**
   * Handle received messages
   * @param {MessageEvent} event - Message event
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      // Call all registered handlers
      this.messageHandlers.forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error("❌ Error in message handler:", err);
        }
      });
    } catch (err) {
      console.error(
        "❌ Error parsing WebRTC message:",
        err,
        "Raw data:",
        event.data
      );
    }
  }

  /**
   * Send an XState event
   * @param {Object} event - The XState event { type: '...', data: {...} }
   */
  sendEvent(event) {
    if (!this.connected || !this.dc) {
      console.warn(
        "⚠️ Unable to send event: data channel not connected"
      );
      console.warn("   State:", {
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
      console.error("❌ Error sending WebRTC event:", err);
      return false;
    }
  }

  /**
   * Send the complete questionnaire state
   * @param {Object} state - The complete XState state
   */
  sendState(state) {
    if (!this.connected || !this.dc) {
      console.warn("⚠️ Unable to send state: data channel not connected");
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
      console.error("❌ Error sending state:", err);
      return false;
    }
  }

  /**
   * Send a generic message
   * @param {Object} messageData - The message data
   */
  sendMessage(messageData) {
    if (!this.connected || !this.dc) {
      console.warn("⚠️ Unable to send message: data channel not connected");
      return false;
    }

    try {
      const message = {
        ...messageData,
        timestamp: Date.now(),
        sender: this.isOfferor ? "host" : "guest",
      };

      this.dc.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error("❌ Error sending message:", err);
      return false;
    }
  }

  /**
   * Check if synchronization is active
   */
  isActive() {
    return this.connected && this.dc !== null;
  }

  /**
   * Update the WebRTC status visual indicator
   */
  updateStatusIndicator() {
    // Check if we were connected before (to distinguish "never connected" vs "disconnected")
    const wasConnected = sessionStorage.getItem('webrtc_connected') === 'true';

    let status, role;

    if (this.connected && this.dc && this.dc.readyState === 'open') {
      // ✅ CONNECTED
      status = "connected";
      role = this.isOfferor ? "offeror" : "answerer";
    } else if (wasConnected && !this.connected) {
      // ❌ DISCONNECTED (was connected before, not anymore)
      status = "disconnected";
      role = this.isOfferor ? "offeror" : "answerer";
    } else {
      // ⚪ Offline (never connected)
      status = "standalone";
      role = null;
    }

    // Call the React function if available
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
   * Get the role (host/guest)
   */
  getRole() {
    const role = this.isOfferor ? "host" : "guest";
    return role;
  }
}

// Create a global instance
window.webrtcSync = new WebRTCSync();

// Export pour modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = WebRTCSync;
}
