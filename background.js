// Background script for RYM Chart Scraper

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "download") {
    try {
      // Download the file using the downloads API
      chrome.downloads.download(
        {
          url: message.url,
          filename: message.filename,
          saveAs: true,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error("Download error:", chrome.runtime.lastError);
            if (sendResponse) {
              sendResponse({
                success: false,
                error: chrome.runtime.lastError.message,
              });
            }
          } else {
            console.log("Download started with ID:", downloadId);
            if (sendResponse) {
              sendResponse({ success: true, downloadId });
            }
          }
        }
      );

      // Cleanup URL object after download starts
      setTimeout(() => {
        if (message.url.startsWith("blob:")) {
          URL.revokeObjectURL(message.url);
        }
      }, 1000);

      return true; // Keep the message channel open for the async response
    } catch (error) {
      console.error("Error in background script:", error);
      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }
    }
  }
});

// Open charts page when extension is installed
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: "https://rateyourmusic.com/charts/",
    });
  }
});
