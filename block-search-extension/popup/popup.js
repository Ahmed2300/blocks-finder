let contentScriptReady = false;
let searchBuffer = [];
let activeTabId = null;
  
  // Function to send message to the content script
  function sendMessageToContentScript(message, callback) {
      if (activeTabId) {
          chrome.tabs.sendMessage(activeTabId, message, callback);
      } else {
          console.error("Blockly Search: No active tab ID available.");
      }
  }
  
  // Function to send search query to the content script
  function performSearch(text) {
      if (contentScriptReady) {
          sendMessageToContentScript({ action: 'searchBlocks', text: text }, (response) => {
              if (chrome.runtime.lastError) {
                  console.warn("Blockly Search: Could not send message to content script.", chrome.runtime.lastError.message);
              } else {
                  // Handle response from content script
              }
          });
      } else {
          console.log("Blockly Search: Content script not ready. Buffering search query.");
          searchBuffer.push(text);
      }
  }
  
  // Listen for the content script ready message
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'contentScriptReady') {
          console.log("Blockly Search: Content script is ready.");
          contentScriptReady = true;
          // Send any buffered search queries
          while (searchBuffer.length > 0) {
              const bufferedText = searchBuffer.shift();
              performSearch(bufferedText);
          }
      }
  });
  
  // Function to send handshake to the content script
  function sendHandshake() {
      if (activeTabId) {
          sendMessageToContentScript({ action: 'handshake' }, (response) => {
              if (chrome.runtime.lastError) {
                console.error("Blockly Search: handshake message could not be sent", chrome.runtime.lastError.message);
              }
          });
      }
  }
  
  // Get the active tab on load
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
          activeTabId = tabs[0].id;
          sendHandshake();
      }
  });
  
  // Event listeners for the search button and input
  document.getElementById('searchBtn').addEventListener('click', () => performSearch(document.getElementById('searchInput').value));
  document.getElementById('searchInput').addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
          event.preventDefault();
          performSearch(document.getElementById('searchInput').value);
      }
  });
  
  // Focus the input field when the popup opens
  document.addEventListener('DOMContentLoaded', () => document.getElementById('searchInput').focus());
