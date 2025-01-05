/**
 * @file background.ts
 * @description Manages communication between popup, content scripts, and Chrome APIs.
 * @authors Perry Chien <peichi1@uw.edu>
 * 
 * Features:
 * - Handles downloads of Panopto videos.
 * - Creates Chrome notifications for download progress and completion.
 * - Orchestrates communication between popup and content scripts.
 */



/**
 * Normalizes file or folder names by replacing invalid characters.
 * @param name - The input string to normalize.
 * @returns A normalized string with invalid characters replaced.
 */
function normalizeName(name: string): string {
  return name.replace(/[ ,;:\/\\\.]/g, "_").replace(/(-|_)+/g, "_");
}
  
/**
 * Creates a Chrome notification with the specified message and title.
 * @param message - The notification message.
 * @param title - Notification title, defaults to "Panopto Scraper".
 */
function createChromeNotification(message: string, title: string = "Panopto Scraper"): void {
  chrome.notifications.create({
    iconUrl: "../icons/icon_64.png",
    message,
    title,
    type: "basic",
  });
}
  
/**
 * Initiates download process for the given video sessions.
 * @param sessions - An array of session objects with download details.
 */
function processDownloadQueue(sessions: Session[]): void {
  for (const session of sessions) {
    const folderName = normalizeName(session.folderName);
    const sessionName = normalizeName(session.sessionName);
    const filename = `${Math.round(session.date / 1000)}-${sessionName}.mp4`;

    // Send a Chrome download request
    chrome.downloads.download({
      url: session.videoURL,
      filename: `${folderName}/${filename}`,
      conflictAction: "prompt", // Prompts if file exists
      method: "GET",
    });

    // Notify user about the download initiation
    createChromeNotification(`Started downloading: "${session.sessionName}"`);
  }
}
  
/**
 * Handles incoming messages and routes them to the appropriate function.
 * @param message - The received message object.
 * @param sender - The sender of the message.
 * @param sendResponse - The function to send a response (if applicable).
 */
function handleMessage(message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): void {
  if (message.downloadQueue) {
    processDownloadQueue(message.downloadQueue);
  }
}

/**
 * Registers the background script to listen for messages.
 */
function initializeBackgroundService(): void {
  chrome.runtime.onMessage.addListener(handleMessage);
}
  

  
/** TYPES */

interface Session {
  folderName: string;
  sessionName: string;
  videoURL: string;
  date: number;
}

interface Message {
  downloadQueue?: Session[];
}

// Initialize the background service
initializeBackgroundService();
