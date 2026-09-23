/**
 * Check Daily Limit (cost airbag).
 * Reads today's ticket counter from Firebase and decides whether another ticket may be created.
 * Firebase answers `null` when nothing was counted yet, so the response is parsed from text.
 * @returns {Array<{json: Object}>} The current email plus `count` and `limitReached`.
 */
const DAILY_LIMIT = 10;

const email = $('Loop Over Emails').first().json;
let count = 0;
try {
    count = Number(JSON.parse($json.data)) || 0;
} catch (error) {
    count = 0;
}

return [{ json: { ...email, count, limitReached: count >= DAILY_LIMIT } }];
