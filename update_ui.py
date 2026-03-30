import re

def main():
    with open('src/index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Quick Actions replaced with SVG
    qa_svg = """        <div class="quick-actions">
          <button class="qa-btn" id="qa-save" title="Kaydet (Ctrl+S)">
            <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          </button>
          <button class="qa-btn" id="qa-undo" title="Geri Al (Ctrl+Z)">
            <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>
          </button>
          <button class="qa-btn" id="qa-redo" title="İleri Al (Ctrl+Y)">
            <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path></svg>
          </button>
        </div>"""
    
    html = re.sub(r'<div class="quick-actions">.*?</div>', qa_svg, html, flags=re.DOTALL)

    # 2. Clipboard Group
    clip_old = """          <div class="rg-content rb-col" style="flex-direction: row;">
            <button class="rb-btn rb-large" id="btn-paste-large" title="Yapıştır (Ctrl+V)" style="flex-direction: column; height: auto; padding: 4px;">
              <span style="font-size: 20px; margin-bottom: 2px;">📋</span>
              <span style="font-size: 10px;">Yapıştır</span>
            </button>
            <div class="rb-col-small" style="display: flex; flex-direction: column; gap: 2px; justify-content: center;">
              <button class="rb-btn" id="btn-cut" title="Kes (Ctrl+X)" style="justify-content: flex-start; padding: 2px 6px;">✂️ Kes</button>
              <button class="rb-btn" id="btn-copy" title="Kopyala (Ctrl+C)" style="justify-content: flex-start; padding: 2px 6px;">📑 Kopyala</button>
            </div>
          </div>"""

    clip_new = """          <div class="rg-content rb-col" style="flex-direction: row;">
            <button class="rb-btn rb-large" id="btn-paste-large" title="Yapıştır (Ctrl+V)" style="flex-direction: column; height: auto; padding: 6px 4px;">
              <svg class="sys-icon xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
              <span style="font-size: 10px; margin-top: 4px; font-weight: 500;">Yapıştır</span>
            </button>
            <div class="rb-col-small" style="display: flex; flex-direction: column; gap: 2px; justify-content: center;">
              <button class="rb-btn" id="btn-cut" title="Kes (Ctrl+X)" style="justify-content: flex-start; padding: 2px 6px;">
                <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg> Kes
              </button>
              <button class="rb-btn" id="btn-copy" title="Kopyala (Ctrl+C)" style="justify-content: flex-start; padding: 2px 6px;">
                <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Kopyala
              </button>
            </div>
          </div>"""
    html = html.replace(clip_old, clip_new)

    # 3. Font Group
    font_old = """            <div class="rg-row">
              <select id="heading-select" title="Stil">
                <option value="p">Normal</option>
                <option value="h1">Başlık 1</option>
                <option value="h2">Başlık 2</option>
                <option value="h3">Başlık 3</option>
              </select>
            </div>
            <div class="rg-row">
              <button class="rb-btn f-bold" id="btn-bold" title="Kalın (Ctrl+B)"><b>B</b></button>
              <button class="rb-btn f-italic" id="btn-italic" title="İtalik (Ctrl+I)"><i>I</i></button>
              <button class="rb-btn f-underline" id="btn-underline" title="Altı Çizili (Ctrl+U)"><u>U</u></button>
              <button class="rb-btn f-strike" id="btn-strike" title="Üstü Çizili"><s>ab</s></button>
              <button class="rb-btn" id="btn-code" title="Kod Bloğu">&lt;/&gt;</button>
              <button class="rb-btn" id="btn-blockquote" title="Alıntı">❝</button>
            </div>"""

    font_new = """            <div class="rg-row">
              <div class="rb-dropdown">
                <button class="rb-btn rb-dropdown-toggle rb-heading-btn" id="heading-toggle" title="Stil" style="min-width: 90px; justify-content: space-between;">
                  <span id="active-heading-text">Normal</span> <span class="caret" style="font-size:8px; margin-left:4px;">▼</span>
                </button>
                <div class="rb-dropdown-menu">
                  <button class="rb-dropdown-item heading-option" data-level="p" style="font-size: 13px;">Normal</button>
                  <button class="rb-dropdown-item heading-option" data-level="1" style="font-size: 18px; font-weight: bold;">Başlık 1</button>
                  <button class="rb-dropdown-item heading-option" data-level="2" style="font-size: 16px; font-weight: bold;">Başlık 2</button>
                  <button class="rb-dropdown-item heading-option" data-level="3" style="font-size: 14px; font-weight: bold;">Başlık 3</button>
                </div>
              </div>
            </div>
            <div class="rg-row">
              <button class="rb-btn" id="btn-bold" title="Kalın (Ctrl+B)">
                <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
              </button>
              <button class="rb-btn" id="btn-italic" title="İtalik (Ctrl+I)">
                <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
              </button>
              <button class="rb-btn" id="btn-underline" title="Altı Çizili (Ctrl+U)">
                <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>
              </button>
              <button class="rb-btn" id="btn-strike" title="Üstü Çizili">
                <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 6l-8 12"></path><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <button class="rb-btn" id="btn-code" title="Kod Bloğu">
                <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
              </button>
              <button class="rb-btn" id="btn-blockquote" title="Alıntı">
                <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path></svg>
              </button>
            </div>"""
    html = html.replace(font_old, font_new)

    # 4. Alignment & Lists Dropdown svgs, and add Indent
    p_old = """              <!-- Alignment Dropdown -->
              <div class="rb-dropdown">
                <button class="rb-btn rb-dropdown-toggle" id="btn-align-toggle" title="Hizalama">
                  <span id="active-align-icon">≡◂</span> <span class="caret" style="font-size:8px; margin-left:4px;">▼</span>
                </button>
                <div class="rb-dropdown-menu">
                  <button class="rb-dropdown-item" id="btn-align-left">≡◂ Sola Yasla</button>
                  <button class="rb-dropdown-item" id="btn-align-center">≡ Ortala</button>
                  <button class="rb-dropdown-item" id="btn-align-right">▸≡ Sağa Yasla</button>
                  <button class="rb-dropdown-item" id="btn-align-justify">☰ İki Yana Yasla</button>
                </div>
              </div>
              
              <!-- Lists Dropdown -->
              <div class="rb-dropdown">
                <button class="rb-btn rb-dropdown-toggle" id="btn-lists-toggle" title="Listeler">
                  <span id="active-list-icon">• ≡</span> <span class="caret" style="font-size:8px; margin-left:4px;">▼</span>
                </button>
                <div class="rb-dropdown-menu">
                  <button class="rb-dropdown-item" id="btn-ul">• ≡ Madde İşaretli</button>
                  <button class="rb-dropdown-item" id="btn-ol">1. ≡ Numaralı Liste</button>
                </div>
              </div>"""

    align_left = '<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="15" y1="12" x2="3" y2="12"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>'
    align_center = '<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="17" y1="12" x2="7" y2="12"></line><line x1="19" y1="18" x2="5" y2="18"></line></svg>'
    align_right = '<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="9" y2="12"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>'
    align_justify = '<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="3" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>'
    ul_icon = '<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>'
    ol_icon = '<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>'
    outdent_icon = '<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="7 8 3 12 7 16"></polyline><line x1="21" y1="12" x2="11" y2="12"></line><line x1="21" y1="6" x2="11" y2="6"></line><line x1="21" y1="18" x2="11" y2="18"></line></svg>'
    indent_icon = '<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 8 7 12 3 16"></polyline><line x1="21" y1="12" x2="11" y2="12"></line><line x1="21" y1="6" x2="11" y2="6"></line><line x1="21" y1="18" x2="11" y2="18"></line></svg>'

    p_new = f"""              <!-- Alignment Dropdown -->
              <div class="rb-dropdown">
                <button class="rb-btn rb-dropdown-toggle" id="btn-align-toggle" title="Hizalama">
                  <span id="active-align-icon">{align_left}</span> <span class="caret" style="font-size:8px; margin-left:4px;">▼</span>
                </button>
                <div class="rb-dropdown-menu">
                  <button class="rb-dropdown-item" id="btn-align-left">{align_left} Sola Yasla</button>
                  <button class="rb-dropdown-item" id="btn-align-center">{align_center} Ortala</button>
                  <button class="rb-dropdown-item" id="btn-align-right">{align_right} Sağa Yasla</button>
                  <button class="rb-dropdown-item" id="btn-align-justify">{align_justify} İki Yana Yasla</button>
                </div>
              </div>
              
              <!-- Lists Dropdown -->
              <div class="rb-dropdown">
                <button class="rb-btn rb-dropdown-toggle" id="btn-lists-toggle" title="Listeler">
                  <span id="active-list-icon">{ul_icon}</span> <span class="caret" style="font-size:8px; margin-left:4px;">▼</span>
                </button>
                <div class="rb-dropdown-menu">
                  <button class="rb-dropdown-item" id="btn-ul">{ul_icon} Madde İşaretli</button>
                  <button class="rb-dropdown-item" id="btn-ol">{ol_icon} Numaralı Liste</button>
                </div>
              </div>
              
              <div class="ribbon-sep-small" style="width: 1px; height: 16px; background: var(--border); margin: 0 4px;"></div>
              
              <!-- Indent / Outdent -->
              <button class="rb-btn" id="btn-outdent" title="Girintiyi Azalt">{outdent_icon}</button>
              <button class="rb-btn" id="btn-indent" title="Girintiyi Arttır">{indent_icon}</button>"""
    html = html.replace(p_old, p_new)

    # 5. Insert Tab Icons
    tbl_icon = '<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>'
    img_icon = '<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
    hr_icon = '<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="12" x2="20" y2="12"></line></svg>'
    
    insert_old = """              <button class="rb-btn" id="btn-table" title="Tablo Ekle">▦ Tablo</button>
              <button class="rb-btn" id="btn-image" title="Resim Ekle">🖼️ Resim</button>
              <button class="rb-btn" id="btn-hr" title="Yatay Çizgi">— Çizgi</button>"""
    insert_new = f"""              <button class="rb-btn" id="btn-table" title="Tablo Ekle">{tbl_icon} Tablo</button>
              <button class="rb-btn" id="btn-image" title="Resim Ekle">{img_icon} Resim</button>
              <button class="rb-btn" id="btn-hr" title="Yatay Çizgi">{hr_icon} Çizgi</button>"""
    html = html.replace(insert_old, insert_new)

    # 6. Delete "Sadece Okuma" Text in view tab to use an eye icon
    view_old = """<button class="rb-btn" id="btn-read-mode" title="Okuma Modu">📖 Sadece Okuma</button>"""
    view_new = """<button class="rb-btn" id="btn-read-mode" title="Okuma Modu"><svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Sadece Okuma</button>"""
    html = html.replace(view_old, view_new)

    # 7. Contextual Tab Table Tools
    c_tab_old = """              <button class="rb-btn" id="btn-add-row" title="Satır Ekle">➕ Satır Ekle</button>
              <button class="rb-btn" id="btn-add-col" title="Sütun Ekle">➕ Sütun Ekle</button>
              <div class="ribbon-sep"></div>
              <button class="rb-btn" id="btn-del-row" title="Satır Sil">➖ Satır Sil</button>
              <button class="rb-btn" id="btn-del-col" title="Sütun Sil">➖ Sütun Sil</button>
              <div class="ribbon-sep"></div>
              <button class="rb-btn" id="btn-del-table" style="color:#ef4444" title="Tabloyu Sil">🚮 Tabloyu Sil</button>"""
    
    add_r = '<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>'
    del_r = '<svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14"></path></svg>'
    trash = '<svg class="sys-icon" style="color:#ef4444" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
    
    c_tab_new = f"""              <button class="rb-btn" id="btn-add-row" title="Satır Ekle">{add_r} Açığa Satır</button>
              <button class="rb-btn" id="btn-add-col" title="Sütun Ekle">{add_r} Sağa Sütun</button>
              <div class="ribbon-sep"></div>
              <button class="rb-btn" id="btn-del-row" title="Satır Sil">{del_r} Satır Sil</button>
              <button class="rb-btn" id="btn-del-col" title="Sütun Sil">{del_r} Sütun Sil</button>
              <div class="ribbon-sep"></div>
              <button class="rb-btn" id="btn-del-table" style="color:#ef4444" title="Tabloyu Sil">{trash} Tabloyu Sil</button>"""
    html = html.replace(c_tab_old, c_tab_new)

    with open('src/index.html', 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == "__main__":
    main()
