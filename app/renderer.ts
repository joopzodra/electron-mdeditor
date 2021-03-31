const textarea = document.querySelector('#textarea');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveFileButton = document.querySelector('#save-file');
const revertButton = document.querySelector('#revert');
const showFileButton = document.querySelector('#show-file');

declare const api: any;

let filePath: string | null = null;
let originalContent = '';
let currentContent = '';

const renderMarkdownToHtml = (markdown: string) => {
    const clean = api.sanitize(markdown);
    (htmlView as Element).innerHTML = api.marked(clean);
};

textarea?.addEventListener('keyup', (event) => {
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

saveFileButton?.addEventListener('click', () => {
    saveFile();
});

revertButton?.addEventListener('click', () => {
    (textarea as HTMLTextAreaElement).value = originalContent;
    renderMarkdownToHtml(originalContent);
    updateUserInterface(false);
});

const saveFile = () => {
    const filters = [
        {name: 'Markdown filePaths', extensions: ['md', 'markdown']},
        {name: 'All Files', extensions: ['*']}
    ];
    const data = {
        filePath,
        filters,
        content: (textarea as HTMLTextAreaElement).value
    }
    api.send('save-file', data);
};

const renderFile = (pathToFile: string, content: string) => {
    filePath = pathToFile;
    originalContent = content;

    (textarea as HTMLTextAreaElement).value = content;
    renderMarkdownToHtml(content);

    updateUserInterface(false);
};

const updateUserInterface = (isEdited: boolean) => {
    let title = api.appName;
    if (filePath) {
        title = `${api.path.basename(filePath)} - ${title}`;
    }
    if (isEdited) {
        title = `${title} (Edited)`;
    }

    const data = {title, isEdited};
    api.send('update-ui', data);
    (saveFileButton as HTMLButtonElement).disabled = !isEdited;
    (revertButton as HTMLButtonElement).disabled = !isEdited;
};

api.receive('file-opened', (pathToFile: string, content: string) => {
    renderFile(pathToFile, content);
});

api.receive('file-changed', (filePath: string, content: string) => {
    renderFile(filePath, content);
});

api.receive('save-file', () => {
    saveFile();
});
