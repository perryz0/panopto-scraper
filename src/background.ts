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
 * Fetches the MP4 video URL for a given DeliveryID.
 * @param deliveryId - The Panopto session DeliveryID.
 * @returns The direct MP4 URL or null.
 */
async function getMp4UrlFromDeliveryId(deliveryId: string): Promise<string | null> {
  const deliveryInfoUrl = `/Panopto/Pages/Viewer/DeliveryInfo.aspx?deliveryId=${deliveryId}`;
  try {
    const response = await fetch(deliveryInfoUrl, { credentials: 'include' });
    if (!response.ok) return null;
    const data = await response.json();
    const streams = data?.Delivery?.Streams || [];
    // Find the best MP4 stream
    const mp4Stream = streams.find((s: any) => s.StreamType === 'mp4');
    return mp4Stream?.StreamUrl || null;
  } catch (e) {
    return null;
  }
}
  
/**
 * Initiates download process for the given video sessions.
 * For each session, fetches the real MP4 URL before downloading.
 * @param sessions - An array of session objects with download details.
 */
async function processDownloadQueue(sessions: Session[]): Promise<void> {
  for (const session of sessions) {
    console.log('[PanoptoScraper] Processing session:', session.sessionName, 'DeliveryID:', session.DeliveryID, 'videoURL:', session.videoURL);
    const folderName = normalizeName(session.folderName);
    const sessionName = normalizeName(session.sessionName);
    const filename = `${Math.round(session.date / 1000)}-${sessionName}.mp4`;
    let mp4Url: string | null = null;
    let deliveryInfoData: any = null;
    if (session.DeliveryID) {
      try {
        const deliveryInfoUrl = `/Panopto/Pages/Viewer/DeliveryInfo.aspx?deliveryId=${session.DeliveryID}`;
        console.log('[PanoptoScraper] Fetching delivery info:', deliveryInfoUrl);
        const response = await fetch(deliveryInfoUrl, { credentials: 'include' });
        if (!response.ok) {
          console.error('[PanoptoScraper] Delivery info fetch failed:', response.status, response.statusText);
        } else {
          deliveryInfoData = await response.json();
          console.log('[PanoptoScraper] Delivery info response:', deliveryInfoData);
          const streams = deliveryInfoData?.Delivery?.Streams || [];
          const mp4Stream = streams.find((s: any) => s.StreamType === 'mp4');
          mp4Url = mp4Stream?.StreamUrl || null;
          if (!mp4Url) {
            console.warn('[PanoptoScraper] No MP4 stream found in delivery info for:', session.sessionName, 'Streams:', streams);
          }
        }
      } catch (err) {
        console.error('[PanoptoScraper] Error fetching/parsing delivery info:', err);
      }
    }
    let downloadUrl = mp4Url;
    if (!mp4Url && session.videoURL && session.videoURL.endsWith('.mp4')) {
      downloadUrl = session.videoURL;
      console.warn('[PanoptoScraper] Fallback to videoURL for:', session.sessionName, downloadUrl);
    }
    if (!downloadUrl) {
      createChromeNotification(`Failed to get MP4 for: ${session.sessionName}`);
      console.error('[PanoptoScraper] Failed to get MP4 URL for:', session.sessionName, 'DeliveryID:', session.DeliveryID, 'videoURL:', session.videoURL, 'deliveryInfoData:', deliveryInfoData);
      continue;
    }
    try {
      chrome.downloads.download({
        url: downloadUrl,
        filename: `${folderName}/${filename}`,
        conflictAction: "prompt",
        method: "GET",
      });
      createChromeNotification(`Started downloading: "${session.sessionName}"`);
      console.log('[PanoptoScraper] Download started for:', session.sessionName, downloadUrl);
    } catch (err) {
      createChromeNotification(`Download failed for: ${session.sessionName}`);
      console.error('[PanoptoScraper] Download failed for:', session.sessionName, err, 'Download URL:', downloadUrl);
    }
  }
}
  
/**
 * Handles incoming messages and routes them to the appropriate function.
 * @param message - The received message object.
 * @param sender - The sender of the message.
 * @param sendResponse - The function to send a response (if applicable).
 */
function handleMessage(message: Message, _sender: chrome.runtime.MessageSender, _sendResponse: (response?: any) => void): void {
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
  DeliveryID?: string;
}

interface Message {
  downloadQueue?: Session[];
}

// Initialize the background service
initializeBackgroundService();
