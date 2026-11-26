/* Shared preference keys also apply to the sign-in page on this origin. */
(() => {
  'use strict';

  const languageKey = 'merhav-language';
  const themeKey = 'merhav-theme';
  const names = { he: 'עברית', ar: 'العربية', en: 'English' };
  const chrome = {
    'החשבון שלי': ['My account', 'حسابي'],
    'יציאה': ['Sign out', 'تسجيل الخروج'],
    'מרחב המחקר': ['Research workspace', 'مساحة البحث'],
    'מרחב מחקר | פוסט דוקטורט': ['Research workspace | Postdoctoral research', 'مساحة البحث | أبحاث ما بعد الدكتوراه'],
    'פוסט דוקטורט ומאמרים': ['Postdoctoral research and papers', 'أبحاث ما بعد الدكتوراه ومقالات'],
    'שפת הממשק': ['Interface language', 'لغة الواجهة'],
    'מראה ושפה': ['Appearance and language', 'المظهر واللغة'],
    'מעבר למצב כהה': ['Switch to dark theme', 'تفعيل المظهر الداكن'],
    'מעבר למצב בהיר': ['Switch to light theme', 'تفعيل المظهر الفاتح'],
    'השפה תתעדכן באזור העריכה לאחר סיום העריכה.': ['This editor will use the new language after you finish editing.', 'ستظهر اللغة الجديدة في هذا المحرر بعد الانتهاء من التحرير.'],
    'אזורי עבודה': ['Workspace navigation', 'التنقل في مساحة العمل'],
    'פעולות במרחב המחקר': ['Workspace actions', 'إجراءات مساحة البحث'],
    'לוח בקרה': ['Dashboard', 'لوحة المتابعة'],
    'המחקרים שלי': ['My research', 'أبحاثي'],
    'משימות': ['Tasks', 'المهام'],
    'גאנט מחקרים': ['Research timeline', 'الجدول الزمني للأبحاث'],
    'מקורות וקריאה': ['Sources and reading', 'المصادر والقراءة'],
    'קבצים וגרסאות': ['Files and versions', 'الملفات والإصدارات'],
    'מאגר כלי מחקר': ['Research instruments', 'أدوات البحث'],
    'תכנון ניתוחים': ['Analysis planning', 'تخطيط التحليلات'],
    'סטטיסטיקה ונתונים': ['Statistics and data', 'الإحصاء والبيانات'],
    'הזדמנויות לפרסום': ['Publication opportunities', 'فرص النشر'],
    'יומן פעילות': ['Activity log', 'سجل النشاط'],
    'שיחה על המחקרים': ['Research chat', 'محادثات البحث'],
    'שמירה וגיבוי': ['Save and backup', 'الحفظ والنسخ الاحتياطي'],
    'טוען נתונים…': ['Loading data…', 'جارٍ تحميل البيانات…'],
    'נתונים שמורים באתר הפרטי': ['Saved to private workspace', 'محفوظ في مساحة البحث الخاصة'],
    'שמירה מקומית': ['Local save', 'حفظ محلي'],
    'עוד': ['More', 'المزيد'],
    '＋ הוספה מהירה': ['＋ Quick add', '＋ إضافة سريعة'],
    'המחקר הפעיל': ['Active project', 'البحث النشط']
  };
  const sectionNames = {
    dashboard: 'לוח בקרה', papers: 'המחקרים שלי', tasks: 'משימות', gantt: 'גאנט מחקרים',
    sources: 'מקורות וקריאה', files: 'קבצים וגרסאות', analyses: 'תכנון ניתוחים',
    statistics: 'סטטיסטיקה ונתונים', tools: 'מאגר כלי מחקר', opportunities: 'הזדמנויות לפרסום',
    activity: 'יומן פעילות', chat: 'שיחה על המחקרים', settings: 'שמירה וגיבוי'
  };
  const page = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const edited = new WeakSet();
  const keyIsLanguage = value => Object.hasOwn(names, value);
  const keyIsTheme = value => value === 'dark' || value === 'light';

  function read(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch { /* Preferences still apply in memory. */ }
  }

  let language = read(languageKey);
  if (!keyIsLanguage(language)) language = 'he';
  let explicitTheme = read(themeKey);
  if (!keyIsTheme(explicitTheme)) explicitTheme = null;

  function t(source) {
    if (language === 'he' || typeof source !== 'string' || !source) return source;
    const key = source.trim();
    const pair = chrome[key] || window.MerhavCoreLocales?.[key] ||
      window.MerhavModuleLocales?.[key] || window.MerhavMessages?.[key];
    const translation = Array.isArray(pair) && pair[language === 'en' ? 0 : 1];
    return translation ? source.replace(key, () => translation) : source;
  }

  function applyDocument() {
    page.lang = language;
    page.dir = language === 'en' ? 'ltr' : 'rtl';
    page.dataset.theme = explicitTheme || (systemTheme.matches ? 'dark' : 'light');
    page.style.colorScheme = page.dataset.theme;
  }

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }
  function setAttr(node, attr, value) {
    if (node && node.getAttribute(attr) !== value) node.setAttribute(attr, value);
  }

  const annotations = { 'data-ui-placeholder': 'placeholder', 'data-ui-title': 'title', 'data-ui-aria': 'aria-label' };
  const markedSelector = '[data-ui-text], [data-ui-placeholder], [data-ui-title], [data-ui-aria]';
  function applyLabels(root) {
    function apply(node) {
      if (node.hasAttribute('data-ui-text')) setText(node, t(node.dataset.uiText));
      for (const [source, attr] of Object.entries(annotations)) {
        if (node.hasAttribute(source)) setAttr(node, attr, t(node.getAttribute(source)));
      }
    }
    if (root.matches?.(markedSelector)) apply(root);
    root.querySelectorAll(markedSelector).forEach(apply);
  }

  // Only translate source-owned UI. Project titles, imported files, notes and form
  // values can be identical to dictionary entries and must remain as the user wrote them.
  function updateChrome() {
    const find = selector => document.querySelector(selector);
    const textLabels = {
      '.sidebar-brand h2':'מרחב המחקר', '.sidebar-brand p':'פוסט דוקטורט ומאמרים',
      '.workspace-breadcrumb':'מרחב המחקר',
      '#workspace-project .workspace-project > span':'המחקר הפעיל'
    };
    for (const [selector, source] of Object.entries(textLabels)) setText(find(selector), t(source));
    setAttr(find('#nav'),'aria-label',t('אזורי עבודה'));
    setAttr(find('#modal'),'aria-label',t('פעולות במרחב המחקר'));
    for (const nav of document.querySelectorAll('#nav button[data-workspace-section], #nav button[data-statistics]')) {
      const key = nav.hasAttribute('data-statistics') ? 'statistics' : nav.dataset.workspaceSection;
      if (sectionNames[key]) setText(nav.querySelector('.nav-category-label'), t(sectionNames[key]));
    }
    if (typeof paperId !== 'undefined' && !paperId && typeof view !== 'undefined' && sectionNames[view]) {
      setText(find('#title'), t(sectionNames[view]));
    }
    const saved = find('#saved');
    if (saved) {
      const statuses = ['נתונים שמורים באתר הפרטי', 'שמירה מקומית', 'טוען נתונים…'];
      const source = statuses.find(key => key === saved.textContent || chrome[key].includes(saved.textContent));
      if (source) setText(saved, t(source));
    }
    const add = find('#quickAdd');
    if (add && ['＋ הוספה מהירה', ...chrome['＋ הוספה מהירה']].includes(add.textContent.trim())) {
      setText(add, t('＋ הוספה מהירה'));
    }
    refreshControls();
  }

  const symbols = {
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c4 4.5 4 13.5 0 18-4-4.5-4-13.5 0-18Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
    moon: '<path d="M20.7 14A8.8 8.8 0 0 1 10 3.3 9 9 0 1 0 20.7 14Z"/>'
  };
  const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + symbols[name] + '</svg>';
  let controls;
  function createControls() {
    const host = document.querySelector('.workspace-header-actions');
    if (!host) return;
    controls = document.createElement('div');
    controls.className = 'studio-preferences';
    controls.setAttribute('role','group');
    const label = document.createElement('label');
    label.className = 'studio-language';
    label.innerHTML = icon('globe');
    const select = document.createElement('select');
    select.id = 'studio-language';
    for (const [value, name] of Object.entries(names)) {
      const option = new Option(name, value);
      option.lang = value;
      select.add(option);
    }
    select.addEventListener('change', () => setLanguage(select.value));
    label.append(select);
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'studio-theme';
    button.addEventListener('click', () => setTheme(page.dataset.theme === 'dark' ? 'light' : 'dark'));
    controls.append(label, button);
    host.prepend(controls);
    refreshControls();
  }
  function refreshControls() {
    if (!controls) return;
    setAttr(controls,'aria-label',t('מראה ושפה'));
    const select = controls.querySelector('select');
    select.value = language;
    setAttr(select, 'aria-label', t('שפת הממשק'));
    const button = controls.querySelector('button');
    const dark = page.dataset.theme === 'dark';
    const label = t(dark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה');
    setAttr(button, 'aria-label', label);
    setAttr(button, 'title', label);
    if (button.dataset.icon !== (dark ? 'sun' : 'moon')) {
      button.dataset.icon = dark ? 'sun' : 'moon';
      button.innerHTML = icon(button.dataset.icon);
    }
  }

  function hasActiveEdits() {
    if (document.querySelector('dialog[open]')) return true;
    return Array.from(document.querySelectorAll('#app input, #app textarea, #app select, #app [contenteditable="true"]'))
      .some(field => edited.has(field) || (field.type === 'file' && field.files?.length));
  }

  function setLanguage(value, persist = true) {
    if (!keyIsLanguage(value) || value === language) return;
    language = value;
    if (persist) write(languageKey, value);
    const editing = hasActiveEdits();
    applyDocument();
    document.title = t('מרחב מחקר | פוסט דוקטורט');
    if (!editing && typeof render === 'function' && typeof S !== 'undefined' && S) render();
    applyLabels(document);
    updateChrome();
    document.dispatchEvent(new CustomEvent('merhav:languagechange', { bubbles: true, detail: { language } }));
    if (editing && typeof toast === 'function') toast(t('השפה תתעדכן באזור העריכה לאחר סיום העריכה.'));
  }

  function setTheme(value, persist = true) {
    if (!keyIsTheme(value) && value !== null) return;
    explicitTheme = value;
    if (persist && value) write(themeKey, value);
    applyDocument();
    refreshControls();
    document.dispatchEvent(new CustomEvent('merhav:themechange', { bubbles: true, detail: { theme: page.dataset.theme } }));
  }

  applyDocument();
  window.MerhavUI = Object.freeze({ t, setLanguage, setTheme, get language() { return language; }, get theme() { return page.dataset.theme; } });
  systemTheme.addEventListener('change', () => { if (!explicitTheme) setTheme(null, false); });
  window.addEventListener('storage', event => {
    if (event.key === languageKey || event.key === null) setLanguage(read(languageKey) || 'he', false);
    if (event.key === themeKey || event.key === null) setTheme(read(themeKey), false);
  });

  function start() {
    document.title = t('מרחב מחקר | פוסט דוקטורט');
    createControls();
    applyLabels(document);
    updateChrome();
    for (const type of ['input','change']) {
      document.addEventListener(type, event => {
        if (event.target.closest?.('#app')) edited.add(event.target);
      }, true);
    }
    const observer = new MutationObserver(records => {
      let chromeChanged = false;
      for (const record of records) {
        if (record.target.parentElement?.closest('.studio-preferences')) continue;
        if (record.target.nodeType === Node.ELEMENT_NODE && record.target.closest('#nav, #saved, #title, #workspace-project, #quickAdd')) chromeChanged = true;
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) applyLabels(node);
        }
      }
      if (chromeChanged) updateChrome();
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
