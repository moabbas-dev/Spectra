import path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { registerAllIpc } from './ipc/index';
import { closeDatabase, getDatabase } from './services/database.service';
import { logger } from './utils/logger.util';

process.env.NODE_ENV ??= app.isPackaged ? 'production' : 'development';

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Spectra',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Docked devtools avoid spurious "Failed to fetch" noise from detached Elements panel.
    win.webContents.openDevTools({ mode: 'bottom' });
  } else {
    const htmlPath = path.join(__dirname, '..', '..', 'dist', 'index.html');
    void win.loadFile(htmlPath);
  }

  return win;
}

app.whenReady().then(() => {
  try {
    const db = getDatabase();
    registerAllIpc(db);
    
    ipcMain.handle('window:open', () => {
      createMainWindow();
      return true;
    });
  } catch (err) {
    logger.error('Failed to initialize database or IPC', err);
    app.quit();
    return;
  }

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase();
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});
