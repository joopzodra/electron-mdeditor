"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const mainProcess = __importStar(require("./main"));
const appName = 'Geodan Knutsel MDEditor';
const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'New Window',
                accelerator: 'CommandOrControl+N',
                click() {
                    mainProcess.createWindow();
                }
            },
            {
                label: 'Open File',
                accelerator: 'CommandOrControl+O',
                click(item, focusedWindow) {
                    if (focusedWindow) {
                        return mainProcess.getFileFromUser(focusedWindow);
                    }
                    const newWindow = mainProcess.createWindow();
                    newWindow.on('show', () => {
                        mainProcess.getFileFromUser(newWindow);
                    });
                },
            },
            {
                label: 'Save File',
                accelerator: 'CommandOrControl+S',
                click(item, focusedWindow) {
                    if (!focusedWindow) {
                        return electron_1.dialog.showErrorBox('Cannot Save or Export', 'There is currently no active document to save or export.');
                    }
                    focusedWindow.webContents.send('save-file');
                },
            }
        ],
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Undo',
                accelerator: 'CommandOrControl+Z',
                role: 'undo',
            },
            {
                label: 'Redo',
                accelerator: 'Shift+CommandOrControl+Z',
                role: 'redo',
            },
            { type: 'separator' },
            {
                label: 'Cut',
                accelerator: 'CommandOrControl+X',
                role: 'cut',
            },
            {
                label: 'Copy',
                accelerator: 'CommandOrControl+C',
                role: 'copy',
            },
            {
                label: 'Paste',
                accelerator: 'CommandOrControl+V',
                role: 'paste',
            },
            {
                label: 'Select All',
                accelerator: 'CommandOrControl+A',
                role: 'selectall',
            },
        ],
    },
    {
        label: 'Window',
        submenu: [
            {
                label: 'Minimize',
                accelerator: 'CommandOrControl+M',
                role: 'minimize',
            },
            {
                label: 'Close',
                accelerator: 'CommandOrControl+W',
                role: 'close',
            },
        ],
    },
    {
        label: 'Help',
        role: 'help',
        submenu: [
            {
                label: 'Toggle Developer Tools',
                click(item, focusedWindow) {
                    if (focusedWindow)
                        focusedWindow.webContents.toggleDevTools();
                }
            }
        ],
    }
];
if (process.platform === 'darwin') {
    const name = appName;
    template.unshift({
        label: name,
        submenu: [
            {
                label: `About ${name}`,
                role: 'about',
            },
            { type: 'separator' },
            {
                label: 'Services',
                role: 'services',
                submenu: [],
            },
            { type: 'separator' },
            {
                label: `Hide ${name}`,
                accelerator: 'Command+H',
                role: 'hide',
            },
            {
                label: 'Hide Others',
                accelerator: 'Command+Alt+H',
                role: 'hideothers',
            },
            {
                label: 'Show All',
                role: 'unhide',
            },
            { type: 'separator' },
            {
                label: `Quit ${name}`,
                accelerator: 'Command+Q',
                click() { electron_1.app.quit(); }, // A
            },
        ],
    });
    const windowMenu = template.find((item) => item.label === 'Window');
    windowMenu.role = 'window';
    (windowMenu.submenu).push({ type: 'separator' }, {
        label: 'Bring All to Front',
        role: 'front',
    });
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const appMenu = electron_1.Menu.buildFromTemplate(template);
exports.default = appMenu;
//# sourceMappingURL=app-menu.js.map