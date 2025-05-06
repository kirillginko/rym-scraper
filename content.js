// Content script for RYM Chart Scraper

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "scrape") {
    const result = scrapeAlbumData();
    sendResponse(result);
  } else if (message.action === "ping") {
    // Respond to ping to confirm content script is loaded
    sendResponse({ status: "ready" });
  }
  return true; // Keep the message channel open for async response
});

// Main function to scrape album data
function scrapeAlbumData() {
  try {
    console.log("RYM Chart Scraper: Starting extraction...");

    // Find all album entries - use multiple selectors to cover different RYM page layouts
    const albumEntries = document.querySelectorAll(
      '.chart_item_release, .page_charts_section_charts_item, .ooookiig, .or_q_albumartist_td, tr.infobox, .the_thing, li[id^="pos"]'
    );

    console.log(
      `Found ${albumEntries.length} album entries using primary selectors`
    );

    // If we didn't find any entries with specific selectors, try a more generic approach
    let entries = albumEntries;
    if (albumEntries.length === 0) {
      // Look for any element that contains both artist and album links
      const containers = document.querySelectorAll("div, tr, li, span");
      const possibleEntries = Array.from(containers).filter((container) => {
        const hasArtistLink =
          container.querySelector('a[href*="/artist/"]') !== null;
        const hasAlbumLink =
          container.querySelector('a[href*="/release/"]') !== null;
        return hasArtistLink && hasAlbumLink;
      });

      console.log(
        `Found ${possibleEntries.length} album entries using fallback detection`
      );
      if (possibleEntries.length > 0) {
        entries = possibleEntries;
      }
    }

    if (entries.length === 0) {
      console.log("No album entries found. This may not be a chart page.");
      return { success: false, message: "No album entries found" };
    }

    // Check if we're on a library music chart page
    const isLibraryMusicChart =
      window.location.href.includes("/g:library-music/") ||
      document.title.toLowerCase().includes("library music");

    // Process albums
    const albums = [];
    let lastPosition = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Extract position/rank
      let position = (lastPosition + 1).toString();
      const rankElement = entry.querySelector(
        '.page_charts_section_charts_item_rank, .chart_position, [class*="rank"], [class*="position"], .pos, .ranking, .rank'
      );
      if (rankElement) {
        const rankText = rankElement.textContent.trim().replace(/[^\d]/g, "");
        if (rankText) position = rankText;
      } else {
        // Try to find position from ID
        const entryId = entry.id || "";
        if (entryId.startsWith("pos")) {
          const posMatch = entryId.match(/\d+/);
          if (posMatch) position = posMatch[0];
        }
      }

      // Extract artist name
      let artistName = "Unknown";

      // Try to get artist name from artist links first (most reliable)
      const artistLinks = entry.querySelectorAll('a[href*="/artist/"]');
      if (artistLinks.length > 0) {
        artistName = Array.from(artistLinks)
          .map((link) => cleanText(link.textContent))
          .filter((text) => text) // Remove empty strings
          .join(" / ");
      } else {
        // Fallback to artist class elements
        const artistElement = entry.querySelector(
          '.artist, [class*="artist"], .anon_name, .page_charts_section_charts_item_credited_name_primary'
        );

        if (artistElement) {
          // Extract just the artist name without the year and album info
          const fullText = artistElement.textContent;
          // Remove year patterns (like 1974) and the word "Album"
          artistName = fullText
            .replace(/\b(19|20)\d{2}\b/g, "")
            .replace(/\bAlbum\b/g, "")
            .replace(/\bLP\b/g, "")
            .replace(/\bEP\b/g, "");
          artistName = cleanText(artistName);
        }
      }

      // Extract album title
      let albumName = "Unknown";

      // First try to get album from release links
      const albumLinks = entry.querySelectorAll('a[href*="/release/album/"]');
      if (albumLinks.length > 0) {
        // Take the last part of the URL which is usually the album name
        const href = albumLinks[0].getAttribute("href");
        const urlParts = href.split("/");

        // Get the album name from the last part of the URL
        let urlAlbumName = urlParts[urlParts.length - 1];
        if (!urlAlbumName || urlAlbumName === "") {
          urlAlbumName = urlParts[urlParts.length - 2];
        }

        // Convert URL format to readable text
        if (urlAlbumName && urlAlbumName !== "") {
          albumName = urlAlbumName
            .replace(/-/g, " ")
            .replace(/^\w|\s\w/g, (c) => c.toUpperCase());
        } else {
          // If we couldn't extract from URL, use the link text
          albumName = cleanText(albumLinks[0].textContent);
        }
      } else {
        // Try dedicated album elements
        const albumElement = entry.querySelector(
          '.album, .release, [class*="album"], [class*="release"], .page_charts_section_charts_item_title'
        );

        if (albumElement) {
          // Remove year and "Album" text from the album name
          const fullText = albumElement.textContent;
          albumName = fullText
            .replace(/\b(19|20)\d{2}\b/g, "")
            .replace(/\bAlbum\b/g, "")
            .replace(/\bLP\b/g, "")
            .replace(/\bEP\b/g, "");
          albumName = cleanText(albumName);
        }
      }

      // Extract genres - completely revised for Library Music charts
      let genreString = "";

      // Get the descriptor cells - specific to RYM chart pages
      const descriptorCells = entry.querySelectorAll(
        ".global_rating_source_selector_chart_descriptors"
      );

      if (descriptorCells.length > 0) {
        // Extract genre text and clean it
        const descriptorText = cleanText(descriptorCells[0].textContent);

        // Handle formats with ratings and voting numbers
        // Remove numbers, ratings, and voting data
        let cleanedText = descriptorText
          .replace(/\d+(\.\d+)?(\s*\/\s*\d+k?)?/g, "") // Remove ratings like "3.73 / 1k"
          .replace(/^\d+\s+\d+\s+/, "") // Remove leading numbers like "18 1 "
          .replace(/\b\d+\b/g, "") // Remove standalone numbers
          .replace(/\s{2,}/g, " ") // Replace multiple spaces with a single space
          .trim();

        // For library music charts, make sure we don't repeat "Library Music"
        if (isLibraryMusicChart) {
          // If we're on a Library Music chart, we know all entries are Library Music
          // Extract other genres besides Library Music
          const otherGenres = new Set();

          // Split by spaces and process each potential genre
          const parts = cleanedText.split(/\s+/);

          for (let i = 0; i < parts.length; i++) {
            // Try to build compound genres from pairs or triplets of words
            if (i < parts.length - 1) {
              const compoundGenre = parts[i] + " " + parts[i + 1];
              if (
                compoundGenre !== "Library Music" &&
                !otherGenres.has(compoundGenre)
              ) {
                otherGenres.add(compoundGenre);
              }
            }

            // Also check individual words as potential genres
            if (
              parts[i] !== "Library" &&
              parts[i] !== "Music" &&
              parts[i].length > 2
            ) {
              otherGenres.add(parts[i]);
            }
          }

          // Create a properly formatted genre string
          const genreList = Array.from(otherGenres);

          if (genreList.length > 0) {
            // Start with Library Music and add other genres
            genreString = "Library Music, " + genreList.slice(0, 2).join(", ");
          } else {
            genreString = "Library Music";
          }
        } else {
          // For other types of charts, use a different approach
          // Get unique genres using a Set to avoid duplication
          const uniqueGenres = new Set();

          // Replace multiple instances of the same genre
          const genrePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
          let match;

          while ((match = genrePattern.exec(cleanedText)) !== null) {
            if (match[1] && match[1].length > 2) {
              uniqueGenres.add(match[1]);
            }
          }

          // Convert to comma-separated string
          genreString = Array.from(uniqueGenres).join(", ");
        }
      } else {
        // Try other genre extraction methods
        const genreElements = entry.querySelectorAll(
          '.genre, [class*="genre"], a[href*="/genre/"], [class*="descriptor"], .tags'
        );

        if (genreElements.length > 0) {
          // Extract unique genres
          const uniqueGenres = new Set();

          for (const element of genreElements) {
            const text = cleanText(element.textContent);
            if (text && text.length > 2) {
              // Skip numbers, ratings, etc.
              const parts = text.split(/\s+/);
              for (const part of parts) {
                if (
                  part.length > 2 &&
                  !/^\d+$/.test(part) &&
                  !/\d\.\d\d/.test(part)
                ) {
                  uniqueGenres.add(part);
                }
              }
            }
          }

          // Format genre string
          if (isLibraryMusicChart) {
            // For library music, ensure "Library Music" is first
            uniqueGenres.delete("Library");
            uniqueGenres.delete("Music");

            const otherGenres = Array.from(uniqueGenres).filter(
              (g) => g !== "Library Music"
            );
            if (otherGenres.length > 0) {
              genreString =
                "Library Music, " + otherGenres.slice(0, 2).join(", ");
            } else {
              genreString = "Library Music";
            }
          } else {
            // For other charts, just join unique genres
            genreString = Array.from(uniqueGenres).join(", ");
          }
        } else {
          // Fallback to URL extraction
          if (isLibraryMusicChart) {
            genreString = "Library Music";
          } else {
            // Try URL-based genre extraction
            const pageUrl = window.location.href;
            const genreMatch = pageUrl.match(/\/g:([^\/]+)/);
            if (genreMatch && genreMatch[1]) {
              const urlGenre = genreMatch[1]
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
              genreString = urlGenre;
            }
          }
        }
      }

      // Extract release date
      let releaseDate = "";

      // Try to find a dedicated date element first
      const dateElement = entry.querySelector(
        '.date, [class*="date"], .release_date, [class*="release_date"], [class*="year"], .page_charts_section_charts_item_date'
      );

      if (dateElement) {
        const dateText = cleanText(dateElement.textContent);
        // Extract just the year or date without "Album" text
        const dateMatch = dateText.match(/\b(19|20)\d{2}\b/);
        if (dateMatch) {
          releaseDate = dateMatch[0];
        } else {
          releaseDate = dateText.replace(/\bAlbum\b/g, "").trim();
        }
      } else {
        // Try to find year somewhere in the entry text
        const yearMatch = entry.textContent.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          releaseDate = yearMatch[0];
        }
      }

      // Extract URL
      let url = "";
      const albumLink = entry.querySelector('a[href*="/release/"]');
      if (albumLink && albumLink.href) {
        url = albumLink.href;
      }

      lastPosition = parseInt(position) || lastPosition + 1;

      albums.push({
        position: position,
        artist: artistName,
        album: albumName,
        genres: genreString,
        releaseDate: releaseDate,
        url: url,
      });
    }

    console.log(`Processed ${albums.length} albums`);

    // Create JSON file
    const chartData = {
      title: cleanText(document.title),
      url: window.location.href,
      scrapedDate: new Date().toISOString(),
      albumCount: albums.length,
      albums: albums,
    };

    // Generate filename from chart title
    let chartName = "chart";
    if (document.title) {
      chartName = document.title
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .substring(0, 50);
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `rym-${chartName}-${dateStr}.json`;

    // Download the file
    const jsonString = JSON.stringify(chartData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create download URL
    const url = URL.createObjectURL(blob);

    // Download using chrome API
    chrome.runtime.sendMessage({
      action: "download",
      url: url,
      filename: filename,
    });

    console.log("RYM Chart Scraper: Extraction complete!");
    return {
      success: true,
      albumCount: albums.length,
      message: `Successfully extracted ${albums.length} albums`,
    };
  } catch (error) {
    console.error("RYM Chart Scraper: Error during extraction", error);
    return {
      success: false,
      message: error.message,
    };
  }
}

// Helper function to clean text by removing excess whitespace and newlines
function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/\s+/g, " ") // Replace multiple whitespace with single space
    .replace(/\n/g, " ") // Replace newlines with space
    .trim(); // Remove leading and trailing whitespace
}
