/**
 * Escapes special HTML characters in a string to prevent XSS.
 * @param {string} str - The string to escape.
 * @returns {string} HTML-safe string.
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}


/**
 * Converts various date formats to ISO 8601 (YYYY-MM-DD).
 * @param {string} value - Date string in ISO, European (dd.mm.yyyy), or parseable format.
 * @returns {string} ISO date string or empty string if conversion fails.
 */
function toIsoDate(value) {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
        const parts = value.split('.');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(value);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return '';
}


/**
 * Truncates a string to a maximum length and appends an ellipsis if needed.
 * @param {string} str - The string to truncate.
 * @param {number} len - Maximum allowed length.
 * @returns {string} Truncated string.
 */
function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
}


/**
 * Returns the CSS class for a task category badge.
 * @param {string} category - Task category string.
 * @returns {string} CSS class name.
 */
function categoryColorClass(category) {
    if (!category) return '';
    const c = category.toLowerCase();
    if (c.includes('technical')) return 'category-technical';
    if (c.includes('user')) return 'category-user-story';
    if (c.includes('feature')) return 'category-feature-request';
    if (c.includes('bug')) return 'category-bug-report';
    return '';
}


/**
 * Returns an inline SVG icon for the given priority level.
 * @param {string} prio - Priority value: 'urgent', 'medium', or 'low'.
 * @returns {string} SVG HTML string or empty string for unknown values.
 */
function prioSvg(prio) {
    if (!prio) return '';
    const p = prio.toLowerCase();
    if (p === 'urgent') return `<svg width="20" height="15" viewBox="0 0 20 14.51" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 8.76 L10 0 L20 8.76 L17.5 8.76 L10 2.5 L2.5 8.76 Z" fill="#FF3D00"/><path d="M0 14.51 L10 5.75 L20 14.51 L17.5 14.51 L10 8.25 L2.5 14.51 Z" fill="#FF3D00"/></svg>`;
    if (p === 'medium') return `<svg width="20" height="8" viewBox="0 0 20 8" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="20" height="2.21" rx="1.1" fill="#FFA800"/><rect x="0" y="5.24" width="20" height="2.21" rx="1.1" fill="#FFA800"/></svg>`;
    if (p === 'low') return `<svg width="20" height="15" viewBox="0 0 20 14.51" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L10 8.76 L20 0 L17.5 0 L10 6.26 L2.5 0 Z" fill="#7AE229"/><path d="M0 5.75 L10 14.51 L20 5.75 L17.5 5.75 L10 12.01 L2.5 5.75 Z" fill="#7AE229"/></svg>`;
    return '';
}


/**
 * Returns the full HTML string for a draggable task card on the board.
 * @param {Object} task - Task object with id, status, category, title, description, subtasks, assignedTo, priority.
 * @returns {string} HTML string.
 */
function taskCardTemplate(task) {
    const progress = buildProgressBar(task.subtasks || [], task.id);
    const avatars = buildAvatars(task.assignedTo || []);
    return `
        <div class="task-card" data-task-id="${task.id}" draggable="true"
            ondragstart="startDragging(${task.id})"
            onclick="openTaskDetail(${task.id})">
            <span class="task-card-category ${categoryColorClass(task.category)}">${escapeHtml(task.category || '')}</span>
            <div class="task-card-title">${escapeHtml(task.title || '')}</div>
            ${task.description ? `<div class="task-card-desc">${escapeHtml(truncate(task.description, 60))}</div>` : ''}
            ${getTaskCreator(task)?.type === 'external' ? `<div class="task-card-requester" title="${escapeHtml(getTaskCreator(task).name || getTaskCreator(task).email)}">by ${escapeHtml(shortPersonName(getTaskCreator(task).name || getTaskCreator(task).email))}</div>` : ''}
            ${progress}
            <div class="task-card-footer">
                <div class="task-card-avatars">${avatars}</div>
                <div class="task-card-prio">${prioSvg(task.priority)}</div>
            </div>
        </div>`;
}


/**
 * Returns a progress bar HTML string for the subtask completion state.
 * @param {Array} subtasks - Array of subtask objects with a done property.
 * @param {string|number} taskId - Parent task id for event binding.
 * @returns {string} HTML string or empty string if there are no subtasks.
 */
function buildProgressBar(subtasks, taskId) {
    const done = subtasks.filter(s => s.done).length;
    const total = subtasks.length;
    if (total === 0) return '';
    return `
        <div class="card-progress" data-task-id="${taskId}"
             onclick="toggleProgressDetails(event, ${taskId})"
             onmouseenter="showProgressTooltip(event, ${taskId})"
             onmouseleave="hideProgressTooltip()">
            <div class="card-progressbar">
                <div class="card-progressbar-fill" style="width:${Math.round(100 / total * done)}%"></div>
            </div>
            <span class="card-progress-label" title="${done} von ${total} Subtasks erledigt">${done}/${total}</span>
        </div>`;
}


/**
 * Returns avatar chip HTML for the assigned contacts, with +N overflow chip.
 * @param {Array} assignedTo - Array of contact objects with color and initials.
 * @returns {string} HTML string.
 */
function buildAvatars(assignedTo) {
    const max = 5;
    const visible = (assignedTo || []).slice(0, max);
    let html = visible.map(a => `<span class="card-avatar" style="background:${a.color || '#ccc'}">${avatarInnerHTML(withContactPhoto(a))}</span>`).join('');
    if ((assignedTo || []).length > max) html += `<span class="card-avatar card-avatar-more">+${(assignedTo || []).length - max}</span>`;
    return html;
}


/**
 * Returns the full detail overlay HTML for a task.
 * @param {Object} task - Task object with all fields.
 * @returns {string} HTML string assembled from sub-builders.
 */
function taskDetailTemplate(task) {
    const prioLabel = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : '–';
    const assignees = buildDetailAssignees(task.assignedTo || []);
    const subtaskList = buildDetailSubtasks(task.subtasks || [], task.id);
    return buildDetailHTML(task, prioLabel, assignees, subtaskList);
}


/**
 * Returns HTML for all assigned contact rows in the detail view.
 * @param {Array} assignedTo - Array of contact objects with color, initials, name.
 * @returns {string} HTML string or empty string if no contacts are assigned.
 */
function buildDetailAssignees(assignedTo) {
    if (!(assignedTo || []).length) return '';
    const max = 5;
    const visible = assignedTo.slice(0, max);
    let html = visible.map(a => `
        <div class="detail-assignee">
            <span class="card-avatar" style="background:${a.color || '#ccc'}">${avatarInnerHTML(withContactPhoto(a))}</span>
            <span class="detail-assignee-name" title="${escapeHtml(a.name || '')}">${escapeHtml(shortPersonName(a.name || ''))}</span>
        </div>`).join('');
    if (assignedTo.length > max) {
        const more = assignedTo.length - max;
        html += `
        <div class="detail-assignee detail-more">
            <span class="card-avatar card-avatar-more">+${more}</span>
            <span class="detail-assignee-name">and ${more} more</span>
        </div>`;
    }
    return html;
}


/**
 * Returns HTML list items for each subtask with a toggle checkbox.
 * @param {Array} subtasks - Array of subtask objects with title and done.
 * @param {string|number} taskId - Parent task id for change event binding.
 * @returns {string} HTML string.
 */
function buildDetailSubtasks(subtasks, taskId) {
    return subtasks.map((s, i) => `
        <li class="detail-subtask-item">
            <input type="checkbox" id="sub-check-${i}" ${s.done ? 'checked' : ''}
                onchange="toggleSubtask(${taskId}, ${i})">
            <label for="sub-check-${i}">${escapeHtml(s.title || '')}</label>
        </li>`).join('');
}


/**
 * Assembles the full detail view HTML from its constituent sections.
 * @param {Object} task - Task object.
 * @param {string} prioLabel - Capitalised priority label.
 * @param {string} assignees - Pre-built assignee HTML.
 * @param {string} subtaskList - Pre-built subtask list HTML.
 * @returns {string} Combined HTML string.
 */
function buildDetailHTML(task, prioLabel, assignees, subtaskList) {
    return buildDetailHeader(task)
        + buildDetailInfo(task, prioLabel)
        + buildDetailAssignSection(task, assignees)
        + buildDetailSubtaskSection(task, subtaskList)
        + '</div>'
        + buildDetailActions(task);
}


/**
 * Returns the detail overlay header HTML including category badge and close button.
 * @param {Object} task - Task object with category, title, description.
 * @returns {string} HTML string.
 */
function buildDetailHeader(task) {
    const description = stripAiNote(task.description || '');
    return `
        <div class="detail-header">
            <div class="detail-header-labels">
                <span class="task-card-category ${categoryColorClass(task.category)}">${escapeHtml(task.category || '')}</span>
                ${isAiTicket(task) ? AI_NOTE_HTML : ''}
            </div>
            <button class="detail-close-btn" aria-label="Close" onmousedown="event.stopPropagation(); event.preventDefault();" onclick="closeOverlay(); event.stopPropagation();">
                <svg viewBox="461 58 24 24" width="24" height="24" aria-hidden="true"><path d="M473 71.4L468.1 76.3C467.916 76.4834 467.683 76.575 467.4 76.575C467.116 76.575 466.883 76.4834 466.7 76.3C466.516 76.1167 466.425 75.8834 466.425 75.6C466.425 75.3167 466.516 75.0834 466.7 74.9L471.6 70L466.7 65.1C466.516 64.9167 466.425 64.6834 466.425 64.4C466.425 64.1167 466.516 63.8834 466.7 63.7C466.883 63.5167 467.116 63.425 467.4 63.425C467.683 63.425 467.916 63.5167 468.1 63.7L473 68.6L477.9 63.7C478.083 63.5167 478.316 63.425 478.6 63.425C478.883 63.425 479.116 63.5167 479.3 63.7C479.483 63.8834 479.575 64.1167 479.575 64.4C479.575 64.6834 479.483 64.9167 479.3 65.1L474.4 70L479.3 74.9C479.483 75.0834 479.575 75.3167 479.575 75.6C479.575 75.8834 479.483 76.1167 479.3 76.3C479.116 76.4834 478.883 76.575 478.6 76.575C478.316 76.575 478.083 76.4834 477.9 76.3L473 71.4Z" fill="currentColor"/></svg>
            </button>
        </div>
        <div class="show-detail">
        <h2 class="detail-title">${escapeHtml(task.title || '')}</h2>
        ${description ? `<p class="detail-desc">${escapeHtml(description)}</p>` : ''}
        ${buildDetailRequester(task)}`;
}


/** Note at the end of AI-generated descriptions; the detail view shows it as a label instead. */
const AI_NOTE_PATTERN = /\s*(🤖\s*)?Dieses Ticket wurde KI-generiert\.?\s*$/u;

/** "AI-generated ticket" label with the wand icon, both in the purple-blue gradient of the design. */
const AI_NOTE_HTML = `
    <span class="detail-ai-note">
        <svg viewBox="260 59 22 22" width="22" height="22" aria-hidden="true">
            <defs><linearGradient id="detail-ai-gradient" x1="262.9" y1="0" x2="279.3" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="#9327FF"/><stop offset="1" stop-color="#2EA1DC"/></linearGradient></defs>
            <path d="M274.804 70.9625L272.833 74.125C272.665 74.3847 272.432 74.4916 272.134 74.4458C271.836 74.4 271.649 74.2243 271.573 73.9187L270.931 71.3521L264.675 77.6083C264.507 77.7764 264.297 77.8642 264.045 77.8718C263.792 77.8795 263.575 77.7916 263.391 77.6083C263.223 77.4402 263.139 77.2264 263.139 76.9666C263.139 76.7069 263.223 76.493 263.391 76.325L269.648 70.0458L267.081 69.4041C266.775 69.3277 266.6 69.1406 266.554 68.8427C266.508 68.5448 266.615 68.3118 266.875 68.1437L270.037 66.1958L269.762 62.4604C269.732 62.1548 269.854 61.9333 270.129 61.7958C270.404 61.6583 270.656 61.6889 270.885 61.8875L273.75 64.2937L277.21 62.8958C277.5 62.7736 277.753 62.8194 277.966 63.0333C278.18 63.2472 278.226 63.4993 278.104 63.7896L276.706 67.25L279.112 70.0916C279.311 70.3208 279.341 70.5729 279.204 70.8479C279.066 71.1229 278.845 71.2451 278.539 71.2146L274.804 70.9625ZM263.071 64.8208C262.979 64.7291 262.933 64.6222 262.933 64.5C262.933 64.3777 262.979 64.2708 263.071 64.1791L264.262 62.9875C264.354 62.8958 264.461 62.85 264.583 62.85C264.705 62.85 264.812 62.8958 264.904 62.9875L266.096 64.1791C266.187 64.2708 266.233 64.3777 266.233 64.5C266.233 64.6222 266.187 64.7291 266.096 64.8208L264.904 66.0125C264.812 66.1041 264.705 66.15 264.583 66.15C264.461 66.15 264.354 66.1041 264.262 66.0125L263.071 64.8208ZM272.719 70.8479L273.819 69.0375L275.95 69.1979L274.575 67.5708L275.377 65.6L273.406 66.4021L271.779 65.05L271.939 67.1583L270.129 68.2812L272.191 68.7854L272.719 70.8479ZM276.179 77.9291L274.987 76.7375C274.896 76.6458 274.85 76.5389 274.85 76.4166C274.85 76.2944 274.896 76.1875 274.987 76.0958L276.179 74.9041C276.271 74.8125 276.378 74.7666 276.5 74.7666C276.622 74.7666 276.729 74.8125 276.821 74.9041L278.012 76.0958C278.104 76.1875 278.15 76.2944 278.15 76.4166C278.15 76.5389 278.104 76.6458 278.012 76.7375L276.821 77.9291C276.729 78.0208 276.622 78.0666 276.5 78.0666C276.378 78.0666 276.271 78.0208 276.179 77.9291Z" fill="url(#detail-ai-gradient)"/>
        </svg>
        <span class="detail-ai-text">AI-generated ticket</span>
    </span>`;


/**
 * Tells whether a task was created by the AI from an email.
 * @param {Object} task - Task object.
 * @returns {boolean}
 */
function isAiTicket(task) {
    return task.source === 'email' || AI_NOTE_PATTERN.test(task.description || '');
}


/**
 * Removes the "KI-generiert" note from a description, because the detail view shows it as a label.
 * @param {string} description - Task description.
 * @returns {string} Description without the note.
 */
function stripAiNote(description) {
    return description.replace(AI_NOTE_PATTERN, '').trim();
}


/**
 * Returns the due date and priority row HTML for the detail view.
 * @param {Object} task - Task object with dueDate and priority.
 * @param {string} prioLabel - Capitalised priority label.
 * @returns {string} HTML string.
 */
function buildDetailInfo(task, prioLabel) {
    return `
        <div class="detail-row">
            <span class="detail-label">Due date:</span>
            <span>${task.dueDate || '–'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Priority:</span>
            <span class="detail-prio">${prioLabel} ${prioSvg(task.priority)}</span>
        </div>`;
}


/**
 * Returns the assigned-to section HTML or empty string if no contacts.
 * @param {Object} task - Task object with assignedTo array.
 * @param {string} assignees - Pre-built assignee HTML.
 * @returns {string} HTML string.
 */
function buildDetailAssignSection(task, assignees) {
    if (!(task.assignedTo || []).length) return '';
    return `
        <div class="detail-section">
            <span class="detail-label">Assigned To:</span>
            <div class="detail-assignees">${assignees}</div>
        </div>`;
}


/**
 * Returns the subtask section HTML or empty string if there are no subtasks.
 * @param {Object} task - Task object with subtasks array.
 * @param {string} subtaskList - Pre-built subtask list HTML.
 * @returns {string} HTML string.
 */
function buildDetailSubtaskSection(task, subtaskList) {
    if (!(task.subtasks || []).length) return '';
    return `
        <div class="detail-section">
            <span class="detail-label">Subtasks</span>
            <ul class="detail-subtask-list">${subtaskList}</ul>
        </div>`;
}


/**
 * Returns the delete and edit action buttons HTML for the detail overlay.
 * Shows an accept button for triage tasks.
 * @param {Object} task - Task object with id and status.
 * @returns {string} HTML string.
 */
function buildDetailActions(task) {
    const taskId = task.id;
    return `
        <div class="detail-actions">
            ${task.status === 'triage' ? `
            <button class="detail-btn detail-btn--accept" onclick="acceptTriageTask(${taskId})"><span class="detail-accept-icon" aria-hidden="true">&#10003;</span><span class="detail-accept-label"><span>Accept to</span> <span>To do</span></span></button>
            <div class="detail-divider-v"></div>` : ''}
            <button class="detail-btn" onclick="deleteTask(${taskId})">
                <img src="../assets/icons/delete.svg" alt="Delete"> Delete
            </button>
            <div class="detail-divider-v"></div>
            <button class="detail-btn" onclick="openEditModal(${taskId})">
                <img src="../assets/icons/edit.svg" alt="Edit"> Edit
            </button>
        </div>`;
}



/**
 * Returns the creator of a task. Older feature requests only stored a requester,
 * which is always an external stakeholder.
 * @param {Object} task - Task object with optional creator or requester.
 * @returns {{name: string, email: string, type: 'internal'|'external'}|null} Creator or null.
 */
function getTaskCreator(task) {
    if (task.creator) return task.creator;
    if (task.requester) return { ...task.requester, type: 'external' };
    return null;
}


/**
 * Returns the creator line for the detail view: name, email and an internal/external badge.
 * @param {Object} task - Task object.
 * @returns {string} HTML string, empty when the task has no creator.
 */
function buildDetailRequester(task) {
    const creator = getTaskCreator(task);
    if (!creator) return '';
    const external = creator.type === 'external';
    return `
        <div class="detail-creator">
            <div class="detail-creator-label">
                <span class="detail-label detail-creator-title">Creator:</span>
                <span class="creator-badge ${external ? 'creator-badge--external' : 'creator-badge--internal'}">
                    ${external ? GLOBE_ICON : TEAM_ICON}${external ? 'Extern' : 'Intern'}
                </span>
            </div>
            <div class="detail-creator-person">
                <span class="detail-creator-name" title="${escapeHtml(creator.name || creator.email || '')}">${escapeHtml(shortPersonName(creator.name || creator.email || 'unknown'))}</span>
                ${creator.email ? buildCreatorMailLink(creator.email, task.title) : ''}
            </div>
        </div>`;
}


/**
 * Returns the "E-mail" link that writes to the creator of the task.
 * @param {string} email - Creator email.
 * @param {string} title - Task title, used as subject.
 * @returns {string} HTML string.
 */
function buildCreatorMailLink(email, title) {
    const href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Re: ${title || 'your ticket'}`)}`;
    return `<a class="detail-creator-mail" href="${href}" title="${escapeHtml(email)}" onclick="event.stopPropagation()">${MAIL_ICON}<span>E-mail</span></a>`;
}

/** Globe icon of the "Extern" badge (design). */
const GLOBE_ICON = `<svg viewBox="141 408.5 14 14" width="14" height="14" aria-hidden="true"><path d="M148 422.5C147.043 422.5 146.139 422.316 145.287 421.949C144.436 421.581 143.692 421.08 143.056 420.444C142.42 419.808 141.919 419.064 141.551 418.212C141.184 417.361 141 416.457 141 415.5C141 414.532 141.184 413.625 141.551 412.779C141.919 411.933 142.42 411.192 143.056 410.556C143.692 409.92 144.436 409.419 145.287 409.051C146.139 408.684 147.043 408.5 148 408.5C148.968 408.5 149.875 408.684 150.721 409.051C151.567 409.419 152.308 409.92 152.944 410.556C153.58 411.192 154.081 411.933 154.449 412.779C154.816 413.625 155 414.532 155 415.5C155 416.457 154.816 417.361 154.449 418.212C154.081 419.064 153.58 419.808 152.944 420.444C152.308 421.08 151.567 421.581 150.721 421.949C149.875 422.316 148.968 422.5 148 422.5ZM148 421.065C148.303 420.645 148.566 420.208 148.787 419.753C149.009 419.298 149.19 418.813 149.33 418.3H146.67C146.81 418.813 146.991 419.298 147.213 419.753C147.434 420.208 147.697 420.645 148 421.065ZM146.18 420.785C145.97 420.4 145.786 420 145.629 419.586C145.471 419.172 145.34 418.743 145.235 418.3H143.17C143.508 418.883 143.931 419.391 144.439 419.823C144.946 420.254 145.527 420.575 146.18 420.785ZM149.82 420.785C150.473 420.575 151.054 420.254 151.561 419.823C152.069 419.391 152.492 418.883 152.83 418.3H150.765C150.66 418.743 150.529 419.172 150.371 419.586C150.214 420 150.03 420.4 149.82 420.785ZM142.575 416.9H144.955C144.92 416.667 144.894 416.436 144.876 416.209C144.859 415.981 144.85 415.745 144.85 415.5C144.85 415.255 144.859 415.019 144.876 414.791C144.894 414.564 144.92 414.333 144.955 414.1H142.575C142.517 414.333 142.473 414.564 142.444 414.791C142.415 415.019 142.4 415.255 142.4 415.5C142.4 415.745 142.415 415.981 142.444 416.209C142.473 416.436 142.517 416.667 142.575 416.9ZM146.355 416.9H149.645C149.68 416.667 149.706 416.436 149.724 416.209C149.741 415.981 149.75 415.745 149.75 415.5C149.75 415.255 149.741 415.019 149.724 414.791C149.706 414.564 149.68 414.333 149.645 414.1H146.355C146.32 414.333 146.294 414.564 146.276 414.791C146.259 415.019 146.25 415.255 146.25 415.5C146.25 415.745 146.259 415.981 146.276 416.209C146.294 416.436 146.32 416.667 146.355 416.9ZM151.045 416.9H153.425C153.483 416.667 153.527 416.436 153.556 416.209C153.585 415.981 153.6 415.745 153.6 415.5C153.6 415.255 153.585 415.019 153.556 414.791C153.527 414.564 153.483 414.333 153.425 414.1H151.045C151.08 414.333 151.106 414.564 151.124 414.791C151.141 415.019 151.15 415.255 151.15 415.5C151.15 415.745 151.141 415.981 151.124 416.209C151.106 416.436 151.08 416.667 151.045 416.9ZM150.765 412.7H152.83C152.492 412.117 152.069 411.609 151.561 411.178C151.054 410.746 150.473 410.425 149.82 410.215C150.03 410.6 150.214 411 150.371 411.414C150.529 411.828 150.66 412.257 150.765 412.7ZM146.67 412.7H149.33C149.19 412.187 149.009 411.702 148.787 411.247C148.566 410.793 148.303 410.355 148 409.935C147.697 410.355 147.434 410.793 147.213 411.247C146.991 411.702 146.81 412.187 146.67 412.7ZM143.17 412.7H145.235C145.34 412.257 145.471 411.828 145.629 411.414C145.786 411 145.97 410.6 146.18 410.215C145.527 410.425 144.946 410.746 144.439 411.178C143.931 411.609 143.508 412.117 143.17 412.7Z" fill="currentColor"/></svg>`;

/** Team icon of the "Intern" badge. */
const TEAM_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/></svg>`;

/** attach_email icon of the "E-mail" link (design). */
const MAIL_ICON = `<svg viewBox="416 407.5 18 16" width="18" height="16" aria-hidden="true"><path d="M417.636 420.3C417.186 420.3 416.801 420.143 416.481 419.83C416.16 419.517 416 419.14 416 418.7V409.1C416 408.66 416.16 408.283 416.481 407.97C416.801 407.657 417.186 407.5 417.636 407.5H430.727C431.177 407.5 431.562 407.657 431.883 407.97C432.203 408.283 432.364 408.66 432.364 409.1V412.3C432.364 412.527 432.285 412.717 432.128 412.87C431.972 413.023 431.777 413.1 431.545 413.1C431.314 413.1 431.119 413.023 430.963 412.87C430.806 412.717 430.727 412.527 430.727 412.3V410.7L424.611 414.44C424.543 414.48 424.472 414.51 424.397 414.53C424.322 414.55 424.25 414.56 424.182 414.56C424.114 414.56 424.042 414.55 423.967 414.53C423.892 414.51 423.82 414.48 423.752 414.44L417.636 410.7V418.7H425C425.232 418.7 425.426 418.777 425.583 418.93C425.74 419.083 425.818 419.273 425.818 419.5C425.818 419.727 425.74 419.917 425.583 420.07C425.426 420.223 425.232 420.3 425 420.3H417.636ZM424.182 413.1L430.727 409.1H417.636L424.182 413.1ZM430.727 423.5C429.827 423.5 429.057 423.187 428.416 422.56C427.775 421.933 427.455 421.18 427.455 420.3V416.7C427.455 416.14 427.652 415.667 428.048 415.28C428.443 414.893 428.927 414.7 429.5 414.7C430.073 414.7 430.557 414.893 430.952 415.28C431.348 415.667 431.545 416.14 431.545 416.7V419.5C431.545 419.727 431.467 419.917 431.31 420.07C431.153 420.223 430.959 420.3 430.727 420.3C430.495 420.3 430.301 420.223 430.144 420.07C429.988 419.917 429.909 419.727 429.909 419.5V416.7C429.909 416.593 429.868 416.5 429.786 416.42C429.705 416.34 429.609 416.3 429.5 416.3C429.391 416.3 429.295 416.34 429.214 416.42C429.132 416.5 429.091 416.593 429.091 416.7V420.3C429.091 420.74 429.251 421.117 429.572 421.43C429.892 421.743 430.277 421.9 430.727 421.9C431.177 421.9 431.562 421.743 431.883 421.43C432.203 421.117 432.364 420.74 432.364 420.3V417.9C432.364 417.673 432.442 417.483 432.599 417.33C432.756 417.177 432.95 417.1 433.182 417.1C433.414 417.1 433.608 417.177 433.765 417.33C433.922 417.483 434 417.673 434 417.9V420.3C434 421.18 433.68 421.933 433.039 422.56C432.398 423.187 431.627 423.5 430.727 423.5Z" fill="currentColor"/></svg>`;


/**
 * Adds the current photo of the matching board contact to an assignee object.
 * @param {Object} assignee - Assignee object with id.
 * @returns {Object} Assignee enriched with photo if one exists.
 */
function withContactPhoto(assignee) {
    const contacts = typeof boardContacts !== 'undefined' ? boardContacts : [];
    const match = contacts.find(c => String(c.id) === String(assignee.id));
    return match?.photo ? { ...assignee, photo: match.photo } : assignee;
}

/** Names longer than this are shortened to first name + initial of the last name. */
const MAX_FULL_NAME_LENGTH = 12;


/**
 * Shortens long names to first name and the initial of the last name, e.g. "Julia Weißenberger" → "Julia W.".
 * Short names and single words (like an email address) stay unchanged.
 * @param {string} name - Full name.
 * @returns {string} Name to display.
 */
function shortPersonName(name) {
    const full = String(name || '').trim().replace(/\s+/g, ' ');
    const parts = full.split(' ');
    if (full.length <= MAX_FULL_NAME_LENGTH || parts.length < 2) return full;
    return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

