"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFile = exports.openFile = exports.getFileFromUser = exports.createWindow = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const app_menu_1 = __importDefault(require("./app-menu"));
if (require('electron-squirrel-startup')) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return;
}
const windows = new Map();
const openFiles = new Map();
electron_1.app.setPath('documents', 'D:/joopr/Documents');
electron_1.app.on('will-finish-launching', () => {
    electron_1.app.on('open-file', (event, file) => {
        const win = createWindow();
        win.once('ready-to-show', () => {
            openFile(win, file);
        });
    });
});
electron_1.app.whenReady().then(() => {
    electron_1.Menu.setApplicationMenu(app_menu_1.default);
    createWindow();
    electron_1.app.on('activate', (event, hasVisibleWindows) => {
        if (!hasVisibleWindows) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
const createWindow = () => {
    let x, y;
    const currentWindow = electron_1.BrowserWindow.getFocusedWindow();
    if (currentWindow) {
        const [currentWindowX, currentWindowY] = currentWindow.getPosition();
        x = currentWindowX + 20;
        y = currentWindowY + 20;
    }
    let newWindow = new electron_1.BrowserWindow({
        x,
        y,
        show: false,
        width: 1400,
        height: 800,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js')
        }
    });
    // newWindow.webContents.openDevTools();
    newWindow.loadFile(`${__dirname}/index.html`);
    newWindow.once('ready-to-show', () => {
        newWindow.show();
    });
    newWindow.on('close', (event) => {
        if (windows.get(newWindow === null || newWindow === void 0 ? void 0 : newWindow.id).isEdited) {
            event.preventDefault();
            const result = electron_1.dialog.showMessageBoxSync(newWindow, {
                type: 'warning',
                title: 'Quit with Unsaved Changes?',
                message: 'Your changes will be lost if you do not save.',
                buttons: [
                    'Quit Anyway',
                    'Cancel',
                ],
                defaultId: 0,
                cancelId: 1
            });
            if (result === 0) {
                windows.delete(newWindow === null || newWindow === void 0 ? void 0 : newWindow.id);
                newWindow.destroy();
            }
        }
    });
    newWindow.on('closed', () => {
        if (!(newWindow === null || newWindow === void 0 ? void 0 : newWindow.isDestroyed())) {
            windows.delete(newWindow === null || newWindow === void 0 ? void 0 : newWindow.id);
        }
        stopWatchingFile(newWindow);
        newWindow = null;
    });
    windows.set(newWindow.id, { window: newWindow, isEdited: false });
    return newWindow;
};
exports.createWindow = createWindow;
const openFile = (targetWindow, filePath) => {
    electron_1.app.addRecentDocument(filePath);
    targetWindow.setRepresentedFilename(filePath);
    const content = fs_1.default.readFileSync(filePath, 'utf8');
    targetWindow.webContents.send('file-opened', filePath, content);
    startWatchingFile(targetWindow, filePath);
};
exports.openFile = openFile;
const startWatchingFile = (targetWindow, filePath) => {
    stopWatchingFile(targetWindow);
    const watcher = fs_1.default.watch(filePath, (event) => {
        if (event === ('change')) {
            const content = fs_1.default.readFileSync(filePath, 'utf8');
            targetWindow.webContents.send('compare-contents', targetWindow.id, filePath, content);
        }
    });
    openFiles.set(targetWindow, watcher);
};
const stopWatchingFile = (targetWindow) => {
    if (openFiles.has(targetWindow)) {
        openFiles.get(targetWindow).close();
        openFiles.delete(targetWindow);
    }
};
const getFileFromUser = (focussedWindow) => {
    const targetWindow = focussedWindow || electron_1.BrowserWindow.getFocusedWindow();
    if (windows.get(targetWindow === null || targetWindow === void 0 ? void 0 : targetWindow.id).isEdited) {
        const result = electron_1.dialog.showMessageBoxSync(targetWindow, {
            type: 'warning',
            title: 'Overwrite Current Unsaved Changes?',
            message: 'Opening a new file in this window will overwrite your unsaved changes. Open this file anyway?',
            buttons: [
                'Yes',
                'Cancel',
            ],
            defaultId: 0,
            cancelId: 1
        });
        if (result === 1) {
            return;
        }
    }
    const filePaths = electron_1.dialog.showOpenDialogSync(targetWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Markdown Files', extensions: ['md', 'markdown'] },
            { name: 'Text Files', extensions: ['txt'] },
        ]
    });
    if (filePaths) {
        openFile(targetWindow, filePaths[0]);
    }
};
exports.getFileFromUser = getFileFromUser;
const saveFile = (data) => {
    let { filePath } = data;
    const { filters, content } = data;
    const currentWindow = electron_1.BrowserWindow.getFocusedWindow();
    if (filePath) {
        fs_1.default.writeFileSync(filePath, content);
    }
    else {
        filePath = electron_1.dialog.showSaveDialogSync(currentWindow, {
            title: 'Save file',
            defaultPath: electron_1.app.getPath('documents'),
            filters
        });
        if (filePath) {
            fs_1.default.writeFileSync(filePath, content);
            openFile(currentWindow, filePath);
        }
    }
    windows.get(currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.id).isEdited = false;
    currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.webContents.send('is-saved');
};
exports.saveFile = saveFile;
electron_1.ipcMain.on('on-new-file', () => {
    createWindow();
});
electron_1.ipcMain.on('get-file-from-user', () => {
    getFileFromUser();
});
electron_1.ipcMain.on('save-file', (event, data) => {
    saveFile(data);
});
electron_1.ipcMain.on('update-ui', (event, { title, isEdited }) => {
    const currentWindow = electron_1.BrowserWindow.getFocusedWindow();
    currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.setTitle(title);
    windows.set(currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.id, { window: currentWindow, isEdited });
    // macOS only
    currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.setDocumentEdited(isEdited);
});
electron_1.ipcMain.on('have-different-contents', (event, data) => {
    const { windowId, filePath, content } = data;
    const targetWindow = windows.get(windowId).window;
    const result = electron_1.dialog.showMessageBoxSync(targetWindow, {
        type: 'warning',
        title: 'Load changes from disk?',
        message: 'Another application has changed this file. Load changes?',
        buttons: [
            'Yes',
            'Cancel',
        ],
        defaultId: 0,
        cancelId: 1
    });
    if (result === 0) {
        targetWindow.webContents.send('file-changed', filePath, content);
    }
});
//# sourceMappingURL=main.js.map