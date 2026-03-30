import re

def main():
    with open('src/index.css', 'r', encoding='utf-8') as f:
        css = f.read()

    # 1. Update Title bar background
    tb_old = """  .title-bar {
    height: 44px;
    background: var(--title-bg);
    color: var(--title-txt);
    border-bottom: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    -webkit-app-region: drag;
  }"""
    tb_new = """  .title-bar {
    height: 46px;
    background: linear-gradient(135deg, #1b3863, #2b579a);
    color: #ffffff;
    border-bottom: 1px solid rgba(0,0,0,0.2);
    box-shadow: 0 1px 5px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    -webkit-app-region: drag;
  }"""
    css = css.replace(tb_old, tb_new)

    # 2. Add svg styles at the bottom
    svg_styles = """
  /* ── SVG ICONS ── */
  .sys-icon {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sys-icon.xl {
    width: 22px;
    height: 22px;
  }
  .rb-btn svg {
    margin: 0;
  }
  .rb-heading-btn {
    min-width: 95px;
  }
"""
    if "/* ── SVG ICONS ── */" not in css:
        css += svg_styles
    
    # 3. Quick Actions button style changes (make them look natural on dark blue bg)
    qa_old = """  .qa-btn {
    background: transparent; border: none; font-size: 14px;
    color: var(--title-txt); cursor: pointer; padding: 4px;
    border-radius: 4px; display: flex; align-items: center; justify-content: center;
    transition: background 0.1s; -webkit-app-region: no-drag;
  }
  .qa-btn:hover { background: rgba(255,255,255,0.1); }"""
    
    qa_new = """  .qa-btn {
    background: transparent; border: none; font-size: 14px;
    color: rgba(255,255,255,0.9); cursor: pointer; padding: 6px;
    border-radius: 4px; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; -webkit-app-region: no-drag;
  }
  .qa-btn:hover { background: rgba(255,255,255,0.15); color: #fff; transform: scale(1.05); }"""
    css = css.replace(qa_old, qa_new)

    # 4. Ribbon Btn hover make slightly more premium
    rb_btn_old = """  .rb-btn:hover { background: var(--surface2); border-color: var(--border); }"""
    rb_btn_new = """  .rb-btn:hover { background: #e3e8f0; border-color: #cbd5e1; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transform: translateY(-0.5px); }"""
    css = css.replace(rb_btn_old, rb_btn_new)

    with open('src/index.css', 'w', encoding='utf-8') as f:
        f.write(css)

if __name__ == "__main__":
    main()
