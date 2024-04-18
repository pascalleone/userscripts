// ==UserScript==
//
// @name         CC Editor
// @description
// @namespace    https://github.com/pascalleone
// @homepage     https://github.com/pascalleone/userscripts
// @version      0.2.21
// @author       Pascal Leone
//
// @match        https://yagpdb.xyz/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yagpdb.xyz
// @updateURL    https://raw.githubusercontent.com/pascalleone/userscripts/main/cc-editor.user.js
// @downloadURL  https://raw.githubusercontent.com/pascalleone/userscripts/main/cc-editor.user.js
//
// @grant        GM.addStyle
// @grant        window.onurlchange
//
// @run-at       document-start
//
// ==/UserScript==

(async () => {
    'use strict';

    log('starting');

    // add fonts and styles
    await GM.addStyle('@import url("https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400&display=swap");');
    await GM.addStyle('.cc-panel { max-height: unset !important; }');
    await GM.addStyle('.cc-panel *, textarea { font-family: "Fira Code", monospace !important; }');

    // initialize fields on page load and url change
    for (const eventType of ['load', 'urlchange']) {
        window.addEventListener(eventType, () => initialize());
    }

    /**
     * add event listeners to all textareas
     */
    function initialize() {
        const elements = document.querySelectorAll('textarea');

        if (elements.length) {
            for (const el of elements) {
                log('initializing textarea');

                el.addEventListener('input', () => resizeTextarea(el));
                respondToVisibility(el, () => resizeTextarea(el));
            }
        }
    }

    /**
     * resize a textarea to fit all of its contents
     *
     * @param {HTMLTextAreaElement} el
     */
    function resizeTextarea(el) {
        log('resizing textarea');

        el.style.marginBottom = el.clientHeight + 'px';
        el.style.height = '0px';
        el.style.height = el.scrollHeight + 100 + 'px';
        el.style.marginBottom = '0px';
    }

    /**
     * execute a callback once element becomes visible (by scrolling into view, loading a page, etc.)
     *
     * @param {HTMLElement} element
     * @param {function} callback
     */
    function respondToVisibility(element, callback) {
        log('responding to visibility');

        const options = {
            root: document.documentElement
        };

        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                callback(entry.intersectionRatio > 0);
            }
        }, options);

        observer.observe(element);
    }

    /**
     * log a message
     *
     * @param {string} msg
     */
    function log(msg) {
        console.log(`cc-editor.user.js: ${msg.trim()}`);
    }
})();
