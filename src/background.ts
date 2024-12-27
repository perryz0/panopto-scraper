/**
 * @file background.ts
 * @description Manages core extension logic and acts as a service worker for 
 *              communication between popup, content scripts, and Chrome APIs.
 * @authors Perry Chien <peichi1@uw.edu>
 * 
 * Features:
 * - Handles downloads of Panopto videos.
 * - Creates notifications for download progress and completion.
 * - Orchestrates communication between the popup and content scripts.
 */
