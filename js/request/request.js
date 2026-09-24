/** Firebase path where n8n counts the tickets it created from emails, one number per day. */
const REQUEST_COUNTER_PATH = 'issueCollector/daily';

/** Timezone n8n uses for the daily counter, so the page and the workflow agree on "today". */
const REQUEST_TIMEZONE = 'Europe/Berlin';

/**
 * Subject and body template that helps stakeholders write a useful request.
 * The subject stays empty so the stakeholder writes their own title.
 * The priority line avoids words like "urgent", because n8n treats them as keywords.
 */
const REQUEST_MAIL_SUBJECT = '';
const REQUEST_MAIL_BODY = [
    'What should be built or fixed?',
    '',
    '',
    'Priority (high, medium or low):',
    '',
    'Deadline (if any, e.g. 31.12.2026):'
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
    const mailto = buildMailtoUrl(address);
    document.querySelectorAll('.js-request-mail').forEach(link => {
        link.href = mailto;
        link.classList.toggle('d-none', !address);
        link.addEventListener('click', openMailMask);
    });
    renderMailMask(address);
    document.querySelectorAll('.js-request-address').forEach(link => {
        link.href = address ? `mailto:${address}` : '#';
        link.textContent = address || 'our request mailbox';
    });
    document.getElementById('request-mail-missing').classList.toggle('d-none', Boolean(address));
}


/**
 * Builds the mailto link with the request template.
 * @param {string} address - Request mailbox.
 * @returns {string} mailto URL.
 */
function buildMailtoUrl(address) {
    return `mailto:${address}?subject=${encodeURIComponent(REQUEST_MAIL_SUBJECT)}&body=${encodeURIComponent(REQUEST_MAIL_BODY)}`;
}


/**
 * Builds a Gmail compose link with the same template, used when no mail app opens.
 * @param {string} address - Request mailbox.
 * @returns {string} Gmail compose URL.
 */
function buildGmailUrl(address) {
    const params = new URLSearchParams({ view: 'cm', fs: '1', to: address, su: REQUEST_MAIL_SUBJECT, body: REQUEST_MAIL_BODY });
    return `https://mail.google.com/mail/?${params}`;
}


/**
 * Fills the email mask with the address and the template text.
 * @param {string} address - Request mailbox.
 * @returns {void}
 */
function renderMailMask(address) {
    document.querySelector('.js-mail-mask-to').textContent = address;
    document.querySelector('.js-mail-mask-subject').textContent = REQUEST_MAIL_SUBJECT;
    document.querySelector('.js-mail-mask-body').textContent = REQUEST_MAIL_BODY;
    document.getElementById('mail-mask-fallback').href = buildGmailUrl(address);
}


/** Timer that redirects to Gmail when no mail app took over. */
let mailFallbackTimer = null;

/** Time the mail app gets to open before the page redirects to Gmail. */
const MAIL_FALLBACK_DELAY = 3000;


/**
 * Shows the email mask and opens the mail app. When the page keeps the focus
 * (no mail app installed or registered), the tab is redirected to Gmail in the browser.
 * @param {MouseEvent} event - Click on a mail button.
 * @returns {void}
 */
function openMailMask(event) {
    event.preventDefault();
    const mask = document.getElementById('mail-mask');
    mask.classList.remove('d-none');
    document.body.classList.add('mail-mask-open');
    setMailMaskStatus('Opening your email app …');
    watchMailAppLaunch();
    window.location.href = buildMailtoUrl(JOIN_REQUEST_EMAIL);
}


/**
 * Starts the fallback timer and cancels it as soon as the mail app takes the focus.
 * @returns {void}
 */
function watchMailAppLaunch() {
    clearTimeout(mailFallbackTimer);
    const onLeave = () => {
        clearTimeout(mailFallbackTimer);
        setMailMaskStatus('Your email app is open. Send the email there, then come back here.');
    };
    window.addEventListener('blur', onLeave, { once: true });
    document.addEventListener('visibilitychange', onLeave, { once: true });
    mailFallbackTimer = setTimeout(() => {
        window.removeEventListener('blur', onLeave);
        document.removeEventListener('visibilitychange', onLeave);
        redirectToGmail();
    }, MAIL_FALLBACK_DELAY);
}


/**
 * Redirects the tab to Gmail compose, unless the mask was closed in the meantime.
 * @returns {void}
 */
function redirectToGmail() {
    if (document.getElementById('mail-mask').classList.contains('d-none')) return;
    if (document.visibilityState === 'hidden' || !document.hasFocus()) return;
    setMailMaskStatus('No email app found – redirecting to Gmail …');
    window.location.href = buildGmailUrl(JOIN_REQUEST_EMAIL);
}


/**
 * Updates the status line inside the email mask.
 * @param {string} text - Status text.
 * @returns {void}
 */
function setMailMaskStatus(text) {
    document.getElementById('mail-mask-status').textContent = text;
}


/**
 * Back button in the email mask: hides it and stops the Gmail redirect.
 * @returns {void}
 */
function closeMailMask() {
    clearTimeout(mailFallbackTimer);
    document.getElementById('mail-mask').classList.add('d-none');
    document.body.classList.remove('mail-mask-open');
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
