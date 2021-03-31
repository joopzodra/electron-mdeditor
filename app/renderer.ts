const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdownButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');
const showFileButton = document.querySelector('#show-file');
const openInDefaultButton = document.querySelector('#open-in-default');

declare const api: any;

let filePath: string | null = null;
let originalContent = '';
let currentContent = '';

const renderMarkdownToHtml = (markdown: string) => {
    const clean = api.sanitize(markdown);
    (htmlView as Element).innerHTML = api.marked(clean);
};

markdownView?.addEventListener('keyup', (event) => {
    currentContent = api.eolAuto((event.target as HTMLTextAreaElement).value);
    renderMarkdownToHtml(currentContent);
    updateUserInterface(originalContent !== currentContent);
});

openFileButton?.addEventListener('click', () => {
    api.send('get-file-from-user');
});

newFileButton?.addEventListener('click', () => {
    api.send('on-new-file');
});

saveHtmlButton?.addEventListener('click', () => {
    const filters = [
        {name: 'HTML Files', extensions: ['html', 'htm']},
        {name: 'All Files', extensions: ['*']}
    ];
    const data = {
        filePath: undefined,
        filters,
        content: htmlView?.innerHTML
    }
    api.send('save-file', data);
});

saveMarkdownButton?.addEventListener('click', () => {
    const filters = [
        {name: 'Markdown filePaths', extensions: ['md', 'markdown']},
        {name: 'All Files', extensions: ['*']}
    ];
    const data = {
        filePath,
        filters,
        content: (markdownView as HTMLTextAreaElement).value
    }
    api.send('save-file', data);
});

revertButton?.addEventListener('click', () => {
    (markdownView as HTMLTextAreaElement).value = originalContent;
    renderMarkdownToHtml(originalContent);
    updateUserInterface(false);
});

api.receive('file-opened', (pathToFile: string, content: string) => {
    renderFile(pathToFile, content);
});

api.receive('file-changed', (filePath: string, content: string) => {
    renderFile(filePath, content);
});

const renderFile = (pathToFile: string, content: string) => {
    filePath = pathToFile;
    originalContent = content;

    (markdownView as HTMLTextAreaElement).value = content;
    renderMarkdownToHtml(content);

    updateUserInterface(false);
};

const updateUserInterface = (isEdited: boolean) => {
    let title = 'Geodan Knutsel TextEditor';
    if (filePath) {
        title = `${api.path.basename(filePath)} - ${title}`;
    }
    if (isEdited) {
        title = `${title} (Edited)`;
    }

    const data = {title, isEdited};
    api.send('update-ui', data);
    (saveMarkdownButton as HTMLButtonElement).disabled = !isEdited;
    (revertButton as HTMLButtonElement).disabled = !isEdited;
};
