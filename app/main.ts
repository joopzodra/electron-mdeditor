import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'path';
import fs from 'fs';

app.whenReady().then(() => {
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

const windows = new Set();

const createWindow = () => {
  let x, y;

  const currentWindow = BrowserWindow.getFocusedWindow();

  if (currentWindow) {
    const [ currentWindowX, currentWindowY ] = currentWindow.getPosition();
    x = currentWindowX + 20;
    y = currentWindowY + 20;
  }

  let newWindow: BrowserWindow | null = new BrowserWindow({
    x,
    y,
    show: false,
    width: 1400,
    height: 800,
    // These webpreferences are needed if you want to use node commands in a <script> in html, i.e. in the browser context
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // preload: path.join(__dirname, 'renderer.js')
    }
  });

  newWindow.webContents.openDevTools();
  newWindow.loadFile(`${__dirname}/index.html`);

  newWindow.once('ready-to-show', () => {
    newWindow!.show();
  });

  newWindow.on('closed', () => {
    windows.delete(newWindow);
    newWindow = null;
  });

  windows.add(newWindow);
  return newWindow;
};

const openFile = (targetWindow: any, result: any) => {
  if (result.canceled) {
    return;
  } else {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath).toString();
    targetWindow.webContents.send('file-opened', filePath, content);
  }
};

ipcMain.handle('get-file-from-user',() => {
  const targetWindow = BrowserWindow.getFocusedWindow();
  dialog.showOpenDialog((targetWindow as BrowserWindow), {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'Markdown Files', extensions: ['md', 'markdown'] }
    ]
  })
    .then((result: any) => openFile(targetWindow, result))
    .catch((err: any) => console.log('Error on getting file path', err));
});

ipcMain.handle('on-new-file', () => {
  createWindow();
});
