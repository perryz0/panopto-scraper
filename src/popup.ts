/**
 * @file popup.ts
 * @description Handles the user interface logic for the Chrome extension popup. 
 *              Displays session information, download buttons, and other controls
 *              to interact with the Panopto sessions.
 * @authors Perry Chien <peichi1@uw.edu>
 * 
 * Features:
 * - Fetches session details from content scripts.
 * - Renders session and folder data dynamically in the popup.
 * - Initiates download requests for individual or all sessions.
 */

/**
 * Creates the popup header with the folder name and a "Download All" button.
 * @param folderName - The name of the Panopto folder.
 * @param sessions - The list of session data.
 */
function renderHeader(folderName: string, sessions: Session[]): void {
    const container = document.getElementById("heading-container")!;
    const heading = document.createElement("h2");
    heading.textContent = folderName;
  
    const downloadAllButton = document.createElement("button");
    downloadAllButton.textContent = "Download All";
    downloadAllButton.id = "download-all";
    downloadAllButton.onclick = () => sendDownloadRequest(sessions);
  
    container.appendChild(heading);
    container.appendChild(downloadAllButton);
  }
  
  /**
   * Creates a single session entry in the popup with a download button.
   * @param session - The session data to render.
   * @returns A DOM element representing the session.
   */
  function createSessionEntry(session: Session): HTMLElement {
    const sessionElement = document.createElement("div");
    sessionElement.className = "session-entry";
  
    const sessionName = document.createElement("p");
    sessionName.textContent = session.sessionName;
  
    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Download";
    downloadButton.className = "download-btn";
    downloadButton.onclick = () => sendDownloadRequest([session]);
  
    sessionElement.appendChild(sessionName);
    sessionElement.appendChild(downloadButton);
  
    return sessionElement;
  }
  
  /**
   * Renders the list of Panopto sessions in the popup.
   * @param sessions - The list of session data.
   */
  function renderSessions(sessions: Session[]): void {
    const sessionList = document.getElementById("session-list")!;
    sessionList.innerHTML = ""; // Clear any existing content
  
    for (const session of sessions) {
      const sessionEntry = createSessionEntry(session);
      sessionList.appendChild(sessionEntry);
      sessionList.appendChild(document.createElement("hr"));
    }
  }
  
  /**
   * Displays an error message in the popup.
   * @param message - The error message to display.
   */
  function displayError(message: string): void {
    const sessionList = document.getElementById("session-list")!;
    sessionList.innerHTML = `<h3>${message}</h3>`;
  }
  
  /**
   * Sends a download request to the background script.
   * @param sessions - The list of sessions to download.
   */
  function sendDownloadRequest(sessions: Session[]): void {
    chrome.runtime.sendMessage({ downloadQueue: sessions });
  }
  
  /**
   * Parses and sorts Panopto session data from the response object.
   * @param response - The raw response from the Panopto API.
   * @returns A list of parsed and sorted session data.
   */
  function parseSessionData(response: PanoptoResponse): Session[] {
    return response.d.Results.map((video) => {
      const videoURL = video.IosVideoUrl?.replace(/\\/g, "") || 
        `${video.ViewerUrl.split("Panopto")[0]}Panopto/Podcast/Embed/${video.DeliveryID}.mp4`;
  
      return {
        folderName: video.FolderName,
        sessionName: video.SessionName,
        videoURL,
        date: parseInt(video.StartTime.match(/Date\(([0-9]+)\)/i)![1], 10),
      };
    }).sort((a, b) => b.date - a.date); // Sort by date descending
  }
  
  /**
   * Handles messages from content scripts to render the popup.
   * @param message - The message received from content scripts.
   */
  function handleContentMessage(message: any): void {
    if (message.panoptoResponse) {
      const sessions = parseSessionData(message.panoptoResponse);
      renderHeader(sessions[0]?.folderName || "Panopto", sessions);
      renderSessions(sessions);
    } else {
      displayError("Sorry, an error occurred while fetching sessions.");
    }
  }
  
  /**
   * Initializes the popup and sends a request to fetch session data.
   */
  function initializePopup(): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
  
      if (currentTab?.url?.includes("Panopto")) {
        chrome.tabs.sendMessage(currentTab.id!, { parseURL: currentTab.url });
      } else {
        displayError("This doesn't appear to be a Panopto page.");
      }
    });
  }
  
  // Add listener for messages from content scripts
  chrome.runtime.onMessage.addListener(handleContentMessage);
  
  // Initialize the popup when the DOM is fully loaded
  window.onload = initializePopup;
  
  // --------- Types
  
  interface Session {
    folderName: string;
    sessionName: string;
    videoURL: string;
    date: number;
  }
  
  interface PanoptoResponse {
    d: {
      Results: Array<{
        FolderName: string;
        SessionName: string;
        IosVideoUrl: string;
        ViewerUrl: string;
        DeliveryID: string;
        StartTime: string;
      }>;
    };
  }
  