'use strict';

const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
const remote = electron.remote

function _save(path){
    var a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', path);
    a.dispatchEvent(new CustomEvent('click'));
}

let width = 0;
let height = 0;

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
            width = ppi === 144 ? img.width / 2 : img.width;
            height = ppi === 144 ? img.height / 2 : img.height;

            window.resizeTo(width, height);
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
        };

        img.src = path;
        ipcRenderer.send(`request-complete:${winId}`, winId);
    });

    ipcRenderer.send(`request-image-path:${winId}`, winId);

    document.getElementById('elem_canvas').addEventListener('dblclick', () => {
        const win = remote.getCurrentWindow();
        const size = win.getSize();
        const coordinate = electron.screen.getCursorScreenPoint();
        win.hide();
        if (size[0] === width && size[1] === height) {
            win.setSize(60, 60);
            win.setPosition(coordinate.x - 30, coordinate.y - 30);
        } else {
            win.setSize(width, height);
            win.setPosition(coordinate.x - Math.floor(width / 2), coordinate.y - Math.floor(height / 2));
        }
        win.show();
    });
};
