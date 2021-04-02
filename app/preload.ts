import { contextBridge } from 'electron';
import marked from 'marked';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import path from 'path';
import { ipcRenderer } from 'electron';
import eol from 'eol';

const windowEmulator = new JSDOM('').window;
const DOMPurify = createDOMPurify((windowEmulator as unknown as Window));
const appName = 'Geodan Knutsel MDEditor';

contextBridge.exposeInMainWorld(
    'api',
    {
        sanitize: DOMPurify.sanitize,
        eolAuto: eol.auto,
        marked,
        send: (channel: string, data: any) => {
            const validChannels = [
                'get-file-from-user',
                'on-new-file',
                'save-file',
                'update-ui',
                'have-different-contents'
            ];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        receive: (channel: string, func: any) => {
            const validChannels = [
                'file-opened',
                'file-changed',
                'save-file',
                'compare-contents'
            ];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender`
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        path: {
            basename: path.basename
        },
        appName
    }
)
