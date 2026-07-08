/* ═══════════════════════════════════════════════════════════════
   ROLES — 角色管理
   ═══════════════════════════════════════════════════════════════ */

function renderRoles() {
  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>角色管理</h1><p class="subt">维护成员角色表，添加/编辑/删除将同步至飞书多维表格。</p></div></div>' +
    '<div class="tbl-wrap">' +
      '<div class="tbl-bar">' +
        '<div style="display:flex;align-items:center;gap:8px;flex:1;">' +
          '<input type="text" id="newRoleInput" placeholder="输入新角色名称..." style="padding:7px 12px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:13px;font-family:var(--font);width:200px;" onkeydown="if(event.key===\'Enter\')addRole()">' +
          '<button class="btn btn-p btn-sm" onclick="addRole()">+ 添加</button>' +
        '</div>' +
        '<span style="font-size:12px;color:var(--tx3);">共 ' + ROLES.length + ' 个角色</span>' +
      '</div>' +
      '<div id="roleTbBody">' + renderRoleTable() + '</div>' +
    '</div>';
  page = 'roles';
}

function renderRoleTable() {
  if (!ROLES.length) return '<div class="empty">暂无角色，请添加</div>';
  return '<table><thead><tr><th style="width:50px;">序号</th><th>角色名称</th><th style="width:150px;">操作</th></tr></thead><tbody>' +
    ROLES.map(function (r, i) {
      return '<tr id="role-row-' + i + '">' +
        '<td>' + (i + 1) + '</td>' +
        '<td id="role-cell-' + i + '">' +
          '<span class="ct" id="role-name-' + i + '">' + r + '</span>' +
          '<input type="text" class="role-edit-inline" id="role-edit-' + i + '" value="' + r + '" style="display:none;" onkeydown="if(event.key===\'Enter\')saveRoleEdit(' + i + ')">' +
        '</td>' +
        '<td class="ca">' +
          '<button class="btn btn-o btn-sm" id="role-btn-edit-' + i + '" onclick="startRoleEdit(' + i + ')">✎ 编辑</button>' +
          '<button class="btn btn-p btn-sm" id="role-btn-save-' + i + '" style="display:none;" onclick="saveRoleEdit(' + i + ')">保存</button>' +
          '<button class="btn btn-gh btn-sm" style="color:var(--red);" onclick="delRole(' + i + ')">删除</button>' +
        '</td></tr>';
    }).join('') + '</tbody></table>';
}

async function addRole() {
  const inp = document.getElementById('newRoleInput');
  const v = inp.value.trim();
  if (!v) { toast('请输入角色名称', 'err'); return; }
  if (ROLES.includes(v)) { toast('角色已存在', 'err'); return; }
  ROLES.push(v); inp.value = '';
  document.getElementById('roleTbBody').innerHTML = renderRoleTable();
  addLogEntry('角色管理', '角色表', '添加角色「' + v + '」');
  try { await API.createRole(v); } catch (e) { console.warn('[roles] addRole sync failed', e); }
  toast('已添加角色「' + v + '」', 'ok');
}

function startRoleEdit(i) {
  document.getElementById('role-name-' + i).style.display = 'none';
  document.getElementById('role-edit-' + i).style.display = '';
  document.getElementById('role-edit-' + i).focus();
  document.getElementById('role-btn-edit-' + i).style.display = 'none';
  document.getElementById('role-btn-save-' + i).style.display = '';
}

async function saveRoleEdit(i) {
  const v = document.getElementById('role-edit-' + i).value.trim();
  if (!v) { toast('角色名称不能为空', 'err'); return; }
  const old = ROLES[i];
  if (v !== old && ROLES.includes(v)) { toast('角色已存在', 'err'); return; }
  ROLES[i] = v;
  document.getElementById('roleTbBody').innerHTML = renderRoleTable();
  addLogEntry('角色管理', '角色表', v !== old ? '重命名「' + old + '」→「' + v + '」' : '保存「' + v + '」');
  try {
    const allRoles = await API.getRoles();
    if (allRoles && allRoles.data) {
      const ids = allRoles.record_id_list || [];
      const fields = allRoles.fields || [];
      const fi = fields.indexOf('角色名称');
      if (old !== v && fi >= 0) {
        for (let j = 0; j < (allRoles.data || []).length; j++) {
          if (allRoles.data[j][fi] === old && ids[j]) {
            await API.deleteRole(ids[j]);
            break;
          }
        }
      }
      await API.createRole(v);
    }
  } catch (e) { console.warn('[roles] saveRoleEdit sync failed', e); }
  toast(v !== old ? '已重命名' : '保存成功', 'ok');
}

async function delRole(i) {
  const r = ROLES[i];
  if (!confirm('确定删除角色「' + r + '」？')) return;
  ROLES.splice(i, 1);
  document.getElementById('roleTbBody').innerHTML = renderRoleTable();
  addLogEntry('角色管理', '角色表', '删除角色「' + r + '」');
  try {
    const allRoles = await API.getRoles();
    if (allRoles && allRoles.data) {
      const ids = allRoles.record_id_list || [];
      const fields = allRoles.fields || [];
      const fi = fields.indexOf('角色名称');
      if (fi >= 0) {
        for (let j = 0; j < (allRoles.data || []).length; j++) {
          if (allRoles.data[j][fi] === r && ids[j]) {
            await API.deleteRole(ids[j]);
            break;
          }
        }
      }
    }
  } catch (e) { console.warn('[roles] delRole sync failed', e); }
  toast('已删除角色「' + r + '」', 'ok');
}
