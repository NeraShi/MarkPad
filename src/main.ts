import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'


// ================= APPLICATION INIT =================

function createWindow() {
    const win = new BrowserWindow({
        width: 1100,
        height: 700,
        frame: false,
        backgroundColor: '#131313',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: true,
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


// ================= FILE SYSTEM ACCESS =================

ipcMain.handle('select-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (canceled) return null;

    const folderPath = filePaths[0];
    const files = fs.readdirSync(folderPath)
        .filter(file => file.endsWith('.md'))
        .map(file => ({
            name: file,
            path: path.join(folderPath, file)
        }));

    return { folderPath, files };
});

ipcMain.handle('read-file', async (event, filePath: string) => {
    return fs.readFileSync(filePath, 'utf-8');
});
