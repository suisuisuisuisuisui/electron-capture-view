'use strict';

const path = require('path');

const electron = require('electron');
const app = electron.app;
const Tray = electron.Tray;
const Menu = electron.Menu;
const BrowserWindow = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut;

const image = require('./browser/image');

const iconPath = path.join(__dirname, '/icon.png');

app.on('ready', () => {
    let win = new BrowserWindow({
        show: false,
        'skip-taskbar': true,
    });

    let appIcon = new Tray(iconPath);

    globalShortcut.register('Command+Shift+X', image.capture);

    var contextMenu = Menu.buildFromTemplate([
        {
            label: 'capture    ⌘⇧X',
            click: image.capture,
        },
        {
            label: 'exit',
            click: function() {
                app.quit();
            }
        }
    ]);

    appIcon.setToolTip('ScreenCapture Viewer.');
    appIcon.setContextMenu(contextMenu);
    app.dock.hide();
});
