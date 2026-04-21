let allTasks = [];
let activeStatFilter = null;
let activePillFilter = null; // pill 精确筛选
let lang = 'zh'; // 'zh' | 'en'

// ── language ──────────────────────────────────────────────
const i18n = {
  zh: {
    pageSub:       '数据来自 ClickUp · Bug list · TripGuru-Dev',
    refresh:       '刷新数据',
    loading:       '正在从 ClickUp 拉取数据...',
    connError:     '连接失败，请确认 server.js 正在运行',
    noResult:      '没有符合条件的 bug',
    empty:         '目前为空',
    cleared:       '已从该项移出',
    done:          '已处理完毕',
    noOwner:       '无负责人',
    allBug:        '全部 Bug',
    unclosed:      '未关闭',
    search:        '搜索 bug 标题、负责人...',
    showing:       (n, t) => `显示 ${n} / ${t} 条`,
    daysAgoLabel:  d => `已 ${d} 天`,
    createdLabel:  d => `创建: ${d}`,
    viewClickup:   '在 ClickUp 查看 ↗',
    historyLabel:  '历史日报',
    submitLabel:   '提交今日日报',
    nameLabel:     '姓名',
    nameHolder:    '— 选择 —',
    yestLabel:     '昨日进展',
    yestHolder:    '昨天完成了什么？',
    blockLabel:    '卡点',
    blockHolder:   '遇到什么阻碍？',
    todayLabel:    '今日计划 *',
    todayHolder:   '今天打算做什么？',
    tomorrowLabel: '明日计划',
    tomorrowHolder:'明天打算做什么？',
    submitBtn:     '提交日报',
    submitOk:      '✓ 已提交到 ClickUp',
    commentFail:   '加载失败',
    noComment:     '暂无日报记录',
    commentLoading:'加载中...',
    allPill:       '全部',
    statLabels:    { active: '未关闭', P0: 'P0', P1: 'P1', P2: 'P2', 'no-owner': '无负责人' },
    pills: [
      { val: 'new',             label: '新建<br>New' },
      { val: 'in progress',     label: '修复中<br>In Progress' },
      { val: 'fixed',           label: '已修复待测试<br>Fixed & Pending Test' },
      { val: 'in verification', label: '验证中<br>Under Verification' },
      { val: 'test passed',     label: 'TEST验证通过<br>Test Passed' },
      { val: 'complete',        label: '已上线<br>Completed' },
      { val: '已拒绝',          label: '已拒绝<br>Rejected' },
      { val: 'backlog',         label: '转为需求<br>Moved to Backlog' },
    ],
  },
  en: {
    pageSub:       'Data from ClickUp · Bug list · TripGuru-Dev',
    refresh:       'Refresh',
    loading:       'Loading from ClickUp...',
    connError:     'Connection failed. Make sure server.js is running',
    noResult:      'No bugs found',
    empty:         'Currently empty',
    cleared:       'All cleared',
    done:          'All resolved',
    noOwner:       'No assignee',
    allBug:        'All Bugs',
    unclosed:      'Open',
    search:        'Search bug title, assignee...',
    showing:       (n, t) => `Showing ${n} / ${t}`,
    daysAgoLabel:  d => `${d} days`,
    createdLabel:  d => `Created: ${d}`,
    viewClickup:   'View in ClickUp ↗',
    historyLabel:  'Daily Log History',
    submitLabel:   'Submit Daily Log',
    nameLabel:     'Name',
    nameHolder:    '— Select —',
    yestLabel:     'Yesterday',
    yestHolder:    'What did you finish yesterday?',
    blockLabel:    'Blockers',
    blockHolder:   'Any blockers?',
    todayLabel:    "Today's Plan *",
    todayHolder:   "What's your plan today?",
    tomorrowLabel: "Tomorrow's Plan",
    tomorrowHolder:"What's your plan tomorrow?",
    submitBtn:     'Submit',
    submitOk:      '✓ Submitted to ClickUp',
    commentFail:   'Failed to load',
    noComment:     'No logs yet',
    commentLoading:'Loading...',
    allPill:       'All',
    statLabels:    { active: 'Open', P0: 'P0', P1: 'P1', P2: 'P2', 'no-owner': 'No Assignee' },
    pills: [
      { val: 'new',             label: 'New' },
      { val: 'in progress',     label: 'In Progress' },
      { val: 'fixed',           label: 'Fixed & Pending Test' },
      { val: 'in verification', label: 'Under Verification' },
      { val: 'test passed',     label: 'Test Passed' },
      { val: 'complete',        label: 'Completed' },
      { val: '已拒绝',          label: 'Rejected' },
      { val: 'backlog',         label: 'Moved to Backlog' },
    ],
  }
};

function t() { return i18n[lang]; }

function toggleLang() {
  lang = lang === 'zh' ? 'en' : 'zh';
  const btn = document.getElementById('lang-btn');
  btn.textContent = lang === 'zh' ? 'EN' : '中文';

  // static text
  document.getElementById('page-sub').textContent = t().pageSub;
  document.getElementById('refresh-btn').textContent = t().refresh;
  document.getElementById('new-bug-btn').textContent = lang === 'zh' ? '＋ 新建 Bug' : '＋ New Bug';
  document.getElementById('search').placeholder = t().search;

  // dropdown options with data-zh / data-en
  document.querySelectorAll('option[data-zh]').forEach(opt => {
    opt.textContent = opt.getAttribute(`data-${lang}`);
  });

  // re-render everything
  render();
}

// ── helpers ──────────────────────────────────────────────
function getSeverity(task) {
  const f = task.custom_fields?.find(f => f.name === 'Bug Severity');
  if (!f || !f.value) return null;
  const opt = f.type_config?.options?.find(o => o.orderindex === f.value || o.id === f.value);
  return opt?.name || null;
}

function getReason(task) {
  const f = task.custom_fields?.find(f => f.name === 'Bug原因');
  if (!f || !f.value) return null;
  const opt = f.type_config?.options?.find(o => o.orderindex === f.value || o.id === f.value);
  return opt?.name || null;
}

function getWorkstream(task) {
  const f = task.custom_fields?.find(f => f.name === 'Workstream');
  if (!f || f.value === null || f.value === undefined) return null;
  const opt = f.type_config?.options?.find(o => o.orderindex === f.value || o.id === f.value);
  return opt?.name || null;
}


function daysAgo(ts) {
  return Math.floor((Date.now() - parseInt(ts)) / 86400000);
}

function severityClass(s) {
  return s === 'P0' ? 'b-p0' : s === 'P1' ? 'b-p1' : s === 'P2' ? 'b-p2' : 'b-p3';
}

function statusClass(s) {
  const sl = (s || '').toLowerCase();
  if (sl.includes('new') || sl.includes('新建')) return 'b-new';
  if (sl.includes('progress') || sl.includes('进行')) return 'b-prog';
  if (sl.includes('complete') || sl.includes('上线') || sl.includes('done')) return 'b-closed';
  if (sl.includes('fixed') || sl.includes('passed')) return 'b-done';
  return 'b-open';
}

function isClosed(t) {
  return t.status?.type === 'closed' || (t.status?.status || '').includes('已拒绝');
}

// ── stat card filter ──────────────────────────────────────
function setStatFilter(key) {
  activeStatFilter = activeStatFilter === key ? null : key;
  document.querySelectorAll('.stat').forEach(el => el.classList.remove('active'));
  if (activeStatFilter) {
    document.querySelector(`.stat[data-key="${activeStatFilter}"]`)?.classList.add('active');
  }
  render();
}

function applyStatFilter(tasks) {
  if (!activeStatFilter) return tasks;
  if (activeStatFilter === 'active') return tasks.filter(t => !isClosed(t));
  if (activeStatFilter === 'P0') return tasks.filter(t => getSeverity(t) === 'P0');
  if (activeStatFilter === 'P1') return tasks.filter(t => getSeverity(t) === 'P1');
  if (activeStatFilter === 'P2') return tasks.filter(t => getSeverity(t) === 'P2');
  if (activeStatFilter === 'no-owner') return tasks.filter(t => !isClosed(t) && t.assignees?.length === 0);
  return tasks;
}

// ── render stats ──────────────────────────────────────────
function renderStats(tasks) {
  const active = tasks.filter(t => !isClosed(t));
  const p0 = tasks.filter(t => getSeverity(t) === 'P0').length;
  const p1 = tasks.filter(t => getSeverity(t) === 'P1').length;
  const p2 = tasks.filter(t => getSeverity(t) === 'P2').length;
  const noOwner = active.filter(t => t.assignees?.length === 0).length;

  const stats = [
    { key: null,       label: t().allBug,              val: tasks.length,  color: '#0f172a' },
    { key: 'active',   label: t().statLabels.active,   val: active.length, color: '#0369a1' },
    { key: 'P0',       label: 'P0',                    val: p0,            color: '#dc2626' },
    { key: 'P1',       label: 'P1',                    val: p1,            color: '#ea580c' },
    { key: 'P2',       label: 'P2',                    val: p2,            color: '#2563eb' },
    { key: 'no-owner', label: t().statLabels['no-owner'], val: noOwner,    color: '#9333ea' },
  ];

  document.getElementById('stats').innerHTML = stats.map(s => `
    <div class="stat${activeStatFilter === s.key && s.key ? ' active' : ''}"
         data-key="${s.key || ''}"
         onclick="${s.key ? `setStatFilter('${s.key}')` : 'setStatFilter(null)'}">
      <div class="stat-label">${s.label}</div>
      <div class="stat-val" style="color:${s.color}">${s.val}</div>
    </div>`).join('');

  // status pill row
  document.getElementById('status-filter-row').innerHTML =
    `<button class="sf-btn active" onclick="setStatusFilter('',this)">
      <div class="sf-label">${t().allPill}</div>
      <div class="sf-num">${tasks.length}</div>
    </button>` +
    t().pills.map(s => {
      const count = tasks.filter(tk => (tk.status?.status || '').toLowerCase().includes(s.val.toLowerCase())).length;
      const onclick = count === 0 ? `showEmpty(this)` : `setStatusFilter('${s.val}',this)`;
      const [zhLine, enLine] = s.label.split('<br>');
      return `<button class="sf-btn" onclick="${onclick}">
        <div class="sf-label">${zhLine}${enLine ? `<span class="sf-en"> ${enLine}</span>` : ''}</div>
        <div class="sf-num">${count}</div>
      </button>`;
    }).join('');
}

function setStatusFilter(val, btn) {
  document.querySelectorAll('.sf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activePillFilter = val || null;
  render();
}

function showEmpty(btn) {
  document.querySelectorAll('.sf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('bug-list').innerHTML = `<div class="loading">${t().empty}</div>`;
}

// ── populate assignees ────────────────────────────────────
function populateAssignees(tasks) {
  const names = new Set();
  tasks.forEach(t => t.assignees?.forEach(a => names.add(a.username)));
  const sel = document.getElementById('f-assignee');
  [...names].sort().forEach(name => {
    const opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    sel.appendChild(opt);
  });
}

// ── main render ───────────────────────────────────────────
function render() {
  const search    = document.getElementById('search').value.toLowerCase();
  const fSev      = document.getElementById('f-severity').value;
  const fStatus   = document.getElementById('f-status').value;
  const fReason   = document.getElementById('f-reason').value;
  const fWorkstream = document.getElementById('f-workstream').value;
  const fAssignee = document.getElementById('f-assignee').value;
  const sortBy    = document.getElementById('f-sort').value;
  const sevOrder  = { P0: 0, P1: 1, P2: 2, P3: 3 };

  let filtered = applyStatFilter(allTasks).filter(t => {
    const sev           = getSeverity(t);
    const reason        = getReason(t);
    const statusStr     = (t.status?.status || '').toLowerCase();
    const assigneeNames = t.assignees?.map(a => a.username).join(' ') || '';
    const matchText     = !search || t.name.toLowerCase().includes(search) || assigneeNames.toLowerCase().includes(search);
    const matchStatus   = activePillFilter
      ? statusStr.includes(activePillFilter.toLowerCase())
      : (!fStatus || statusStr.includes(fStatus));
    return matchText
      && matchStatus
      && (!fSev        || sev === fSev)
      && (!fReason     || reason === fReason)
      && (!fWorkstream || getWorkstream(t) === fWorkstream)
      && (!fAssignee   || assigneeNames.includes(fAssignee));
  });

  filtered.sort((a, b) => {
    const aDone = isClosed(a) ? 1 : 0;
    const bDone = isClosed(b) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    if (sortBy === 'days-desc')    return parseInt(a.date_created) - parseInt(b.date_created);
    if (sortBy === 'updated-desc') return parseInt(b.date_updated) - parseInt(a.date_updated);
    const sa = sevOrder[getSeverity(a)] ?? 4;
    const sb = sevOrder[getSeverity(b)] ?? 4;
    if (sa !== sb) return sa - sb;
    return parseInt(b.date_created) - parseInt(a.date_created);
  });

  renderStats(allTasks);

  const el = document.getElementById('bug-list');
  if (!filtered.length) {
    const msg = activeStatFilter
      ? `<div class="loading" style="color:#16a34a;">✓ ${t().cleared}</div>`
      : `<div class="loading">${t().noResult}</div>`;
    el.innerHTML = msg;
    return;
  }

  el.innerHTML = `<div class="count">${t().showing(filtered.length, allTasks.length)}</div>` +
    filtered.map(task => {
      const sev        = getSeverity(task);
      const reason     = getReason(task);
      const workstream = getWorkstream(task);
      const days     = daysAgo(task.date_created);
      const isUrgent = days > 7 && !isClosed(task);
      const assignees = task.assignees || [];
      const dateStr  = new Date(parseInt(task.date_created)).toLocaleDateString('zh-CN');

      const avatarsHtml = assignees.length
        ? assignees.map(a => a.profilePicture
            ? `<img class="avatar" src="${a.profilePicture}" title="${a.username}">`
            : `<span class="avatar-placeholder" title="${a.username}">${a.initials || a.username[0]}</span>`
          ).join('')
        : `<span style="font-size:12px;color:#94a3b8;">${t().noOwner}</span>`;

      const assigneeText = assignees.map(a => `<span style="font-size:12px">${a.username}</span>`).join('、');

      return `
<div class="bug-card" id="card-${task.id}">
  <div class="bug-summary" onclick="toggleExpand('${task.id}')">
    <div class="bug-badges">
      ${sev ? `<span class="badge ${severityClass(sev)}">${sev}</span>` : ''}
      <span class="badge ${statusClass(task.status?.status)}">${task.status?.status || '—'}</span>
      ${workstream ? `<span class="badge b-ws">${workstream}</span>` : ''}
      ${reason ? `<span class="badge b-reason">${reason}</span>` : ''}
    </div>
    <div class="bug-title">${task.name}</div>
    <div class="bug-meta">
      <div class="assignees">${avatarsHtml}${assigneeText}</div>
      <span>${t().createdLabel(dateStr)}</span>
      <span class="days-badge ${isUrgent ? 'days-urgent' : ''}">${t().daysAgoLabel(days)}</span>
      <a class="bug-link" href="${task.url}" target="_blank" onclick="event.stopPropagation()">${t().viewClickup}</a>
    </div>
  </div>
  <div class="expand-panel" id="expand-${task.id}">
    <div class="expand-grid">
      <div>
        <div class="panel-label">${t().historyLabel}</div>
        <div class="comments-scroll" id="comments-${task.id}">
          <span style="font-size:13px;color:#94a3b8;">${t().commentLoading}</span>
        </div>
      </div>
      <div class="form-col">
        <div class="panel-label">${t().submitLabel}</div>
        <div class="field-wrap">
          <div class="field-label">${t().nameLabel}</div>
          <select id="member-${task.id}">
            <option value="">${t().nameHolder}</option>
            <option>liucai</option>
            <option>LiAng Lu</option>
            <option>YangMingqin</option>
            <option>Eric</option>
            <option>lili</option>
            <option>Liyumeng</option>
            <option>Echo Pang</option>
            <option>Lily Wang</option>
          </select>
        </div>
        <div class="field-wrap">
          <div class="field-label">${t().yestLabel}</div>
          <textarea id="prog-${task.id}" placeholder="${t().yestHolder}"></textarea>
        </div>
        <div class="field-wrap">
          <div class="field-label">${t().blockLabel}</div>
          <textarea id="block-${task.id}" placeholder="${t().blockHolder}"></textarea>
        </div>
        <div class="field-wrap">
          <div class="field-label">${t().todayLabel}</div>
          <textarea id="today-${task.id}" placeholder="${t().todayHolder}"></textarea>
        </div>
        <div class="field-wrap">
          <div class="field-label">${t().tomorrowLabel}</div>
          <textarea id="tomorrow-${task.id}" placeholder="${t().tomorrowHolder}"></textarea>
        </div>
        <button class="submit-btn" onclick="submitLog('${task.id}')">${t().submitBtn}</button>
        <div class="success-msg" id="msg-${task.id}">${t().submitOk}</div>
        <div style="margin-top:12px;border-top:1px solid #e2e8f0;padding-top:10px;">
          <div class="field-label" style="margin-bottom:6px;">${lang === 'zh' ? '上传附件' : 'Upload Attachment'}</div>
          <div onclick="document.getElementById('attach-input-${task.id}').click()"
            style="border:2px dashed #e2e8f0;border-radius:6px;padding:10px;text-align:center;cursor:pointer;color:#94a3b8;font-size:12px;">
            📎 ${lang === 'zh' ? '点击选择文件' : 'Click to select files'}
            <input type="file" id="attach-input-${task.id}" multiple style="display:none"
              onchange="handleExistingBugFiles('${task.id}', this.files)">
          </div>
          <div id="attach-list-${task.id}" style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;"></div>
          <button id="attach-btn-${task.id}" onclick="submitAttachment('${task.id}')"
            class="submit-btn" style="margin-top:8px;">
            ${lang === 'zh' ? '上传附件' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>`;
    }).join('');
}

// ── expand / comments ─────────────────────────────────────
async function toggleExpand(taskId) {
  const panel = document.getElementById(`expand-${taskId}`);
  const isOpen = panel.style.display === 'block';
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) loadComments(taskId);
}

async function loadComments(taskId) {
  const el = document.getElementById(`comments-${taskId}`);
  el.innerHTML = `<span style="font-size:13px;color:#94a3b8;">${t().commentLoading}</span>`;
  try {
    const res = await fetch(`http://localhost:3001/api/task/${taskId}/comment`);
    const data = await res.json();
    const comments = data.comments || [];
    if (!comments.length) {
      el.innerHTML = `<span style="font-size:13px;color:#94a3b8;">${t().noComment}</span>`;
      return;
    }
    const logLabel = lang === 'zh' ? '日报' : 'Log';
    el.innerHTML = comments.map(c => {
      const isLog = c.comment_text?.startsWith('📅');
      return `
<div class="comment-card" style="${isLog ? 'border-color:#86efac;background:#f0fdf4;' : ''}">
  <div class="comment-header">
    ${c.user?.profilePicture ? `<img src="${c.user.profilePicture}" style="width:18px;height:18px;border-radius:50%;">` : ''}
    <span class="comment-user">${c.user?.username || '—'}</span>
    ${isLog ? `<span style="font-size:10px;background:#dcfce7;color:#166534;padding:1px 6px;border-radius:20px;border:1px solid #86efac;">${logLabel}</span>` : ''}
    <span class="comment-date">${new Date(parseInt(c.date)).toLocaleDateString('zh-CN')}</span>
  </div>
  <div class="comment-body">${c.comment_text}</div>
</div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = `<span style="color:#ef4444;font-size:13px;">${t().commentFail}</span>`;
  }
}

// ── submit log ────────────────────────────────────────────
async function submitLog(taskId) {
  const member = document.getElementById(`member-${taskId}`).value;
  const today  = document.getElementById(`today-${taskId}`).value.trim();
  if (!member) { alert(lang === 'zh' ? '请选择姓名' : 'Please select your name'); return; }
  if (!today)  { alert(lang === 'zh' ? '请填写今日计划' : "Please fill in today's plan"); return; }

  const prog     = document.getElementById(`prog-${taskId}`).value.trim();
  const block    = document.getElementById(`block-${taskId}`).value.trim();
  const tomorrow = document.getElementById(`tomorrow-${taskId}`).value.trim();
  const date     = new Date().toLocaleDateString('zh-CN');

  const text = `📅 ${date} | ${member}\n━━━━━━━━━━━━━━━━\n昨日进展：${prog || '—'}\n卡点：${block || '—'}\n今日计划：${today}\n明日计划：${tomorrow || '—'}`;

  try {
    await fetch(`http://localhost:3001/api/task/${taskId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_text: text })
    });
    const msg = document.getElementById(`msg-${taskId}`);
    msg.textContent = t().submitOk;
    msg.style.display = 'block';
    ['member', 'prog', 'block', 'today', 'tomorrow'].forEach(f => {
      document.getElementById(`${f}-${taskId}`).value = '';
    });
    setTimeout(() => { msg.style.display = 'none'; loadComments(taskId); }, 1500);
  } catch (e) {
    alert((lang === 'zh' ? '提交失败：' : 'Submit failed: ') + e.message);
  }
}

// ── new bug modal ─────────────────────────────────────────
function openNewBugModal() {
  // populate assignees from loaded tasks
  const sel = document.getElementById('nb-assignee');
  sel.innerHTML = '<option value="">— Select —</option>';
  const seen = new Set();
  allTasks.forEach(t => t.assignees?.forEach(a => {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.username;
      sel.appendChild(opt);
    }
  }));

  document.getElementById('nb-title').value = '';
  document.getElementById('nb-severity').value = '';
  document.getElementById('nb-workstream').value = '';
  document.getElementById('nb-assignee').value = '';
  document.getElementById('nb-reporter').value = '';
  document.getElementById('nb-due').value = '';
  document.getElementById('nb-desc').value = '';
  document.getElementById('nb-files').value = '';
  document.getElementById('nb-file-list').innerHTML = '';
  document.getElementById('nb-msg').style.display = 'none';
  document.getElementById('nb-submit-btn').disabled = false;
  document.getElementById('nb-submit-btn').textContent = 'Submit';

  const modal = document.getElementById('new-bug-modal');
  modal.style.display = 'flex';
}

function closeNewBugModal() {
  document.getElementById('new-bug-modal').style.display = 'none';
}

async function submitNewBug() {
  const title = document.getElementById('nb-title').value.trim();
  if (!title) { alert('Please enter a title'); return; }

  const severityVal  = document.getElementById('nb-severity').value;
  const workstreamId = document.getElementById('nb-workstream').value;
  const assigneeId   = document.getElementById('nb-assignee').value;
  const reporter     = document.getElementById('nb-reporter').value.trim();
  const dueVal       = document.getElementById('nb-due').value;
  const desc         = document.getElementById('nb-desc').value.trim();

  const fullDesc = reporter ? `[Reported by: ${reporter}]\n\n${desc}` : desc;

  const body = {
    name: title,
    description: fullDesc,
    assignees: assigneeId ? [parseInt(assigneeId)] : [],
    due_date: dueVal ? new Date(dueVal).getTime() : null,
    priority: severityVal ? parseInt(severityVal) : null,
    custom_fields: []
  };

  if (workstreamId) {
    body.custom_fields.push({
      id: '564243b5-f057-4195-b0b0-fedd4164369d',
      value: workstreamId
    });
  }

  const btn = document.getElementById('nb-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    const res = await fetch('http://localhost:3001/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.id) {
      // upload attachments if any
      const files = document.getElementById('nb-files').files;
      if (files.length > 0) {
        btn.textContent = 'Uploading files...';
        await uploadFilesToTask(data.id, files);
      }
      const msg = document.getElementById('nb-msg');
      msg.textContent = '✓ Bug submitted to ClickUp';
      msg.style.display = 'block';
      setTimeout(() => { closeNewBugModal(); loadTasks(); }, 1500);
    } else {
      alert('Submit failed: ' + JSON.stringify(data));
      btn.disabled = false;
      btn.textContent = 'Submit';
    }
  } catch (e) {
    alert('Submit failed: ' + e.message);
    btn.disabled = false;
    btn.textContent = 'Submit';
  }
}


// ── file upload helpers ───────────────────────────────────
async function uploadFilesToTask(taskId, files) {
  for (const file of files) {
    const form = new FormData();
    form.append('file', file, file.name);
    try {
      await fetch(`http://localhost:3001/api/task/${taskId}/attachment`, {
        method: 'POST',
        body: form
      });
    } catch (e) {
      console.warn('File upload failed:', file.name, e.message);
    }
  }
}

function handleNewBugFiles(files) {
  const list = document.getElementById('nb-file-list');
  list.innerHTML = '';
  for (const file of files) {
    const tag = document.createElement('div');
    tag.style.cssText = 'font-size:12px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:3px 10px;color:#334155;';
    tag.textContent = `📄 ${file.name}`;
    list.appendChild(tag);
  }
}

function handleExistingBugFiles(taskId, files) {
  const list = document.getElementById(`attach-list-${taskId}`);
  if (!list) return;
  list.innerHTML = '';
  for (const file of files) {
    const tag = document.createElement('div');
    tag.style.cssText = 'font-size:12px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:3px 10px;color:#334155;';
    tag.textContent = `📄 ${file.name}`;
    list.appendChild(tag);
  }
}

async function submitAttachment(taskId) {
  const input = document.getElementById(`attach-input-${taskId}`);
  if (!input.files.length) { alert('Please select a file first'); return; }
  const btn = document.getElementById(`attach-btn-${taskId}`);
  btn.disabled = true;
  btn.textContent = lang === 'zh' ? '上传中...' : 'Uploading...';
  await uploadFilesToTask(taskId, input.files);
  btn.disabled = false;
  btn.textContent = lang === 'zh' ? '上传附件' : 'Upload';
  input.value = '';
  document.getElementById(`attach-list-${taskId}`).innerHTML = '';
  const msg = document.createElement('div');
  msg.style.cssText = 'font-size:12px;color:#16a34a;margin-top:4px;';
  msg.textContent = '✓ Uploaded';
  btn.parentElement.appendChild(msg);
  setTimeout(() => msg.remove(), 2000);
}


async function loadTasks() {
  document.getElementById('bug-list').innerHTML = `<div class="loading">${t().loading}</div>`;
  try {
    const res  = await fetch('http://localhost:3001/api/tasks');
    const data = await res.json();
    allTasks   = data.tasks || [];
    populateAssignees(allTasks);
    render();
  } catch (e) {
    document.getElementById('bug-list').innerHTML =
      `<div class="error">${t().connError}<br><small>${e.message}</small></div>`;
  }
}

loadTasks();
