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
 * Builds a Gmail compose link with the same template.
 * @param {string} address - Request mailbox.
 * @returns {string} Gmail compose URL.
 */
function buildGmailUrl(address) {
    const params = new URLSearchParams({ view: 'cm', fs: '1', to: address, su: REQUEST_MAIL_SUBJECT, body: REQUEST_MAIL_BODY });
    return `https://mail.google.com/mail/?${params}`;
}


/**
 * Builds an Outlook (outlook.com / Microsoft 365 web) compose link with the same template.
 * @param {string} address - Request mailbox.
 * @returns {string} Outlook compose URL.
 */
function buildOutlookUrl(address) {
    const params = new URLSearchParams({ to: address, subject: REQUEST_MAIL_SUBJECT, body: REQUEST_MAIL_BODY });
    return `https://outlook.live.com/mail/0/deeplink/compose?${params.toString().replace(/\+/g, '%20')}`;
}


/**
 * Fills the email mask with the address, the template text and the links of all send options.
 * @param {string} address - Request mailbox.
 * @returns {void}
 */
function renderMailMask(address) {
    const subject = document.querySelector('.js-mail-mask-subject');
    subject.textContent = REQUEST_MAIL_SUBJECT || 'A short title for your request';
    subject.classList.toggle('is-placeholder', !REQUEST_MAIL_SUBJECT);
    document.querySelector('.js-mail-mask-to').textContent = address;
    document.querySelector('.js-mail-mask-body').textContent = REQUEST_MAIL_BODY;
    document.getElementById('mail-mask-gmail').href = buildGmailUrl(address);
    document.getElementById('mail-mask-outlook').href = buildOutlookUrl(address);
    document.getElementById('mail-mask-app').href = buildMailtoUrl(address);
}


/**
 * Shows the email mask. Nothing opens by itself: the stakeholder picks Gmail, Outlook,
 * the installed email app or copies the text, because a mail app is not set up on every device.
 * @param {MouseEvent} event - Click on a mail button.
 * @returns {void}
 */
function openMailMask(event) {
    event.preventDefault();
    document.getElementById('mail-mask').classList.remove('d-none');
    document.body.classList.add('mail-mask-open');
    setMailMaskStatus('Choose where you want to write the email. The address and the template are filled in for you.');
    document.getElementById('mail-mask-gmail').focus();
}


/** Android package names of the mail apps the send options try first. */
const MAIL_APP_PACKAGES = { gmail: 'com.google.android.gm', outlook: 'com.microsoft.office.outlook' };

/** Time an iOS app gets to open before the page falls back to the website. */
const MAIL_APP_TIMEOUT = 1500;


/**
 * Returns the mobile platform of the device, or 'desktop'.
 * iPadOS reports itself as a Mac, so a Mac with a touch screen counts as iOS.
 * @returns {'android'|'ios'|'desktop'}
 */
function getMailPlatform() {
    const agent = navigator.userAgent;
    if (/Android/i.test(agent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(agent) || (/Macintosh/i.test(agent) && navigator.maxTouchPoints > 1)) return 'ios';
    return 'desktop';
}


/**
 * Builds the iOS link that opens the Gmail or Outlook app with the request template.
 * @param {'gmail'|'outlook'} app
 * @param {string} address - Request mailbox.
 * @returns {string} App URL.
 */
function buildIosAppUrl(app, address) {
    const params = new URLSearchParams({ to: address, subject: REQUEST_MAIL_SUBJECT, body: REQUEST_MAIL_BODY });
    const query = params.toString().replace(/\+/g, '%20');
    return app === 'gmail' ? `googlegmail://co?${query}` : `ms-outlook://compose?${query}`;
}


/**
 * Builds the Android intent that opens the Gmail or Outlook app. Chrome opens the website itself
 * (browser_fallback_url) when the app is not installed.
 * @param {'gmail'|'outlook'} app
 * @param {string} address - Request mailbox.
 * @param {string} webUrl - Website to open without the app.
 * @returns {string} Intent URL.
 */
function buildAndroidIntentUrl(app, address, webUrl) {
    const mailto = buildMailtoUrl(address).replace(/^mailto:/, '');
    return `intent:${mailto}#Intent;scheme=mailto;package=${MAIL_APP_PACKAGES[app]};`
        + `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
}


/**
 * Gmail / Outlook button: opens the installed app on phones and tablets, otherwise the website.
 * Desktop computers have no Gmail app and the Outlook desktop app cannot be addressed from a website,
 * so there the website opens in a new tab.
 * @param {MouseEvent} event - Click on the button.
 * @param {'gmail'|'outlook'} app
 * @returns {void}
 */
function openMailApp(event, app) {
    const webUrl = app === 'gmail' ? buildGmailUrl(JOIN_REQUEST_EMAIL) : buildOutlookUrl(JOIN_REQUEST_EMAIL);
    const platform = getMailPlatform();
    if (platform === 'desktop') return;
    event.preventDefault();
    if (platform === 'android') {
        window.location.href = buildAndroidIntentUrl(app, JOIN_REQUEST_EMAIL, webUrl);
        return;
    }
    openIosAppOrWebsite(buildIosAppUrl(app, JOIN_REQUEST_EMAIL), webUrl);
}


/**
 * Tries the iOS app and opens the website if the page is still in front afterwards (app not installed).
 * @param {string} appUrl - App URL.
 * @param {string} webUrl - Website fallback.
 * @returns {void}
 */
function openIosAppOrWebsite(appUrl, webUrl) {
    let appOpened = false;
    const onLeave = () => { appOpened = true; };
    document.addEventListener('visibilitychange', onLeave, { once: true });
    window.addEventListener('pagehide', onLeave, { once: true });
    window.location.href = appUrl;
    setTimeout(() => {
        if (!appOpened && document.visibilityState === 'visible') window.location.href = webUrl;
    }, MAIL_APP_TIMEOUT);
}


/**
 * Copies address and template to the clipboard, for stakeholders who write the email somewhere else.
 * @async
 * @returns {Promise<void>}
 */
async function copyMailRequest() {
    const text = `To: ${JOIN_REQUEST_EMAIL}\n\n${REQUEST_MAIL_BODY}`;
    try {
        await navigator.clipboard.writeText(text);
        setMailMaskStatus(`Copied! Paste it into a new email to ${JOIN_REQUEST_EMAIL}.`);
    } catch (error) {
        setMailMaskStatus(`Copying is blocked here. Please write to ${JOIN_REQUEST_EMAIL}.`);
    }
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
 * Back button in the email mask: hides it again.
 * @returns {void}
 */
function closeMailMask() {
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
