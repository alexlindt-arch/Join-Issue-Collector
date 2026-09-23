const REQUEST_DAILY_LIMIT = 5;
const REQUEST_LIMIT_KEY = 'joinRequestLog';
let requestAttachments = [];


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
    if (!values.name || !values.email || !values.title || !values.description) return 'Bitte alle Pflichtfelder ausfüllen.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) return 'Bitte eine gültige E-Mail-Adresse eingeben.';
    if (getTodaysRequestCount() >= REQUEST_DAILY_LIMIT) return `Maximal ${REQUEST_DAILY_LIMIT} Anfragen pro Tag – bitte morgen wieder.`;
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
        toggleRequestSuccess(true);
    } catch (e) {
        console.error('Error sending request:', e);
        showRequestError('Senden fehlgeschlagen. Bitte später erneut versuchen.');
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
 * Switches between the form card and the success card.
 * @param {boolean} success
 * @returns {void}
 */
function toggleRequestSuccess(success) {
    document.getElementById('request-card').classList.toggle('d-none', success);
    document.getElementById('request-success').classList.toggle('d-none', !success);
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
    toggleRequestSuccess(false);
}
