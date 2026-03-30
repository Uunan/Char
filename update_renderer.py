import re

def main():
    with open('src/renderer.js', 'r', encoding='utf-8') as f:
        js = f.read()

    # 1. Imports
    js = js.replace("import { Editor } from '@tiptap/core';", "import { Editor, Extension } from '@tiptap/core';")

    # 2. Indent Extension definition
    indent_ext = """
// ── İndent (Girinti) Eklentisi ──
const Indent = Extension.create({
  name: 'indent',
  addOptions() { return { types: ['paragraph', 'heading'], minIndent: 0, maxIndent: 8 } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        indent: {
          default: 0,
          parseHTML: element => parseInt(element.getAttribute('data-indent') || '0', 10),
          renderHTML: attrs => attrs.indent ? { 'data-indent': attrs.indent, style: `margin-left: ${attrs.indent * 24}px` } : {}
        }
      }
    }]
  },
  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        let success = false;
        tr.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const current = node.attrs.indent || 0;
            if (current < this.options.maxIndent) {
              tr.setNodeMarkup(pos, node.type, { ...node.attrs, indent: current + 1 });
              success = true;
            }
          }
        });
        if (success && dispatch) dispatch(tr);
        return success;
      },
      outdent: () => ({ tr, state, dispatch }) => {
        let success = false;
        tr.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const current = node.attrs.indent || 0;
            if (current > this.options.minIndent) {
              tr.setNodeMarkup(pos, node.type, { ...node.attrs, indent: current - 1 });
              success = true;
            }
          }
        });
        if (success && dispatch) dispatch(tr);
        return success;
      }
    }
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    }
  }
});

// ══════════════════════════════════════════════════════════════
//  CHAR – Renderer  |  renderer.js  (P0 complete)
"""
    js = js.replace("// ══════════════════════════════════════════════════════════════\n//  CHAR – Renderer  |  renderer.js  (P0 complete)", indent_ext)

    # 3. Add to extensions array
    js = js.replace("TableCell,", "TableCell,\n    Indent,")

    # 4. updateActiveStates - Heading Logic
    old_heading = """  const headingSelect = document.getElementById('heading-select');
  if      (ed.isActive('heading', { level: 1 })) headingSelect.value = 'h1';
  else if (ed.isActive('heading', { level: 2 })) headingSelect.value = 'h2';
  else if (ed.isActive('heading', { level: 3 })) headingSelect.value = 'h3';
  else                                            headingSelect.value = 'p';"""
    
    new_heading = """  const activeHeadingText = document.getElementById('active-heading-text');
  if (activeHeadingText) {
    if      (ed.isActive('heading', { level: 1 })) activeHeadingText.textContent = 'Başlık 1';
    else if (ed.isActive('heading', { level: 2 })) activeHeadingText.textContent = 'Başlık 2';
    else if (ed.isActive('heading', { level: 3 })) activeHeadingText.textContent = 'Başlık 3';
    else                                           activeHeadingText.textContent = 'Normal';
  }"""
    js = js.replace(old_heading, new_heading)

    # 5. Heading dropdown event listener
    old_heading_listener = """document.getElementById('heading-select').addEventListener('change', (e) => {
  if (isReadOnly) return triggerLoginFlow();
  const val = e.target.value;
  if (val === 'p') editor.chain().focus().setParagraph().run();
  else editor.chain().focus().toggleHeading({ level: parseInt(val.replace('h', '')) }).run();
});"""

    new_heading_listener = """document.querySelectorAll('.heading-option').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (isReadOnly) return triggerLoginFlow();
    const val = btn.getAttribute('data-level');
    if (val === 'p') editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: parseInt(val) }).run();
    document.querySelectorAll('.rb-dropdown-menu').forEach(m => m.classList.remove('show'));
  });
});"""
    js = js.replace(old_heading_listener, new_heading_listener)

    # 6. Add Indent bindCommands
    if "bindCommand('btn-indent'" not in js:
        indent_bindings = """
bindCommand('btn-indent',       chain => chain.indent());
bindCommand('btn-outdent',      chain => chain.outdent());

// Tablo araçları
"""
        js = js.replace("// Tablo araçları\n", indent_bindings)

    with open('src/renderer.js', 'w', encoding='utf-8') as f:
        f.write(js)

if __name__ == "__main__":
    main()
