const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('charAPI', {
  // ── Auth ──
  openAuth: () => ipcRenderer.invoke('open-auth'),
  readOnlyMode: () => ipcRenderer.invoke('read-only-mode'),
  onInitData: (cb) => ipcRenderer.on('init-data', (_e, data) => cb(data)),
  onUserLoggedIn: (cb) => ipcRenderer.on('user-logged-in', (_e, data) => cb(data)),

  // ── Dosya İşlemleri ──
  newFile: () => ipcRenderer.invoke('new-file'),
  saveFile: (content) => ipcRenderer.invoke('save-file', content),
  saveFileAs: (content) => ipcRenderer.invoke('save-file-as', content),
  openFile: () => ipcRenderer.invoke('open-file'),
  exportPDF: () => ipcRenderer.invoke('export-pdf'),
  printDoc: () => ipcRenderer.invoke('print-doc'),

  // ── YENİ: Resim ──
  // Native dialog açar, seçilen dosyayı {src: 'data:...', name: '...'} olarak döner.
  insertImage: () => ipcRenderer.invoke('insert-image'),

  // ── YENİ: Otomatik Kaydetme ──
  // Renderer her değişiklikte debounce'dan sonra çağırır.
  autosave: (content) => ipcRenderer.invoke('autosave', content),

  // ── YENİ: Draft Sistemi ──
  loadDraft: () => ipcRenderer.invoke('load-draft'),
  clearDraft: () => ipcRenderer.invoke('clear-draft'),
});
