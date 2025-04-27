
// Function to send search query to the content script
function performSearch() {
  const inputElement = document.getElementById('searchInput');
  const text = inputElement.value;

  // Get the currently active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Ensure we have a valid tab ID
    if (tabs.length > 0 && tabs[0].id) {
      // Send message to the content script of the active tab
      chrome.tabs.sendMessage(tabs[0].id, { action: 'searchBlocks', text: text }, (response) => {
        if (chrome.runtime.lastError) {
          // Handle potential errors (e.g., content script not ready or incorrect URL)
          console.warn("Blockly Search: Could not send message to content script.", chrome.runtime.lastError.message);
          // Optionally provide user feedback here
        } else {
          // Handle response from content script if needed (e.g., match count)
          // console.log("Search message sent. Response:", response);
        }
      });
    } else {
      console.error("Blockly Search: Could not get active tab ID.");
    }
  });
}

// Add event listener for the search button click
document.getElementById('searchBtn').addEventListener('click', performSearch);

// Add event listener for Enter key press in the search input
document.getElementById('searchInput').addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent default form submission behavior if it were in a form
    performSearch();
  }
});

// Automatically focus the input field when the popup opens
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput').focus();
});
