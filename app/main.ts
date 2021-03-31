import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron'
import path from 'path';
import fs from 'fs';
import appMenu from './app-menu';

const windows = new Map();
const openFiles = new Map();

app.setPath('documents', 'D:/joopr/Documents')

app.on('will-finish-launching', () => {
    app.on('open-file', (event, file) => {
        const win = createWindow();
        win.once('ready-to-show', () => {
            openFile(win, file);
        });
    });
});

app.whenReady().then(() => {
    Menu.setApplicationMenu(appMenu);
    createWindow()

    app.on('activate', (event: any, hasVisibleWindows: boolean) => {
        if (!hasVisibleWindows) {
            createWindow()
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

const createWindow = () => {
    let x, y;

    const currentWindow = BrowserWindow.getFocusedWindow();

    if (currentWindow) {
        const [currentWindowX, currentWindowY] = currentWindow.getPosition();
        x = currentWindowX + 20;
        y = currentWindowY + 20;
    }

    let newWindow: BrowserWindow | null = new BrowserWindow({
        x,
        y,
        show: false,
        width: 1400,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    newWindow.webContents.openDevTools();
    newWindow.loadFile(`${__dirname}/index.html`);

    newWindow.once('ready-to-show', () => {
        newWindow!.show();
    });

    newWindow.on('close', (event) => {
        if (windows.get(newWindow?.id).isEdited) {
            event.preventDefault();

            const result = dialog.showMessageBoxSync((newWindow as BrowserWindow), {
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
                windows.delete(newWindow?.id);
                newWindow!.destroy();
            }
        }
    });

    newWindow.on('closed', () => {
        if (!newWindow?.isDestroyed()) {
            windows.delete(newWindow?.id);
        }
        stopWatchingFile((newWindow as BrowserWindow));
        newWindow = null;
    });

    windows.set(newWindow.id, {window: newWindow, isEdited: false});
    return newWindow;
};

const openFile = (targetWindow: BrowserWindow, filePath: string) => {
    app.addRecentDocument(filePath);
    targetWindow.setRepresentedFilename(filePath);

    const content = fs.readFileSync(filePath, 'utf8');
    targetWindow.webContents.send('file-opened', filePath, content);
    startWatchingFile(targetWindow, filePath);
};

const startWatchingFile = (targetWindow: BrowserWindow, filePath: string) => {
    stopWatchingFile(targetWindow);

    const watcher = fs.watch(filePath, (event) => {
        if (event === ('change')) {
            const content = fs.readFileSync(filePath, 'utf8');
            targetWindow.webContents.send('compare-contents', targetWindow.id, filePath, content);
        }
    });

    openFiles.set(targetWindow, watcher);
};

const stopWatchingFile = (targetWindow: BrowserWindow) => {
    if (openFiles.has(targetWindow)) {
        openFiles.get(targetWindow).close();
        openFiles.delete(targetWindow);
    }
};

const getFileFromUser = (focussedWindow?: BrowserWindow) => {
    const targetWindow = focussedWindow || BrowserWindow.getFocusedWindow();

    if (windows.get(targetWindow?.id).isEdited) {
        const result = dialog.showMessageBoxSync((targetWindow as BrowserWindow), {
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

    const filePaths = dialog.showOpenDialogSync((targetWindow as BrowserWindow), {
        properties: ['openFile'],
        filters: [
            {name: 'Markdown Files', extensions: ['md', 'markdown']},
            {name: 'Text Files', extensions: ['txt']},
        ]
    });

    if (filePaths) {
        openFile((targetWindow as BrowserWindow), filePaths[0]);
    }
}

const saveFile = (data: any) => {
    let {filePath} = data;
    const {filters, content} = data;
    const currentWindow = BrowserWindow.getFocusedWindow();
    if (filePath) {
        fs.writeFileSync(filePath, content);
    } else {
        filePath = dialog.showSaveDialogSync((currentWindow as BrowserWindow), {
            title: 'Save file',
            defaultPath: app.getPath('documents'),
            filters
        });

        if (filePath) {
            fs.writeFileSync(filePath, content);
            openFile((currentWindow as BrowserWindow), filePath);
        }
    }
}

ipcMain.on('on-new-file', () => {
    createWindow();
});

ipcMain.on('get-file-from-user', () => {
    getFileFromUser();
});

ipcMain.on('save-file', (event, data) => {
    saveFile(data);
});

ipcMain.on('update-ui', (event, {title, isEdited}) => {
    const currentWindow = BrowserWindow.getFocusedWindow();
    currentWindow?.setTitle(title);
    windows.set(currentWindow?.id, {window: currentWindow, isEdited});
    // macOS only
    currentWindow?.setDocumentEdited(isEdited);
});

ipcMain.on('have-different-contents', (event, data) => {
    const {windowId, filePath, content} = data;
    const targetWindow = windows.get(windowId).window;
    const result = dialog.showMessageBoxSync(targetWindow, {
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

export {
    createWindow,
    getFileFromUser,
    openFile,
    saveFile
}
