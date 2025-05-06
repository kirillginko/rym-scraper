// Test script for RYM Chart Scraper
// This can be run directly in the browser console on a RateYourMusic chart page

function testRYMScraper() {
  console.log("🧪 RYM Scraper Test: Starting...");

  // Test the selectors to see if they can extract album data
  try {
    // Find all album entries using the same selectors as the extension
    const albumEntries = document.querySelectorAll(
      '.chart_item_release, .page_charts_section_charts_item, .ooookiig, .or_q_albumartist_td, tr.infobox, .the_thing, li[id^="pos"]'
    );

    console.log(
      `🔍 Found ${albumEntries.length} album entries using primary selectors`
    );

    // If no entries found, try fallback method
    let entries = albumEntries;
    if (albumEntries.length === 0) {
      const containers = document.querySelectorAll("div, tr, li, span");
      const possibleEntries = Array.from(containers).filter((container) => {
        const hasArtistLink =
          container.querySelector('a[href*="/artist/"]') !== null;
        const hasAlbumLink =
          container.querySelector('a[href*="/release/"]') !== null;
        return hasArtistLink && hasAlbumLink;
      });

      console.log(
        `🔍 Found ${possibleEntries.length} album entries using fallback detection`
      );
      if (possibleEntries.length > 0) {
        entries = possibleEntries;
      }
    }

    if (entries.length === 0) {
      console.error("❌ No album entries found. This may not be a chart page.");
      return false;
    }

    // Test extraction on first 3 entries
    const testSample = Math.min(3, entries.length);
    console.log(`🧪 Testing data extraction on ${testSample} entries...`);

    const testResults = [];
    let successCount = 0;

    for (let i = 0; i < testSample; i++) {
      const entry = entries[i];
      const testResult = {
        entryIndex: i,
        success: false,
        fields: {
          position: { found: false, value: null },
          artist: { found: false, value: null },
          album: { found: false, value: null },
          genres: { found: false, value: [] },
          releaseDate: { found: false, value: null },
          url: { found: false, value: null },
        },
      };

      // Test position extraction
      const rankElement = entry.querySelector(
        '.page_charts_section_charts_item_rank, .chart_position, [class*="rank"], [class*="position"], .pos, .ranking, .rank'
      );
      if (rankElement) {
        const rankText = rankElement.textContent.trim().replace(/[^\d]/g, "");
        if (rankText) {
          testResult.fields.position.found = true;
          testResult.fields.position.value = rankText;
        }
      } else {
        // Try to find position from ID
        const entryId = entry.id || "";
        if (entryId.startsWith("pos")) {
          const posMatch = entryId.match(/\d+/);
          if (posMatch) {
            testResult.fields.position.found = true;
            testResult.fields.position.value = posMatch[0];
          }
        }
      }

      // Test artist extraction
      const artistElement = entry.querySelector(
        '.artist, [class*="artist"], a[href*="/artist/"], .anon_name, .page_charts_section_charts_item_credited_name_primary'
      );
      if (artistElement) {
        testResult.fields.artist.found = true;
        testResult.fields.artist.value = artistElement.textContent.trim();
      }

      // Test album name extraction
      const albumElement = entry.querySelector(
        '.album, .release, [class*="album"], [class*="release"], a[href*="/release/"], .page_charts_section_charts_item_title'
      );
      if (albumElement) {
        testResult.fields.album.found = true;
        testResult.fields.album.value = albumElement.textContent.trim();
      }

      // Test genres extraction
      const genreElements = entry.querySelectorAll(
        '.genre, [class*="genre"], a[href*="/genre/"], [class*="descriptor"], .tags'
      );

      if (genreElements.length > 0) {
        const genres = [];
        genreElements.forEach((genreEl) => {
          const genre = genreEl.textContent.trim();
          if (genre && !genres.includes(genre)) genres.push(genre);
        });

        if (genres.length > 0) {
          testResult.fields.genres.found = true;
          testResult.fields.genres.value = genres;
        }
      } else {
        // Try URL-based genre extraction
        const pageUrl = window.location.href;
        const genreMatch = pageUrl.match(/\/g:([^\/]+)/);
        if (genreMatch && genreMatch[1]) {
          const urlGenre = genreMatch[1]
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          testResult.fields.genres.found = true;
          testResult.fields.genres.value = [urlGenre];
        }
      }

      // Test release date extraction
      const dateElement = entry.querySelector(
        '.date, [class*="date"], .release_date, [class*="release_date"], [class*="year"], .page_charts_section_charts_item_date'
      );

      if (dateElement) {
        testResult.fields.releaseDate.found = true;
        testResult.fields.releaseDate.value = dateElement.textContent.trim();
      } else {
        // Try date regex match
        const dateMatch = entry.textContent.match(
          /\b(\d{1,2}\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i
        );
        if (dateMatch) {
          testResult.fields.releaseDate.found = true;
          testResult.fields.releaseDate.value = dateMatch[0];
        } else {
          // Try year-only match
          const yearMatch = entry.textContent.match(/\b(19|20)\d{2}\b/);
          if (yearMatch) {
            testResult.fields.releaseDate.found = true;
            testResult.fields.releaseDate.value = yearMatch[0];
          }
        }
      }

      // Test URL extraction
      const albumLink = entry.querySelector('a[href*="/release/"]');
      if (albumLink && albumLink.href) {
        testResult.fields.url.found = true;
        testResult.fields.url.value = albumLink.href;
      }

      // Calculate success (need at least artist, album and either position or url)
      const mandatoryFields =
        testResult.fields.artist.found &&
        testResult.fields.album.found &&
        (testResult.fields.position.found || testResult.fields.url.found);

      testResult.success = mandatoryFields;

      if (testResult.success) {
        successCount++;
      }

      testResults.push(testResult);
    }

    // Output results for each test entry
    console.group("📊 Test Results");

    testResults.forEach((result, idx) => {
      console.group(
        `Entry #${idx + 1}: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`
      );
      Object.entries(result.fields).forEach(([field, data]) => {
        console.log(
          `${field}: ${data.found ? "✅" : "❌"} ${
            data.found ? JSON.stringify(data.value) : ""
          }`
        );
      });
      console.groupEnd();
    });

    console.groupEnd();

    // Overall assessment
    const successRate = (successCount / testSample) * 100;
    if (successRate === 100) {
      console.log(
        "✅ TEST PASSED: All entries were successfully parsed! Your selectors are working correctly."
      );
      return true;
    } else if (successRate >= 66) {
      console.log(
        `⚠️ TEST PARTIALLY PASSED: ${successRate.toFixed(
          0
        )}% of entries were successfully parsed. Some selectors may need improvement.`
      );
      return true;
    } else {
      console.error(
        `❌ TEST FAILED: Only ${successRate.toFixed(
          0
        )}% of entries were successfully parsed. Your selectors need significant improvements.`
      );
      return false;
    }
  } catch (error) {
    console.error("❌ TEST ERROR:", error);
    return false;
  }
}

// Execute the test
const testResult = testRYMScraper();
console.log(`🧪 TEST COMPLETE: ${testResult ? "PASSED ✅" : "FAILED ❌"}`);
