/**
 * Validate Payload (status notifier).
 * Accepts only a short task id from the board and drops everything else.
 * @returns {Array<{json: {taskId: string}}>} One item with the task id, or no item for invalid calls.
 */
const taskId = String($json.body?.taskId ?? '').trim();

if (!/^[A-Za-z0-9_-]{1,40}$/.test(taskId)) return [];

return [{ json: { taskId } }];
