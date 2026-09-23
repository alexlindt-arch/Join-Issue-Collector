const IMAGE_MAX_INPUT_BYTES = 15 * 1024 * 1024;
const TASK_ATTACHMENTS_MAX_BYTES = 1024 * 1024;
const ATTACHMENT_MAX_SIZE = 800;
const AVATAR_MAX_SIZE = 200;


/**
 * Checks the first bytes of a file to verify it really is a JPEG or PNG.
 * Prevents renamed files (e.g. .exe → .jpg) from being accepted.
 * @async
 * @param {File} file - The selected file.
 * @returns {Promise<boolean>} True if the file starts with a JPEG or PNG signature.
 */
async function hasImageMagicBytes(file) {
    const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    return isJpeg || isPng;
}


/**
 * Validates type, size and signature of an image file.
 * @async
 * @param {File} file - The selected file.
 * @returns {Promise<string>} Empty string when valid, otherwise an error message.
 */
async function validateImageFile(file) {
    if (!['image/jpeg', 'image/png'].includes(file.type)) return `${file.name}: only JPG and PNG are allowed.`;
    if (file.size > IMAGE_MAX_INPUT_BYTES) return `${file.name}: file is larger than 15 MB.`;
    if (!(await hasImageMagicBytes(file))) return `${file.name}: file is not a valid image.`;
    return '';
}


/**
 * Loads a file into an HTMLImageElement.
 * @param {File} file - The image file.
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image could not be loaded')); };
        img.src = url;
    });
}


/**
 * Scales an image down to fit into a square box and returns it as JPEG data URL.
 * @async
 * @param {File} file - The image file.
 * @param {number} maxSize - Maximum width/height in pixels.
 * @param {number} [quality=0.7] - JPEG quality between 0 and 1.
 * @returns {Promise<string>} Compressed image as data URL.
 */
async function compressImage(file, maxSize, quality = 0.7) {
    const img = await loadImageFromFile(file);
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
}


/**
 * Returns the approximate byte size of a base64 data URL.
 * @param {string} dataUrl - The data URL.
 * @returns {number} Size in bytes.
 */
function dataUrlSize(dataUrl) {
    const base64 = (dataUrl || '').split(',')[1] || '';
    return Math.round(base64.length * 3 / 4);
}


/**
 * Sums up the size of all attachments of a task.
 * @param {Array} attachments - Attachment objects with a size property.
 * @returns {number} Total size in bytes.
 */
function totalAttachmentSize(attachments) {
    return (attachments || []).reduce((sum, a) => sum + (a.size || 0), 0);
}


/**
 * Formats a byte count as human readable string (e.g. "245 KB").
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}


/**
 * Converts selected files into compressed attachment objects.
 * Invalid files and files exceeding the per-task limit are skipped with a message.
 * @async
 * @param {FileList|Array<File>} files - Selected files.
 * @param {Array} existing - Attachments already on the task.
 * @returns {Promise<{added: Array, errors: Array<string>}>}
 */
async function filesToAttachments(files, existing) {
    const added = [];
    const errors = [];
    let used = totalAttachmentSize(existing);
    for (const file of Array.from(files)) {
        const error = await validateImageFile(file);
        if (error) { errors.push(error); continue; }
        const base64 = await compressImage(file, ATTACHMENT_MAX_SIZE);
        const size = dataUrlSize(base64);
        if (used + size > TASK_ATTACHMENTS_MAX_BYTES) { errors.push(`${file.name}: task attachment limit (1 MB) reached.`); continue; }
        used += size;
        added.push({ filename: file.name.replace(/\.(png|jpe?g)$/i, '') + '.jpg', base64, size });
    }
    return { added, errors };
}


/**
 * Creates a compressed avatar data URL from an image file.
 * @async
 * @param {File} file - Selected image file.
 * @returns {Promise<string>} Data URL of the avatar.
 * @throws {Error} When the file is invalid.
 */
async function fileToAvatar(file) {
    const error = await validateImageFile(file);
    if (error) throw new Error(error);
    return await compressImage(file, AVATAR_MAX_SIZE, 0.8);
}


/**
 * Returns the HTML for a list of attachment thumbnails.
 * @param {Array} attachments - Attachment objects.
 * @param {string} [removeFn] - Name of a global function called with the index to remove an item.
 * @returns {string} HTML string.
 */
function attachmentThumbsHTML(attachments, removeFn) {
    return (attachments || []).map((a, i) => `
        <div class="attachment-thumb" title="${imgEscape(a.filename)} (${formatBytes(a.size || 0)})">
            <img src="${a.base64}" alt="${imgEscape(a.filename)}" onclick="openImageViewer(this.src)">
            ${removeFn ? `<button type="button" class="attachment-remove" onclick="${removeFn}(${i}); event.stopPropagation();" aria-label="Remove">&times;</button>` : ''}
            <a class="attachment-download" href="${a.base64}" download="${imgEscape(a.filename)}" onclick="event.stopPropagation()" aria-label="Download">&#8681;</a>
        </div>`).join('');
}


/**
 * Opens a fullscreen viewer showing the given image.
 * @param {string} src - Image source (data URL).
 * @returns {void}
 */
function openImageViewer(src) {
    closeImageViewer();
    const viewer = document.createElement('div');
    viewer.id = 'image-viewer';
    viewer.className = 'image-viewer';
    viewer.onclick = closeImageViewer;
    viewer.innerHTML = `<img src="${src}" alt="Attachment"><button type="button" class="image-viewer-close" aria-label="Close">&times;</button>`;
    document.body.appendChild(viewer);
}


/**
 * Removes the fullscreen image viewer if present.
 * @returns {void}
 */
function closeImageViewer() {
    document.getElementById('image-viewer')?.remove();
}


/**
 * Returns the inner HTML for an avatar: the photo if present, otherwise the initials.
 * @param {Object} person - Object with optional photo and initials/avatar fields.
 * @returns {string} HTML string.
 */
function avatarInnerHTML(person) {
    if (person?.photo) return `<img class="avatar-photo" src="${person.photo}" alt="">`;
    return person?.initials || person?.avatar || '?';
}


/**
 * Escapes HTML special characters (standalone so this file works on every page).
 * @param {string} str - Raw string.
 * @returns {string} Escaped string.
 */
function imgEscape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML.replace(/"/g, '&quot;');
}
