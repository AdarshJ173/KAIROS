// content.js for SOTA Todo Extension
console.log("SOTA Todo Content Script loaded on page:", window.location.href);

(function () {
  // Prevent duplicate insertion
  const containerId = "sota-todo-extension-root";
  let container = document.getElementById(containerId);

  if (!container) {
    console.log("SOTA Todo: Creating overlay container element...");
    container = document.createElement("div");
    container.id = containerId;
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100vw";
    container.style.height = "100vh";
    container.style.zIndex = "2147483647";
    container.style.pointerEvents = "none";
    container.style.display = "none";
    
    // Create Shadow DOM to completely isolate extension
    const shadowRoot = container.attachShadow({ mode: "open" });
    
    const iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("index.html");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.pointerEvents = "auto";
    iframe.style.background = "transparent";
    
    shadowRoot.appendChild(iframe);
    (document.body || document.documentElement).appendChild(container);
    console.log("SOTA Todo: Overlay container appended to page.");
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("SOTA Todo Content Script received message:", request);
    if (request.action === "toggle-todo-overlay") {
      toggleOverlay();
      sendResponse({ status: "success" });
    }
  });

  // Listen for messages from inside the React app iframe (e.g. request to close)
  window.addEventListener("message", (event) => {
    if (event.data && event.data.action === "close-sota-todo") {
      hideOverlay();
    }
  });

  function toggleOverlay() {
    if (container.style.display === "none") {
      showOverlay();
    } else {
      hideOverlay();
    }
  }

  function showOverlay() {
    container.style.display = "block";
    container.style.pointerEvents = "auto";
    // Notify the iframe that it has been shown so it can focus inputs
    const shadow = container.shadowRoot;
    if (shadow) {
      const iframe = shadow.querySelector("iframe");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ action: "overlay-shown" }, "*");
      }
    }
  }

  function hideOverlay() {
    container.style.display = "none";
    container.style.pointerEvents = "none";
  }
})();
