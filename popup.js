// Popup script for RYM Chart Scraper

document.addEventListener("DOMContentLoaded", function () {
  const scrapeButton = document.getElementById("scrape-button");
  const goToRymButton = document.getElementById("go-to-rym");
  const statusElement = document.getElementById("status");
  const notRymElement = document.getElementById("not-rym");
  const rymContentElement = document.getElementById("rym-content");

  // Check if we're on a RYM page
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentUrl = tabs[0].url;
    const isRymPage = currentUrl.includes("rateyourmusic.com");
    const isChartPage =
      isRymPage &&
      (currentUrl.includes("/charts/") ||
        currentUrl.includes("/list/") ||
        currentUrl.includes("/genre/"));

    if (isRymPage) {
      notRymElement.style.display = "none";
      rymContentElement.style.display = "block";

      if (!isChartPage) {
        statusElement.textContent =
          "This appears to be a RYM page, but not a chart page. Extraction might not work correctly.";
        statusElement.className = "warning";
      } else {
        statusElement.textContent =
          "Ready to extract album data from this chart. Click the button above.";
      }
    } else {
      notRymElement.style.display = "block";
      rymContentElement.style.display = "none";
    }
  });

  // Handle scrape button click
  scrapeButton.addEventListener("click", function () {
    statusElement.textContent = "Extracting album data...";
    statusElement.className = "";
    scrapeButton.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // First check if the content script is already injected
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "ping" },
        function (response) {
          if (chrome.runtime.lastError) {
            // Content script not yet injected, inject it first
            chrome.scripting
              .executeScript({
                target: { tabId: tabs[0].id },
                files: ["content.js"],
              })
              .then(() => startScraping(tabs[0].id))
              .catch(handleError);
          } else {
            // Content script already injected, start scraping
            startScraping(tabs[0].id);
          }
        }
      );
    });
  });

  function startScraping(tabId) {
    // Send message to content script to start scraping
    chrome.tabs.sendMessage(tabId, { action: "scrape" }, function (response) {
      if (chrome.runtime.lastError) {
        handleError(chrome.runtime.lastError);
      } else if (response && response.success) {
        statusElement.textContent = `Success! Found ${response.albumCount} albums.`;
        statusElement.className = "success";
      } else {
        statusElement.textContent = response
          ? response.message
          : "Failed to extract data.";
        statusElement.className = "error";
      }
      scrapeButton.disabled = false;
    });
  }

  function handleError(err) {
    statusElement.textContent = "Error: " + (err.message || err);
    statusElement.className = "error";
    scrapeButton.disabled = false;
    console.error("Scraper error:", err);
  }

  // Go to RYM button click
  goToRymButton.addEventListener("click", function () {
    chrome.tabs.create({ url: "https://rateyourmusic.com/charts/" });
  });
});
