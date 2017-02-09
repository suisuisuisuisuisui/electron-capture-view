'use strict';

const fs = require('fs');
const exec = require('child_process').exec;
const EventEmitter = require('events').EventEmitter;
const PNG = require('pngjs2').PNG;

const electron = require('electron');

const ipcMain = electron.ipcMain;
const nativeImage = electron.nativeImage;
const BrowserWindow = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut;
const dialog = electron.dialog;

const cache = require('../cache');

const SAVE_SHORTCUT_KEY = 'Command+S';

/**
 * キャプチャ処理
 */
exports.capture = function() {
    const path = `/tmp/${Date.now()}.png`;
    _capture(path).on('captured', (exists) => {
        if (!exists) {
            return false;
        }

        _openWindow(path);
    }).on('error', (err) => {
        console.error(err);
    });
};

/**
 * アクティブなキャプチャの保存
 * @return {[type]} [description]
 */
exports.save = function() {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) {
        return;
    }

    const path = cache.get(window);
    if (!path) {
        return;
    }

    dialog.showSaveDialog(window, {defaultPath: `~/Desktop/${path.slice(path.lastIndexOf('/') + 1)}`}, (filename) => {
        if (!filename) {
            return;
        }

        const rs = fs.createReadStream(path);
        const ws = fs.createWriteStream(filename);
        rs.pipe(ws);
    });
}

/**
 * Macキャプチャーコマンド(screencapture)の実行
 * @param  {String} path キャプチャ画像のパス
 * @return {String}
 */
function _capture(path) {
    const ev = new EventEmitter;
    const cmd = `screencapture -s -tpng ${path}`;

    exec(cmd, (err) => {
        err && ev.emit('error', err)
    }).on('close', () => {
        fs.exists(path, (exists) => ev.emit('captured', exists))
    });

    return ev;
}

function _registIpc(winId, path, ppi) {
    ipcMain.on(`request-image-path:${winId}`,
        (event) => event.sender.send(`request-image-path-reply:${winId}`, path, ppi));

    ipcMain.on(`request-complete:${winId}`,
        () => ipcMain.removeAllListeners([`request-image-path:${winId}`, `request-complete:${winId}`]));
}

function* _parseChunks(data) {
  var offset = 8; // skip PNG header

  while (offset < data.length) {
    var dataLength  = data.readUInt32BE(offset);
    var chunkLength = dataLength + 12;
    var typeStart   = offset + 4;
    var dataStart   = offset + 8;
    var dataEnd     = offset + 8 + dataLength;
    var crcEnd      = dataEnd + 4;

    yield {
      type : data.toString('ascii', typeStart, dataStart),
      data : data.slice(dataStart, dataEnd),
      crc  : data.slice(dataEnd, crcEnd),
    };

    offset = crcEnd;
  }
}

function _getPpi(path) {
    for (let chunk of _parseChunks(fs.readFileSync(path))) {
        if (chunk.type === 'pHYs') {
            var ppuX = chunk.data.readUInt32BE(0);
            var ppuY = chunk.data.readUInt32BE(4);
            var unit = chunk.data.readUInt8(8); // should always be `1`
            return Math.round(ppuX * 0.0254);
        }
    }
    return 72;
}

function _openWindow(path) {
    const coordinate = electron.screen.getCursorScreenPoint();
    const imageSize = nativeImage.createFromPath(path).getSize();
    const ppi = _getPpi(path);

    let win = new BrowserWindow({
        width: 0,
        height: 0,
        frame: false,
        images: true,
        'always-on-top': true,
        'skip-taskbar': true,
        resizable: false,
        x: coordinate.x - (ppi === 144 ? imageSize.width / 2 : imageSize.width),
        y: coordinate.y - (ppi === 144 ? imageSize.height / 2 : imageSize.height),
    });

    win.on('closed', () => {
        fs.unlink(path);
        win.destroy();
        globalShortcut.unregister(SAVE_SHORTCUT_KEY);
        win = null;
    });

    win.on('blur', () => {
        globalShortcut.unregister(SAVE_SHORTCUT_KEY);
    });

    win.on('focus', () => {
        if (globalShortcut.isRegistered(SAVE_SHORTCUT_KEY)) {
            return;
        }

        globalShortcut.register(SAVE_SHORTCUT_KEY, exports.save);
    });

    win.loadURL(`file://${__dirname}/../image.html`);
    win.setAlwaysOnTop(true);
    win.show();

    cache.set(win, path);

    _registIpc(win.id, path, ppi);
}
