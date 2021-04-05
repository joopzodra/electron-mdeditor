"use strict";
const textarea = document.querySelector('#textarea');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveFileButton = document.querySelector('#save-file');
const revertButton = document.querySelector('#revert');
let filePath = null;
let originalContent = '';
let currentContent = '';
const renderMarkdownToHtml = (markdown) => {
    const clean = api.sanitize(markdown);
    htmlView.innerHTML = api.marked(clean);
};
textarea === null || textarea === void 0 ? void 0 : textarea.addEventListener('keyup', (event) => {
    currentContent = api.eolAuto(event.target.value);
    renderMarkdownToHtml(currentContent);
    updateUserInterface(originalContent !== currentContent);
});
openFileButton === null || openFileButton === void 0 ? void 0 : openFileButton.addEventListener('click', () => {
    api.send('get-file-from-user');
});
newFileButton === null || newFileButton === void 0 ? void 0 : newFileButton.addEventListener('click', () => {
    api.send('on-new-file');
});
saveFileButton === null || saveFileButton === void 0 ? void 0 : saveFileButton.addEventListener('click', () => {
    saveFile();
});
revertButton === null || revertButton === void 0 ? void 0 : revertButton.addEventListener('click', () => {
    textarea.value = originalContent;
    renderMarkdownToHtml(originalContent);
    updateUserInterface(false);
});
const saveFile = () => {
    const filters = [
        { name: 'Markdown filePaths', extensions: ['md', 'markdown'] },
        { name: 'All Files', extensions: ['*'] }
    ];
    const data = {
        filePath,
        filters,
        content: textarea.value
    };
    api.send('save-file', data);
};
const renderFile = (pathToFile, content) => {
    filePath = pathToFile;
    originalContent = content;
    textarea.value = content;
    renderMarkdownToHtml(content);
    updateUserInterface(false);
};
const updateUserInterface = (isEdited) => {
    let title = api.appName;
    if (filePath) {
        title = `${api.path.basename(filePath)} - ${title}`;
    }
    if (isEdited) {
        title = `${title} (Edited)`;
    }
    const data = { title, isEdited };
    api.send('update-ui', data);
    saveFileButton.disabled = !isEdited;
    revertButton.disabled = !isEdited;
};
api.receive('file-opened', (pathToFile, content) => {
    renderFile(pathToFile, content);
});
api.receive('file-changed', (filePath, content) => {
    renderFile(filePath, content);
});
api.receive('save-file', () => {
    saveFile();
});
api.receive('compare-contents', (windowId, filePath, content) => {
    const haveDifferentContents = api.eolAuto(content) !== currentContent;
    if (haveDifferentContents) {
        const data = {
            windowId,
            filePath,
            content
        };
        api.send('have-different-contents', data);
    }
});
api.receive('is-saved', () => {
    updateUserInterface(false);
});
//# sourceMappingURL=renderer.js.map