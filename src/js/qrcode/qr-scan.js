async function startScanner() {
  setTimeout(async () => {
    // Find the visible scan frame
    const scanFrame = document.querySelector(
      '.scan-frame:not([style*="display: none"])'
    );
    const scanFrameInterviewee = document.querySelector(
      '.scan-frame-interviewee:not([style*="display: none"])'
    );

    if (!scanFrame && !scanFrameInterviewee) {
      alert("Scan frame not found!");
      return;
    }

    // Create and style the video element
    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    Object.assign(video.style, {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: 1,
    });

    // Prepare scan frame for video
    if (scanFrame) {
      scanFrame.style.position = "relative";
      scanFrame.style.overflow = "hidden";
      scanFrame.insertBefore(video, scanFrame.firstChild);
    }
    if (scanFrameInterviewee) {
      scanFrameInterviewee.style.position = "relative";
      scanFrameInterviewee.style.overflow = "hidden";
      scanFrameInterviewee.insertBefore(video, scanFrameInterviewee.firstChild);
    }

    let stream = null,
      detector = null,
      rafId = null;

    // Add a cancel button overlay (optional, or use existing UI button)
    // If you want to add a cancel button inside the scan frame, you can do so here.

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      console.error("getUserMedia failed", err);
      alert("Impossible d'accéder à la caméra: " + (err.message || err));
      stopScanner();
      return;
    }

    // BarcodeDetector logic
    if ("BarcodeDetector" in window) {
      try {
        const supported = await BarcodeDetector.getSupportedFormats();
        if (supported.includes("qr_code"))
          detector = new BarcodeDetector({ formats: ["qr_code"] });
      } catch (e) {
        console.warn(e);
      }
    }

    // Info message (optional: you can show a message in your UI if needed)

    if (detector) {
      const loop = async () => {
        try {
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length) {
            applyScannedValue(barcodes[0].rawValue);
            stopScanner();
            return;
          }
        } catch (e) {
          console.warn("detect error", e);
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    } else {
      // Optionally, show a message in your UI
      alert("Scan non supporté par ce WebView. Ajoute jsQR si besoin.");
      console.warn("BarcodeDetector absent");
    }

    // Clean up: remove video and stop stream
    function stopScanner() {
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (video && video.parentNode) video.parentNode.removeChild(video);
    }
  }, 50);
}
function applyScannedValue(value) {
  // Use the handleScannedData function from webrtc-onboarding.js if available
  if (typeof window.handleScannedData === "function") {
    window.handleScannedData(value);
  } else {
    // Fallback to direct textarea assignment
    const ta = document.querySelectorAll("textarea")[1]; // Second textarea
    if (ta) {
      ta.value = value;
      ta.focus();
      // Trigger input event to activate button
      ta.dispatchEvent(new Event("input"));
    }
  }
}

// Note: Event listeners are now attached in webrtc-onboarding.js
