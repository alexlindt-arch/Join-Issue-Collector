/**
 * Assign Ticket Id.
 * Join stores tasks under numeric keys (tasks/1, tasks/2, ...). The shallow task list
 * from Firebase is parsed from text because an empty board answers `null`.
 * @returns {Array<{json: Object}>} The ticket context with `task.id` set to the next free number.
 */
const context = $('Build Ticket').first().json;

let keys = [];
try {
    keys = Object.keys(JSON.parse($json.data) || {});
} catch (error) {
    keys = [];
}

const highestId = keys.map(Number).filter(Number.isFinite).reduce((max, id) => Math.max(max, id), 0);
const task = { ...context.task, id: highestId + 1 };

return [{ json: { ...context, task } }];
