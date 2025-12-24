import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    readFile: (path: string) => ipcRenderer.invoke('read-file', path),

    saveFile: (path: string, content: string) => ipcRenderer.invoke('save-file', path, content),
    saveAs: (content: string) => ipcRenderer.invoke('save-as-dialog', content),
});
