import React from "react";
import { createRoot } from "react-dom/client";
import Sidebar from "./Sidebar.jsx";

let root = null;

// Function to initialize the sidebar
function initializeSidebar() {
  // Check if user is the interviewer (host)
  const isInterviewer = sessionStorage.getItem("webrtc_isOfferor") === "true";

  if (!isInterviewer) {
    return;
  }

  // Create container if necessary
  let container = document.getElementById("sidebar-root");
  // using the first element of the page to insert
  let firstElement = document.querySelector(".dev-speed-dial");
  if (!container) {
    container = document.createElement("div");
    container.id = "sidebar-root";
    // document.body.appendChild(container);
    document.body.insertBefore(container, firstElement);
  }

  // Mount the React component
  if (!root) {
    root = createRoot(container);
    root.render(<Sidebar />);
  }
}

// Listen for the event indicating the app is displayed
document.addEventListener("lifestoriesShown", initializeSidebar);
