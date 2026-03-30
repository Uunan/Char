const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const mammoth = require('mammoth');

let mainWindow = null;
let authWindow = null;
let currentUser = null;
let isReadOnly = true;
let currentFilePath = null;
let capturedEmail = null;

// Autosave draft path — AppData/Temp altında sabit bir taslak dosyası
const DRAFT_PATH = path.join(os.tmpdir(), 'char_autosave_draft.html');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#11111b',
    show: false,
    title: 'Char',
  });
  mainWindow.setMenuBarVisibility(true);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
    mainWindow.webContents.openDevTools();
    mainWindow.webContents.send('init-data', {
      user: currentUser,
      isReadOnly: isReadOnly,
      hasDraft: fs.existsSync(DRAFT_PATH),
    });
  });
}

function openAuthWindow() {
  const redirectUrl = 'https://char.deede.tr/auth-callback';
  capturedEmail = null;

  authWindow = new BrowserWindow({
    width: 480,
    height: 650,
    resizable: false,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0f0f0f',
    title: 'Giriş Yap - DeeDe Hesabı',
  });
  authWindow.setMenuBarVisibility(false);

  authWindow.webContents.session.webRequest.onBeforeRequest(
    { urls: ['*://*.deede.tr/*', '*://*.deede.info/*'] },
    (details, callback) => {
      if (details.method === 'POST' && details.uploadData && details.uploadData.length > 0) {
        try {
          const buf = details.uploadData[0].bytes;
          if (buf) {
            const body = buf.toString('utf-8');
            const params = new URLSearchParams(body);
            if (params.get('email')) capturedEmail = params.get('email');
          }
        } catch (e) { /* ignore */ }
      }

      if (details.url.includes('char.deede.tr') && details.url.includes('sso_token=')) {
        callback({ cancel: true });
        handleAuthSuccess(details.url);
        return;
      }
      callback({});
    }
  );

  authWindow.loadURL(`https://auth.deede.tr/login.php?redirect=${encodeURIComponent(redirectUrl)}`);
  authWindow.on('closed', () => { authWindow = null; });
}

function handleAuthSuccess(url) {
  try {
    const urlObj = new URL(url);
    const ssoToken = urlObj.searchParams.get('sso_token');
    const decoded = JSON.parse(Buffer.from(ssoToken, 'base64').toString('utf-8'));

    let displayName = 'Kullanıcı';
    let email = capturedEmail || '';
    if (email) {
      const local = email.split('@')[0];
      displayName = local.replace(/[._-]/g, ' ').split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    currentUser = {
      uid: decoded.uid,
      email: email,
      displayName: displayName,
      initial: displayName.charAt(0).toUpperCase(),
      ssoToken: ssoToken
    };
    isReadOnly = false;

    if (authWindow) { authWindow.close(); authWindow = null; }
    if (mainWindow) {
      mainWindow.webContents.send('user-logged-in', {
        user: currentUser,
        isReadOnly: false
      });
    }
  } catch (e) {
    console.error('SSO token decode failed:', e);
  }
}

// ── IPC Handlers ──
ipcMain.handle('open-auth', () => openAuthWindow());

ipcMain.handle('read-only-mode', () => {
  isReadOnly = true;
  currentUser = null;
  if (mainWindow) {
    mainWindow.webContents.send('init-data', {
      user: currentUser,
      isReadOnly: isReadOnly,
      hasDraft: fs.existsSync(DRAFT_PATH),
    });
  }
});

ipcMain.handle('new-file', () => { currentFilePath = null; return true; });

ipcMain.handle('save-file', async (_e, content) => {
  if (currentFilePath) {
    fs.writeFileSync(currentFilePath, content, 'utf-8');
    // Başarılı kayıt → draft'ı temizle
    if (fs.existsSync(DRAFT_PATH)) fs.unlinkSync(DRAFT_PATH);
    return { success: true, filePath: currentFilePath };
  }
  return await saveFileAs(content);
});

ipcMain.handle('save-file-as', async (_e, content) => saveFileAs(content));

async function saveFileAs(content) {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'HTML Belgesi', extensions: ['html'] },
      { name: 'Metin Dosyası', extensions: ['txt'] },
    ],
    defaultPath: 'Adsız.html'
  });
  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf-8');
    currentFilePath = filePath;
    // Başarılı kayıt → draft'ı temizle
    if (fs.existsSync(DRAFT_PATH)) fs.unlinkSync(DRAFT_PATH);
    return { success: true, filePath };
  }
  return { success: false };
}

ipcMain.handle('open-file', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Belgeler', extensions: ['docx', 'html', 'htm', 'txt'] },
      { name: 'Word Dosyası', extensions: ['docx'] },
      { name: 'Tüm Dosyalar', extensions: ['*'] }
    ]
  });
  if (filePaths && filePaths.length > 0) {
    const ext = path.extname(filePaths[0]).toLowerCase();

    if (ext === '.docx') {
      try {
        const result = await mammoth.extractToHtml({ path: filePaths[0] });
        const html = result.value;
        currentFilePath = filePaths[0];
        return { content: html, filePath: filePaths[0], isDocx: true };
      } catch (err) {
        console.error('Docx parse error', err);
        return null;
      }
    }

    const content = fs.readFileSync(filePaths[0], 'utf-8');
    currentFilePath = filePaths[0];
    return { content, filePath: filePaths[0], isDocx: false };
  }
  return null;
});

ipcMain.handle('export-pdf', async () => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    defaultPath: 'belge.pdf'
  });
  if (filePath) {
    const data = await mainWindow.webContents.printToPDF({ pageSize: 'A4', printBackground: true });
    fs.writeFileSync(filePath, data);
    return true;
  }
  return false;
});

ipcMain.handle('print-doc', async () => { mainWindow.webContents.print(); });


// ── YENİ: Lokal Resim Ekleme ──
// Dosyayı dialog ile seçer, base64'e çevirip renderer'a döndürür.
// Renderer tarafında hiçbir zaman disk yolu açığa çıkmaz.
ipcMain.handle('insert-image', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    title: 'Resim Seç',
    properties: ['openFile'],
    filters: [
      { name: 'Resim Dosyaları', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] },
    ]
  });

  if (canceled || !filePaths || filePaths.length === 0) return null;

  const filePath = filePaths[0];
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const mimeMap = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
  };
  const mime = mimeMap[ext] || 'image/png';

  try {
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');
    return { src: `data:${mime};base64,${base64}`, name: path.basename(filePath) };
  } catch (err) {
    console.error('Resim okuma hatası:', err);
    return null;
  }
});

// ── YENİ: Otomatik Kaydetme (Autosave) ──
// Renderer debounce'dan sonra tetikler. currentFilePath varsa oraya,
// yoksa temp dizinindeki draft dosyasına yazar. Asenkron, UI'ı bloklamaz.
ipcMain.handle('autosave', async (_e, content) => {
  try {
    const target = currentFilePath || DRAFT_PATH;
    await fs.promises.writeFile(target, content, 'utf-8');
    return { success: true, isDraft: !currentFilePath };
  } catch (err) {
    console.error('Autosave hatası:', err);
    return { success: false };
  }
});

// ── YENİ: Draft Yükle ──
// Uygulama açılırken kaydedilmemiş draft varsa renderer'a gönder.
ipcMain.handle('load-draft', async () => {
  try {
    if (fs.existsSync(DRAFT_PATH)) {
      const content = fs.readFileSync(DRAFT_PATH, 'utf-8');
      return { content, exists: true };
    }
    return { exists: false };
  } catch (err) {
    return { exists: false };
  }
});

// ── YENİ: Draft Temizle ──
ipcMain.handle('clear-draft', () => {
  try {
    if (fs.existsSync(DRAFT_PATH)) fs.unlinkSync(DRAFT_PATH);
    return true;
  } catch (err) {
    return false;
  }
});

// Handle Squirrel startup
if (require('electron-squirrel-startup')) {
  app.quit();
}

// ── App Lifecycle ──
app.whenReady().then(() => {
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
