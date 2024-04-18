// ==UserScript==
//
// @name         GoPro Timestamp Fixer
// @description  Please fix your firmware, GoPro
// @namespace    https://github.com/pascalleone
// @homepage     https://github.com/pascalleone/userscripts
// @version      0.1.4
// @author       Pascal Leone
//
// @match        https://plus.gopro.com/media-library
// @match        https://plus.gopro.com/media-library/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=plus.gopro.com
// @updateURL    https://raw.githubusercontent.com/pascalleone/userscripts/main/gopro-timestamp-fixer.js
// @downloadURL  https://raw.githubusercontent.com/pascalleone/userscripts/main/gopro-timestamp-fixer.js
//
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/plugin/utc.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/plugin/timezone.js
//
// @grant        GM.notification
//
// @run-at       context-menu
//
// ==/UserScript==

(async () => {
    'use strict';

    let accessToken;

    const scripts = document.querySelectorAll('script');

    // find token
    for (const script of scripts) {
        if (!script.textContent) continue;

        const match = script.textContent.match(/"gpAccessToken":"(.*?)"/);

        if (!match) continue;

        accessToken = match[1];
    }

    if (!accessToken) {
        return GM.notification({
            title: 'Error',
            text: `Could not find access token`,
            silent: true
        });
    }

    // load dayjs
    const dayjs = window.dayjs || null;

    if (!dayjs) {
        return GM.notification({
            title: 'Error',
            text: 'Could not load dayJS',
            silent: true
        });
    }

    dayjs.extend(window.dayjs_plugin_utc);
    dayjs.extend(window.dayjs_plugin_timezone);

    dayjs.tz.setDefault('Europe/Zurich');

    // get all selected medias
    const selectedMediaEls = document.querySelectorAll('.show-overlay.selected');

    if (!selectedMediaEls.length) {
        return GM.notification({
            title: 'Error',
            text: `No medias were selected`,
            silent: true
        });
    }

    // open date edit modal
    document.querySelector('.btn.selection-edit-date-button').click();

    // get start date in UTC
    let date = dayjs(document.querySelector('.edit-date-modal .rdt .form-control').value).utc();

    // close date edit modal
    document.querySelector('.edit-date-modal .modal-close-btn').click();

    // next we parse our selected medias and grab all the values we need
    const medias = [];
    let prevRecording = null;

    for (const selectedEl of selectedMediaEls) {
        const gridItemEl = selectedEl.closest('.grid-item');
        const id = gridItemEl.querySelector('.grid-item-wrapper').id;
        const filename = gridItemEl.querySelector('.filename-overlay').innerText;
        const duration = gridItemEl.querySelector('.media-details .duration').innerText;

        // filename example: GX020005.MP4
        let [, chunk, recording] = filename.match(/GX(\d{2})(\d+)\.MP4/);

        chunk = parseInt(chunk);
        recording = parseInt(recording);

        // multiple recordings are not yet supported
        if (prevRecording && prevRecording !== recording) {
            return GM.notification({
                title: 'Error',
                text: `Multiple recordings were selected`,
                silent: true
            });
        }

        prevRecording = recording;

        medias.push({
            id: id,
            filename: filename,
            duration: duration,
            chunk: chunk,
            gridItem: gridItemEl
        });
    }

    // sort the medias by chunk, so they're in chronological order
    medias.sort((a, b) => a.chunk - b.chunk);

    // finally, go through all medias, calculate the correct date and update it via the gopro api
    let prevMedia;

    for (let media of medias) {
        // ignore the first chunk, since it already has the correct date
        if (prevMedia) {
            // add the duration from the previous chunk to get the correct start date for the current chunk
            let [minutes, seconds] = prevMedia.duration.split(':');

            minutes = parseInt(minutes);
            seconds = parseInt(seconds);

            if (minutes) date = date.add(minutes, 'minute');
            if (seconds) date = date.add(seconds, 'second');
        }

        updateMedia(media.id, date.format('YYYY-MM-DDTHH:mm:ss[Z]'))
            .then(() => log(`successfully updated media ${media.id}`));

        // wait a little bit before the next request
        const timeout = random(2500, 5000);

        log(`waiting ${timeout}ms`);
        await sleep(timeout);

        prevMedia = media;
    }

    /**
     * updates a medias "captured_at" value by making a request to the gopro api
     *
     * @param {string} id
     * @param {string} capturedAt
     */
    async function updateMedia(id, capturedAt) {
        const response = await fetch(`https://api.gopro.com/media/${id}`, {
            method: 'PUT',
            mode: 'cors',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/vnd.gopro.jk.media+json; version=2.0.0',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.5',
                'Authorization': `Bearer ${accessToken}`,
                'Connection': 'keep-alive',
                'Content-Length': '38',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                captured_at: capturedAt
            })
        });

        return response.json();
    }

    /**
     * @param {number} ms
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    function random(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * @param {string} msg
     */
    function log(msg) {
        console.log(`gopro-timestamp-fixer.js: ${msg.trim()}`);
    }
})();
