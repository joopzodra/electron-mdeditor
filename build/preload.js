"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const marked_1 = __importDefault(require("marked"));
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const path_1 = __importDefault(require("path"));
const electron_2 = require("electron");
const eol_1 = __importDefault(require("eol"));
const windowEmulator = new jsdom_1.JSDOM('').window;
const DOMPurify = dompurify_1.default(windowEmulator);
const appName = 'Geodan Knutsel MDEditor';
electron_1.contextBridge.exposeInMainWorld('api', {
    sanitize: DOMPurify.sanitize,
    eolAuto: eol_1.default.auto,
    marked: marked_1.default,
    send: (channel, data) => {
        const validChannels = [
            'get-file-from-user',
            'on-new-file',
            'save-file',
            'update-ui',
            'have-different-contents'
        ];
        if (validChannels.includes(channel)) {
            electron_2.ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        const validChannels = [
            'file-opened',
            'file-changed',
            'save-file',
            'compare-contents',
            'is-saved'
        ];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender`
            electron_2.ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    path: {
        basename: path_1.default.basename
    },
    appName
});
//# sourceMappingURL=preload.js.map