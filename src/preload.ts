import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    // temporary stub for files hierachy - see index.html
});
