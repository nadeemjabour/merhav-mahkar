// Reply templates are selected before record data is interpolated. A stored title,
// excerpt, filename or note is always inserted verbatim, even if it matches UI copy.
const messages = {
  allPapers: ['כל המאמרים', 'All papers', 'جميع المقالات'],
  unset: ['לא הוזן', 'Not entered', 'لم يُسجّل'],
  notDefined: ['טרם הוגדר', 'Not yet defined', 'لم يُحدّد بعد'],
  none: ['אין', 'None', 'لا يوجد'],
  header: ['תמונת מצב מתוך הנתונים השמורים: {title}', 'From the saved research records: {title}', 'من سجلات البحث المحفوظة: {title}'],
  stage: ['שלב: {stage}; מצב עבודה: {work}', 'Stage: {stage}. Work status: {work}', 'المرحلة: {stage}. حالة العمل: {work}'],
  progress: ['מעקב ביצוע: {done} מתוך {total} משימות ופרקים הושלמו{percent}', 'Tasks and chapters completed: {done} of {total}{percent}', 'المهام والفصول المكتملة: {done} من أصل {total}{percent}'],
  openTasks: ['משימות פתוחות: {count}; באיחור: {late}', 'Open tasks: {count}. Overdue: {late}', 'المهام المفتوحة: {count}. المتأخرة: {late}'],
  targetDate: ['מועד יעד: {date}', 'Target date: {date}', 'الموعد المستهدف: {date}'],
  nextStep: ['הצעד הבא: {step}', 'Next step: {step}', 'الخطوة التالية: {step}'],
  progressNote: ['ההתקדמות היא חישוב של המשימות והפרקים שסומנו כהושלמו; היא אינה הערכה מדעית של מוכנות המאמר.', 'Progress counts tasks and chapters marked complete. It does not assess the scientific readiness of a paper.', 'يُحسب التقدم من المهام والفصول التي وُسمت بأنها مكتملة. ولا يمثّل تقييمًا للجاهزية العلمية للمقال.'],
  lateTasks: ['משימות באיחור:', 'Overdue tasks:', 'المهام المتأخرة:'],
  priorityTasks: ['משימות פתוחות בעדיפות גבוהה או דחופה:', 'High-priority or urgent open tasks:', 'المهام المفتوحة ذات الأولوية العالية أو العاجلة:'],
  nextTasks: ['המשימות הפתוחות והצעדים הבאים:', 'Open tasks and next steps:', 'المهام المفتوحة والخطوات التالية:'],
  task: ['• {title} | {code} | יעד: {date} | {status}', '• {title} | {code} | Due: {date} | {status}', '• {title} | {code} | الموعد: {date} | {status}'],
  noTasks: ['לא נמצאו משימות המתאימות לבקשה.', 'No tasks match this request.', 'لا توجد مهام تطابق هذا الطلب.'],
  taskLimit: ['מוצגות 12 מתוך {count} משימות.', 'Showing 12 of {count} tasks.', 'يُعرض 12 من أصل {count} من المهام.'],
  missing: ['מידע חסר שתועד במחקר: {detail}', 'Information recorded as missing: {detail}', 'المعلومات المسجّلة ضمن نواقص البحث: {detail}'],
  emptyChapters: ['פרקים ללא תוכן שמור, גם לאחר בדיקת תתי־הפרקים: {titles}', 'Chapters with no saved content in the chapter or its subsections: {titles}', 'الفصول التي لا تحتوي على محتوى محفوظ فيها أو في أقسامها الفرعية: {titles}'],
  requiredFile: ['• קובץ נדרש: {title} — {reason}', '• Required file: {title} — {reason}', '• ملف مطلوب: {title} — {reason}'],
  noReason: ['צורך לא הוזן', 'No reason recorded', 'لم يُسجّل سبب الطلب'],
  dates: ['מועדים שנשמרו במערכת:', 'Saved deadlines:', 'المواعيد النهائية المسجّلة:'],
  noDates: ['לא הוזנו מועדי יעד מתאימים.', 'No matching deadlines have been recorded.', 'لم تُسجّل مواعيد نهائية مطابقة.'],
  files: ['נמצאו {count} קבצים וגרסאות זמינים ברשומות שנבחרו.', 'Files and versions available in the selected records: {count}.', 'عدد الملفات والإصدارات المتاحة في السجلات المحدّدة: {count}.'],
  unclassified: ['לא סווג', 'Unclassified', 'غير مصنّف'],
  privateFiles: ['חומרי ראיונות פנימיים אינם מפורטים בשיחה הכללית; ניתן לגשת אליהם מתוך קבצי המאמר.', 'Internal interview materials are kept out of general chat. You can access them through the paper’s files.', 'مواد المقابلات الداخلية مستثناة من المحادثة العامة. يمكن الوصول إليها من ملفات المقال.'],
  fileNote: ['זמינות הקבצים היא במחשב שבו האפליקציה פועלת. תוכן הקבצים עצמם לא נותח בשיחה.', 'File availability depends on the workspace storage. This conversation has not analysed the contents of the files.', 'يعتمد توفر الملفات على مساحة تخزين بيئة العمل. لم يُحلّل محتوى الملفات في هذه المحادثة.'],
  sources: ['תועדו {count} רשומות מקורות.', 'Source records: {count}.', 'عدد سجلات المراجع: {count}.'],
  untitledSource: ['מקור ללא כותרת', 'Untitled source', 'مرجع بلا عنوان'],
  verification: ['• {title} — אימות: {status}', '• {title} — Verification: {status}', '• {title} — حالة التحقّق: {status}'],
  notVerified: ['לא אומת', 'Unverified', 'غير موثّق'],
  noSources: ['אין ברשומות שנבחרו מקורות ביבליוגרפיים שהוזנו. לא הושלמו פרטים ממקור חיצוני.', 'The selected records contain no bibliographic sources. No details were added from external sources.', 'لا توجد مراجع ببليوغرافية في السجلات المحدّدة. لم تُضف تفاصيل من مصادر خارجية.'],
  excerpts: ['קטעים שנמצאו בתוכן הפרקים השמור, ללא ניתוח או אימות מדעי:', 'Excerpts from the saved chapter text, without scientific analysis or verification:', 'مقتطفات من نصوص الفصول المحفوظة، دون تحليل أو تحقّق علمي:'],
  quote: ['״{text}״', '“{text}”', '«{text}»'],
  openChapter: ['פתיחת {title}', 'Open {title}', 'فتح {title}'],
  noExcerpt: ['לא מצאתי תשובה בתוכן הפרקים השמור. אפשר לשאול על מצב המאמר, משימות, מידע חסר, קבצים או מועדי יעד.', 'I found no answer in the saved chapter text. You can ask about the paper’s status, tasks, missing information, files or deadlines.', 'لم أجد إجابة في نصوص الفصول المحفوظة. يمكنك السؤال عن حالة المقال أو مهامه أو المعلومات الناقصة أو الملفات أو المواعيد النهائية.'],
  help: ['אפשר לשאול על תמונת המצב, מה לקדם, משימות באיחור, מידע חסר ומועדים. לשאלה על תוכן מאמר מסוים, בחרו מאמר למעלה או ציינו את הקוד שלו, למשל מאמר05.', 'You can ask about overall progress, next steps, overdue tasks, missing information or deadlines. To ask about a paper’s content, select the paper above or include its code, for example article05.', 'يمكنك السؤال عن التقدّم العام أو الخطوات التالية أو المهام المتأخرة أو المعلومات الناقصة أو المواعيد النهائية. للسؤال عن محتوى مقال معيّن، حدّد المقال أعلاه أو اذكر رمزه مثل مقال05.']
};

// These groups mirror the workspace select fields. Imported custom values pass through.
const choices = {
  stage: {
    'רעיון': ['Idea','فكرة'], 'תכנון': ['Planning','التخطيط'], 'איסוף נתונים': ['Data collection','جمع البيانات'],
    'ניתוח': ['Analysis','التحليل'], 'כתיבה': ['Writing','الكتابة'], 'בבדיקת שותפים': ['Under collaborator review','قيد مراجعة الشركاء'],
    'הוגש': ['Submitted','تم التقديم'], 'בתיקונים': ['In revision','قيد التعديل'], 'התקבל': ['Accepted','مقبول'], 'פורסם': ['Published','منشور']
  },
  work: {
    'טרם התחיל': ['Not started','لم يبدأ'], 'נדרשת עבודה משמעותית': ['Substantial work needed','يتطلب عملًا إضافيًا كبيرًا'],
    'דרוש עדכון או תיקון': ['Update or revision needed','يتطلب تحديثًا أو تعديلًا'], 'הושלם': ['Completed','مكتمل']
  },
  task: {
    'לביצוע': ['To do','للتنفيذ'], 'בעבודה': ['In progress','قيد التنفيذ'],
    'ממתין לשותף': ['Awaiting collaborator','بانتظار الشريك'], 'הושלם': ['Completed','مكتمل']
  },
  category: {
    'טיוטות ופרקים': ['Drafts and chapters','المسودات والفصول'], 'מקורות': ['Sources','المصادر'],
    'כלי מחקר': ['Research instruments','أدوات البحث'], 'נתונים וניתוח': ['Data and analysis','البيانات والتحليل'], 'הגשות': ['Submissions','طلبات النشر']
  },
  verification: {
    'טרם אומת': ['Not yet verified','لم يُتحقَّق منه بعد'], 'אימות חלקי': ['Partially verified','تم التحقق جزئيًا'], 'מאומת': ['Verified','تم التحقق']
  }
};

function replyLanguage(language) {
  const code = typeof language === 'string' ? language.toLowerCase().split('-')[0] : 'he';
  const index = code === 'en' ? 1 : code === 'ar' ? 2 : 0;
  const formatter = new Intl.DateTimeFormat(['he-IL','en','ar'][index], {timeZone:'Asia/Jerusalem'});
  function say(key, values = {}) {
    return messages[key][index].replace(/\{(\w+)\}/g, (_, name) => values[name]);
  }
  function choice(group, value, empty = 'unset') {
    if (!value) return say(empty);
    if (index && Object.hasOwn(choices[group], value)) return choices[group][value][index-1];
    return value;
  }
  function date(value) {
    const when = value && new Date(value);
    return when && Number.isFinite(when.getTime()) ? formatter.format(when) : say('unset');
  }
  return {say, choice, date};
}

module.exports = {replyLanguage};
