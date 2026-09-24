const dialogElement = document.querySelector("dialog");
const dialog = document.getElementById("add-contact-dialog");
const contactListContainer = document.getElementById("contacts-list-import");
const contactDetailsContainer = document.getElementById("contact-details-view");
const CONTACTS_URL = `${JOIN_DB_URL}/contacts.json`;
let loadedContacts = [];
let pendingContactPhoto = '';
let dialogContactBase = {};


/**
 * Initializes the contacts view: resets the local contacts cache,
 * loads contacts from the appropriate source (guest or remote DB)
 * and renders them into the DOM.
 * @async
 * @returns {Promise<void>}
 */
async function init() {
    initMain();
    loadedContacts = [];
    await loadAndPrepareContacts();
    renderContacts();

}


/**
 * Loads the contacts from Firebase, normalizes them into an array and
 * populates `loadedContacts` via {@link addContactsToLoaded}.
 * Guests see the same real contacts (including everyone who registered);
 * the demo file db.json is only used when Firebase cannot be reached.
 * @async
 * @returns {Promise<void>}
 */
async function loadAndPrepareContacts() {
    try {
        let raw = await fetchContactsSource(CONTACTS_URL, data => data);
        if (!raw && checkIsGuest()) raw = await fetchContactsSource('../db.json', data => data.contacts);
        const arr = Object.keys(raw || {}).map(key => ({ ...raw[key], id: key }));
        loadedContacts = [];
        addContactsToLoaded(arr.filter(c => c && c.name));
    } catch (error) { console.error("Fehler beim Laden:", error); }
}


/**
 * Fetches a contact source and returns its contact collection, or null if it is unreachable or empty.
 * @async
 * @param {string} url - Firebase URL or path of the demo file.
 * @param {function(Object): Object} pick - Picks the contact collection from the response.
 * @returns {Promise<Object|Array|null>}
 */
async function fetchContactsSource(url, pick) {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        return (data && pick(data)) || null;
    } catch (error) {
        return null;
    }
}


/**
 * Adds an array of raw contact objects to the global `loadedContacts`
 * array, normalizing fields (phone, color, avatar) and avoiding
 * duplicate entries by id.
 * @param {Array<Object>} contactsFromDB - Raw contact objects (e.g. from Firebase/JSON).
 * @returns {void}
 */
function addContactsToLoaded(contactsFromDB) {
    contactsFromDB.forEach(c => {
        const cId = String(c.id);
        if (!loadedContacts.some(lc => String(lc.id) === cId)) {
            loadedContacts.push({
                id: cId, name: c.name, email: c.email,
                phone: c.phone || 'no phone number provided',
                color: c.color || getRandomColor(),
                avatar: c.avatar || getInitials(c.name),
                photo: c.photo || ''
            });
        }
    });
}


/**
 * Groups all loaded contacts alphabetically by the first letter of
 * their name, sorting the contacts within each group.
 * @returns {Object<string, Array<Object>>} A map of letter -> array of contacts.
 */
function groupContactsByLetter() {
    let groups = {};
    let sorted = [...loadedContacts].sort((a, b) => a.name.localeCompare(b.name));

    sorted.forEach(contact => {
        let firstLetter = contact.name.charAt(0).toUpperCase();
        if (!groups[firstLetter]) groups[firstLetter] = [];
        groups[firstLetter].push(contact);
    });
    return groups;
}


/**
 * Renders the HTML markup for a single letter group (e.g. all contacts
 * starting with "A"), including the group header and its contact items.
 * @param {[string, Array<Object>]} entry - A `[letter, contacts]` pair from `Object.entries`.
 * @returns {string} HTML markup for the letter group.
 */
function renderLetterGroup([letter, contactsInGroup]) {
    let itemsHtml = contactsInGroup.map(renderContactlist).join('');
    return renderLetterGroupTemplate(letter, itemsHtml);
}


/**
 * Renders the full contacts list into the `contactListContainer`,
 * grouped alphabetically by first letter.
 * @returns {void}
 */
function renderContacts() {
    if (!contactListContainer) return;

    let groupedData = groupContactsByLetter();
    let html = Object.entries(groupedData).map(renderLetterGroup).join('');

    contactListContainer.innerHTML = html;
}


/**
 * Opens the add/edit contact dialog as a modal.
 * @returns {void}
 */
function openDialog() {
    dialog.showModal();
}


/**
 * Closes the add/edit contact dialog.
 * @returns {void}
 */
function closeDialog() {
    dialog.close();
}


/**
 * Displays the detail view for a given contact, marks the
 * corresponding list item as active, and switches to the detail
 * view on mobile viewports.
 * @param {string|number} contactId - The id of the contact to display.
 * @returns {void}
 */
function showContactDetails(contactId) {
    const currentActive = document.querySelector('.contact-item.active');
    if (currentActive) currentActive.classList.remove('active');
    const clickedElement = document.getElementById(contactId);
    if (clickedElement) clickedElement.classList.add('active');
    const contact = loadedContacts.find(c => String(c.id) === String(contactId));
    if (contact) contactDetailsContainer.innerHTML = renderContactDetails(contact);

    if (window.innerWidth <= 768) {
        toggleMobileContactView(true);
    }
}


/**
 * Assigns an id, avatar and color to a new contact, then saves it
 * either locally (guest mode) or to the remote database.
 * @async
 * @param {Object} newContact - The new contact data (name, email, phone).
 * @returns {Promise<void>}
 */
async function saveContactToDB(newContact) {
    const isGuest = checkIsGuest();
    newContact.id = loadedContacts.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0) + 1;
    newContact.avatar = getInitials(newContact.name);
    newContact.color = getRandomColor();

    if (isGuest) {
        saveGuestContact(newContact);
    } else {
        await saveUserContact(newContact);
    }
}


/**
 * Persists a new contact to the remote Firebase database, reloads
 * the contact list, closes the dialog and re-renders the UI.
 * @async
 * @param {Object} newContact - The contact to persist.
 * @returns {Promise<void>}
 */
async function saveUserContact(newContact) {
    try {
        await fetch(`${CONTACTS_URL.replace('.json', '')}/${newContact.id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newContact)
        });
        await loadAndPrepareContacts();
        dialog.close();
        renderContacts();
    } catch (e) { console.error("Fehler beim Cloud-Speichern:", e); }
}


/**
 * Handles submission of the "Edit contact" form: reads updated values
 * and dispatches to the guest or remote update routine.
 * @async
 * @param {SubmitEvent} event - The form submit event.
 * @param {string|number} id - The id of the contact being updated.
 * @returns {Promise<void>}
 */
async function updateContact(event, id) {
    event.preventDefault();
    const contact = loadedContacts.find(c => String(c.id) === String(id));
    if (!contact) return;
    const data = new FormData(event.target);
    const updated = {
        id: contact.id, color: contact.color,
        name: data.get('name').trim(), email: data.get('email').trim(),
        phone: data.get('phone').trim() || 'no phone number provided',
        photo: pendingContactPhoto
    };
    updated.avatar = getInitials(updated.name);
    if (checkIsGuest()) updateGuestContact(updated); else await updateUserContact(updated);
}


/**
 * Persists an updated contact to the remote Firebase database, reloads
 * the contact list and refreshes the UI to reflect the change.
 * @async
 * @param {Object} updated - The updated contact data.
 * @returns {Promise<void>}
 */
async function updateUserContact(updated) {
    try {
        await fetch(`${CONTACTS_URL.replace('.json', '')}/${updated.id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        await loadAndPrepareContacts();
        finalizeUpdate(updated.id);
    } catch (e) { console.error('Update error:', e); }
}


/**
 * Updates a contact in the local `loadedContacts` array for guest
 * users (no backend persistence).
 * @param {Object} updated - The updated contact data.
 * @returns {void}
 */
function updateGuestContact(updated) {
    const idx = loadedContacts.findIndex(c => String(c.id) === String(updated.id));
    if (idx !== -1) loadedContacts[idx] = updated;
    finalizeUpdate(updated.id);
}

 
/**
 * Common cleanup after a contact update: closes the dialog,
 * re-renders the contact list, and re-opens the detail view
 * for the updated contact.
 * @param {string|number} id - The id of the updated contact.
 * @returns {void}
 */
function finalizeUpdate(id) {
    dialog.close();
    renderContacts();
    showContactDetails(String(id));
}


/**
 * Determines whether the current session belongs to a guest user
 * by inspecting `sessionStorage`. Defaults to `true` (guest) if
 * the session data cannot be parsed.
 * @returns {boolean} `true` if the current user is a guest, otherwise `false`.
 */
function checkIsGuest() {
    try {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        return user?.isGuest === true;
    } catch (e) {
        return true;
    }
}


/**
 * Toggles between the contacts list and the contact detail view
 * on mobile/narrow viewports by show/hiding the split panels.
 * @param {boolean} showDetails - If `true`, shows the detail panel and hides the list.
 * @returns {void}
 */
function toggleMobileContactView(showDetails) {
    const left = document.querySelector('.contacts-split-left');
    const right = document.querySelector('.contacts-split-right');
    if (left && right) {
        left.style.display = showDetails ? 'none' : '';
        right.style.display = showDetails ? 'flex' : '';
    }
}


/**
 * Resets the mobile view back to the contacts list and clears the
 * currently active contact selection.
 * @returns {void}
 */
function resetMobileContactView() {
    toggleMobileContactView(false);
    const currentActive = document.querySelector('.contact-item.active');
    if (currentActive) {
        currentActive.classList.remove('active');
    }
}


/**
 * Toggles the visibility of the mobile contact options menu and
 * registers an outside-click listener to close it when open.
 * @param {MouseEvent} event - The triggering click event (propagation is stopped).
 * @returns {void}
 */
function toggleMobileOptions(event) {
    event.stopPropagation();
    const menu = document.getElementById('mobile-options-menu');
    if (menu) {
        menu.classList.toggle('show');
    }
    if (menu && menu.classList.contains('show')) {
        document.addEventListener('click', closeMobileOptionsOutside);
    }
}


/**
 * Closes the mobile options menu when a click occurs outside of it,
 * and removes itself as a document click listener.
 * @returns {void}
 */
function closeMobileOptionsOutside() {
    const menu = document.getElementById('mobile-options-menu');
    if (menu) {
        menu.classList.remove('show');
    }
    document.removeEventListener('click', closeMobileOptionsOutside);
}


/**
 * Resets the split-view layout to its default (desktop) state
 * whenever the window is resized above the mobile breakpoint.
 */
window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
        const left = document.querySelector('.contacts-split-left');
        const right = document.querySelector('.contacts-split-right');
        if (left && right) {
            left.style.display = '';
            right.style.display = '';
        }
    }
});


/**
 * Displays a transient toast notification with the given message.
 * @param {string} message - The text to display in the toast.
 * @returns {void}
 */
function showToastFeedback(message) {
    const toast = document.createElement('div');
    toast.className = 'contact-success-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => removeToastFeedback(toast), 3000);
}


/**
 * Hides and then removes a toast notification element from the DOM.
 * @param {HTMLElement} toast - The toast element to remove.
 * @returns {void}
 */
function removeToastFeedback(toast) {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
}


