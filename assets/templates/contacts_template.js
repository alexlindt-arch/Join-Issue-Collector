
/**
 * Renders the HTML template for a single contact item within the contact list.
 * * @param {Contact} contact - The contact object to be rendered.
 * @returns {string} The HTML string template for the list item.
 */
function renderContactlist(contact) {
    return `<div class="contact-item" id="${contact.id}" onclick="showContactDetails('${contact.id}')">
        <div class="avatar" style="background-color: ${contact.color};">${avatarInnerHTML(contact)}</div>
        <div class="contact-info">
            <span class="name">${contact.name}</span>
            <span class="email">${contact.email}</span>
        </div>
    </div>`;
}


/**
 * Renders a letter group container (e.g., "A", "B", "C") used for alphabetical sorting in the contact list.
 * * @param {string} letter - The initial letter of the group.
 * @param {string} itemsHtml - The pre-rendered HTML string of contacts belonging to this letter group.
 * @returns {string} The HTML string template for the letter group.
 */
function renderLetterGroupTemplate(letter, itemsHtml) {
    return `
        <div class="letter-group">
            <h2 class="letter-group-title">${letter}</h2>
            ${itemsHtml}
        </div>
    `;
}


/**
 * Renders the detailed profile view of a contact, including action buttons for both desktop and mobile views.
 * * @param {Contact} contact - The contact object whose details are to be displayed.
 * @returns {string} The HTML string template for the detailed profile view.
 */
function renderContactDetails(contact) {
    return `<div class="profile-header">
                        <div class="profile-avatar" style="background-color: ${contact.color};">${avatarInnerHTML(contact)}</div>
                        <div class="profile-meta">
                            <h2 class="profile-name">${contact.name}</h2>
                            <div class="profile-actions for-mobile-hide" id="profile">
                                <button type="button" class="profile-btn" onclick="editContact('${contact.id}')">
                                <img src="../assets/icons/edit_contacts.svg"alt="edit"> Edit
                                </button>
                                <button type="button" class="profile-btn" onclick="deleteContact('${contact.id}')">
                                <img src="../assets/icons/delete.svg"alt="delete"> Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="profile-body">
                        <h3 class="section-title">Contact Information</h3>

                        <div class="info-group">
                            <label class="info-label">E-mail</label>
                            <span class="info-value email-link">${contact.email}</span>
                        </div>

                        <div class="info-group">
                            <label class="info-label">Phone</label>
                            <span class="info-value">${contact.phone}</span>
                        </div>

                        <button type="button" class="btn-options-mobile" onclick="toggleMobileOptions(event)">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="5" r="2" fill="white"/>
                                <circle cx="12" cy="12" r="2" fill="white"/>
                                <circle cx="12" cy="19" r="2" fill="white"/>
                            </svg>
                        </button>

                        <div id="mobile-options-menu" class="mobile-options-popup" onclick="event.stopPropagation()">
                            <div class="menu-item" onclick="editContact('${contact.id}')">
                               <img src="../assets/icons/edit_contacts.svg" alt="Edit">
                               <span>Edit</span>
                           </div>
                            <div class="menu-item" onclick="deleteContact('${contact.id}')">
                                <img src="../assets/icons/delete.svg" alt="Delete">
                                <span>Delete</span>
                            </div>
                      </div>
                    </div>`;
}


/**
 * Renders the layout framework of the modal dialog used for adding or editing a contact.
 * It also stores the form submission action globally on the `window` object.
 * * @param {string} title - The title of the dialog (e.g., "Add contact" or "Edit contact").
 * @param {string} submitAction - The name of the global function (as a string) to execute upon form submission.
 * @param {string} buttonHtml - The pre-rendered HTML string for the footer buttons (context-dependent).
 * @returns {string} The HTML string template for the modal dialog.
 */
function renderDialogContact(title, submitAction, buttonHtml) {
    window.currentSubmitAction = submitAction; 
    const isEdit = typeof title === 'string' && title.toLowerCase().includes('edit');
    return `<div class="modal-content" onclick="event.stopPropagation()">
            <div class="modal-left">
            <button type="button" class="close-dialog dp-show-mobile" onclick="closeDialog()">×</button>
                <div class="modal-logo for-mobile-hide"><img src="../assets/img/logo_white.svg" alt="join icon"></div>
                <h2>${title}</h2>
                ${title.includes('Edit') ? '' : `<p class="modal-tagline">Tasks are better with a team!</p>`}
                <div class="modal-divider"></div>
            </div>

            <form method="dialog" class="modal-right" onsubmit="handleContactSubmit(event, window.currentSubmitAction)">
                <button type="button" class="close-dialog dp-hidden-mobile" onclick="closeDialog()">×</button>

                <div class="avatar-upload">
                    <label class="profile-placeholder" for="modal-photo" title="Upload photo (JPG/PNG)">
                        <i class="fa-solid fa-user"></i>
                    </label>
                    <input type="file" id="modal-photo" accept="image/jpeg,image/png" hidden
                        onchange="handleContactPhotoSelect(this)">
                    <button type="button" class="avatar-remove-btn d-none" id="avatar-remove-btn"
                        onclick="removeContactPhoto()">Remove photo</button>
                </div>

                <div class="input-group">
                    <input type="text" id="modal-name" name="name" placeholder="Name" onblur="validateField('name')" autocomplete="off">
                    <i class="fa-solid fa-user"></i>
                </div>
                <div id="name-error" class="error-message">Please enter both your first and last name.</div>

                <div class="input-group">
                    <input type="text" id="modal-email" name="email" placeholder="Email" onblur="validateField('email')" autocomplete="off">
                    <i class="fa-solid fa-envelope"></i>
                </div>
                <div id="email-error" class="error-message">Please enter a valid email address.</div>

                <div class="input-group">
                    <input type="text" id="modal-phone" name="phone" placeholder="Phone" oninput="allowOnlyNumbers(this)" onblur="validateField('phone')" autocomplete="off">
                    <i class="fa-solid fa-phone"></i>
                </div>
                <div id="phone-error" class="error-message">Only numbers are allowed.</div>

                <div class="modal-footer">
                    ${buttonHtml}
                </div>
            </form>
        </div> `;
}


/**
 * Renders the action buttons for the dialog when an existing contact is being *edited* (Delete & Save).
 * * @param {Contact} contact - The contact object currently being edited.
 * @returns {string} The HTML string template for the "Delete" and "Save" buttons.
 */
function renderDialogContactEditButton(contact) {
    return `<button type="button" class="btn-cancel" onclick="deleteContact('${contact.id}')"> Delete <i
                class="fa-solid fa-xmark"></i></button>
            <button type="submit" class="btn-submit"> Save <i class="fa-solid fa-check"></i></button>`;
}


/**
 * Renders the action buttons for the dialog when a new contact is being *created* (Cancel & Create contact).
 * * @returns {string} The HTML string template for the "Cancel" and "Create contact" buttons.
 */
function renderDialogCreateContactButton() {
    return `<button type="button" class="btn-cancel btn-mobile-hide" onclick="closeDialog()"> Cancel <i
                class="fa-solid fa-xmark"></i></button>
            <button type="submit" class="btn-submit"> Create contact <i class="fa-solid fa-check"></i></button>`;
}