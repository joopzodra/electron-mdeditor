import { app, dialog, Menu, shell, BrowserWindow } from 'electron';
import * as mainProcess from './main';

const appName = 'Geodan Knutsel TextEditor';

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New File',
        accelerator: 'CommandOrControl+N',
        click() {
          mainProcess.createWindow();
        }
      },
      {
        label: 'Open File',
        accelerator: 'CommandOrControl+O',
        click(item: any, focusedWindow: BrowserWindow) {
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
        click(item: any, focusedWindow: BrowserWindow) {
          if (!focusedWindow) {
            return dialog.showErrorBox(
              'Cannot Save or Export',
              'There is currently no active document to save or export.'
            );
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
        label: 'Visit Website',
        click() { /* To be implemented */ }
      },
      {
        label: 'Toggle Developer Tools',
        click(item: any, focusedWindow: BrowserWindow) {
          if (focusedWindow) focusedWindow.webContents.toggleDevTools();
        }
      }
    ],
  }
];

if (process.platform === 'darwin') {
  const name = appName;
  (template as any).unshift({
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
        click() { app.quit(); }, // A
      },
    ],
  });

  const windowMenu = (template as any).find((item: any) => item.label === 'Window');
  windowMenu!.role = 'window';
  (windowMenu!.submenu).push(
    { type: 'separator' },
    {
      label: 'Bring All to Front',
      role: 'front',
    }
  );
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const appMenu = Menu.buildFromTemplate(template);
export default appMenu;

