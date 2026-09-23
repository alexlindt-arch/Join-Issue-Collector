const REQUEST_DAILY_LIMIT = 10;
const REQUEST_LIMIT_KEY = 'joinRequestLog';
let requestAttachments = [];

document.addEventListener('DOMContentLoaded', initRequestPage);


/**
 * Renders the counter and shows the limit screen when today's limit is used up.
 * @returns {void}
 */
function initRequestPage() {
    renderRequestUsage();
    if (isRequestLimitReached()) showRequestStep('limit');
}


/**
 * Checks whether the daily request limit has been reached.
 * @returns {boolean}
 */
function isRequestLimitReached() {
    return getTodaysRequestCount() >= REQUEST_DAILY_LIMIT;
}


/**
 * Shows how many requests were already sent today.
 * @returns {void}
 */
function renderRequestUsage() {
    document.getElementById('request-used').textContent = Math.min(getTodaysRequestCount(), REQUEST_DAILY_LIMIT);
    document.getElementById('request-limit').textContent = REQUEST_DAILY_LIMIT;
    document.querySelector('.request-limit-count').textContent = REQUEST_DAILY_LIMIT;
    document.querySelector('.request-usage').classList.toggle('is-limit', isRequestLimitReached());
}


/**
 * Shows exactly one of the steps: intro, limit, form or success.
 * @param {'intro'|'limit'|'form'|'success'} step
 * @returns {void}
 */
function showRequestStep(step) {
    document.getElementById('request-intro').classList.toggle('d-none', step !== 'intro');
    document.getElementById('request-limit-reached').classList.toggle('d-none', step !== 'limit');
    document.getElementById('request-card').classList.toggle('d-none', step !== 'form');
    document.getElementById('request-success').classList.toggle('d-none', step !== 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


/**
 * Opens the request form (step 2).
 * @returns {void}
 */
function showRequestForm() {
    if (isRequestLimitReached()) return showRequestStep('limit');
    showRequestStep('form');
    document.getElementById('req-name').focus();
}


/**
 * Back arrow: returns to the start screen from the form, otherwise to the welcome page.
 * @returns {void}
 */
function goBack() {
    const onStart = ['request-intro', 'request-limit-reached']
        .some(id => !document.getElementById(id).classList.contains('d-none'));
    if (!onStart) {
        showRequestStep(isRequestLimitReached() ? 'limit' : 'intro');
    } else {
        window.location.href = '../index.html';
    }
}


/**
 * Compresses the selected screenshots and adds them to the request.
 * @async
 * @param {HTMLInputElement} input - The file input.
 * @returns {Promise<void>}
 */
async function handleRequestAttachmentSelect(input) {
    const { added, errors } = await filesToAttachments(input.files, requestAttachments);
    requestAttachments = requestAttachments.concat(added);
    input.value = '';
    renderRequestAttachments();
    showRequestError(errors.join(' '));
}


/**
 * Removes a screenshot from the request by index.
 * @param {number} index
 * @returns {void}
 */
function removeRequestAttachment(index) {
    requestAttachments.splice(index, 1);
    renderRequestAttachments();
}


/**
 * Renders the screenshot thumbnails.
 * @returns {void}
 */
function renderRequestAttachments() {
    document.getElementById('req-attachment-list').innerHTML =
        attachmentThumbsHTML(requestAttachments, 'removeRequestAttachment');
}


/**
 * Reads all form values.
 * @returns {Object} Raw form values.
 */
function readRequestForm() {
    return {
        name: document.getElementById('req-name').value.trim(),
        email: document.getElementById('req-email').value.trim(),
        type: document.querySelector('input[name="req-type"]:checked')?.value || 'Feature Request',
        title: document.getElementById('req-title').value.trim(),
        description: document.getElementById('req-desc').value.trim()
    };
}


/**
 * Validates the form values and returns an error message or empty string.
 * @param {Object} values - Values from readRequestForm().
 * @returns {string}
 */
function validateRequest(values) {
    if (!values.name || !values.email || !values.title || !values.description) return 'Please fill in all required fields.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) return 'Please enter a valid email address.';
    if (getTodaysRequestCount() >= REQUEST_DAILY_LIMIT) return `You have reached the limit of ${REQUEST_DAILY_LIMIT} requests for today – please try again tomorrow.`;
    return '';
}


/**
 * Returns how many requests were sent from this browser today.
 * @returns {number}
 */
function getTodaysRequestCount() {
    try {
        const log = JSON.parse(localStorage.getItem(REQUEST_LIMIT_KEY)) || [];
        const today = new Date().toISOString().slice(0, 10);
        return log.filter(d => d === today).length;
    } catch (e) {
        return 0;
    }
}


/**
 * Records a sent request for the daily limit.
 * @returns {void}
 */
function logRequestSent() {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const log = (JSON.parse(localStorage.getItem(REQUEST_LIMIT_KEY)) || []).filter(d => d === today);
        log.push(today);
        localStorage.setItem(REQUEST_LIMIT_KEY, JSON.stringify(log));
    } catch (e) { /* storage unavailable – limit is best effort */ }
}


/**
 * Builds the triage task from the form values.
 * @param {Object} values - Values from readRequestForm().
 * @returns {Object} Task object.
 */
function buildRequestTask(values) {
    return {
        title: values.title,
        description: values.description,
        category: values.type,
        priority: values.type === 'Bug Report' ? 'urgent' : 'medium',
        status: 'triage',
        dueDate: '',
        assignedTo: [],
        subtasks: [],
        attachments: requestAttachments,
        requester: { name: values.name, email: values.email },
        createdAt: new Date().toISOString()
    };
}


/**
 * Determines the next free numeric task id.
 * @async
 * @returns {Promise<number>}
 */
async function getNextRequestTaskId() {
    const response = await fetch(`${JOIN_DB_URL}/tasks.json`);
    const data = await response.json();
    if (!data) return 1;
    const ids = Object.values(data).filter(Boolean).map(t => Number(t.id) || 0);
    return (ids.length ? Math.max(...ids) : 0) + 1;
}


/**
 * Saves the task in the Firebase database.
 * @async
 * @param {Object} task - The task to save.
 * @returns {Promise<void>}
 */
async function saveRequestTask(task) {
    task.id = await getNextRequestTaskId();
    const response = await fetch(`${JOIN_DB_URL}/tasks/${task.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}


/**
 * Handles the form submit: validates, saves and shows the success card.
 * @async
 * @param {SubmitEvent} event
 * @returns {Promise<void>}
 */
async function submitRequest(event) {
    event.preventDefault();
    const values = readRequestForm();
    const error = validateRequest(values);
    showRequestError(error);
    if (error) return;
    const button = document.getElementById('req-submit');
    button.disabled = true;
    try {
        await saveRequestTask(buildRequestTask(values));
        logRequestSent();
        renderRequestUsage();
        showRequestStep('success');
    } catch (e) {
        console.error('Error sending request:', e);
        showRequestError('Sending failed. Please try again later.');
    } finally {
        button.disabled = false;
    }
}


/**
 * Shows or clears the form error message.
 * @param {string} message
 * @returns {void}
 */
function showRequestError(message) {
    document.getElementById('request-error').textContent = message || '';
}


/**
 * Clears the form so another request can be sent.
 * @returns {void}
 */
function resetRequestForm() {
    document.getElementById('request-form').reset();
    requestAttachments = [];
    renderRequestAttachments();
    showRequestError('');
    showRequestForm();
}
