/* ═══════════════════════════════════════════════════════════════
   MEMBERS — 成员弹窗/工时编辑
   依赖: core.js (全局状态, Maps, 公共函数)
   ═══════════════════════════════════════════════════════════════ */

function showMemModal() {
  syncMemHours();
  const p = editData || selProj;
  const months = getMonths(p && p.start, (p && p.end) || (p && p.start));
  const m = document.createElement('div'); m.className = 'mod'; m.style.display = 'flex';
  m.onclick = function (e) { if (e.target === this) this.remove(); };

  const rows = tmpMems.map(function (mem, i) {
    let name = mem.pname || '';
    const pp = PPL_BY_ID.get(mem.pid);
    if (pp && !name) name = pp.name;
    if (!name) name = mem.pid || '未知';
    const av = pp ? pp.av : stringToColor(name);
    const total = months.reduce(function (s, mon) { return s + (parseFloat((mem.hours && mem.hours[mon]) || 0) || 0); }, 0);

    const roleSel = '<select multiple data-name="roles" style="width:100%;min-width:140px;padding:4px 6px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:11px;font-family:var(--font);background:var(--surf);" size="' + Math.min(ROLES.length, 4) + '">' +
      ROLES.map(function (r) {
        const sel = (mem.roles || []).indexOf(r) >= 0 ? ' selected' : '';
        return '<option value="' + r + '"' + sel + '>' + r + '</option>';
      }).join('') + '</select>';

    const attrSel = '<select data-name="attr" style="width:100%;padding:4px 6px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:11px;font-family:var(--font);background:var(--surf);">' +
      ATTRS.map(function (a) {
        return '<option value="' + a + '"' + (mem.attr === a ? ' selected' : '') + '>' + a + '</option>';
      }).join('') + '</select>';

    return '<tr data-idx="' + i + '">' +
      '<td style="text-align:center;">' + (i + 1) + '</td>' +
      '<td><span class="mav" style="background:' + av + '">' + name[0] + '</span> ' + escHtml(name) +
        ((mem.roles || []).includes('项目负责人') ? ' <span class="tag b" style="margin-left:4px;">负责人</span>' : '') +
      '</td>' +
      '<td>' + roleSel + '</td>' +
      '<td>' + attrSel + '</td>' +
      months.map(function (mon) {
        return '<td style="text-align:center;"><input type="number" class="m-hour" data-mon="' + mon + '" value="' + ((mem.hours && mem.hours[mon]) || '') + '" min="0" step="1" style="width:58px;text-align:center;padding:6px 4px;font-size:12px;" oninput="calcMemTotal(this)"></td>';
      }).join('') +
      '<td class="m-total" style="text-align:center;font-weight:600;">' + total + '</td>' +
      '<td><button class="btn btn-gh btn-sm" style="color:var(--red);" onclick="removeTmpMem(' + i + '); this.closest(\'.mod\').remove(); showMemModal();">移除</button></td>' +
    '</tr>';
  }).join('');

  const emptyRow = !tmpMems.length
    ? '<tr><td colspan="' + (4 + months.length + 2) + '" style="text-align:center;color:var(--tx3);padding:40px;">暂无成员，请点击右上角添加</td></tr>'
    : '';

  m.innerHTML = '<div class="mod-p" style="max-width:95vw;width:1100px;">' +
    '<div class="mod-h"><h3>编辑项目成员</h3><button class="btn btn-gh btn-sm" onclick="this.closest(\'.mod\').remove()">&times;</button></div>' +
    '<div class="mod-b">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">' +
        '<p style="font-size:12px;color:var(--tx2);">项目周期：<b>' + (p ? p.start || '—' : '—') + ' ~ ' + (p ? p.end || '—' : '—') + '</b>　|　角色选项来自飞书角色表（共' + ROLES.length + '个）</p>' +
        '<button class="btn btn-o btn-sm" onclick="showAddMemPicker()">+ 添加成员</button>' +
      '</div>' +
      '<div style="overflow-x:auto;">' +
        '<table class="mem-tbl" style="min-width:' + (500 + months.length * 72) + 'px;">' +
          '<thead><tr><th style="width:40px;text-align:center;">序号</th><th>姓名</th><th style="min-width:130px;">角色（多选）</th><th style="width:90px;">人员属性</th>' +
          months.map(function (mon) { return '<th style="min-width:72px;text-align:center;">' + mon + '</th>'; }).join('') +
          '<th style="width:80px;text-align:center;">工时总计</th><th style="width:60px;">操作</th></tr></thead>' +
          '<tbody>' + rows + emptyRow + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +
    '<div class="mod-f"><button class="btn btn-gh" onclick="this.closest(\'.mod\').remove()">取消</button><button class="btn btn-p" onclick="saveMems(this)">确认</button></div>' +
  '</div>';
  document.body.appendChild(m);
}

function showAddMemPicker() {
  const candidates = [];
  const seenNames = {};
  if (selProj && selProj.memberIds) {
    selProj.memberIds.forEach(function (m) {
      const nm = (m.name || '').trim();
      if (nm && !seenNames[nm]) {
        seenNames[nm] = true;
        candidates.push({ id: m.id, name: nm, dept: '', av: stringToColor(nm) });
      }
    });
  }
  PPL.forEach(function (x) {
    const nm = (x.name || '').trim();
    if (nm && !seenNames[nm]) {
      seenNames[nm] = true;
      candidates.push({ id: x.id, name: nm, dept: x.dept || '', av: x.av });
    }
  });

  const avail = candidates.filter(function (x) { return !tmpMems.some(function (m) { return m.pid === x.id; }); });
  if (!avail.length) { toast('暂无可添加人员', 'err'); return; }
  const m = document.createElement('div'); m.className = 'mod'; m.style.display = 'flex';
  m.onclick = function (e) { if (e.target === this) this.remove(); };
  m.innerHTML = '<div class="mod-p sm"><div class="mod-h"><h3>添加成员</h3><button class="btn btn-gh btn-sm" onclick="this.closest(\'.mod\').remove()">&times;</button></div>' +
    '<div class="mod-b">' +
    avail.map(function (x) {
      return '<label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bd);cursor:pointer;">' +
        '<input type="checkbox" data-pid="' + escAttr(x.id) + '" data-pname="' + escAttr(x.name) + '">' +
        '<span class="mav" style="background:' + x.av + '">' + (x.name || '?')[0] + '</span>' +
        '<span style="flex:1;font-weight:500;">' + escHtml(x.name) + '</span>' +
        '<span style="font-size:12px;color:var(--tx3);">' + escHtml(x.dept || '') + '</span></label>';
    }).join('') +
    '</div>' +
    '<div class="mod-f"><button class="btn btn-gh" onclick="this.closest(\'.mod\').remove()">取消</button><button class="btn btn-p" onclick="confirmAddMems(this)">确认添加</button></div></div>';
  document.body.appendChild(m);
}

function confirmAddMems(btn) {
  const checked = btn.closest('.mod').querySelectorAll('input[type="checkbox"]:checked');
  checked.forEach(function (cb) {
    tmpMems.push({
      pid: cb.dataset.pid,
      pname: cb.dataset.pname || cb.dataset.pid,
      roles: ['成员'],
      attr: '国智',
      hours: {},
      total: 0
    });
  });
  btn.closest('.mod').remove();
  document.querySelectorAll('.mod').forEach(function (x) { x.remove(); });
  showMemModal();
}

function saveMems(btn) {
  const rows = btn.closest('.mod').querySelectorAll('tbody tr[data-idx]');
  rows.forEach(function (row) {
    const idx = parseInt(row.dataset.idx);
    const roleSel = row.querySelector('select[data-name="roles"]');
    const roles = [];
    if (roleSel) {
      for (let ri = 0; ri < roleSel.options.length; ri++) {
        if (roleSel.options[ri].selected) roles.push(roleSel.options[ri].value);
      }
    }
    const attrSel = row.querySelector('select[data-name="attr"]');
    const attr = attrSel ? attrSel.value : '国智';
    const hours = {};
    let total = 0;
    row.querySelectorAll('.m-hour').forEach(function (inp) {
      const v = parseFloat(inp.value) || 0;
      hours[inp.dataset.mon] = v;
      total += v;
    });
    if (tmpMems[idx]) {
      tmpMems[idx].roles = roles.length ? roles : ['成员'];
      tmpMems[idx].attr = attr;
      tmpMems[idx].hours = hours;
      tmpMems[idx].total = total;
    }
  });
  btn.closest('.mod').remove();
  const tmpTbl = document.getElementById('tmpTbl');
  if (tmpTbl) tmpTbl.innerHTML = renderTmpMems();
  toast('已更新成员（' + tmpMems.length + '人），保存项目时同步至飞书', 'ok');
}
