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


// ================= SAVE FILES =================

// save changes in an existing files
ipcMain.handle('save-file', async (event, filePath: string, content: string) => {
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true };
    } catch (error: any) {
        console.log("Ошибка сохранения: ", error)
        return { success: false, error: error };
    }
}); 

// save as a new file
ipcMain.handle('save-as-dialog', async (event, content: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Save new file',
        defaultPath: 'untitled-1.md',
        filters: [{ name: 'Markdown', extensions: ['md'] }]
    });

    if (canceled || !filePath) return null;

    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
});


// ================= SAVE FILES =================

ipcMain.handle('rename-file', async (event, oldPath: string, newName: string) => {
    try {
        const directory = path.dirname(oldPath);
        const newPath = path.join(directory, newName.endsWith('.md') ? newName : `${newName}.md`);
        
        if (fs.existsSync(newPath)) {
            return { success: false, error: 'A file with this name already exists!' };
        }

        fs.renameSync(oldPath, newPath);
        return { success: true, newPath };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
