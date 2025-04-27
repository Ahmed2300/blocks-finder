# **App Name**: Blockly Finder

## Core Features:

- Search Input: Display a search input box in a popup window.
- Block Highlighting: Highlight matching blocks in the Blockly workspace.
- Scroll to Block: Scroll the first matching block into view.

## Style Guidelines:

- Primary color: Light gray (#F0F0F0) for a clean interface.
- Secondary color: White (#FFFFFF) for contrast and readability.
- Accent color: Teal (#008080) for buttons and highlights.
- Simple and clean layout for the popup window.
- Use clear and recognizable icons for search actions.

## Original User Request:
Below is a step-by-step guide to building a Manifest V3 Chrome extension that injects a search UI into the App Inventor/Blockly workspace, traverses all blocks, filters by user query, highlights matching blocks, and scrolls them into view. We’ll cover:

    Architecture & Manifest

    Interacting with Blockly’s API

    Content Script Logic

    Popup UI & Message Passing

    Performance & Testing

Summary

You’ll create a Chrome extension (Manifest V3) with a popup search box. When the user enters a query, the popup sends it to a content script injected into the App Inventor page. The content script calls workspace.getAllBlocks() to retrieve all blocks
Google for Developers
, filters them by matching text or field values, highlights each match via blockSvg.setHighlighted(true)
Google for Developers
, and scrolls the first match into view. Communication between popup and content script uses chrome.runtime.sendMessage() and listeners
Chrome for Developers
. Below you’ll find the folder structure, manifest.json, UI files, and JavaScript snippets to get you started.
1. Extension Architecture & Manifest
1.1 Folder Structure

block-search-extension/
├── manifest.json
├── popup/
│   ├── popup.html
│   └── popup.js
└── content_scripts/
    └── content.js

This follows standard Chrome Extension layout
DEV Community
.
1.2 manifest.json (Manifest V3)

{
  "manifest_version": 3,
  "name": "Blockly Block Search",
  "version": "1.0",
  "description": "Search and highlight blocks in App Inventor workspace",
  "permissions": ["scripting", "activeTab"],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["*://*.appinventor.mit.edu/*"],
      "js": ["content_scripts/content.js"]
    }
  ]
}

    scripting & activeTab: allow programmatic injection and interaction with the current page
    Chrome for Developers
    .

    matches: target App Inventor’s block editor URL pattern.

2. Interacting with Blockly’s API
2.1 Retrieving All Blocks

Use the getAllBlocks() method on the workspace instance (usually Blockly.getMainWorkspace() or Blockly.getMainWorkspace().getAllBlocks() in App Inventor) to get an array of all BlockSvg objects
Google for Developers
.
2.2 Highlighting Matches

Once you identify a matching block, call blockSvg.setHighlighted(true) to visually mark it
Google for Developers
. Optionally reset non-matches with setHighlighted(false).
2.3 Scrolling Into View

Each BlockSvg has an SVG root:

const svgRoot = blockSvg.getSvgRoot();
svgRoot.parentElement.scrollIntoView({ behavior: "smooth", block: "center" });

This centers the block in the workspace view.
3. Content Script Logic (content_scripts/content.js)

// Listen for search queries from the popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'searchBlocks') {
    const query = msg.text.toLowerCase();
    const workspace = Blockly.getMainWorkspace();
    const allBlocks = workspace.getAllBlocks(false); // ordered=false :contentReference[oaicite:7]{index=7}
    let firstMatch = null;

    allBlocks.forEach(block => {
      // Combine type name and field values for matching
      const text = (block.type + ' ' +
        block.inputList.map(input =>
          input.fieldRow.map(field => field.getText()).join(' ')
        ).join(' ')
      ).toLowerCase();

      const isMatch = query && text.includes(query);
      block.svg_ && block.svg_.setHighlighted(isMatch); // highlight via BlockSvg :contentReference[oaicite:8]{index=8}

      if (isMatch && !firstMatch) {
        firstMatch = block;
      }
    });

    // Scroll to the first match, if any
    if (firstMatch) {
      const root = firstMatch.svg_.getSvgRoot();
      root.parentElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
});

    Message listener: using chrome.runtime.onMessage
    Chrome for Developers
    .

    Workspace API: getAllBlocks() for traversal
    Google for Developers
    .

    Highlighting: setHighlighted() on BlockSvg
    Google for Developers
    .

4. Popup UI & Message Passing
4.1 popup.html

<!doctype html>
<html>
<head>
  <style>
    body { margin: 10px; font-family: sans-serif; }
    input { width: 200px; padding: 5px; }
    button { margin-left: 5px; }
  </style>
</head>
<body>
  <input id="searchInput" type="text" placeholder="Search blocks…"/>
  <button id="searchBtn">Go</button>
  <script src="popup.js"></script>
</body>
</html>

4.2 popup.js

document.getElementById('searchBtn').addEventListener('click', () => {
  const text = document.getElementById('searchInput').value;
  // Send the query to the content script in the active tab :contentReference[oaicite:12]{index=12}
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'searchBlocks', text });
  });
});

    chrome.tabs.query + sendMessage: routes the search term to your content.js listener
    Stack Overflow
    .

5. Performance & Testing

    Debounce Input: If you want live-search as the user types, debounce the input so you’re not iterating 7 000 blocks on every keystroke.

    Batch Highlighting: For very large workspaces, consider highlighting only the first N matches or clustering highlights.

    Profiling: Use Chrome’s Performance tab to ensure that calling getAllBlocks() and setting highlights remains under ~50 ms even on massive projects.

6. Next Steps & Optimization

    Fallback for Legacy AI2 Version

        The stable App Inventor still uses Blockly 2017 and may not expose Blockly.getMainWorkspace(). You may need to inject a small script into page context to bridge the isolated world
        Stack Overflow
        .

    Enhanced UI

        Add keyboard shortcuts (e.g. Ctrl + F binding in content script) to open the search popup.

        Show match counts and “next/previous” buttons to navigate between matches.

    Open-Source & Community

        Publish your extension on GitHub and the Chrome Web Store.

        Invite feedback on the App Inventor forum to refine search and visualization features.
  