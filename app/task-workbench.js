// The workspace task list uses the same task records, filters, and status actions as the existing board.
function taskWorkspace() {
  const selectedPaper = articleFilters.tasks || '';
  const range = window.taskrange || 'הכול';
  const category = window.taskCategory || '';
  const base = sorted(S.tasks.filter(task => !selectedPaper || task.paperId === selectedPaper));
  const end = dayPlus(today(), 7);
  const scoped = base.filter(task => {
    if (range === 'היום') return task.due === today();
    if (range === 'השבוע') return task.status !== 'הושלם' && task.due >= today() && task.due <= end;
    if (range === 'באיחור') return overdue(task);
    if (range === 'ממתין לשותף') return task.status === range;
    return true;
  });
  const count = {
    pending: scoped.filter(task => task.status !== 'הושלם').length,
    high: scoped.filter(task => task.status !== 'הושלם' && ['גבוהה','דחופה'].includes(task.priority)).length,
    completed: scoped.filter(task => task.status === 'הושלם').length,
    overdue: scoped.filter(overdue).length
  };
  const rows = scoped.filter(task => {
    if (category === 'pending') return task.status !== 'הושלם';
    if (category === 'high') return task.status !== 'הושלם' && ['גבוהה','דחופה'].includes(task.priority);
    if (category === 'completed') return task.status === 'הושלם';
    return true;
  });
  const copy = {
    he: {intro:'כל המשימות והצעדים הבאים במקום אחד',open:'משימות פתוחות',late:'באיחור',high:'עדיפות גבוהה',done:'הושלמו',study:'כל המחקרים',search:'חיפוש משימות',sort:'מיון',view:'תצוגת משימות',list:'רשימה',board:'לוח',task:'משימה',priority:'עדיפות',due:'מועד יעד',project:'מחקר',status:'מצב',owner:'אחראי',actions:'פעולות',edit:'פתיחה',empty:'אין משימות התואמות לבחירה',clear:'ניקוי מסננים',add:'הוספת משימה',all:'כל המשימות'},
    en: {intro:'Your tasks and next steps in one place',open:'Open tasks',late:'Overdue',high:'High priority',done:'Completed',study:'All studies',search:'Search tasks',sort:'Sort',view:'Task view',list:'List',board:'Board',task:'Task',priority:'Priority',due:'Due date',project:'Study',status:'Status',owner:'Owner',actions:'Actions',edit:'Open',empty:'No tasks match your selection',clear:'Clear filters',add:'Add task',all:'All tasks'},
    ar: {intro:'مهامك وخطواتك القادمة في مكان واحد',open:'المهام المفتوحة',late:'المتأخرة',high:'أولوية عالية',done:'المكتملة',study:'جميع الأبحاث',search:'البحث في المهام',sort:'ترتيب',view:'عرض المهام',list:'قائمة',board:'لوحة',task:'المهمة',priority:'الأولوية',due:'الموعد',project:'البحث',status:'الحالة',owner:'المسؤول',actions:'الإجراءات',edit:'فتح',empty:'لا توجد مهام تطابق اختيارك',clear:'مسح عوامل التصفية',add:'إضافة مهمة',all:'كل المهام'}
  }[document.documentElement.lang.split('-')[0]] || {};
  const metric = (key, icon, label, value, pressed) => `<button type="button" class="task-stat ${key}" aria-pressed="${pressed}" onclick="taskWorkspaceMetric('${key}')"><span class="task-stat-icon" aria-hidden="true">${workspaceIcon(icon)}</span><span><small>${label}</small><strong>${value}</strong></span></button>`;
  const selected = (value, current) => value === current ? 'selected' : '';
  const options = (values, current) => values.map(value => `<option value="${esc(value)}" ${selected(value,current)}>${esc(uiText(value))}</option>`).join('');
  const tableRows = rows.map(task => `<tr>
    <td data-label="${copy.task}"><button type="button" class="task-title-link" data-task-open="${esc(task.id)}" onclick="edit('tasks',this.dataset.taskOpen)" dir="auto">${esc(task.title)}</button><small dir="auto">${esc(task.owner || uiText('אחראי לא הוזן'))}</small></td>
    <td data-label="${copy.priority}"><span class="task-priority ${['גבוהה','דחופה'].includes(task.priority)?'is-high':''}">${esc(displayChoice(task.priority,priority,'רגילה'))}</span></td>
    <td data-label="${copy.due}"><span class="${overdue(task)?'task-overdue':''}">${task.due ? date(task.due) : uiText('לא הוזן')}</span>${overdue(task)?` <small class="task-overdue">${copy.late}</small>`:''}</td>
    <td data-label="${copy.project}" dir="auto">${esc(pname(task.paperId))}</td>
    <td data-label="${copy.status}"><select aria-label="${esc(copy.status+' '+task.title)}" data-task-status="${esc(task.id)}" onchange="changeTaskStatus(this.dataset.taskStatus,this.value)">${options(taskstates,task.status)}</select></td>
    <td data-label="${copy.actions}"><button type="button" data-task-open="${esc(task.id)}" onclick="edit('tasks',this.dataset.taskOpen)">${copy.edit}</button></td>
  </tr>`).join('');
  const board = `<div class="kanban task-board">${taskstates.map(status=>`<section class="column" data-status="${esc(status)}"><h3>${esc(uiText(status))}</h3>${rows.filter(task=>task.status===status).map(taskCard).join('')}</section>`).join('')}</div>`;
  return `<div class="task-workbench">
    <header class="task-workbench-head"><div><h2>${uiText('משימות')}</h2><p>${copy.intro}</p></div><button type="button" class="primary task-create" onclick="edit('tasks')">＋ ${copy.add}</button></header>
    <div class="task-metrics">
      ${metric('pending','tasks',copy.open,count.pending,category==='pending')}
      ${metric('overdue','gantt',copy.late,count.overdue,range==='באיחור')}
      ${metric('high','tasks',copy.high,count.high,category==='high')}
      ${metric('completed','tasks',copy.done,count.completed,category==='completed')}
    </div>
    <div class="task-filter-bar">
      <label class="task-search"><span class="task-sr">${copy.search}</span><input id="task-search" type="search" dir="auto" placeholder="${copy.search}" value="${esc(q)}" oninput="updateTaskSearch(this)"></label>
      <label><span class="task-sr">${copy.project}</span><select onchange="selectTaskArticle(this.value)"><option value="">${copy.study}</option>${S.papers.map(p=>`<option value="${esc(p.id)}" ${selected(p.id,selectedPaper)}>${esc([p.code,p.title].filter(Boolean).join(' — '))}</option>`).join('')}</select></label>
      <label><span class="task-sr">${uiText('טווח משימות')}</span><select onchange="window.taskrange=this.value;renderBody()">${options(['הכול','היום','השבוע','באיחור','ממתין לשותף'],range)}</select></label>
      <label><span class="task-sr">${copy.priority}</span><select onchange="filter=this.value;renderBody()"><option value="">${uiText('כל העדיפויות')}</option>${options(priority,filter)}</select></label>
      <label><span class="task-sr">${copy.sort}</span><select onchange="sort=this.value;renderBody()"><option value="updated" ${selected('updated',sort)}>${uiText('עדכון אחרון')}</option><option value="title" ${selected('title',sort)}>${uiText('שם')}</option><option value="due" ${selected('due',sort)}>${copy.due}</option></select></label>
      <div class="task-view-switch" role="group" aria-label="${copy.view}"><button type="button" aria-pressed="${window.tasksLayout!=='board'}" onclick="window.tasksLayout='cards';renderBody()">${copy.list}</button><button type="button" aria-pressed="${window.tasksLayout==='board'}" onclick="window.tasksLayout='board';renderBody()">${copy.board}</button></div>
    </div>
    <div class="task-results"><div class="task-results-title"><b>${copy.all}</b><span>${rows.length}</span><button type="button" onclick="taskWorkspaceClear()">${copy.clear}</button></div>
      ${rows.length ? window.tasksLayout==='board' ? board : `<div class="task-table-scroll"><table class="task-table"><thead><tr><th>${copy.task}</th><th>${copy.priority}</th><th>${copy.due}</th><th>${copy.project}</th><th>${copy.status}</th><th>${copy.actions}</th></tr></thead><tbody>${tableRows}</tbody></table></div>` : `<p class="task-empty">${copy.empty}</p>`}
    </div>
  </div>`;
}

function taskWorkspaceClear() {
  articleFilters.tasks = '';
  window.taskCategory = '';
  window.taskrange = 'הכול';
  filter = '';
  q = '';
  sort = 'updated';
  renderBody();
}

function taskWorkspaceMetric(key) {
  if (key === 'overdue') {
    window.taskrange = window.taskrange === 'באיחור' ? 'הכול' : 'באיחור';
    window.taskCategory = '';
  } else {
    window.taskrange = 'הכול';
    window.taskCategory = window.taskCategory === key ? '' : key;
  }
  renderBody();
}

function installTaskWorkbench() {
  const previousRenderBody = renderBody;
  renderBody = function() {
    if (view === 'tasks' && !paperId) {
      document.body.classList.remove('workspace-sticky');
      document.getElementById('body').innerHTML = taskWorkspace();
      bindDrag();
      return;
    }
    return previousRenderBody();
  };
}
