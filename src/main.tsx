import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

async function clearDevServiceWorkers() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(
      cacheKeys
        .filter((key) => key.startsWith("learn-english-shell-"))
        .map((key) => caches.delete(key))
    );
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    if (import.meta.env.DEV) {
      void clearDevServiceWorkers();
      return;
    }

    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // The app still works fine without the service worker.
    });
  });
}

registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
