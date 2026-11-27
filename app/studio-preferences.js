/* Shared preference keys also apply to the sign-in page on this origin. */
(() => {
  'use strict';

  const languageKey = 'merhav-language';
  const themeKey = 'merhav-theme';
  const names = { he: 'עברית', ar: 'العربية', en: 'English' };
  const chrome = {
    'הוספה מהירה': ['Quick add', 'إضافة سريعة'],
    'מצב שמירה': ['Save status', 'حالة الحفظ'],
    'החשבון שלי': ['My account', 'حسابي'],
    'יציאה': ['Sign out', 'تسجيل الخروج'],
    'היציאה לא הושלמה. נסו שוב.': ['Sign-out could not be completed. Try again.', 'تعذّر تسجيل الخروج. حاول مجددًا.'],
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
    'המחקר הפעיל': ['Active project', 'البحث النشط'],
    'מחקר פעיל': ['Active research', 'البحث النشط'],
    'שולחן המחקר': ['Research desk', 'مكتب البحث'],
    'מחקרים': ['Research', 'الأبحاث'],
    'כל המחקרים': ['All research', 'جميع الأبحاث'],
    'חזרה למחקר הפעיל': ['Back to active research', 'العودة إلى البحث النشط'],
    'חיפוש במחקרים': ['Search research', 'البحث في الأبحاث'],
    'כתיבה': ['Writing', 'الكتابة'],
    'משימות וקבצים': ['Tasks and files', 'المهام والملفات'],
    'אזורי שולחן המחקר': ['Research desk sections', 'أقسام مكتب البحث'],
    'המחקר הראשון מתחיל כאן': ['Your first research project starts here', 'يبدأ بحثك الأول هنا'],
    'הוסיפו מחקר כדי להתחיל לעקוב אחר ההתקדמות והמשימות.': ['Add a research project to start tracking progress and tasks.', 'أضف بحثًا لبدء متابعة التقدم والمهام.']
  };
  const sectionNames = {
    dashboard: 'שולחן המחקר', papers: 'המחקרים שלי', tasks: 'משימות', gantt: 'גאנט מחקרים',
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
    setToolbarAction(find('#quickAdd'),'plus',t('הוספה מהירה'));
    setToolbarAction(find('#statistics-top-assistant'),'assistant',t('פתיחת עוזר בבחירת שיטה'));
    setToolbarAction(find('#instrument-add-tool'),'instrument',t('＋ כלי מחקר חדש'));
    const statusToggle=find('.studio-save summary');
    const statusText=t('מצב שמירה')+' · '+(saved?.textContent || '');
    setAttr(statusToggle,'aria-label',statusText);
    setAttr(statusToggle,'title',statusText);
    setAttr(find('.studio-account summary'),'title',t('החשבון שלי'));
    refreshControls();
  }

  const symbols = {
    plus: '<path d="M12 4v16M4 12h16"/>',
    minus: '<path d="M4 12h16"/>',
    type: '<path d="M2 19 7.5 5 13 19M4.2 13.5h6.6M14 19l4-9 4 9m-6.4-3.5h4.8"/>',
    saved: '<path d="M3 3h14l4 4v14H3zM7 3v6h10V3m-9 12 2.5 2.5L16 12"/>',
    assistant: '<path d="m4 20 10-10 3 3L7 23zM15 3l.8 2.2L18 6l-2.2.8L15 9l-.8-2.2L12 6l2.2-.8zM20 7l.7 1.6L22 9l-1.3.5L20 11l-.6-1.5L18 9l1.4-.4z"/>',
    instrument: '<path d="M9 3h6m-5 0v7l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3M8 15h8"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c4 4.5 4 13.5 0 18-4-4.5-4-13.5 0-18Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
    moon: '<path d="M20.7 14A8.8 8.8 0 0 1 10 3.3 9 9 0 1 0 20.7 14Z"/>'
  };
  const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + symbols[name] + '</svg>';
  let controls;
  const typeKey = 'merhav-reading-size';
  const typeSteps = [80,90,100,115,130,150,175,200];
  function applyType(size, persist = false) {
    const level = typeSteps.includes(Number(size)) ? Number(size) : 100;
    page.style.fontSize = level + '%';
    page.style.setProperty('--reading-ratio',String(level/100));
    page.toggleAttribute('data-large-type',level >= 150);
    const group = document.querySelector('.studio-type');
    if (group) {
      setAttr(group,'aria-label',t('גודל טקסט'));
      const levelLabel = t('גודל טקסט')+' · '+level+'%';
      const toggle = group.parentElement.querySelector('summary');
      setAttr(toggle,'aria-label',levelLabel);
      setAttr(toggle,'title',levelLabel);
      setText(group.querySelector('output'),level+'%');
      for(const button of group.querySelectorAll('button')){
        const delta = Number(button.dataset.step);
        button.disabled = !typeSteps[typeSteps.indexOf(level)+delta];
        const label = t(delta < 0 ? 'הקטנת טקסט' : 'הגדלת טקסט');
        setAttr(button,'aria-label',label);
        setAttr(button,'title',label);
      }
    }
    if (persist) write(typeKey,String(level));
    return level;
  }
  let typeLevel = applyType(read(typeKey));

function mountTypeControl(host) {
  const details = document.createElement('details');
  details.className='studio-widget studio-font';
  details.setAttribute('name','workspace-utilities');
  details.innerHTML='<summary class="studio-icon">'+icon('type')+'</summary><div class="studio-type" role="group"><button type="button" data-step="-1">'+icon('minus')+'</button><output aria-live="polite"></output><button type="button" data-step="1">'+icon('plus')+'</button></div>';
  details.addEventListener('click',event=>{
    const button = event.target.closest('[data-step]');
    if (button) typeLevel=applyType(typeSteps[typeSteps.indexOf(typeLevel)+Number(button.dataset.step)],true);
  });
  host.prepend(details);
  applyType(typeLevel);
}

function setToolbarAction(button, symbol, label) {
  if (!button) return;
  setAttr(button,'aria-label',label);
  setAttr(button,'title',label);
  if (button.dataset.toolbarIcon !== symbol) {
    button.dataset.toolbarIcon=symbol;
    button.classList.add('studio-icon');
    button.innerHTML=icon(symbol);
  }
}

function mountStatus(host) {
  const status=host.querySelector('#saved');
  if (!status) return;
  const details=document.createElement('details');
  details.className='studio-widget studio-save';
  details.setAttribute('name','workspace-utilities');
  details.innerHTML='<summary class="studio-icon">'+icon('saved')+'</summary>';
  status.before(details);
  details.append(status);
  status.setAttribute('role','status');
}

function closeToolbarWidgets(host) {
  document.addEventListener('click',event=>{
    for(const item of host.querySelectorAll('details[open]')) {
      if(!item.contains(event.target)) item.open=false;
    }
  });
  host.addEventListener('keydown',event=>{
    if(event.key!=='Escape') return;
    const item=event.target.closest('details[open]');
    if(item) {
      item.open=false;
      item.querySelector('summary').focus();
      event.preventDefault();
    }
  });
}

  function createControls() {
    const host = document.querySelector('.workspace-header-actions');
    if (!host) return;
    controls = document.createElement('div');
    controls.className = 'studio-preferences';
    controls.setAttribute('role','group');
    const label = document.createElement('label');
    label.className = 'studio-language studio-icon';
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
    button.className = 'studio-icon';
    button.addEventListener('click', () => setTheme(page.dataset.theme === 'dark' ? 'light' : 'dark'));
    controls.append(label, button);
    host.prepend(controls);
    mountTypeControl(host);
    mountStatus(host);
    const account=host.querySelector('.studio-account');
    if(account) { account.setAttribute('name','workspace-utilities'); account.querySelector('summary').classList.add('studio-icon'); }
    closeToolbarWidgets(host);
    refreshControls();
  }
  function refreshControls() {
    if (!controls) return;
    applyType(typeLevel);
    setAttr(controls,'aria-label',t('מראה ושפה'));
    const select = controls.querySelector('select');
    select.value = language;
    const languageLabel=t('שפת הממשק')+' · '+names[language];
    setAttr(select,'aria-label',t('שפת הממשק'));
    setAttr(select,'title',languageLabel);
    setAttr(select.parentElement,'title',languageLabel);
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
    if (event.key === typeKey || event.key === null) typeLevel=applyType(read(typeKey));
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
        if (record.target.parentElement?.closest('.studio-preferences, .studio-font')) continue;
        if ([...record.addedNodes].some(node => ['statistics-top-assistant','instrument-add-tool'].includes(node.id))) chromeChanged = true;
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
