/* ═══════════════════════════════════════════════════════════════
   USERS — 用户与权限管理
   ═══════════════════════════════════════════════════════════════ */

function renderUsers() {
  userSel = {};
  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>用户与权限管理</h1><p class="subt">管理用户信息与角色权限（REQ-SM-001 / REQ-SM-002）</p></div>' +
    '<button class="btn btn-p" onclick="showBatchPerm()">批量调整角色</button></div>' +
    '<div class="tbl-wrap">' +
      '<div class="tbl-bar">' +
        '<div class="tbl-src"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
        '<input type="text" placeholder="按姓名、角色搜索..." oninput="filterUsers(this.value)"></div>' +
        '<span style="font-size:12px;color:var(--tx3);">勾选用户后可批量调整角色</span>' +
      '</div>' +
      '<table><thead><tr><th style="width:40px;"><input type="checkbox" onchange="toggleAll(this)"></th><th>姓名</th><th>部门</th><th>当前角色</th><th>权限说明</th></tr></thead><tbody id="userTb"></tbody></table>' +
    '</div>';
  renderUserTb();
  page = 'users';
}

function renderUserTb(f) {
  f = f || '';
  let list = [...USER_DATA];
  if (f) {
    const q = f.toLowerCase();
    list = list.filter(function (u) {
      const pp = PPL_BY_ID.get(u.pid);
      return ((pp && pp.name) || '').toLowerCase().includes(q) || u.rl.toLowerCase().includes(q);
    });
  }
  const tc = { admin: 'b', pmo: 'g', lead: 'y', user: 'gr' };
  const perm = { admin: '全部权限', pmo: '审批+待合并操作', lead: '查看+编辑项目', user: '仅查看项目' };
  document.getElementById('userTb').innerHTML = list.map(function (u) {
    const pp = PPL_BY_ID.get(u.pid);
    return '<tr>' +
      '<td><input type="checkbox" data-uid="' + u.id + '" onchange="toggleUSel(\'' + u.id + '\',this)"></td>' +
      '<td><span class="mav" style="background:' + (pp ? pp.av : '#2563EB') + '">' + ((pp ? pp.name : '?')[0]) + '</span>' + (pp ? pp.name : '—') + '</td>' +
      '<td style="font-size:12px;color:var(--tx2);">' + (pp ? pp.dept : '—') + '</td>' +
      '<td><span class="tag ' + (tc[u.role] || 'gr') + '">' + u.rl + '</span></td>' +
      '<td style="font-size:12px;color:var(--tx3);">' + perm[u.role] + '</td></tr>';
  }).join('');
}

function toggleAll(c) {
  document.querySelectorAll('#userTb input[type="checkbox"]').forEach(function (ch) {
    ch.checked = c.checked;
    userSel[ch.dataset.uid] = c.checked;
  });
}
function toggleUSel(uid, cb) { userSel[uid] = cb.checked; }
function filterUsers(v) { renderUserTb(v); }

function showBatchPerm() {
  const sel = Object.entries(userSel).filter(function (e) { return e[1]; }).map(function (e) { return e[0]; });
  if (!sel.length) { toast('请先勾选用户', 'err'); return; }
  const m = document.createElement('div'); m.className = 'mod'; m.style.display = 'flex';
  m.onclick = function (e) { if (e.target === this) this.remove(); };
  m.innerHTML = '<div class="mod-p sm"><div class="mod-h"><h3>批量调整角色（REQ-SM-002）</h3><button class="btn btn-gh btn-sm" onclick="this.closest(\'.mod\').remove()">&times;</button></div>' +
    '<div class="mod-b"><p style="margin-bottom:14px;">已选择 <b>' + sel.length + '</b> 名用户：</p>' +
    '<div style="display:flex;flex-direction:column;gap:8px;">' +
      [{ r: 'user', t: '用户 — 仅查看' }, { r: 'lead', t: '项目负责人 — 查看+编辑' }, { r: 'pmo', t: 'PMO — 审批+操作' }, { r: 'admin', t: '系统管理员 — 全部权限' }].map(function (x) {
        return '<button class="btn btn-o" style="justify-content:flex-start;padding:12px;" onclick="batchRole(\'' + sel.join(',') + '\',\'' + x.r + '\')">' + x.t + '</button>';
      }).join('') +
    '</div></div></div>';
  document.body.appendChild(m);
}

async function batchRole(uids, r) {
  const lb = { user: '用户', lead: '项目负责人', pmo: 'PMO', admin: '系统管理员' };
  uids.split(',').forEach(function (uid) {
    const u = USER_DATA.find(function (x) { return x.id === uid; });
    if (u) { u.role = r; u.rl = lb[r]; }
  });
  document.querySelectorAll('.mod').forEach(function (m) { m.remove(); });
  addLogEntry('调整角色', uids.split(',').length + '名用户', '角色设为"' + lb[r] + '"');

  const uidList = uids.split(',');
  for (let i = 0; i < uidList.length; i++) {
    const uid = uidList[i];
    const u = USER_DATA.find(function (x) { return x.id === uid; });
    if (u && u.pid) {
      try {
        await API.updateUser(u.pid, { '权限': lb[r] });
      } catch (e) { console.warn('[users] batchRole sync failed for', uid, e); }
    }
  }
  renderUsers();
  toast('角色已调整为"' + lb[r] + '"', 'ok');
}
