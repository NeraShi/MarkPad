declare const marked: any;
declare const renderMathInElement: any;

const toggleBtn = document.getElementById('toggleMode') as HTMLButtonElement;
const editor = document.getElementById('editor') as HTMLTextAreaElement;
const preview = document.getElementById('preview') as HTMLDivElement;

const lineNumbers = document.getElementById('line-numbers') as HTMLDivElement;
const editorWrapper = document.getElementById('editor-wrapper') as HTMLDivElement;


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