/**
 * Returns the full HTML string for the add-task modal dialog.
 * @returns {string} HTML string for the <dialog> element.
 */
function renderAddTaskModal() {
    return `
    <dialog class="board-overlay" id="add-task-overlay" onclick="closeAddTaskModal(event)">
        <div class="add-task-modal" onclick="event.stopPropagation()">
            <button class="modal-close-btn" onmousedown="event.stopPropagation(); event.preventDefault();" onclick="closeAddTaskModal()">&times;</button>
            <h2 class="modal-title">Add Task</h2>

            <form method="dialog" class="task-form" id="modal-task-form" onsubmit="createTaskFromModal(event)">
            <div class="task-form-detail">
                <div class="form-columns">
                    <div class="form-col">
                        <div class="form-group">
                            <label class="form-label" for="modal-task-title">Title <span class="required">*</span></label>
                            <input class="form-input" type="text" id="modal-task-title" placeholder="Enter a title"
                                oninput="updateModalCreateButton()">
                            <span class="field-error d-none" id="modal-error-title">This field is required</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="modal-task-desc">Description</label>
                            <textarea class="form-input form-textarea" id="modal-task-desc"
                                placeholder="Enter a description"></textarea>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="modal-task-due">Due date <span class="required">*</span></label>
                            <div class="form-input-icon">
                                <input class="form-input" type="text" id="modal-task-due"
                                    placeholder="TT.MM.JJJJ" readonly style="cursor:pointer;"
                                    onchange="updateModalCreateButton()">
                                <svg class="input-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <mask id="mask-modal-cal" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                                        <rect width="24" height="24" fill="#D9D9D9"/>
                                    </mask>
                                    <g mask="url(#mask-modal-cal)">
                                        <path d="M14.5 18C13.8 18 13.2083 17.7583 12.725 17.275C12.2417 16.7917 12 16.2 12 15.5C12 14.8 12.2417 14.2083 12.725 13.725C13.2083 13.2417 13.8 13 14.5 13C15.2 13 15.7917 13.2417 16.275 13.725C16.7583 14.2083 17 14.8 17 15.5C17 16.2 16.7583 16.7917 16.275 17.275C15.7917 17.7583 15.2 18 14.5 18ZM5 22C4.45 22 3.97917 21.8042 3.5875 21.4125C3.19583 21.0208 3 20.55 3 20V6C3 5.45 3.19583 4.97917 3.5875 4.5875C3.97917 4.19583 4.45 4 5 4H6V3C6 2.71667 6.09583 2.47917 6.2875 2.2875C6.47917 2.09583 6.71667 2 7 2C7.28333 2 7.52083 2.09583 7.7125 2.2875C7.90417 2.47917 8 2.71667 8 3V4H16V3C16 2.71667 16.0958 2.47917 16.2875 2.2875C16.4792 2.09583 16.7167 2 17 2C17.2833 2 17.5208 2.09583 17.7125 2.2875C17.9042 2.47917 18 2.71667 18 3V4H19C19.55 4 20.0208 4.19583 20.4125 4.5875C20.8042 4.97917 21 5.45 21 6V20C21 20.55 20.8042 21.0208 20.4125 21.4125C20.0208 21.8042 19.55 22 19 22H5ZM5 20H19V10H5V20ZM5 8H19V6H5V8Z" fill="#2A3647"/>
                                    </g>
                                </svg>
                            </div>
                            <span class="field-error d-none" id="modal-error-due">This field is required</span>
                        </div>
                    </div>

                    <div class="form-divider-vertical"></div>

                    <div class="form-col">
                        <div class="form-group">
                            <label class="form-label">Priority</label>
                            <div class="prio-buttons">
                                <button type="button" class="prio-btn prio-urgent" data-prio="urgent"
                                    onclick="setModalPriority(this)">
                                    Urgent
                                    <svg width="20" height="15" viewBox="0 0 20 14.51" fill="none">
                                        <path d="M0 8.76 L10 0 L20 8.76 L17.5 8.76 L10 2.5 L2.5 8.76 Z" />
                                        <path d="M0 14.51 L10 5.75 L20 14.51 L17.5 14.51 L10 8.25 L2.5 14.51 Z" />
                                    </svg>
                                </button>
                                <button type="button" class="prio-btn prio-medium prio-active" data-prio="medium"
                                    onclick="setModalPriority(this)">
                                    Medium
                                    <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
                                        <rect x="0" y="0" width="20" height="2.21" rx="1.1" />
                                        <rect x="0" y="5.24" width="20" height="2.21" rx="1.1" />
                                    </svg>
                                </button>
                                <button type="button" class="prio-btn prio-low" data-prio="low"
                                    onclick="setModalPriority(this)">
                                    Low
                                    <svg width="20" height="15" viewBox="0 0 20 14.51" fill="none">
                                        <path d="M0 0 L10 8.76 L20 0 L17.5 0 L10 6.26 L2.5 0 Z" />
                                        <path d="M0 5.75 L10 14.51 L20 5.75 L17.5 5.75 L10 12.01 L2.5 5.75 Z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div class="form-group" style="position: relative;">
                            <label class="form-label">Assigned to</label>
                            <div class="custom-select" id="modal-assign-select">
                                <div class="form-input select-toggle" id="modal-assign-toggle"
                                    onclick="toggleModalAssignDropdown()">
                                    <span>Select contacts to assign</span>
                                    <span class="select-caret">&#9662;</span>
                                </div>
                                <div class="select-options d-none" id="modal-assign-options"></div>
                            </div>
                            <div class="assigned-avatars" id="modal-assigned-avatars"
                                style="position: absolute; top: 100%; left: 0; z-index: 1;"></div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="margin-top: 30px;">Category <span class="required">*</span></label>
                            <div class="custom-select" id="modal-category-select">
                                <div class="form-input select-toggle" id="modal-category-toggle"
                                    onclick="toggleModalCategoryDropdown()">
                                    <span id="modal-category-selected" class="select-placeholder">Select task category</span>
                                    <span class="select-caret">&#9662;</span>
                                </div>
                                <div class="select-options d-none" id="modal-category-options">
                                    <div class="select-option" onclick="selectModalCategory('Technical Task')">Technical Task</div>
                                    <div class="select-option" onclick="selectModalCategory('User Story')">User Story</div>
                                </div>
                            </div>
                            <span class="field-error d-none" id="modal-error-category">This field is required</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="modal-task-subtask">Subtasks</label>
                            <div class="subtask-input-wrapper">
                                <input class="form-input" type="text" id="modal-task-subtask"
                                    placeholder="Add new subtask" oninput="updateModalSubtaskActions()"
                                    onkeydown="handleModalSubtaskKey(event)">
                                <div class="subtask-actions">
                                    <span class="subtask-edit-actions d-none" id="modal-subtask-edit-actions">
                                        <button type="button" class="subtask-icon-btn" title="Clear"
                                            onclick="clearModalSubtaskInput()">&#10005;</button>
                                        <span class="subtask-action-divider"></span>
                                        <button type="button" class="subtask-icon-btn" title="Add"
                                            onclick="addModalSubtask()">&#10003;</button>
                                    </span>
                                </div>
                            </div>
                            <ul class="subtask-list" id="modal-subtask-list"></ul>
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-footer">
                <span class="required-hint"><span class="required">*</span>This field is required</span>
                <div class="form-actions">
                    <button type="button" class="btn-clear" onclick="clearModalTaskForm()">Clear <span class="btn-x">✕</span></button>
                    <button type="submit" class="btn-create" id="modal-btn-create" disabled>
                        Create Task
                        <img src="../assets/icons/done.svg" alt="" class="btn-icon">
                    </button>
                </div>
            </div>
            </form>
        </div>
    </dialog>`;
}


/**
 * Injects the add-task modal into the DOM and initialises its date picker.
 * @returns {void}
 */
function injectAddTaskModal() {
    document.body.insertAdjacentHTML('beforeend', renderAddTaskModal());
    setTimeout(initModalDatepicker, 0);
}


/**
 * Attaches a flatpickr date picker to the modal due-date input.
 * @returns {void}
 */
function initModalDatepicker() {
    const modalDue = document.getElementById('modal-task-due');
    const modalContainer = document.querySelector('.add-task-modal');
    if (modalDue && window.flatpickr) {
        flatpickr(modalDue, {
            dateFormat: 'd.m.Y',
            minDate: 'today',
            allowInput: false,
            disableMobile: true,
            position: 'above',
            appendTo: modalContainer || document.body,
            onReady: function (selectedDates, dateStr, instance) {
                instance.calendarContainer.style.zIndex = '99999';
            },
            onChange: function () {
                if (typeof updateModalCreateButton === 'function') updateModalCreateButton();
            }
        });
    }
    if (window.attachDatepickers) try { window.attachDatepickers(); } catch (e) {}
}


/**
 * Injects the add-task modal immediately or waits for DOMContentLoaded.
 * @returns {void}
 */
function initAddTaskModal() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectAddTaskModal);
    } else {
        injectAddTaskModal();
    }
}


try {
    initAddTaskModal();
} catch (e) {
    /* ignore injection errors in non-browser contexts */
}