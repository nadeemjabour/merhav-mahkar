// The message and source selections belong to one conversation.
let chatSelectedAnswer = -1;
let chatReader = null;
let chatLoadVersion = 0;
let chatLoading = false;
let chatLoadFailed = false;
let chatVoiceOpen = false;
let chatLibraryExpanded = false;
let chatEvidenceExpanded = null;
const chatLibraryPreviewSize = 3;
const chatSmallScreen = window.matchMedia('(max-width:760px)');
chatSmallScreen.addEventListener('change', event => {
  chatEvidenceExpanded = !event.matches;
  const evidence = document.getElementById('chat-evidence');
  if (evidence) evidence.open = chatEvidenceExpanded;
});
const pendingChatSends = new Map();

Object.assign(window.MerhavMessages ||= {}, {
  'היקף השיחה': ['Chat scope', 'نطاق المحادثة'],
  'באיזה נושא נתחיל?': ['Where would you like to start?', 'بماذا تود أن تبدأ؟'],
  'אפשר לבחור שאלה או לכתוב שאלה משלך על המאמרים, המשימות והמקורות השמורים.': ['Choose a question or ask your own about your saved papers, tasks, and sources.', 'اختر سؤالًا أو اكتب سؤالك عن أوراقك ومهامك ومصادرك المحفوظة.'],
  'כתיבת שאלה על המחקר…': ['Ask about your research…', 'اكتب سؤالًا عن بحثك…'],
  'שליחה': ['Send', 'إرسال'],
  'הצגת כל המקורות': ['Show all sources', 'عرض جميع المصادر'],
  'הצגת פחות מקורות': ['Show fewer sources', 'عرض عدد أقل من المصادر'],
  'לא ניתן לטעון את השיחה.': ['The conversation could not be loaded.', 'تعذّر تحميل المحادثة.']
});

function currentChatStudy() {
  if (view === 'chat') return chatPaperId;
  return paperId || document.querySelector('#workspace-project select')?.value || '';
}

async function openResearchChat(pid = currentChatStudy()) {
  const version = ++chatLoadVersion;
  stopVoice();
  stopSpeech();
  voiceDraft = '';
  chatPaperId = pid;
  chatLibraryExpanded = false;
  chatEvidenceExpanded = null;
  chatReader = null;
  chatSelectedAnswer = -1;
  chatConversation = {messages:[]};
  chatLoading = true;
  chatLoadFailed = false;
  view = 'chat';
  paperId = '';
  render();
  history.replaceState(null, '', '#chat' + (pid ? '/' + encodeURIComponent(pid) : ''));
  try {
    if (pendingChatSends.has(pid)) await pendingChatSends.get(pid).catch(() => {});
    const conversation = await api('/api/chat?paperId=' + encodeURIComponent(pid));
    if (version !== chatLoadVersion || view !== 'chat') return;
    chatConversation = conversation;
  } catch (error) {
    if (version !== chatLoadVersion || view !== 'chat') return;
    chatLoadFailed = true;
    toast(error.message,true);
  } finally {
    if (version === chatLoadVersion && view === 'chat') {
      chatLoading = false;
      renderBody();
      scrollChat();
    }
  }
}

function chatSources() {
  if (!chatPaperId) return S.sources;
  const chapterIds = new Set(S.chapters.filter(c=>c.paperId===chatPaperId).map(c=>c.id));
  return S.sources.filter(s=>s.paperId===chatPaperId || s.paperIds?.includes(chatPaperId) || (s.chapterId && chapterIds.has(s.chapterId)));
}

function answerIndex() {
  if (chatSelectedAnswer >= 0) return chatSelectedAnswer;
  return chatConversation.messages.findLastIndex(message=>message.role === 'assistant');
}

function chatMessage(message, index) {
  const assistant = message.role === 'assistant';
  const count = message.links?.length || 0;
  return `<article class="conversation-message" data-speaker="${assistant?'assistant':'user'}">
    <div class="conversation-byline">${assistant ? `<span class="chat-speaker-icon">${workspaceIcon('chat')}</span>` : ''}${uiText(assistant?'סביבת המחקר':'השאלה שלך')}</div>
    <div class="conversation-text" dir="auto">${esc(message.text)}</div>
    ${assistant && count ? `<button type="button" class="answer-records" data-answer="${index}"
      aria-controls="chat-evidence-body" aria-pressed="${index===answerIndex()}" onclick="inspectChatAnswer(this)">
      ${workspaceIcon('sources')} ${uiText('הפניות לתשובה')} · ${count}</button>` : ''}
  </article>`;
}

function chatSourceRow(kind,id,title,credit,action) {
  return `<button type="button" class="chat-record" data-id="${esc(id)}" onclick="${action}">
    <span class="record-glyph">${workspaceIcon(({source:'sources',paper:'papers',file:'files',chapter:'writing',task:'tasks'})[kind]||'sources')}</span>
    <span class="chat-record-copy"><b dir="auto">${esc(title)}</b>${credit?`<small dir="auto">${esc(credit)}</small>`:''}</span>
    <i class="chat-forward" aria-hidden="true"></i></button>`;
}

const chatKinds = {paper:'מחקר', chapter:'פרק', task:'משימה', file:'קובץ', source:'מקור'};
function chatRecord(link) {
  if (link.kind==='source') return sourceById(link.id);
  const list = {paper:S.papers,task:S.tasks,chapter:S.chapters,file:S.files}[link.kind];
  return list?.find(item=>item.id===(link.kind==='paper'?link.paperId:link.id) && !item.sensitive);
}

function chatEvidenceBody() {
  if (chatReader) {
    const item = chatRecord(chatReader);
    if (item) {
      let preview;
      if (chatReader.kind==='source') preview = sourceDetail(item);
      else {
        const text = {paper:item.topic,chapter:item.content,task:item.description||item.notes,file:item.category}[chatReader.kind];
        preview = `<h3 dir="auto">${esc(item.title||item.name)}</h3>
          ${item.status?`<p>${esc(uiText(item.status))}</p>`:''}
          ${text?`<div class="conversation-text" dir="auto">${esc(text)}</div>`:''}
          <button type="button" onclick="openChatSource(chatReader)">${uiText('פתיחת הרשומה')}</button>`;
      }
      return `<button type="button" class="chat-reader-back" onclick="closeChatReader()">${uiText('חזרה למקורות')}</button>${preview}`;
    }
  }
  const index = answerIndex();
  const links = chatConversation.messages[index]?.links || [];
  const sources = chatSources();
  const visibleSources = chatLibraryExpanded ? sources : sources.slice(0, chatLibraryPreviewSize);
  return `<section class="chat-evidence-block"><h3>${uiText('הפניות לתשובה')} <span>${links.length}</span></h3>
    ${index>0 && chatConversation.messages[index-1]?.role==='user' ? `<p class="chat-evidence-question" dir="auto">${esc(chatConversation.messages[index-1].text)}</p>` : ''}
    ${links.length ? links.map((link,i)=>chatRecord(link)
      ? chatSourceRow(link.kind,i,link.label,uiText(chatKinds[link.kind]),'readChatReference(this)')
      : `<p class="chat-unavailable">${esc(link.label)} · ${uiText('הרשומה אינה זמינה')}</p>`).join('')
      : `<p>${uiText(index<0?'ההפניות יופיעו כאן אחרי תשובה שמקשרת לרשומות.':'לתשובה זו אין הפניות שמורות.')}</p>`}</section>
    <section class="chat-evidence-block chat-library-block"><h3>${uiText('ספריית המקורות')} <span>${sources.length}</span></h3>
      <div id="chat-library-list">${visibleSources.map(s=>chatSourceRow('source',s.id,s.title||s.bibliography||uiText('מקור ללא כותרת'),sourceCredit(s),'readChatLibraryItem(this)')).join('')||
        `<p>${uiText('טרם שויכו מקורות.')}</p>`}</div>
      ${sources.length > chatLibraryPreviewSize ? `<button class="chat-library-more" type="button" aria-controls="chat-library-list" aria-expanded="${chatLibraryExpanded}" onclick="toggleChatLibrary()">${uiText(chatLibraryExpanded?'הצגת פחות מקורות':'הצגת כל המקורות')}<i class="chat-caret" aria-hidden="true"></i></button>` : ''}</section>`;
}

function toggleChatLibrary() {
  chatLibraryExpanded = !chatLibraryExpanded;
  refreshChatEvidence(false);
  document.querySelector('.chat-library-more')?.focus();
}

function inspectChatAnswer(button) {
  chatSelectedAnswer = Number(button.dataset.answer);
  chatReader = null;
  document.querySelectorAll('.answer-records').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const rail = document.querySelector('#chat-evidence');
  chatEvidenceExpanded = true;
  rail.open = true;
  refreshChatEvidence();
}

let chatReaderTrigger = '';
function refreshChatEvidence(focus = true) {
  const body = document.getElementById('chat-evidence-body');
  body.innerHTML = chatEvidenceBody();
  body.scrollTop = 0;
  if (focus) body.focus();
}
function readChatReference(button) {
  chatReaderTrigger = 'reference';
  chatReader = chatConversation.messages[answerIndex()].links[Number(button.dataset.id)];
  refreshChatEvidence();
}
function readChatLibraryItem(button) {
  chatReaderTrigger = 'library';
  chatReader = {kind:'source',id:button.dataset.id};
  refreshChatEvidence();
}
function closeChatReader() {
  const selected = chatReader;
  const fromLibrary = chatReaderTrigger === 'library';
  chatReader = null;
  refreshChatEvidence(false);
  const rows = document.querySelectorAll('.chat-evidence-block:'+(fromLibrary?'last':'first')+'-child .chat-record');
  const key = fromLibrary ? selected.id : String(chatConversation.messages[answerIndex()].links.indexOf(selected));
  Array.from(rows).find(b=>b.dataset.id===String(key))?.focus();
}

function chatWelcome() {
  const suggestions = [
    ['analyses', 'מה תמונת המצב הכללית?'],
    ['tasks', 'מה כדאי לקדם עכשיו?'],
    ['sources', 'אילו מקורות יש?']
  ];
  return `<div class="conversation-welcome">
    <div class="chat-intro"><div class="chat-intro-copy">
      <h2>${uiText('באיזה נושא נתחיל?')}</h2>
      <p>${uiText('אפשר לבחור שאלה או לכתוב שאלה משלך על המאמרים, המשימות והמקורות השמורים.')}</p>
    </div><div class="chat-illustration" aria-hidden="true">
      <i class="chat-orbit"></i><i class="chat-sheet chat-sheet-back"></i><i class="chat-sheet chat-sheet-front"><b></b></i><i class="chat-bubble"><b></b></i>
    </div></div>
    <div class="conversation-prompts">${suggestions.map(([icon,key])=>{
      const question = uiText(key);
      return `<button type="button" data-question="${esc(question)}" onclick="askResearchShortcut(this.dataset.question)">
        <span class="chat-prompt-icon">${workspaceIcon(icon)}</span><span>${esc(question)}</span><i class="chat-forward" aria-hidden="true"></i></button>`;
    }).join('')}</div></div>`;
}

function chatPaperLabel(paper) {
  return paper ? [paper.code,paper.title].filter(Boolean).join(' · ') : uiText('כל המאמרים');
}

function researchChat() {
  const selectedPaper = chatPaperLabel(S.papers.find(paper=>paper.id===chatPaperId));
  const pending = pendingChatSends.has(chatPaperId);
  const disabled = chatLoading || chatLoadFailed || pending;
  const messages = chatConversation.messages;
  const evidenceOpen = chatEvidenceExpanded ?? !chatSmallScreen.matches;
  let log;
  if (chatLoading) log = `<p class="chat-status">${uiText('טעינת השיחה…')}</p>`;
  else if (chatLoadFailed) log = `<div class="chat-status"><p>${uiText('לא ניתן לטעון את השיחה.')}</p>
    <button type="button" onclick="openResearchChat(chatPaperId)">${uiText('טעינה מחדש')}</button></div>`;
  else log = messages.length ? messages.map(chatMessage).join('') : chatWelcome();
  return `<div class="conversation-workspace">
    <header class="conversation-study">
      <label for="chat-study"><span class="chat-context-icon">${workspaceIcon('papers')}</span>${uiText('היקף השיחה')}</label>
      <div class="chat-paper-picker">
        <span class="chat-paper-caption" aria-hidden="true"><bdi>${esc(selectedPaper)}</bdi><i class="chat-caret"></i></span>
        <select id="chat-study" title="${esc(selectedPaper)}" onchange="openResearchChat(this.value)">
          <option value="">${uiText('כל המאמרים')}</option>
          ${S.papers.map(p=>`<option value="${esc(p.id)}" ${p.id===chatPaperId?'selected':''}>${esc(chatPaperLabel(p))}</option>`).join('')}
        </select>
      </div></header>
    <div class="conversation-columns">
      <section class="conversation-main" aria-label="${uiText('שיחה על המחקרים')}">
        <div class="conversation-log ${messages.length ? 'has-messages' : ''}" id="research-messages" role="log" aria-label="${uiText('שיחה על המחקרים')}" aria-live="polite">${log}</div>
        <form id="research-chat-form" onsubmit="sendResearchQuestion(event)">
          <label for="research-question">${uiText('שאלה על המחקרים')}</label>
          <div class="chat-input-row">
            <textarea id="research-question" dir="auto" required maxlength="2000" rows="2" oninput="voiceDraft=this.value"
              onkeydown="if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)&&!event.isComposing){event.preventDefault();this.form.requestSubmit()}"
              placeholder="${esc(uiText('כתיבת שאלה על המחקר…'))}" ${disabled?'disabled':''}>${esc(voiceDraft)}</textarea>
            <button class="primary chat-send" type="submit" ${disabled?'disabled':''}>${uiText(pending?'מכין תשובה…':'שליחה')}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" width="17" height="17" aria-hidden="true"><path d="m3 9 13-5-5 13-2.3-5.7L3 9Zm5.7 2.3L16 4"/></svg></button>
          </div>
        </form>
        <details class="chat-voice" ${chatVoiceOpen?'open':''} ontoggle="chatVoiceOpen=this.open"><summary>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" width="17" height="17" aria-hidden="true"><rect x="7.5" y="2" width="5" height="10" rx="2.5"/><path d="M5 9a5 5 0 0 0 10 0m-5 5v3m-3 0h6"/></svg>
          ${uiText('אפשרויות קול')}<i class="chat-caret" aria-hidden="true"></i></summary>${voiceControls()}</details>
      </section>
      <details id="chat-evidence" class="chat-evidence" ${evidenceOpen?'open':''} ontoggle="if(this.isConnected)chatEvidenceExpanded=this.open">
        <summary><span class="chat-evidence-icon">${workspaceIcon('sources')}</span>${uiText('מקורות והפניות')}<i class="chat-caret" aria-hidden="true"></i></summary>
        <div id="chat-evidence-body" tabindex="-1">${chatEvidenceBody()}</div>
      </details>
    </div></div>`;
}

async function sendResearchQuestion(event) {
  event.preventDefault();
  const pid = chatPaperId, version = chatLoadVersion;
  const input = document.getElementById('research-question');
  const question = input.value.trim();
  if (!question || chatLoading || chatLoadFailed || pendingChatSends.has(pid)) return;
  captureVoiceDraft();
  stopVoice(false);
  input.disabled = true;
  const submit = event.target.querySelector('[type=submit]');
  submit.disabled = true;
  submit.textContent = uiText('מכין תשובה…');
  const pending = api('/api/chat',{paperId:pid,question,language:document.documentElement.lang});
  pendingChatSends.set(pid,pending);
  try {
    const conversation = await pending;
    if (view!=='chat' || version!==chatLoadVersion) return;
    chatConversation = conversation;
    chatSelectedAnswer = -1;
    chatReader = null;
    voiceDraft = '';
    if (voiceMode==='conversation') speakLastAnswer();
  } catch (error) {
    if (view==='chat' && version===chatLoadVersion) toast(error.message,true);
  } finally {
    pendingChatSends.delete(pid);
    if (view==='chat' && version===chatLoadVersion) {
      renderBody();
      scrollChat();
      document.getElementById('research-question')?.focus({preventScroll:true});
    }
  }
}
