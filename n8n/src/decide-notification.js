/**
 * Decide Notification (status notifier).
 * The board only sends the task id. The task, its status and the creator's email are read
 * from Firebase, so nobody can trigger mails to arbitrary addresses through the webhook.
 * A mail is only sent when the status differs from the last status the creator was told about.
 * @returns {Array<{json: Object}>} One item with the mail data, or no item when nothing is to be sent.
 */
const COLUMN_NAMES = {
    triage: 'Triage',
    todo: 'To do',
    inProgress: 'In progress',
    awaitFeedback: 'Awaiting feedback',
    done: 'Done'
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

let task = null;
try {
    task = JSON.parse($json.data);
} catch (error) {
    task = null;
}

const creator = task?.creator || (task?.requester ? { ...task.requester, type: 'external' } : null);
const status = task?.status;

if (!task || !COLUMN_NAMES[status]) return [];
if (!creator || !EMAIL_PATTERN.test(String(creator.email || ''))) return [];
if (task.lastNotifiedStatus === status) return [];

return [{
    json: {
        taskId: $('Validate Payload').first().json.taskId,
        title: task.title || 'Untitled task',
        status,
        columnName: COLUMN_NAMES[status],
        creatorName: creator.name || creator.email,
        creatorEmail: creator.email
    }
}];
