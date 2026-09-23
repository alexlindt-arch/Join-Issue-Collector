/**
 * Central backend configuration.
 * Replace JOIN_DB_URL with the URL of your own Firebase Realtime Database
 * (Firebase console → Build → Realtime Database, shown at the top of the data view).
 * @type {string}
 */
const JOIN_DB_URL = 'https://join-issue-collector-d9c37-default-rtdb.europe-west1.firebasedatabase.app';


/**
 * n8n webhook that emails the creator of a task when it moves to another column.
 * Only the task id is sent; n8n reads the task and the creator's email from Firebase itself.
 * @type {string}
 */
const JOIN_STATUS_WEBHOOK_URL = 'https://alexlindt.app.n8n.cloud/webhook/join-status-change';


/**
 * Dedicated mailbox that the n8n Issue Collector reads. Stakeholders send their requests here.
 * Leave empty until the mailbox exists; the landing page then shows a hint instead of a mail link.
 * @type {string}
 */
const JOIN_REQUEST_EMAIL = '';


/**
 * Maximum number of tickets n8n creates from emails per day (cost airbag).
 * n8n enforces the limit; the landing page only displays it.
 * @type {number}
 */
const JOIN_DAILY_REQUEST_LIMIT = 10;
