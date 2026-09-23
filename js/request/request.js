/** Firebase path where n8n counts the tickets it created from emails, one number per day. */
const REQUEST_COUNTER_PATH = 'issueCollector/daily';

/** Timezone n8n uses for the daily counter, so the page and the workflow agree on "today". */
const REQUEST_TIMEZONE = 'Europe/Berlin';

/** Subject and body template that helps stakeholders write a useful request. */
const REQUEST_MAIL_SUBJECT = 'Feature request: ';
const REQUEST_MAIL_BODY = [
    'What should be built or fixed?',
    '',
    'Why is it important?',
    '',
    'Deadline (if any):'
].join('\n');

document.addEventListener('DOMContentLoaded', initRequestPage);


/**
 * Wires up the mail links, then loads today's usage and switches to the limit screen when needed.
 * @async
 * @returns {Promise<void>}
 */
async function initRequestPage() {
    renderMailLinks();
    const used = await loadTodaysRequestCount();
    renderRequestUsage(used);
    if (used >= JOIN_DAILY_REQUEST_LIMIT) showRequestStep('limit');
}


/**
 * Returns today's date as YYYY-MM-DD in the workflow's timezone.
 * @returns {string} Date key used by the n8n counter.
 */
function getTodayKey() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: REQUEST_TIMEZONE }).format(new Date());
}


/**
 * Reads how many tickets n8n already created from emails today.
 * @async
 * @returns {Promise<number>} Count for today, 0 when nothing was stored or the request failed.
 */
async function loadTodaysRequestCount() {
    try {
        const response = await fetch(`${JOIN_DB_URL}/${REQUEST_COUNTER_PATH}/${getTodayKey()}.json`);
        const count = await response.json();
        return Number(count) || 0;
    } catch (error) {
        console.warn('Request counter could not be loaded:', error);
        return 0;
    }
}


/**
 * Shows "X of 10 requests used today" and turns the counter red once the limit is reached.
 * @param {number} used - Tickets created today.
 * @returns {void}
 */
function renderRequestUsage(used) {
    document.getElementById('request-used').textContent = Math.min(used, JOIN_DAILY_REQUEST_LIMIT);
    document.getElementById('request-limit').textContent = JOIN_DAILY_REQUEST_LIMIT;
    document.querySelectorAll('.js-request-limit').forEach(el => { el.textContent = JOIN_DAILY_REQUEST_LIMIT; });
    document.querySelector('.request-usage').classList.toggle('is-limit', used >= JOIN_DAILY_REQUEST_LIMIT);
}


/**
 * Points all mail buttons and the address link at the request mailbox.
 * Without a configured mailbox the buttons are hidden and a hint is shown instead.
 * @returns {void}
 */
function renderMailLinks() {
    const address = JOIN_REQUEST_EMAIL;
    const mailto = `mailto:${address}?subject=${encodeURIComponent(REQUEST_MAIL_SUBJECT)}&body=${encodeURIComponent(REQUEST_MAIL_BODY)}`;
    document.querySelectorAll('.js-request-mail').forEach(link => {
        link.href = mailto;
        link.classList.toggle('d-none', !address);
    });
    document.querySelectorAll('.js-request-address').forEach(link => {
        link.href = address ? `mailto:${address}` : '#';
        link.textContent = address || 'our request mailbox';
    });
    document.getElementById('request-mail-missing').classList.toggle('d-none', Boolean(address));
}


/**
 * Shows either the normal intro or the limit-reached screen.
 * @param {'intro'|'limit'} step
 * @returns {void}
 */
function showRequestStep(step) {
    document.getElementById('request-intro').classList.toggle('d-none', step !== 'intro');
    document.getElementById('request-limit-reached').classList.toggle('d-none', step !== 'limit');
}


/**
 * Back arrow: returns to the welcome page.
 * @returns {void}
 */
function goBack() {
    window.location.href = '../index.html';
}
