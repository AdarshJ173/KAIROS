// background.js for SOTA Todo Extension
console.log("SOTA Todo Service Worker initialized!");

// Listen for the keyboard shortcut command
chrome.commands.onCommand.addListener((command) => {
  console.log("Keyboard command received:", command);
  if (command === "toggle-todo-overlay") {
    triggerToggle();
  }
});

// Listen for clicks on the extension action (toolbar icon)
chrome.action.onClicked.addListener(() => {
  console.log("Extension action icon clicked!");
  triggerToggle();
});

// Helper function to send toggle command to active tab
function triggerToggle() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const activeTab = tabs[0];
      // Do not try to inject into chrome:// or chrome-extension:// pages
      if (activeTab.url && (activeTab.url.startsWith("chrome://") || activeTab.url.startsWith("chrome-extension://"))) {
        console.warn("Cannot show SOTA Todo overlay on chrome:// pages");
        return;
      }
      
      chrome.tabs.sendMessage(activeTab.id, { action: "toggle-todo-overlay" }, (response) => {
        // If content script is not loaded, dynamically inject it
        if (chrome.runtime.lastError) {
          console.log("Content script not loaded on active tab. Injecting dynamically...");
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ["content.js"]
          }, () => {
            if (chrome.runtime.lastError) {
              console.error("Failed to inject content script:", chrome.runtime.lastError.message);
            } else {
              // Send the toggle command again once injected
              setTimeout(() => {
                chrome.tabs.sendMessage(activeTab.id, { action: "toggle-todo-overlay" });
              }, 150);
            }
          });
        }
      });
    }
  });
}
