# Race Data Integration - Automated Results Fetching

## Overview

This document describes the automated race results fetching feature for the Koerspoule cycling pool application. This feature allows admins to automatically fetch race results from FirstCycling.com or ProCyclingStats.com using a Cloud Function with Puppeteer.

## Features

- **Automatic scraping** of race results from cycling statistics websites
- **Puppeteer-based** headless browser to bypass anti-bot protection
- **Admin-only access** for ethical and controlled usage
- **Support for multiple sources**: FirstCycling and ProCyclingStats
- **Manual fallback** option still available

## Architecture

### Cloud Function: `fetchRaceResults`

**Location:** `/functions/index.js`

**Type:** HTTPS Callable (Firebase Functions v2)

**Memory:** 1GB (required for Puppeteer)

**Timeout:** 60 seconds

**Authentication:** Admin only

#### Input Parameters

```javascript
{
  raceUrl: string,        // Required: URL of the race results page
  source: string          // Optional: 'firstcycling' or 'procyclingstats' (auto-detected)
}
```

#### Output

```javascript
{
  success: boolean,
  results: [
    {
      position: number,
      name: string,
      riderNumber: number | null
    }
  ],
  source: string,
  fetchedAt: string,
  raceUrl: string
}
```

### Parsing Logic

#### FirstCycling.com Parser

- Looks for `table.tablesorter` elements
- Extracts rider name from links with `href*="rider.php"`
- Parses rider numbers from formats: `(#123)`, `#123`, or standalone numbers
- Returns top 30 results

#### ProCyclingStats.com Parser

- Searches all tables for results
- Extracts rider name from links containing `/rider/`
- Attempts multiple number matching patterns
- Returns top 30 results

## Usage

### Admin UI

**Location:** `/src/components/Admin/StageResults.js`

The admin interface now has two options for entering stage results:

#### Option 1: Automatic Fetching

1. Enter or paste a race URL from FirstCycling or ProCyclingStats
2. Click "Haal Op" (Fetch) button
3. Results are automatically populated in the textarea
4. Review and verify the data
5. Click "Resultaten Verwerken" to process points

**Example URLs:**
```
https://firstcycling.com/race.php?r=17&y=2026&e=01
https://www.procyclingstats.com/race/tour-de-france/2026/stage-1
```

#### Option 2: Manual Entry

- Copy/paste results manually as before
- Format: `1. RIDER NAME (#number)`

### Security

- ✅ Requires user authentication
- ✅ Admin-only access enforced
- ✅ URL validation (only FirstCycling and ProCyclingStats allowed)
- ✅ Error handling and logging
- ✅ Rate limiting via Firebase Functions quotas

## Ethical Usage

This feature is designed for **responsible and ethical use**:

1. **Admin-triggered only** - No automatic scheduled scraping
2. **Reasonable usage** - Only when manually needed by admins
3. **Respects source sites** - Uses realistic browser headers and delays
4. **Crawl-delay compliance** - FirstCycling requests 10-second delays
5. **Alternative available** - Manual entry always works as fallback

## Installation & Deployment

### Prerequisites

```json
{
  "node": "20",
  "dependencies": {
    "puppeteer": "^21.x"
  }
}
```

### Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Configure Memory & Timeout

The function is already configured with:
- Memory: 1GB (required for Puppeteer)
- Timeout: 60 seconds
- These settings are in the function definition

## Testing

### Test URLs

Use these real race results for testing:

**FirstCycling (National Championships):**
```
https://firstcycling.com/race.php?r=1165&y=2026
```

**ProCyclingStats (when available):**
```
https://www.procyclingstats.com/race/tour-de-france/2025/stage-21
```

### Local Testing

For local development, use Firebase emulators:

```bash
firebase emulators:start --only functions
```

Then update your React app to point to local functions.

## Error Handling

The function handles various error scenarios:

1. **Authentication errors** - User not logged in or not admin
2. **Invalid URL** - Only accepts FirstCycling and ProCyclingStats URLs
3. **Page not found** - Race doesn't exist or results not published
4. **Parsing errors** - No results found on page
5. **Timeout errors** - Page takes too long to load
6. **Browser errors** - Puppeteer fails to launch

## Limitations

1. **Bot detection** - Some sites may block or rate-limit requests
2. **Page structure changes** - Sites may update HTML, breaking parsers
3. **Cost** - Cloud Functions with 1GB memory cost more per invocation
4. **Cold starts** - First invocation may take 10-15 seconds
5. **Rider numbers** - Not always available, may return `null`

## Future Improvements

- [ ] Add caching to avoid re-fetching same race
- [ ] Support more data sources (UCI, race organizers)
- [ ] Automatic rider number matching from local database
- [ ] Scheduled checks for active races
- [ ] Webhook notifications when results are published
- [ ] Support for split stages and time bonuses

## Troubleshooting

### Function times out

- Check if the race URL is correct and accessible
- Verify results are published (not a future stage)
- Check Firebase Functions logs for details

### No results found

- Verify the race has finished
- Check if the page structure has changed
- Try manual entry as fallback

### Rider numbers missing

- Some sites don't display numbers consistently
- Numbers will be `null` in the results
- Admin should manually add numbers if needed

### Authentication errors

- Ensure user is logged in
- Verify user has `isAdmin: true` in Firestore

## Related Files

- `/functions/index.js` - Cloud Function implementation
- `/src/components/Admin/StageResults.js` - Admin UI
- `/src/components/Admin/StageResults.css` - Styling
- `/functions/package.json` - Dependencies

## Support

For issues or questions, check:
- Firebase Functions logs: `firebase functions:log`
- Browser console in admin panel
- Network tab for function call details
