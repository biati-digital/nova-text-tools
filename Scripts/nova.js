/**
 * Log
 * print log in debug pane
 *
 * @param {mixed} message
 */
export function log(message) {
    const showLog = nova.workspace.config.get(nova.extension.identifier + '.log');
    if (nova.inDevMode() || showLog) {
        if (typeof message == 'object') {
            message = JSON.stringify(message, null, 2);
        }
        console.log(message);
    }
}

/**
 * Performance starts
 *
 * @param {string} id
 */
export function logPerformanceStart(id = '') {
    const showLog = nova.workspace.config.get(nova.extension.identifier + '.log');
    if (nova.inDevMode() || showLog) {
        console.time(id);
    }
}

/**
 * Performance end
 *
 * @param {string} id
 */
export function logPerformanceEnd(id = '') {
    const showLog = nova.workspace.config.get(nova.extension.identifier + '.log');
    if (nova.inDevMode() || showLog) {
        if (typeof message == 'object') {
            message = JSON.stringify(message, null, ' ');
        }
        console.timeEnd(id);
    }
}

/**
 * Show notifications
 *
 * @param {Object}
 */
export function showNotification({ id = '', title, body, actions = false, type = '', cancellAll = true }) {
    if (!id) {
        id = nova.extension.identifier;
    }
    if (cancellAll) {
        nova.notifications.cancel(id);
    }

    let request = new NotificationRequest(id);
    request.title = nova.localize(title);
    request.body = nova.localize(body);

    if (actions) {
        if (typeof actions === 'boolean') {
            request.actions = [nova.localize('OK')];
        } else {
            request.actions = actions.map((action) => nova.localize(action));
        }
    }

    nova.notifications.add(request).catch((err) => console.error(err, err.stack));
}
