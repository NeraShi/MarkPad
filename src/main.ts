import { app, BrowserWindow } from 'electron'
import * as path from 'path'

function createWindow() {
    const win = new BrowserWindow({
        width: 1100,
        height: 700,
        frame: false,
        backgroundColor: '#131313',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: false,
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.webContents.on('context-menu', (e) => {
    e.preventDefault();
    });
    
    win.loadFile(path.join(__dirname, '../index.html'));
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform != 'darwin') app.quit();
});
