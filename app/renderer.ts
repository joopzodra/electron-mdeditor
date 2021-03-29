import marked from 'marked';
import createDOMPurify  from 'dompurify';
import { JSDOM } from 'jsdom';

import { ipcRenderer } from 'electron';

const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdownButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');
const showFileButton = document.querySelector('#show-file');
const openInDefaultButton = document.querySelector('#open-in-default');

const windowEmulator = new JSDOM('').window;
const DOMPurify = createDOMPurify((windowEmulator as unknown as Window ));

const renderMarkdownToHtml = (markdown: string) => {
  const clean = DOMPurify.sanitize(markdown);
  htmlView!.innerHTML = marked(clean);
};

markdownView!.addEventListener('keyup', (event) => {
  const currentContent = (event.target as HTMLTextAreaElement).value;
  renderMarkdownToHtml(currentContent);
});

openFileButton!.addEventListener('click', () => {
  ipcRenderer.invoke('get-file-from-user');
});

newFileButton!.addEventListener('click', () => {
  ipcRenderer.invoke('on-new-file');
});

ipcRenderer.on('file-opened', (event: any, filePath: string, content: string) => {
    (markdownView as HTMLTextAreaElement).value = content;
  renderMarkdownToHtml(content);
});

// ipcRenderer.on('on-window-focus', (event, windowId) => {
//   console.log('in renderer onWindowFocus', windowId)
//   focussedWindowId = windowId;
// });

// ipcRenderer.on('on-window-blur', () => {
//   console.log('in renderer onWindowBlur')
//   focussedWindow = null;
// });
