import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

let mounted = false;

function mountReact() {
  if (mounted) return;

  const host = document.getElementById("vibeai-overlay-host");
  if (!host) {
    console.warn("[FoldSpace] Host not found, retrying...");
    setTimeout(mountReact, 500);
    return;
  }

  const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
  let container = shadow.getElementById("vibeai-react-root");

  if (!container) {
    container = document.createElement("div");
    container.id = "vibeai-react-root";
    shadow.appendChild(container);
  }

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  console.log("[FoldSpace] ✅ React app mounted successfully in Shadow DOM.");
  mounted = true;
}

console.log("[FoldSpace] VibeAI Sidebar mount initialized.");
mountReact();
