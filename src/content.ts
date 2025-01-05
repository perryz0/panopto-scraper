/**
 * @file content.ts
 * @description Interacts with Panopto web pages to extract relevant session data.
 * @authors Perry Chien <peichi1@uw.edu>
 * 
 * Features:
 * - Parses folder and session data from Panopto pages.
 * - Communicates with the background script to fetch or send data.
 * - Sends extracted data to the popup for rendering.
 * 
 * Runs in the context of the Panopto web page.
 */



/**
 * Extracts the folder ID from a Panopto URL.
 * @param url - The URL to extract the folder ID from.
 * @returns The folder ID if found, otherwise null.
 */
function getFolderID(url: string): string | null {
  const decodedURL = decodeURIComponent(url);
  const match = decodedURL.match(/#folderID="([0-9a-fA-F\-]+)"/);
  return match ? match[1] : null;
}

/**
 * Parses the sessions from the Panopto API.
 * @param url - The Panopto URL to parse sessions for.
 */
async function parseSessions(url: string): Promise<void> {
  const folderID = getFolderID(url);
  if (!folderID) {
      console.error("Folder ID not found in URL.");
      chrome.runtime.sendMessage({ panoptoResponse: false });
      return;
  }

  const postURL = new URL("/Panopto/Services/Data.svc/GetSessions", url).toString();
  const payload = {
      queryParameters: {
          maxResults: 999,
          folderID,
      },
  };

  try {
      const response = await fetch(postURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      chrome.runtime.sendMessage({ panoptoResponse: data });
  } catch (error) {
      console.error("Error fetching sessions:", error);
      chrome.runtime.sendMessage({ panoptoResponse: false });
  }
}

/**
 * Message handler that parses video URLs for current session.
 */
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.parseURL) {
    parseSessions(message.parseURL);
  }
});
