'use strict';

const fs = require('fs');
const path = require('path');

const electron = require('electron');
const app = electron.app;
const Tray = electron.Tray;
const Menu = electron.Menu;
const BrowserWindow = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut;

const cache = require('./cache');
const image = require('./browser/image');

const iconPath = path.join(__dirname, '/icon.png');

let appIcon = null;
// test
app.on('ready', () => {
    let win = new BrowserWindow({
        show: false,
        'skip-taskbar': true,
    });

    appIcon = new Tray(iconPath);

    globalShortcut.register('Command+Shift+X', image.capture);

    var contextMenu = Menu.buildFromTemplate([
        {
            label: 'capture',
            accelerator: 'Command+Shift+X',
            click: image.capture,
        },
        {
            label: 'save',
            accelerator: 'Command+S',
            click: image.save,
        },
        {
            label: 'Quit',
            click: app.quit
        }
    ]);

    appIcon.setToolTip('ScreenCapture Viewer.');
    appIcon.setContextMenu(contextMenu);
    app.dock.hide();
});
