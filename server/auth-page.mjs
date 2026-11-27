import { entranceMarkup, startEntrance } from './research-entrance.mjs';
import { fieldDiagram } from './auth-art.mjs';
import { authStyle } from './auth-style.mjs';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

const copy = {
  he: {
    skipFilm:'דילוג לכניסה', playFilm:'ניגון עם צליל', resumeFilm:'המשך ניגון', pauseFilm:'השהיה', muteFilm:'השתקה', unmuteFilm:'הפעלת צליל',
    title: 'כניסה למרחב המחקר', brand: 'מרחב המחקר', signIn: 'כניסה', signUp: 'יצירת חשבון',
    heading: 'כניסה למרחב', intro: 'התחברו עם כתובת הדוא״ל שאושרה למרחב המחקר שלכם.',
    email: 'כתובת דוא״ל', password: 'סיסמה', access: 'הגישה למחקרים זמינה לחשבונות שאושרו.',
    pending: 'ממתינים להרשאה', signedIn: 'התחברתם עם החשבון', pendingInfo: 'לחשבון הזה עדיין אין הרשאה למרחב. אפשר לצאת ולהתחבר עם החשבון שאושר.',
    logout: 'יציאה מהחשבון', confirmed: 'לאחר אימות כתובת הדוא״ל אפשר להתחבר כאן.',
    atlas: 'אטלס המחקר', atlasIntro: 'המחקרים, המקורות והניתוחים שלכם במקום אחד.',
    language: 'שפת הממשק', dark: 'מעבר למצב כהה', light: 'מעבר למצב בהיר',
    wait: 'רגע…', network: 'לא ניתן להשלים את הבקשה. בדקו את החיבור ונסו שוב.',
    welcomeMail: 'בדקו את הדוא״ל, אשרו את הכתובת ואז חזרו לכאן לכניסה.',
    credentials: 'הזינו כתובת דוא״ל תקינה וסיסמה באורך 8 תווים לפחות.',
    wrongLogin: 'הכניסה לא הצליחה. בדקו את הפרטים וודאו שאישרתם את כתובת הדוא״ל.',
    wrongSignup: 'לא ניתן ליצור חשבון כרגע. בדקו את הכתובת והסיסמה.',
    rate: 'בוצעו ניסיונות רבים. נסו שוב בעוד מספר דקות.',
    service: 'חיבור המרחב עדיין לא הוגדר.', origin: 'מקור הבקשה לא מורשה.', tooLarge: 'הבקשה גדולה מדי.',
    invalidEmail: 'הזינו כתובת דוא״ל תקינה.', invalidPassword: 'הזינו סיסמה באורך 8 תווים לפחות.',
    workspace: 'נמצאו כמה מרחבי מחקר. יש לבחור מרחב בהגדרות החיבור.',
    retry: 'הפעולה לא הושלמה. נסו שוב.'
  },
  en: {
    skipFilm:'Skip to sign in', playFilm:'Play with sound', resumeFilm:'Resume film', pauseFilm:'Pause', muteFilm:'Mute', unmuteFilm:'Turn sound on',
    title: 'Sign in to Research Workspace', brand: 'Research Workspace', signIn: 'Sign in', signUp: 'Create account',
    heading: 'Sign in', intro: 'Use the email address approved for your research workspace.',
    email: 'Email address', password: 'Password', access: 'Research is available to approved accounts.',
    pending: 'Access pending', signedIn: 'You are signed in as', pendingInfo: 'This account is waiting for workspace access. You can sign out and use an approved account.',
    logout: 'Sign out', confirmed: 'Once you have confirmed your email address, you can sign in here.',
    atlas: 'Research atlas', atlasIntro: 'Your studies, sources and analyses in one place.',
    language: 'Interface language', dark: 'Switch to dark theme', light: 'Switch to light theme',
    wait: 'One moment…', network: 'Could not reach the workspace. Check your connection and try again.',
    welcomeMail: 'Check your email, confirm your address, then return here to sign in.',
    credentials: 'Enter a valid email address and a password of at least 8 characters.',
    wrongLogin: 'Sign-in failed. Check your details and make sure you confirmed your email address.',
    wrongSignup: 'Could not create the account. Check the email address and password.',
    rate: 'Too many attempts. Please try again in a few minutes.',
    service: 'The workspace connection has not been configured yet.', origin: 'This request came from an unauthorized origin.', tooLarge: 'The request is too large.',
    invalidEmail: 'Enter a valid email address.', invalidPassword: 'Enter a password of at least 8 characters.',
    workspace: 'Several research workspaces are available. Select a workspace in the connection settings.',
    retry: 'The request could not be completed. Please try again.'
  },
  ar: {
    skipFilm:'تخطَّ إلى تسجيل الدخول', playFilm:'تشغيل مع الصوت', resumeFilm:'متابعة التشغيل', pauseFilm:'إيقاف مؤقت', muteFilm:'كتم الصوت', unmuteFilm:'تشغيل الصوت',
    title: 'تسجيل الدخول إلى مساحة البحث', brand: 'مساحة البحث', signIn: 'دخول', signUp: 'إنشاء حساب',
    heading: 'تسجيل الدخول', intro: 'سجّل الدخول باستخدام عنوان البريد الإلكتروني المعتمد لمساحة البحث.',
    email: 'البريد الإلكتروني', password: 'كلمة المرور', access: 'الأبحاث متاحة للحسابات المعتمدة.',
    pending: 'بانتظار الموافقة', signedIn: 'سجّلت الدخول بالحساب', pendingInfo: 'هذا الحساب بانتظار صلاحية الدخول إلى المساحة. يمكنك تسجيل الخروج واستخدام حساب معتمد.',
    logout: 'تسجيل الخروج', confirmed: 'يمكنك تسجيل الدخول هنا بعد تأكيد عنوان بريدك الإلكتروني.',
    atlas: 'أطلس الأبحاث', atlasIntro: 'دراساتك ومصادرك وتحليلاتك في مكان واحد.',
    language: 'لغة الواجهة', dark: 'التبديل إلى المظهر الداكن', light: 'التبديل إلى المظهر الفاتح',
    wait: 'لحظة من فضلك…', network: 'تعذّر الاتصال بمساحة البحث. تحقّق من اتصالك وحاول مجددًا.',
    welcomeMail: 'تحقّق من بريدك الإلكتروني وأكّد عنوانك، ثم عُد إلى هنا لتسجيل الدخول.',
    credentials: 'أدخل بريدًا إلكترونيًا صالحًا وكلمة مرور تتألف من 8 أحرف على الأقل.',
    wrongLogin: 'تعذّر تسجيل الدخول. تحقّق من بياناتك وتأكّد من تأكيد بريدك الإلكتروني.',
    wrongSignup: 'تعذّر إنشاء الحساب. تحقّق من البريد الإلكتروني وكلمة المرور.',
    rate: 'تجاوزت عدد المحاولات المسموح به. حاول مجددًا بعد بضع دقائق.',
    service: 'لم يُضبط اتصال مساحة البحث بعد.', origin: 'مصدر هذا الطلب غير مصرّح به.', tooLarge: 'حجم الطلب كبير جدًا.',
    invalidEmail: 'أدخل عنوان بريد إلكتروني صالحًا.', invalidPassword: 'أدخل كلمة مرور تتألف من 8 أحرف على الأقل.',
    workspace: 'توجد عدة مساحات بحث. اختر مساحة في إعدادات الاتصال.',
    retry: 'تعذّر إكمال الطلب. حاول مجددًا.'
  }
};

const apiMessages = {
  'בדקו את הדוא״ל, אשרו את הכתובת, ואז חזרו לכאן לכניסה.': 'welcomeMail',
  'יש להזין דוא״ל וסיסמה באורך 8 תווים לפחות': 'credentials',
  'בוצעו ניסיונות רבים. נסו שוב בעוד מספר דקות.': 'rate',
  'לא ניתן ליצור חשבון כרגע. בדקו את הכתובת והסיסמה.': 'wrongSignup',
  'הכניסה לא הצליחה. בדקו את הפרטים ואמתו את כתובת הדוא״ל.': 'wrongLogin',
  'חיבור המרחב עדיין לא הוגדר': 'service',
  'יש לבחור מרחב מחקר בהגדרות החיבור המקומי': 'workspace',
  'מקור בקשה לא מורשה': 'origin',
  'הבקשה גדולה מדי': 'tooLarge'
};

const mark = "<svg viewBox=\"0 0 40 40\" aria-hidden=\"true\" focusable=\"false\"><rect width=\"40\" height=\"40\" rx=\"13\" fill=\"#374963\"/><g transform=\"rotate(-28 20 20)\"><ellipse cx=\"20\" cy=\"20\" rx=\"16\" ry=\"8\" fill=\"none\" stroke=\"#aabfda\" stroke-width=\"1.4\"/><circle cx=\"20\" cy=\"20\" r=\"6.4\" fill=\"#f6b1ce\"/><path d=\"M4 20a16 8 0 0 0 32 0\" fill=\"none\" stroke=\"#e395af\" stroke-width=\"1.7\"/><circle cx=\"32.6\" cy=\"15.2\" r=\"2.1\" fill=\"#f5eff8\"/></g></svg>";
const globe = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>';
const themes = '<svg class="moon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M20.5 14.6a8.8 8.8 0 0 1-11-11 9 9 0 1 0 11 11Z"/></svg><svg class="sun" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19"/></svg>';

const initialize = `(() => {
  const root = document.documentElement;
  let language = 'he';
  let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  try {
    const savedLanguage = localStorage.getItem('merhav-language');
    const savedTheme = localStorage.getItem('merhav-theme');
    if (['he','ar','en'].includes(savedLanguage)) language = savedLanguage;
    if (['light','dark'].includes(savedTheme)) theme = savedTheme;
  } catch {}
  root.lang = language;
  root.dir = language === 'en' ? 'ltr' : 'rtl';
  root.dataset.theme = theme;
  if (location.hash) history.replaceState(null, '', location.pathname);
})();`;

function localized(key) {
  return '<span data-copy="' + key + '">' + escapeHtml(copy.he[key]) + '</span>';
}

export function authPage({pending = false, email = '', confirmed = false, entrance = true} = {}) {
  const showEntrance = entrance && !pending && !confirmed;
  const content = pending
    ? `<h1>${localized('pending')}</h1><p class="lead">${localized('signedIn')} <bdi class="account">${escapeHtml(email)}</bdi></p><p class="notice">${localized('pendingInfo')}</p><button class="action" id="logout" type="button">${localized('logout')}</button>`
    : `<h1>${localized('heading')}</h1><p class="lead">${localized('intro')}</p>
       ${confirmed ? '<p class="notice">' + localized('confirmed') + '</p>' : ''}
       <form id="login" method="post" action="/auth/login">
         <div class="fields"><label>${localized('email')}<input name="email" type="email" required autocomplete="username" placeholder="name@example.com"></label>
         <label>${localized('password')}<input name="password" type="password" required minlength="8" autocomplete="current-password"></label></div>
         <div class="actions"><button type="submit" class="action">${localized('signIn')}</button><button type="button" class="action secondary" id="signup">${localized('signUp')}</button></div>
       </form><p class="note">${localized('access')}</p>`;

  return `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${copy.he.title}</title>
<script>${initialize}
${showEntrance ? "document.documentElement.dataset.entrance='ready';" : ''}</script><style>${authStyle}</style></head>
<body>${showEntrance ? entranceMarkup(mark, localized) : ''}<div class="shell">
<header><div class="brand">${mark}${localized('brand')}</div><div class="preferences">
<label class="control">${globe}<select id="language" aria-label="${copy.he.language}"><option value="he" lang="he">עברית</option><option value="ar" lang="ar">العربية</option><option value="en" lang="en">English</option></select></label>
<button id="theme" class="control theme" type="button" aria-label="${copy.he.dark}" title="${copy.he.dark}">${themes}</button></div></header>
<main><div class="spread"><section class="paper"><div class="form-content">${content}<p id="message" role="status" aria-live="polite"></p></div></section>
<aside class="atlas">${fieldDiagram}<div class="atlas-caption"><h2>${localized('atlas')}</h2><p>${localized('atlasIntro')}</p></div></aside></div></main></div>
<script>
(() => {
  const dictionary = ${JSON.stringify(copy)};
  const responseKeys = ${JSON.stringify(apiMessages)};
  const root = document.documentElement;
  const languageSelect = document.querySelector('#language');
  const themeControl = document.querySelector('#theme');
  const message = document.querySelector('#message');
  const form = document.querySelector('#login');
  let messageKey = '';
  const translate = key => dictionary[root.lang][key];
  function remember(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }
  function refreshLabels() {
    document.title = translate('title');
    languageSelect.value = root.lang;
    languageSelect.setAttribute('aria-label', translate('language'));
    languageSelect.title = translate('language')+' · '+languageSelect.selectedOptions[0].text;
    const themeLabel = translate(root.dataset.theme === 'dark' ? 'light' : 'dark');
    themeControl.setAttribute('aria-label', themeLabel);
    themeControl.title = themeLabel;
    document.querySelectorAll('[data-copy]').forEach(node => {
      node.textContent = translate(node.dataset.copy);
    });
    message.textContent = messageKey ? translate(messageKey) : '';
  }
  languageSelect.addEventListener('change', () => {
    root.lang = languageSelect.value;
    root.dir = root.lang === 'en' ? 'ltr' : 'rtl';
    remember('merhav-language', root.lang);
    if (form) Array.from(form.querySelectorAll('input')).forEach(input => input.setCustomValidity(''));
    refreshLabels();
  });
  themeControl.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    remember('merhav-theme', root.dataset.theme);
    refreshLabels();
  });
  function setStatus(key, error = false) {
    messageKey = key;
    message.dataset.error = String(error);
    message.textContent = translate(key);
  }
  async function action(path, data) {
    const buttons = document.querySelectorAll('.action');
    buttons.forEach(button => { button.disabled = true; });
    setStatus('wait');
    try {
      const response = await fetch(path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {})
      });
      const out = await response.json();
      if (!response.ok) {
        setStatus(responseKeys[out.error] || 'retry', true);
      } else if (out.redirect) {
        location.assign(out.redirect);
      } else {
        setStatus(responseKeys[out.message] || 'retry');
      }
    } catch {
      setStatus('network', true);
    } finally {
      buttons.forEach(button => { button.disabled = false; });
    }
  }
  if (form) {
    for (const input of form.querySelectorAll('input')) {
      input.addEventListener('input', () => input.setCustomValidity(''));
      input.addEventListener('invalid', () => input.setCustomValidity(translate(input.type === 'email' ? 'invalidEmail' : 'invalidPassword')));
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      action('/auth/login', Object.fromEntries(new FormData(form)));
    });
    document.querySelector('#signup').addEventListener('click', () => {
      if (form.reportValidity()) action('/auth/signup', Object.fromEntries(new FormData(form)));
    });
  }
  document.querySelector('#logout')?.addEventListener('click', () => action('/auth/logout'));
  refreshLabels();
  ${showEntrance ? `(${startEntrance.toString()})();` : ''}
})();
</script></body></html>`;
}
