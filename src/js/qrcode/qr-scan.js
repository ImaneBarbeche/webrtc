async function startScanner() {
  // Quick test to check if the camera is accessible at all
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(() => console.log("Camera OK"))
    .catch((err) => console.log("Camera error:", err.name, err.message));

  // Delay to ensure the UI has finished rendering (important for layout)
  setTimeout(async () => {

    /**
     * Utility: Check if an element is truly visible on screen.
     * This checks:
     *  - its own display/visibility
     *  - all parent elements up to <body>
     */
    function isVisible(element) {
      if (!element) return false;

      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") {
        return false;
      }

      // Check parent visibility as well
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const parentStyle = window.getComputedStyle(parent);
        if (
          parentStyle.display === "none" ||
          parentStyle.visibility === "hidden"
        ) {
          return false;
        }
        parent = parent.parentElement;
      }

      return true;
    }

    // Try to locate the visible scan frame (interviewer or interviewee)
    const scanFrame = document.querySelector(".scan-frame:not(.hidden)");
    const scanFrameInterviewee = document.querySelector(
      ".scan-frame-interviewee:not(.hidden)"
    );

    // Determine which frame is actually visible
    let targetFrame = null;
    if (isVisible(scanFrame)) {
      targetFrame = scanFrame;
    } else if (isVisible(scanFrameInterviewee)) {
      targetFrame = scanFrameInterviewee;
    }

    if (!targetFrame) {
      console.error("No visible scan frame found!");
      alert("Scan frame not found!");
      return;
    }

    // Variables used later
    let stream = null;
    let detector = null;
    let scanLoopId = null;
    let video = null;

    try {
      /**
       * STEP 1 — Request camera access
       * We request the environment-facing camera with ideal resolution.
       */
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      /**
       * STEP 2 — Create the <video> element that will display the camera feed
       */
      video = document.createElement("video");
      video.setAttribute("playsinline", ""); // Prevents fullscreen on iOS
      video.setAttribute("autoplay", "");
      video.setAttribute("muted", ""); // Required for autoplay on some browsers

      // Style the video to fill the scan frame
      Object.assign(video.style, {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: 10,
        pointerEvents: "none", // Prevents blocking clicks
      });

      /**
       * STEP 3 — Prepare the scan frame container
       */
      targetFrame.style.position = "relative";
      targetFrame.style.overflow = "hidden";

      // Hide the scan button if present
      const btn = targetFrame.querySelector(".scan-btn");
      if (btn) btn.style.display = "none";

      // Insert the video as the first child of the frame
      targetFrame.insertBefore(video, targetFrame.firstChild);

      /**
       * STEP 4 — Attach the camera stream and wait for the video to be ready
       */
      video.srcObject = stream;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve).catch(reject);
        };
        video.onerror = reject;
      });

    } catch (err) {
      console.error("getUserMedia failed", err);
      alert("Unable to access the camera: " + (err.message || err));
      stopScanner();
      return;
    }

    /**
     * STEP 5 — Initialize BarcodeDetector if supported
     */
    if ("BarcodeDetector" in window) {
      try {
        const supported = await BarcodeDetector.getSupportedFormats();
        if (supported.includes("qr_code")) {
          detector = new BarcodeDetector({ formats: ["qr_code"] });
        }
      } catch (e) {
        console.warn(e);
      }
    }

    /**
     * STEP 6 — If BarcodeDetector is available, start scanning loop
     */
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
        scanLoopId = requestAnimationFrame(loop);
      };

      scanLoopId = requestAnimationFrame(loop);

    } else {
      // No native QR scanning support
      alert("Scanning not supported by this WebView. Add jsQR if needed.");
      console.warn("BarcodeDetector absent");
    }

    /**
     * STEP 7 — Cleanup function: stop camera + remove video element
     */
    function stopScanner() {
      if (scanLoopId) cancelAnimationFrame(scanLoopId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (video && video.parentNode) video.parentNode.removeChild(video);
    }

  }, 50); // Small delay to ensure layout is ready
}

/**
 * Apply the scanned QR value to the UI.
 * If handleScannedData() exists, use it.
 * Otherwise, fallback to writing into the second <textarea>.
 */
function applyScannedValue(value) {
    console.log("SCANNED VALUE:", JSON.stringify(value));
  if (typeof window.handleScannedData === "function") {
    window.handleScannedData(value);
  } else {
    const textarea = document.querySelectorAll("textarea")[1];
    if (textarea) {
      textarea.value = value;
      textarea.focus();
      textarea.dispatchEvent(new Event("input")); // Trigger UI updates
    }
  }
}
