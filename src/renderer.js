import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';

// ══════════════════════════════════════════════════════════════
//  CHAR – Renderer  |  renderer.js  (P0 complete)
//  P0 Features:
//    ✓ Find & Replace (Ctrl+F / Ctrl+H)
//    ✓ Lokal dosyadan resim ekleme (native dialog → base64)
//    ✓ Otomatik kaydetme (debounce 1500ms → autosave IPC)
//    ✓ Draft geri yükleme (uygulama açılışında)
//    ✓ Genişletilmiş klavye kısayolları
// ══════════════════════════════════════════════════════════════

// ── State ──
let isReadOnly = true;
let currentUser = null;
let zoomLevel = 100;
let loginTimeout = null;

// ── Find & Replace State ──
let findMatches = [];       // [{from, to}, ...]
let findCurrentIdx = -1;
let lastFindTerm = '';

// ── Autosave State ──
let autosaveTimer = null;
let isDirty = false;        // Kaydedilmemiş değişiklik var mı?

// ── DOM Cache ──
const authOverlay   = document.getElementById('auth-overlay');
const editorWrapper = document.getElementById('editor-wrapper');
const docTitle      = document.getElementById('doc-title');
const wordCountEl   = document.getElementById('word-count');
const charCountEl   = document.getElementById('char-count');
const findBar       = document.getElementById('find-bar');
const findInput     = document.getElementById('find-input');
const replaceInput  = document.getElementById('replace-input');

// ══════════════════════════════════════════════════════════════
//  EDİTÖR BAŞLATMA
// ══════════════════════════════════════════════════════════════
const editor = new Editor({
  element: document.getElementById('editor'),
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] }
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Image.configure({ allowBase64: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
  ],
  content: '<p></p>',
  editable: !isReadOnly,
  onUpdate: ({ editor }) => {
    updateCounts(editor);
    scheduleAutosave(editor);
    isDirty = true;

    // Aktif bir arama varsa eşleşmeleri yeniden hesapla
    if (lastFindTerm) findInDocument(lastFindTerm);
  },
  onSelectionUpdate: ({ editor }) => {
    updateActiveStates(editor);
  },
  onTransaction: ({ editor }) => {
    updateActiveStates(editor);
  }
});

// ══════════════════════════════════════════════════════════════
//  KELIME / KARAKTER SAYACI
// ══════════════════════════════════════════════════════════════
function updateCounts(ed) {
  const text = ed.getText();
  const normalized = text.trim().replace(/[\r\n\t\u00A0]+/g, ' ').replace(/\s{2,}/g, ' ');
  const words = normalized.length === 0 ? [] : normalized.split(' ');
  wordCountEl.textContent = `${words.length} kelime`;
  charCountEl.textContent = `${text.length} karakter`;
}

// ══════════════════════════════════════════════════════════════
//  AKTİF DURUM GÜNCELLEMESİ
// ══════════════════════════════════════════════════════════════
function updateActiveStates(ed) {
  const toggle = (id, isActive) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', isActive);
  };

  toggle('btn-bold',          ed.isActive('bold'));
  toggle('btn-italic',        ed.isActive('italic'));
  toggle('btn-underline',     ed.isActive('underline'));
  toggle('btn-strike',        ed.isActive('strike'));
  toggle('btn-blockquote',    ed.isActive('blockquote'));
  toggle('btn-code',          ed.isActive('codeBlock'));

  toggle('btn-align-left',    ed.isActive({ textAlign: 'left' }));
  toggle('btn-align-center',  ed.isActive({ textAlign: 'center' }));
  toggle('btn-align-right',   ed.isActive({ textAlign: 'right' }));
  toggle('btn-align-justify', ed.isActive({ textAlign: 'justify' }));

  toggle('btn-ul', ed.isActive('bulletList'));
  toggle('btn-ol', ed.isActive('orderedList'));

  const headingSelect = document.getElementById('heading-select');
  if      (ed.isActive('heading', { level: 1 })) headingSelect.value = 'h1';
  else if (ed.isActive('heading', { level: 2 })) headingSelect.value = 'h2';
  else if (ed.isActive('heading', { level: 3 })) headingSelect.value = 'h3';
  else                                            headingSelect.value = 'p';

  const tableTab = document.getElementById('tab-table-tab');
  if (ed.isActive('table')) {
    tableTab.style.display = 'block';
  } else {
    tableTab.style.display = 'none';
    const tablePanel = document.getElementById('tab-table');
    if (tableTab.classList.contains('active')) {
      document.querySelector('.rt-tab[data-target="tab-home"]').click();
    }
  }

  // Dropdown İkon Güncellemeleri
  const activeAlignIcon = document.getElementById('active-align-icon');
  if (activeAlignIcon) {
    if (ed.isActive({ textAlign: 'center' })) activeAlignIcon.textContent = '≡';
    else if (ed.isActive({ textAlign: 'right' })) activeAlignIcon.textContent = '▸≡';
    else if (ed.isActive({ textAlign: 'justify' })) activeAlignIcon.textContent = '☰';
    else activeAlignIcon.textContent = '≡◂';
  }
  
  const activeListIcon = document.getElementById('active-list-icon');
  if (activeListIcon) {
    if (ed.isActive('orderedList')) activeListIcon.textContent = '1. ≡';
    else activeListIcon.textContent = '• ≡';
  }
}

// ══════════════════════════════════════════════════════════════
//  RİBBON TAB MENTİĞİ
// ══════════════════════════════════════════════════════════════
document.querySelectorAll('.rt-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    if (tab.classList.contains('file-tab')) return;

    document.querySelectorAll('.rt-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ribbon-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');

    const target = tab.getAttribute('data-target');
    if (target) {
      const panel = document.getElementById(target);
      if (panel) panel.classList.add('active');
    }
  });
});

// ══════════════════════════════════════════════════════════════
//  DROPDOWN MANTIKLARI
// ══════════════════════════════════════════════════════════════
document.querySelectorAll('.rb-dropdown-toggle').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = btn.nextElementSibling;
    const isShowing = menu.classList.contains('show');
    document.querySelectorAll('.rb-dropdown-menu').forEach(m => m.classList.remove('show'));
    if (!isShowing) menu.classList.add('show');
  });
});
document.addEventListener('click', () => {
  document.querySelectorAll('.rb-dropdown-menu').forEach(m => m.classList.remove('show'));
});

// ══════════════════════════════════════════════════════════════
//  FORMATLAMA KOMUTLARI
// ══════════════════════════════════════════════════════════════
const bindCommand = (id, commandFn) => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isReadOnly) return triggerLoginFlow();
      commandFn(editor.chain().focus()).run();
    });
  }
};

bindCommand('btn-bold',           chain => chain.toggleBold());
bindCommand('btn-italic',         chain => chain.toggleItalic());
bindCommand('btn-underline',      chain => chain.toggleUnderline());
bindCommand('btn-strike',         chain => chain.toggleStrike());
bindCommand('btn-blockquote',     chain => chain.toggleBlockquote());
bindCommand('btn-code',           chain => chain.toggleCodeBlock());
bindCommand('btn-align-left',     chain => chain.setTextAlign('left'));
bindCommand('btn-align-center',   chain => chain.setTextAlign('center'));
bindCommand('btn-align-right',    chain => chain.setTextAlign('right'));
bindCommand('btn-align-justify',  chain => chain.setTextAlign('justify'));
bindCommand('btn-ul',             chain => chain.toggleBulletList());
bindCommand('btn-ol',             chain => chain.toggleOrderedList());
bindCommand('btn-table',          chain => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
bindCommand('btn-hr',             chain => chain.setHorizontalRule());

// Tablo araçları
bindCommand('btn-add-row',  chain => chain.addRowAfter());
bindCommand('btn-add-col',  chain => chain.addColumnAfter());
bindCommand('btn-del-row',  chain => chain.deleteRow());
bindCommand('btn-del-col',  chain => chain.deleteColumn());
bindCommand('btn-del-table',chain => chain.deleteTable());

// Undo / Redo
bindCommand('qa-undo', chain => chain.undo());
bindCommand('qa-redo', chain => chain.redo());

// Heading seçici
document.getElementById('heading-select').addEventListener('change', (e) => {
  if (isReadOnly) return triggerLoginFlow();
  const val = e.target.value;
  if (val === 'p') editor.chain().focus().setParagraph().run();
  else editor.chain().focus().toggleHeading({ level: parseInt(val.replace('h', '')) }).run();
});

// ── Pano ──
document.getElementById('btn-copy').addEventListener('click', () => { document.execCommand('copy'); });
document.getElementById('btn-cut').addEventListener('click', () => { document.execCommand('cut'); });
document.getElementById('btn-paste-large').addEventListener('click', async () => {
  if (isReadOnly) return triggerLoginFlow();
  try {
    const text = await navigator.clipboard.readText();
    editor.commands.insertContent(text);
  } catch (err) {
    console.error('Pano okuma hatası:', err);
  }
});

// ── Görünüm: Salt Okuma ──
document.getElementById('btn-read-mode').addEventListener('click', () => {
  window.charAPI.readOnlyMode();
});

// ══════════════════════════════════════════════════════════════
//  P0 ÖZELLİĞİ 1: BUL VE DEĞİŞTİR
// ══════════════════════════════════════════════════════════════

/**
 * Belgedeki tüm `term` eşleşmelerini ProseMirror dokümanında bulur.
 * Eşleşmeler findMatches dizisine {from, to} olarak yazılır.
 * İlk eşleşme seçilir ve editörde vurgulanır.
 */
function findInDocument(term) {
  findMatches = [];
  findCurrentIdx = -1;
  lastFindTerm = term;

  if (!term) return;

  const doc = editor.state.doc;
  const lowerTerm = term.toLowerCase();
  const termLen = term.length;

  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const text = node.text.toLowerCase();
    let idx = 0;
    while ((idx = text.indexOf(lowerTerm, idx)) !== -1) {
      findMatches.push({ from: pos + idx, to: pos + idx + termLen });
      idx += termLen;
    }
  });

  updateFindStatus();

  if (findMatches.length > 0) {
    findCurrentIdx = 0;
    scrollToMatch(0);
  }
}

/** Belirtilen index'teki eşleşmeye gider ve editörde seçer */
function scrollToMatch(idx) {
  if (idx < 0 || idx >= findMatches.length) return;
  const { from, to } = findMatches[idx];
  editor.chain()
    .focus()
    .setTextSelection({ from, to })
    .run();

  // DOM'da görünür alana kaydır
  const domSel = window.getSelection();
  if (domSel && domSel.rangeCount > 0) {
    const range = domSel.getRangeAt(0);
    range.startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function findNext() {
  if (findMatches.length === 0) return;
  findCurrentIdx = (findCurrentIdx + 1) % findMatches.length;
  scrollToMatch(findCurrentIdx);
  updateFindStatus();
}

function findPrev() {
  if (findMatches.length === 0) return;
  findCurrentIdx = (findCurrentIdx - 1 + findMatches.length) % findMatches.length;
  scrollToMatch(findCurrentIdx);
  updateFindStatus();
}

/** Şu anki seçimi replace terimi ile değiştirir */
function replaceCurrent() {
  if (isReadOnly) return;
  if (findMatches.length === 0 || findCurrentIdx < 0) return;

  const term = findInput.value;
  const replacement = replaceInput.value;
  if (!term) return;

  const { from, to } = findMatches[findCurrentIdx];
  editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, replacement).run();

  // Değişiklik sonrası listeyi yenile
  findInDocument(term);
}

/** Tüm eşleşmeleri değiştirir (sondan başa, pozisyon kaymasını önler) */
function replaceAll() {
  if (isReadOnly) return;
  const term = findInput.value;
  const replacement = replaceInput.value;
  if (!term || findMatches.length === 0) return;

  // Sondan başa değiştir: pozisyon hesabı bozulmaz
  const reversed = [...findMatches].reverse();
  const chain = editor.chain().focus();
  reversed.forEach(({ from, to }) => {
    chain.deleteRange({ from, to }).insertContentAt(from, replacement);
  });
  chain.run();

  findInDocument(term);
}

/** Find bar durum metnini günceller: "3 / 12 eşleşme" */
function updateFindStatus() {
  const statusEl = document.getElementById('find-status');
  if (!statusEl) return;
  if (findMatches.length === 0) {
    statusEl.textContent = lastFindTerm ? 'Bulunamadı' : '';
    statusEl.style.color = lastFindTerm ? '#ef4444' : 'var(--subtext)';
  } else {
    statusEl.textContent = `${findCurrentIdx + 1} / ${findMatches.length}`;
    statusEl.style.color = 'var(--subtext)';
  }
}

function openFindBar(focusReplace = false) {
  findBar.style.display = 'flex';
  if (focusReplace) {
    replaceInput.focus();
  } else {
    findInput.focus();
    // Seçili metin varsa arama kutusuna al
    const sel = editor.state.selection;
    if (!sel.empty) {
      const selectedText = editor.state.doc.textBetween(sel.from, sel.to);
      if (selectedText.length < 100) {
        findInput.value = selectedText;
        findInDocument(selectedText);
      }
    }
  }
}

function closeFindBar() {
  findBar.style.display = 'none';
  findMatches = [];
  findCurrentIdx = -1;
  lastFindTerm = '';
  updateFindStatus();
  editor.commands.focus();
}

// Find bar event listener'ları
findInput.addEventListener('input', (e) => {
  findInDocument(e.target.value);
});

findInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.shiftKey ? findPrev() : findNext();
  }
  if (e.key === 'Escape') closeFindBar();
});

replaceInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeFindBar();
});

document.getElementById('find-next-btn').addEventListener('click', findNext);
document.getElementById('find-prev-btn')?.addEventListener('click', findPrev);
document.getElementById('replace-btn').addEventListener('click', replaceCurrent);
document.getElementById('replace-all-btn').addEventListener('click', replaceAll);
document.getElementById('find-close-btn').addEventListener('click', closeFindBar);

// ══════════════════════════════════════════════════════════════
//  P0 ÖZELLİĞİ 2: LOKAL DOSYADAN RESİM EKLEME
// ══════════════════════════════════════════════════════════════
document.getElementById('btn-image').addEventListener('click', async () => {
  if (isReadOnly) return triggerLoginFlow();

  const result = await window.charAPI.insertImage();
  if (result && result.src) {
    editor.chain().focus().setImage({ src: result.src, alt: result.name }).run();
  }
});

// ══════════════════════════════════════════════════════════════
//  P0 ÖZELLİĞİ 3: OTOMATİK KAYDETME (AUTOSAVE)
// ══════════════════════════════════════════════════════════════

/**
 * Her editör güncellemesinde 1500ms debounce ile tetiklenir.
 * Main process'e HTML içeriği gönderir; currentFilePath varsa
 * o dosyaya, yoksa geçici draft dosyasına yazar.
 */
function scheduleAutosave(ed) {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(async () => {
    if (!isReadOnly) {
      const html = ed.getHTML();
      const result = await window.charAPI.autosave(html);
      if (result?.success) {
        showAutosaveIndicator(result.isDraft);
      }
    }
  }, 1500);
}

/** Status bar'da geçici "Kaydedildi / Taslak kaydedildi" göstergesi */
function showAutosaveIndicator(isDraft) {
  const label = isDraft ? 'Taslak kaydedildi' : 'Otomatik kaydedildi';
  const el = document.getElementById('autosave-status');
  if (!el) return;
  el.textContent = `✓ ${label}`;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 2500);
}

// ── Kaydedilmemiş Değişiklik Koruması ──
// Autosave aktif olduğu için beforeunload ile kapatmayı engellemeye gerek kalmadı.
// window.addEventListener('beforeunload', (e) => {
//   if (isDirty) {
//     e.preventDefault();
//     e.returnValue = '';
//   }
// });

// ══════════════════════════════════════════════════════════════
//  UX AKIŞI: Salt Okuma → Tıkla → Giriş
// ══════════════════════════════════════════════════════════════
editorWrapper.addEventListener('click', (e) => {
  if (isReadOnly) {
    e.preventDefault();
    triggerLoginFlow();
  }
});

function triggerLoginFlow() {
  if (!isReadOnly || currentUser) return;
  authOverlay.style.display = 'flex';
  window.charAPI.openAuth();
  if (loginTimeout) clearTimeout(loginTimeout);
  loginTimeout = setTimeout(() => {
    authOverlay.style.display = 'none';
  }, 60000);
}

// ══════════════════════════════════════════════════════════════
//  IPC DİNLEYİCİLERİ
// ══════════════════════════════════════════════════════════════
window.charAPI.onInitData(async (data) => {
  currentUser = data.user;
  isReadOnly = data.isReadOnly;
  editor.setEditable(!isReadOnly);
  updateUIForUser();

  // Draft geri yükleme — sadece belge boşsa ve draft varsa sor
  if (data.hasDraft) {
    const draft = await window.charAPI.loadDraft();
    if (draft?.exists && draft.content && draft.content.trim().length > 0) {
      const restore = confirm(
        'Kaydedilmemiş bir taslak belgesi bulundu.\nGeri yüklemek istiyor musunuz?'
      );
      if (restore) {
        editor.commands.setContent(draft.content);
        docTitle.textContent = 'Taslak Belge';
        updateCounts(editor);
      } else {
        await window.charAPI.clearDraft();
      }
    }
  }
});

window.charAPI.onUserLoggedIn((data) => {
  currentUser = data.user;
  isReadOnly = data.isReadOnly;
  editor.setEditable(!isReadOnly);

  if (loginTimeout) clearTimeout(loginTimeout);
  authOverlay.style.display = 'none';

  updateUIForUser();
  editor.commands.focus();
});

function updateUIForUser() {
  if (currentUser) {
    document.getElementById('user-section').style.display = 'flex';
    document.getElementById('user-name').textContent = currentUser.displayName;
    document.getElementById('user-avatar').textContent = currentUser.initial;
    document.getElementById('readonly-badge').style.display = 'none';
    document.getElementById('btn-read-mode').textContent = '📖 Okuma Modundan Çık';
  } else {
    document.getElementById('user-section').style.display = 'none';
    document.getElementById('readonly-badge').style.display = 'inline-block';
    document.getElementById('btn-read-mode').textContent = '📖 Sadece Okuma';
  }
}

// ══════════════════════════════════════════════════════════════
//  DOSYA MENÜSÜ
// ══════════════════════════════════════════════════════════════
document.getElementById('menu-new').addEventListener('click', async () => {
  if (isReadOnly) return triggerLoginFlow();
  if (isDirty) {
    const ok = confirm('Kaydedilmemiş değişiklikler var. Yeni belge açılsın mı?');
    if (!ok) return;
  }
  editor.commands.setContent('');
  docTitle.textContent = 'Adsız Belge';
  isDirty = false;
  await window.charAPI.newFile();
  await window.charAPI.clearDraft();
});

document.getElementById('menu-open').addEventListener('click', async () => {
  const result = await window.charAPI.openFile();
  if (result) {
    editor.commands.setContent(result.content);
    const name = result.filePath.split(/[\\/]/).pop();
    docTitle.textContent = name;
    isDirty = false;
    updateCounts(editor);
  }
});

async function saveDocument(saveAs = false) {
  if (isReadOnly) return triggerLoginFlow();
  const htmlContent = editor.getHTML();

  let result;
  if (saveAs) {
    result = await window.charAPI.saveFileAs(htmlContent);
  } else {
    result = await window.charAPI.saveFile(htmlContent);
  }

  if (result?.success) {
    const name = result.filePath.split(/[\\/]/).pop();
    docTitle.textContent = name;
    isDirty = false;
  }
}

document.getElementById('menu-save').addEventListener('click',    () => saveDocument(false));
document.getElementById('qa-save').addEventListener('click',      () => saveDocument(false));
document.getElementById('menu-saveas').addEventListener('click',  () => saveDocument(true));
document.getElementById('menu-export-pdf').addEventListener('click', () => window.charAPI.exportPDF());
document.getElementById('menu-print').addEventListener('click',   () => window.charAPI.printDoc());

// ══════════════════════════════════════════════════════════════
//  ZOOM
// ══════════════════════════════════════════════════════════════
document.getElementById('zoom-in').addEventListener('click',  () => setZoom(zoomLevel + 10));
document.getElementById('zoom-out').addEventListener('click', () => setZoom(zoomLevel - 10));

function setZoom(level) {
  zoomLevel = Math.max(50, Math.min(200, level));
  const page = document.getElementById('page');
  // transform yerine zoom — scroll davranışını bozmaz
  page.style.zoom = `${zoomLevel}%`;
  document.getElementById('zoom-level').textContent = `${zoomLevel}%`;
}

// ══════════════════════════════════════════════════════════════
//  P0 ÖZELLİĞİ 4: GENİŞLETİLMİŞ KLAVYE KISAYOLLARI
// ══════════════════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
  // Ctrl / Cmd kombinasyonları
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      // Dosya işlemleri
      case 's':
        e.preventDefault();
        saveDocument(e.shiftKey); // Ctrl+Shift+S → Farklı Kaydet
        break;
      case 'o':
        e.preventDefault();
        document.getElementById('menu-open').click();
        break;
      case 'n':
        e.preventDefault();
        document.getElementById('menu-new').click();
        break;

      // Bul / Değiştir
      case 'f':
        e.preventDefault();
        openFindBar(false);
        break;
      case 'h':
        e.preventDefault();
        openFindBar(true);
        break;

      // Undo / Redo (editör odağından bağımsız çalışır)
      case 'z':
        if (!e.shiftKey) {
          e.preventDefault();
          editor.chain().focus().undo().run();
        }
        break;
      case 'y':
        e.preventDefault();
        editor.chain().focus().redo().run();
        break;

      // Yazdır
      case 'p':
        e.preventDefault();
        window.charAPI.printDoc();
        break;
    }
  }

  // Escape → Find bar'ı kapat
  if (e.key === 'Escape' && findBar.style.display !== 'none') {
    closeFindBar();
  }

  // Find bar açıkken: F3 / Shift+F3 → ileri / geri
  if (e.key === 'F3' && findBar.style.display !== 'none') {
    e.preventDefault();
    e.shiftKey ? findPrev() : findNext();
  }
});

// ══════════════════════════════════════════════════════════════
//  BAŞLANGIÇ
// ══════════════════════════════════════════════════════════════
updateCounts(editor);
