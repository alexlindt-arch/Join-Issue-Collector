/**
 * Prepare Emails (runs once for all emails of one poll).
 * Maps every new Gmail message to a plain request object and adds the ids of the two
 * target folders ("erledigt" = done, "zu bearbeiten" = needs manual review).
 * @returns {Array<{json: Object}>} One item per email.
 * @throws {Error} When one of the two Gmail labels does not exist yet.
 */
const DONE_LABEL = 'erledigt';
const REVIEW_LABEL = 'zu bearbeiten';
const MAX_BODY_LENGTH = 6000;

const labels = $('Get Mailbox Labels').all().map(item => item.json);

/**
 * Returns the id of a Gmail label by its name (case-insensitive).
 * @param {string} name - Label name as shown in Gmail.
 * @returns {string|undefined} Label id.
 */
function findLabelId(name) {
    return labels.find(label => String(label.name || '').toLowerCase() === name)?.id;
}

/**
 * Turns HTML mail content into plain text as a fallback when the mail has no text part.
 * @param {string} html - HTML body.
 * @returns {string} Plain text.
 */
function stripHtml(html) {
    return String(html || '')
        .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();
}

const doneLabelId = findLabelId(DONE_LABEL);
const reviewLabelId = findLabelId(REVIEW_LABEL);
if (!doneLabelId || !reviewLabelId) {
    throw new Error(`Create the Gmail labels "${DONE_LABEL}" and "${REVIEW_LABEL}" first.`);
}

const today = $now.setZone('Europe/Berlin').toFormat('yyyy-MM-dd');

return $('Gmail Trigger').all().map(({ json: mail }) => {
    const sender = mail.from?.value?.[0] || {};
    const body = (mail.text || stripHtml(mail.html)).trim().slice(0, MAX_BODY_LENGTH);
    return {
        json: {
            messageId: mail.id,
            senderEmail: String(sender.address || '').toLowerCase(),
            senderName: sender.name || sender.address || 'Stakeholder',
            subject: String(mail.subject || '').trim(),
            body,
            today,
            doneLabelId,
            reviewLabelId
        }
    };
});
