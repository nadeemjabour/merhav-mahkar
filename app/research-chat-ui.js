// The message and source selections belong to one conversation.
let chatSelectedAnswer = -1;
let chatReader = null;
let chatLoadVersion = 0;
let chatLoading = false;
let chatLoadFailed = false;
let chatVoiceOpen = false;
const pendingChatSends = new Map();

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
    <div class="conversation-byline">${uiText(assistant?'סביבת המחקר':'השאלה שלך')}</div>
    <div class="conversation-text" dir="auto">${esc(message.text)}</div>
    ${assistant && count ? `<button type="button" class="answer-records" data-answer="${index}"
      aria-controls="chat-evidence-body" aria-pressed="${index===answerIndex()}" onclick="inspectChatAnswer(this)">
      ${workspaceIcon('sources')} ${uiText('הפניות לתשובה')} · ${count}</button>` : ''}
  </article>`;
}

function chatSourceRow(kind,id,title,credit,action) {
  return `<button type="button" class="chat-record" data-id="${esc(id)}" onclick="${action}">
    <span class="record-glyph">${workspaceIcon(({source:'sources',paper:'papers',file:'files',chapter:'writing',task:'tasks'})[kind]||'sources')}</span>
    <span><b dir="auto">${esc(title)}</b>${credit?`<small dir="auto">${esc(credit)}</small>`:''}</span></button>`;
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
  return `<section class="chat-evidence-block"><h3>${uiText('הפניות לתשובה')} <span>${links.length}</span></h3>
    ${index>0 && chatConversation.messages[index-1]?.role==='user' ? `<p class="chat-evidence-question" dir="auto">${esc(chatConversation.messages[index-1].text)}</p>` : ''}
    ${links.length ? links.map((link,i)=>chatRecord(link)
      ? chatSourceRow(link.kind,i,link.label,uiText(chatKinds[link.kind]),'readChatReference(this)')
      : `<p class="chat-unavailable">${esc(link.label)} · ${uiText('הרשומה אינה זמינה')}</p>`).join('')
      : `<p>${uiText(index<0?'ההפניות יופיעו כאן אחרי תשובה שמקשרת לרשומות.':'לתשובה זו אין הפניות שמורות.')}</p>`}</section>
    <section class="chat-evidence-block"><h3>${uiText('ספריית המקורות')} <span>${sources.length}</span></h3>
      ${sources.map(s=>chatSourceRow('source',s.id,s.title||s.bibliography||uiText('מקור ללא כותרת'),sourceCredit(s),'readChatLibraryItem(this)')).join('')||
        `<p>${uiText('טרם שויכו מקורות.')}</p>`}</section>`;
}

function inspectChatAnswer(button) {
  chatSelectedAnswer = Number(button.dataset.answer);
  chatReader = null;
  document.querySelectorAll('.answer-records').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const rail = document.querySelector('#chat-evidence');
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

function researchChat() {
  const study = S.papers.find(p=>p.id===chatPaperId);
  const disabled = chatLoading || chatLoadFailed || pendingChatSends.has(chatPaperId);
  const suggestions = ['מה תמונת המצב הכללית?','מה כדאי לקדם עכשיו?','אילו מקורות יש?'];
  return `<div class="conversation-workspace"><header class="conversation-study"><div>
    <span>${workspaceIcon('papers')} ${uiText('המחקר הפעיל')}${study?.code?' · '+esc(study.code):''}</span>
    <h2 dir="auto">${esc(study?.title || uiText('כל המאמרים'))}</h2>
    </div><label>${uiText('מאמר לשיחה')}<select onchange="openResearchChat(this.value)">
      <option value="">${uiText('כל המאמרים')}</option>
      ${S.papers.map(p=>`<option value="${esc(p.id)}" ${p.id===chatPaperId?'selected':''}>${esc(p.title)}</option>`).join('')}
    </select></label></header>
    <div class="conversation-columns"><section class="conversation-main" aria-label="${uiText('שיחה על המחקרים')}">
      <div class="conversation-log" id="research-messages" role="log" aria-label="${uiText('שיחה על המחקרים')}" aria-live="polite">
      ${chatLoading?`<p>${uiText('טעינת השיחה…')}</p>`:chatLoadFailed?`<button type="button" onclick="openResearchChat(chatPaperId)">${uiText('טעינה מחדש')}</button>`:
        chatConversation.messages.length ? chatConversation.messages.map(chatMessage).join('') :
        `<div class="conversation-welcome">${workspaceIcon('chat')}<h3>${uiText('על מה עובדים היום?')}</h3>
        <div class="conversation-prompts">${suggestions.map(s=>`<button type="button" data-question="${esc(uiText(s))}" onclick="askResearchShortcut(this.dataset.question)">${uiText(s)}</button>`).join('')}</div></div>`}</div>
      <form id="research-chat-form" onsubmit="sendResearchQuestion(event)"><label for="research-question">${uiText('שאלה על המחקרים')}</label>
        <textarea id="research-question" dir="auto" required maxlength="2000" oninput="voiceDraft=this.value" ${disabled?'disabled':''}>${esc(voiceDraft)}</textarea>
        <button class="primary" type="submit" ${disabled?'disabled':''}>${uiText(pendingChatSends.has(chatPaperId)?'מכין תשובה…':'שליחת שאלה ←')}</button>
      </form><details class="chat-voice" ${chatVoiceOpen?'open':''} ontoggle="chatVoiceOpen=this.open">
        <summary>${uiText('אפשרויות קול')}</summary>${voiceControls()}</details></section>
      <details id="chat-evidence" class="chat-evidence" ${!window.matchMedia('(max-width:760px)').matches?'open':''}>
        <summary>${workspaceIcon('sources')} ${uiText('מקורות והפניות')}</summary>
        <div id="chat-evidence-body" tabindex="-1">${chatEvidenceBody()}</div></details></div></div>`;
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
  const pending = api('/api/chat',{paperId:pid,question});
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
