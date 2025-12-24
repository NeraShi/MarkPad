declare const marked: any;
declare const renderMathInElement: any;

const toggleBtn = document.getElementById('toggleMode') as HTMLButtonElement;
const editor = document.getElementById('editor') as HTMLTextAreaElement;
const preview = document.getElementById('preview') as HTMLDivElement;

const lineNumbers = document.getElementById('line-numbers') as HTMLDivElement;
const editorWrapper = document.getElementById('editor-wrapper') as HTMLDivElement;

// RENAME DIALOG
const renameModal = document.getElementById('rename-modal') as HTMLDivElement;
const renameInput = document.getElementById('rename-input') as HTMLInputElement;
const confirmBtn = document.getElementById('rename-confirm') as HTMLButtonElement;
const cancelBtn = document.getElementById('rename-cancel') as HTMLButtonElement;


// ================= PREVIEW / EDITOR TOGGLE =================

toggleBtn?.addEventListener('click', () => {
    const isPreviewMode = editorWrapper.classList.toggle('hidden');
    preview.classList.toggle('hidden');

    if (isPreviewMode) {
        const markdownText = editor.value;
        preview.innerHTML = marked.parse(markdownText);
        
        renderMathInElement(preview, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ],
            throwOnError: false
        });

        editorWrapper.classList.add('hidden');
        preview.classList.remove('hidden');
        toggleBtn.textContent = 'Mode: Preview';
    } else {
        editorWrapper.classList.remove('hidden');
        preview.classList.add('hidden');
        toggleBtn.textContent = 'Mode: Editing';
        updateLineNumbers();
    }
});


// ================= EDITOR NUMBER LINE =================

const updateLineNumbers = () => {
    const lines = editor.value.split('\n');
    const linesCount = lines.length;
    let numberHtml = '';
    for (let i = 1; i <= linesCount; i++) {
        numberHtml += `<div class="line-num">${i}</div>`;
    }
    lineNumbers.innerHTML = numberHtml;
};

editor.addEventListener('input', updateLineNumbers);
editor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = editor.scrollTop;
});

updateLineNumbers();


// ===============================================
// ================= FILE SYSTEM =================
// ===============================================

interface FileData { name: string, path: string; }
declare const electronAPI: {
    selectFolder: () => Promise<{ folderPath: string, files: FileData[] } | null>;
    readFile: (path: string) => Promise<string>;

    saveFile: (path: string, content: string) => Promise<{ success: boolean, error?: string }>;
    saveAs: (content: string) => Promise<string | null>;

    renameFile: (oldPath: string, newName: string) => Promise<{ success: boolean, newPath?: string, error?: string }>;
};

const fileListContainer = document.querySelector('.file-list') as HTMLDivElement;
const explorerTitle = document.querySelector('.sidebar-title') as HTMLDivElement;

let currentPath: string | null = null;
let lastSavedContent: string = '';
let activeFileElement: HTMLElement | null = null;


// ================= KEEP TRACK OF FILE CHANGES =================

const checkChanges = () => {
    if (!activeFileElement) return;

    if (editor.value !== lastSavedContent) {
        activeFileElement.classList.add('modified');
    } else {
        activeFileElement.classList.remove('modified');
    }
}

editor.addEventListener('input', () => {
    updateLineNumbers();
    checkChanges();
});


// ================= FILE SYSTEM ACESS =================

explorerTitle.style.cursor = 'pointer';

explorerTitle.addEventListener('click', async () => {
    const result = await electronAPI.selectFolder();

    if (result) {
        fileListContainer.innerHTML = '';

        result.files.forEach(file => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.textContent = file.name;

            item.addEventListener('contextmenu', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                renameModal.classList.remove('hidden');
                renameInput.value = file.name.replace('.md', '');
                renameInput.focus();

                const onConfirm = async () => {
                    const newName = renameInput.value.trim();
                    if (newName && newName !== file.name.replace('.md', '')) {
                        const response = await electronAPI.renameFile(file.path, newName);
                        if (response.success) {
                            file.name = newName.endsWith('.md') ? newName : `${newName}.md`;
                            file.path = response.newPath!;
                            item.textContent = file.name;
                            if (activeFileElement === item) currentPath = file.path;
                        } else {
                            alert(response.error);
                        }
                    }
                    closeModal();
                };

                const closeModal = () => {
                    renameModal.classList.add('hidden');
                    confirmBtn.removeEventListener('click', onConfirm);
                    cancelBtn.removeEventListener('click', closeModal);
                };

                renameInput.onkeydown = (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        onConfirm();
                    } else if (event.key === 'Escape') {
                        event.preventDefault();
                        closeModal();
                    }
                };

                confirmBtn.addEventListener('click', onConfirm);
                cancelBtn.addEventListener('click', closeModal);
            });

            item.addEventListener('click', async () => {
                if (activeFileElement) activeFileElement.classList.remove('active')

                currentPath = String(file.path);
                activeFileElement = item;
                activeFileElement.classList.add('active');

                if (!currentPath) {
                    console.error("The file's path is undefined!");
                    return;
                }
                
                try {
                    const content = await electronAPI.readFile(currentPath);
                    editor.value = content;
                    lastSavedContent = content;
                    updateLineNumbers();
                    activeFileElement.classList.remove('modified');
    
                    if (editorWrapper.classList.contains('hidden')) {
                        toggleBtn.click();
                    }
                } catch (err) {
                    console.log("Clicked on file with path: ", currentPath);
                    console.error("Error on file read: ", err);
                }
            });

            fileListContainer.appendChild(item);
        });
    }
});


// ================= SAVE FILES =================

async function handleSave() {
    const content = editor.value;

    if (currentPath) {
        const result = await electronAPI.saveFile(currentPath, content);
        if (result.success) { 
            lastSavedContent = content;
            if (activeFileElement) activeFileElement.classList.remove('modified');

            console.log("The file with path ", currentPath, " was saved successfully."); 
        }
        else { console.error("Save failed: ", result.error); }
    } else {
        const newPath = await String(electronAPI.saveAs(content));
        if (newPath) {
            currentPath = newPath;
            lastSavedContent = content;
            console.log("Created new file at: ", currentPath);
        }
    }
}

window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
    }
});
