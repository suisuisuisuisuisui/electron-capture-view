'use strict';

const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
const remote = electron.remote;

exports.setUp = function() {
    const winId = remote.getCurrentWindow().id;

    ipcRenderer.on(`request-image-path-reply:${winId}`, (event, path, ppi) => {
        const canvas = document.getElementById('elem_canvas');
        if (!canvas || !canvas.getContext) {
           return false;
        }

        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function() {
            // mac retinaでキャプチャした画像のサイズが２倍になってる(＞x＜)
            const width = ppi === 144 ? img.width / 2 : img.width;
            const height = ppi === 144 ? img.height / 2 : img.height;

            window.resizeTo(width, height);
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
        };

        img.src = path;
        ipcRenderer.send(`request-complete:${winId}`, winId);
    });

    ipcRenderer.send(`request-image-path:${winId}`, winId);
};
