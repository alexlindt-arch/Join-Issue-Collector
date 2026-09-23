/**
 * Build Ticket.
 * Validates the AI analysis and turns it into a Join task for the Triage column.
 * Priority comes from keywords in the email first; the AI value is only the fallback.
 * The deadline is taken from the AI and double-checked against dates written in the email.
 * @returns {Array<{json: Object}>} The email context plus the finished `task`.
 * @throws {Error} When neither the AI nor the subject provide a usable title.
 */
const email = $('Check Daily Limit').first().json;
const ai = $json.output || {};

const CATEGORIES = { bug: 'Bug Report', technical: 'Technical Task', feature: 'User Story' };
const PRIORITIES = ['urgent', 'medium', 'low'];
const LOW_KEYWORDS = ['nicht dringend', 'not urgent', 'keine eile', 'no rush', 'irgendwann', 'bei gelegenheit',
    'nice to have', 'nice-to-have', 'low priority', 'niedrige priorität', 'when you have time'];
const URGENT_KEYWORDS = ['dringend', 'urgent', 'asap', 'sofort', 'umgehend', 'kritisch', 'critical', 'blocker',
    'notfall', 'emergency', 'so schnell wie möglich', 'as soon as possible', 'production down', 'geht nicht mehr'];
const AI_NOTE = '🤖 Dieses Ticket wurde KI-generiert.';

/**
 * Picks the priority: low keywords win over urgent ones ("nicht dringend" contains "dringend").
 * @param {string} text - Subject and body of the email.
 * @param {string} aiPriority - Priority suggested by the AI.
 * @returns {'urgent'|'medium'|'low'} Priority.
 */
function detectPriority(text, aiPriority) {
    const lower = text.toLowerCase();
    if (LOW_KEYWORDS.some(word => lower.includes(word))) return 'low';
    if (URGENT_KEYWORDS.some(word => lower.includes(word))) return 'urgent';
    return PRIORITIES.includes(aiPriority) ? aiPriority : 'medium';
}

/**
 * Checks that year, month and day form a real calendar date.
 * @param {number} year
 * @param {number} month - 1-12.
 * @param {number} day
 * @returns {boolean} True for a real date.
 */
function isRealDate(year, month, day) {
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Formats a date as DD.MM.YYYY, the format the Join board uses.
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {string} Formatted date.
 */
function toBoardDate(year, month, day) {
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
}

/**
 * Returns the deadline: the AI value (YYYY-MM-DD) if valid, otherwise the first DD.MM.YYYY date in the email.
 * @param {string} aiDate - Date suggested by the AI.
 * @param {string} text - Subject and body of the email.
 * @returns {string} Deadline as DD.MM.YYYY or empty string.
 */
function detectDeadline(aiDate, text) {
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(aiDate || '').trim());
    if (iso && isRealDate(+iso[1], +iso[2], +iso[3])) return toBoardDate(+iso[1], +iso[2], +iso[3]);
    const german = /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/.exec(text);
    if (german && isRealDate(+german[3], +german[2], +german[1])) return toBoardDate(+german[3], +german[2], +german[1]);
    return '';
}

const text = `${email.subject}\n${email.body}`;
const title = String(ai.title || email.subject || '').replace(/\s+/g, ' ').trim().slice(0, 60);
if (!title) throw new Error('The email has neither a usable subject nor content for a title.');

const summary = String(ai.description || email.body.slice(0, 500)).trim();

const task = {
    title,
    description: `${summary}\n\n${AI_NOTE}`,
    category: CATEGORIES[ai.category] || 'User Story',
    priority: detectPriority(text, ai.priority),
    dueDate: detectDeadline(ai.dueDate, text),
    status: 'triage',
    assignedTo: [],
    subtasks: [],
    creator: { name: email.senderName, email: email.senderEmail, type: 'external' },
    source: 'email',
    lastNotifiedStatus: 'triage',
    createdAt: new Date().toISOString()
};

return [{ json: { ...email, task } }];
