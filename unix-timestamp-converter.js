// ==UserScript==
//
// @name         UNIX Timestamp Converter
// @description
// @namespace    https://github.com/pascalleone
// @homepage     https://github.com/pascalleone/userscripts
// @version      0.1.18
// @author       Pascal Leone
//
// @match        *://*/*
// @icon
// @updateURL    https://github.com/pascalleone/userscripts/src/unix-timestamp-converter.js
// @downloadURL  https://github.com/pascalleone/userscripts/src/unix-timestamp-converter.js
//
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/plugin/relativeTime.js
//
// @grant        GM.notification
// @grant        GM.setClipboard
//
// @run-at       context-menu
//
// ==/UserScript==

(async () => {
    'use strict';
    const dayjs = window.dayjs || null;

    if (!dayjs) {
        return GM.notification({
            title: 'Error',
            text: 'Could not load dayJS',
            silent: true
        });
    }

    dayjs.extend(window.dayjs_plugin_relativeTime);

    let selection = getSelectionText();
    selection = selection.replace(/\D+/g, '');

    if (!selection) {
        return GM.notification({
            title: 'Error',
            text: 'No UNIX timestamp found in selection',
            silent: true
        });
    } else {
        let timestamp = parseInt(selection);
        let date = dayjs(timestamp * 1000);

        if (!date) {
            return GM.notification({
                title: 'Error',
                text: `Something went wrong, could not convert ${timestamp} to a date`,
                silent: true
            });
        }

        const notificationContent =
            `${date.format('YYYY-MM-DD HH:mm:ss Z')}\n`
            + `${date.fromNow()}\n\n`
            + `Click to copy to clipboard`;

        return GM.notification({
            title: `UNIX Timestamp Converter - ${timestamp}`,
            text: notificationContent,
            silent: true,
            onclick: async () => {
                const formattedDate = date.format('YYYY-MM-DD HH:mm');

                await GM.setClipboard(formattedDate, 'text');

                await GM.notification({
                    title: 'UNIX Timestamp Converter',
                    text: `Copied '${formattedDate}' to clipboard!`,
                    silent: true,
                    timeout: 2
                });
            }
        });
    }
})();

function getSelectionText() {
    let text = '';
    let activeEl = document.activeElement;
    let activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;

    if (
        activeElTagName === 'textarea'
        || (activeElTagName === 'input' && /^(?:text|search|password|tel|url)$/i.test(activeEl.type))
        && typeof activeEl.selectionStart == 'number'
    ) {
        text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
    } else if (window.getSelection) {
        text = window.getSelection().toString();
    }

    return text;
}
