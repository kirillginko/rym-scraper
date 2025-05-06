# RYM Data Scraper

This tool allows you to easily scrape album data from RateYourMusic (RYM) charts and save it to properly formatted JSON files.

## How to Use

### Method 1: Simple Web Tool (Recommended)

1. Open the `run-scraper.html` file in your browser
2. In a separate tab, go to any RateYourMusic chart page (e.g., https://rateyourmusic.com/charts/)
3. Copy the RYM chart URL
4. Paste it into the input field in the tool
5. Click "Open & Scrape"
6. A new tab will open with your chart page and the scraper code will be copied to your clipboard
7. Open the developer console (F12 or right-click → Inspect → Console)
8. Paste the code and press Enter
9. The scraper will extract album data and display download buttons in the top-right corner

### Method 2: Direct Browser Console Method

1. Go to any RateYourMusic chart page
2. Open your browser's Developer Tools:
   - Chrome/Edge: Press F12 or right-click → Inspect
   - Firefox: Press F12 or right-click → Inspect Element
   - Safari: Enable developer tools in preferences, then right-click → Inspect Element
3. Go to the "Console" tab
4. Copy and paste the entire content of either:
   - `standalone-scraper.js` (recommended, more robust)
   - `simple-scraper.js` (simpler alternative)
5. Press Enter to run the script
6. Type `testPageScraping()` and press Enter (for standalone-scraper)
7. Click on the "Save to JSON file" button (green button in the top-right corner) to save the data

### Example Chart URLs to Try

- Top ambient albums of the 2000s: https://rateyourmusic.com/charts/top/album/2000s/g:ambient/
- Top library music of all time: https://rateyourmusic.com/charts/top/album/all-time/g:library-music/
- Top albums of the 1970s: https://rateyourmusic.com/charts/top/album/1970s/

## JSON Output Format

The scraped data is saved in a JSON file with the following structure:

```json
{
  "title": "Chart Title from Page",
  "url": "https://rateyourmusic.com/charts/...",
  "scrapedDate": "2023-04-15T12:34:56.789Z",
  "albumCount": 100,
  "albums": [
    {
      "position": "1",
      "artist": "Artist Name",
      "album": "Album Title",
      "releaseYear": "2022",
      "url": "https://rateyourmusic.com/release/..."
    }
    // More albums...
  ]
}
```

## Troubleshooting

- **No albums found**: Make sure you're on a RYM chart page
- **Missing data**: Try both scrapers - some chart formats work better with one than the other
- **Download not working**: Some browsers may block automatic downloads. Look for download prompts or try a different browser
- **Console errors**: Refresh the page and try again, or try the simple-scraper instead

## Standalone vs Simple Scraper

- **standalone-scraper.js**: More robust, handles different page layouts, attempts multiple extraction methods
- **simple-scraper.js**: Simpler approach that works well with most chart pages and has fewer moving parts

## Chrome Extension (Coming Soon)

A Chrome extension version is under development. Once ready, you'll be able to:

1. Install the extension from the Chrome Web Store
2. Navigate to any RYM chart page
3. Click the extension icon and select "Scrape Data"
4. The data will be automatically saved as a JSON file

## Notes

- This is for personal use only - respect RYM's terms of service and avoid excessive scraping
- The scripts are completely client-side and don't send any data to external servers
- Your data is saved locally to your computer only

# RYM Chart Scraper - Chrome Extension

A Chrome extension that extracts album data from RateYourMusic charts and saves it as a JSON file.

## Features

This extension scrapes the following details from RateYourMusic chart pages:

- Artist name
- Album title
- Genres
- Release date
- Album position in chart
- Album URL

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension folder
5. The extension should now appear in your Chrome toolbar

## How to Use

1. Navigate to any RateYourMusic chart page (e.g., https://rateyourmusic.com/charts/top/album/all-time/g:shoegaze/)
2. Click the extension icon in the toolbar
3. Click the "Extract Album Data" button
4. The extension will scrape all album data from the chart
5. A save dialog will appear to save the JSON file to your computer
6. Choose a location and save the file

## Testing the Extension

To verify the extension is correctly scraping data:

1. Open the `test-rym-scraper.html` file in your browser
2. Enter a RateYourMusic chart URL (default is shoegaze chart)
3. Click "Load Chart" to load the page
4. Click "Run Test" to test the data extraction
5. View the results to see if all data fields are being correctly identified

The test will show detailed results for the first few albums on the chart, including:

- Whether the artist name was found
- Whether the album title was found
- Whether genres were detected
- Whether release dates were found
- Overall success rate

If some fields aren't being detected correctly, you may need to adjust the selectors in the content.js file.

## Example Chart URLs

- Top shoegaze albums of all time: https://rateyourmusic.com/charts/top/album/all-time/g:shoegaze/
- Top ambient albums of the 2000s: https://rateyourmusic.com/charts/top/album/2000s/g:ambient/
- Top albums of the 1970s: https://rateyourmusic.com/charts/top/album/1970s/

## JSON Output Format

The scraped data is saved in a JSON file with the following structure:

```json
{
  "title": "Chart Title from Page",
  "url": "https://rateyourmusic.com/charts/...",
  "scrapedDate": "2023-04-15T12:34:56.789Z",
  "albumCount": 100,
  "albums": [
    {
      "position": "1",
      "artist": "My Bloody Valentine",
      "album": "Loveless",
      "genres": ["Shoegaze", "Noise Pop"],
      "releaseDate": "11 November 1991",
      "url": "https://rateyourmusic.com/release/album/my-bloody-valentine/loveless/"
    }
    // More albums...
  ]
}
```

## Troubleshooting

- **No albums found**: Make sure you're on a RYM chart page
- **Extension doesn't work**: Refresh the page and try again. Some chart formats may not be recognized.
- **Missing data**: Some fields may not be available for all albums on the chart
- **Test fails**: Use the test tool to identify which selectors need to be improved

## Notes

- This extension is for personal use only - respect RYM's terms of service and avoid excessive scraping
- All data processing is done in the browser; no data is sent to external servers
- Album data is saved locally to your computer only
