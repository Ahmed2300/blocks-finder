
console.log("Blockly Search content script loaded. Waiting for handshake...");

// --- Helper Functions ---

// Send a ready message to the popup
function sendReadyMessage() {
  chrome.runtime.sendMessage({ action: "contentScriptReady" });
}

// --- Message Listener ---

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Blockly Search: Message received", msg);
  if (msg.action === "handshake") {
    sendReadyMessage()
    return true
  }
  // Handle other potential actions here
  return false; // No asynchronous response expected for other actions
});

// Safely get the main Blockly workspace
function getWorkspace() {
  return new Promise((resolve) => {
    const checkBlockly = () => {
      // App Inventor might have Blockly under different global structures
      if (typeof Blockly !== 'undefined' && Blockly.getMainWorkspace) {
        console.log("Blockly Search: Found Blockly.getMainWorkspace()");
        resolve(Blockly.getMainWorkspace());
      } else {
        // Add checks for other potential global names if needed (e.g., for older AI versions)
        console.warn("Blockly Search: Could not find Blockly.getMainWorkspace(). Retrying...");
        setTimeout(checkBlockly, 500); // Check every 500ms
      }
    };
    checkBlockly();
  });
}

// Get searchable text from a block
function getBlockText(block) {
  if (!block) {
    console.log("Blockly Search: getBlockText - Block is null");
    return '';
  }

  let text = block.type || ''; // Start with the block type
  console.log(`Blockly Search: getBlockText - Block type: ${block.type}, Block ID: ${block.id}`);

  // Add text from input fields
  if (block.inputList) {
    block.inputList.forEach(input => {
      if (input.fieldRow) {
        input.fieldRow.forEach(field => {
          // Check if field has getText method and it's not an empty string
          if (field && typeof field.getText === 'function') {
            const fieldValue = field.getText();
            if (fieldValue) {
                text += ' ' + fieldValue;
            }
          }
        });
      }
    });
  }

  // Add comment text if available
  if (block.getCommentText && block.getCommentText()) {
      const commentText = block.getCommentText();
      text += ' ' + commentText;
      console.log(`Blockly Search: getBlockText - Comment text: ${commentText}`);
  }

  return text.toLowerCase().trim();
}

// Highlight or unhighlight a block
function highlightBlock(block, shouldHighlight) {
  if (block && block.svg_ && typeof block.svg_.setHighlighted === 'function') {
    try {
      block.svg_.setHighlighted(shouldHighlight);
    } catch (e) {
      console.warn(`Blockly Search: Error highlighting block ${block.id}:`, e);
    }
  }
}

// Scroll a block into view
function scrollBlockIntoView(block) {
  if (block && block.svg_) {
     const svgRoot = block.svg_.getSvgRoot();
     if (svgRoot && svgRoot.parentElement && typeof svgRoot.parentElement.scrollIntoView === 'function') {
         // Check if the element is actually visible/rendered before scrolling
         if (svgRoot.getBBox().width > 0 && svgRoot.getBBox().height > 0) {
            try {
                // Using 'nearest' can sometimes be less jarring than 'center'
                svgRoot.parentElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
            } catch (e) {
                console.warn(`Blockly Search: Error scrolling block ${block.id} into view:`, e);
                // Fallback if smooth scroll fails
                try {
                    svgRoot.parentElement.scrollIntoView({ block: "nearest", inline: "nearest" });
                } catch (e2) {
                     console.error(`Blockly Search: Failed to scroll block ${block.id} into view entirely:`, e2);
                }
            }
         } else {
             console.log(`Blockly Search: Skipping scroll for non-rendered block ${block.id}`);
         }
     } else {
        console.warn(`Blockly Search: Could not find scrollable parent for block ${block.id}`);
     }
  }
}

// --- Main Search Logic ---

async function searchAndHighlightBlocks(query) {
  const workspace = await getWorkspace();
  if (!workspace) {
    console.error("Blockly Search: Workspace not found.");
    return { matchCount: 0 };
  }

  const lowerCaseQuery = query ? query.toLowerCase().trim() : '';
  const allBlocks = workspace.getAllBlocks(false); // ordered=false for potential performance gain
  let firstMatch = null;
  let matchCount = 0;

  // Clear previous highlights first if query is empty
  if (!lowerCaseQuery) {
      allBlocks.forEach(block => highlightBlock(block, false));
      return { matchCount: 0 };
  }

  // Iterate and highlight/unhighlight blocks
  allBlocks.forEach(block => {
    const blockText = getBlockText(block);
    const isMatch = lowerCaseQuery && blockText.includes(lowerCaseQuery);
    console.log(`Blockly Search: searchAndHighlightBlocks - Block text: ${blockText}, Query: ${lowerCaseQuery}, Is match: ${isMatch}`);

    highlightBlock(block, isMatch);
    console.log(`Blockly Search: highlightBlock called with isMatch: ${isMatch}`);

    if (isMatch) {
      matchCount++;
      if (!firstMatch) {
        firstMatch = block;
      }
    }
  });
  console.log(`Blockly Search: searchAndHighlightBlocks - Match count: ${matchCount}`);

  // Scroll to the first match, if any
  if (firstMatch) {
      // Small delay allows rendering updates before scrolling
      setTimeout(() => scrollBlockIntoView(firstMatch), 50);
  } else if (lowerCaseQuery) {
      console.log(`Blockly Search: No matches found for "${query}"`);
      // Optional: Provide feedback to the user (e.g., via popup)
  }

  console.log(`Blockly Search: Found ${matchCount} matches for "${query}"`);
  return { matchCount: matchCount };
}
