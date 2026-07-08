/* ═══════════════════════════════════════════════════════════════
   MERGE — 待合并流程 + 已合并清单
   依赖: core.js (全局状态, Maps, 公共函数)
   ═══════════════════════════════════════════════════════════════ */

/* ═══ MERGE LIST ═══ */
function renderMerge() {
  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>待合并项目清单</h1><p class="subt">飞书同步项目的暂存区，仅管理员/PMO可操作（REQ-DS-002）</p></div><button class="btn btn-p" onclick="showCreateModal()">+ 手动创建项目</button></div>' +
    '<div class="ban w"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>此清单仅系统管理员/PMO可操作，需清洗合并后进入正式项目清单。</div>' +
    '<div class="tbl-wrap">' +
      (MERGE.length === 0 ? '<div class="empty">暂无待合并项目</div>' :
      '<table><thead><tr><th>类型</th><th>编号</th><th>名称</th><th>来源</th><th>同步时间</th><th>合并情况</th><th>操作</th></tr></thead><tbody>' +
      MERGE.map(function (m) {
        const tagClass = m.type === 'setup' ? 'b' : m.type === 'close' ? 'r' : 'gr';
        const tagText = m.type === 'setup' ? '立项' : m.type === 'close' ? '结项' : '手动创建';
        return '<tr>' +
          '<td><span class="tag ' + tagClass + '">' + tagText + '</span></td>' +
          '<td>' + (m.comboNo || m.no || '') + '</td>' +
          '<td><span class="ct">' + (m.f.name || m.name) + '</span></td>' +
          '<td>' + m.src + '</td>' +
          '<td style="font-size:12px;color:var(--tx2);">' + m.dt + '</td>' +
          '<td><span class="tag ' + (m.mergeStatus === '初始化' ? 'y' : 'gr') + '">' + (m.mergeStatus || '初始化') + '</span></td>' +
          '<td class="ca">' +
            '<button class="btn btn-p btn-sm" onclick="startMerge(\'' + m._id + '\')">合并项目信息</button>' +
            (m.type !== 'close' ? '<button class="btn btn-o btn-sm" onclick="quickNew(\'' + m._id + '\')">新建合并项目</button>' : '') +
          '</td></tr>';
      }).join('') + '</tbody></table>') +
    '</div>';
  page = 'merge';
}

function showCreateModal() {
  const m = document.createElement('div'); m.className = 'mod'; m.style.display = 'flex';
  m.onclick = function (e) { if (e.target === this) this.remove(); };
  m.innerHTML = '<div class="mod-p"><div class="mod-h"><h3>手动创建项目（REQ-PM-001）</h3><button class="btn btn-gh btn-sm" onclick="this.closest(\'.mod\').remove()">&times;</button></div>' +
    '<div class="mod-b">' +
      '<div class="f-row"><div class="fg"><label>项目名称 *</label><input type="text" id="ncn"></div><div class="fg"><label>项目编号</label><input type="text" id="ncno" placeholder="PRJ-2026-"></div></div>' +
      '<div class="f-row"><div class="fg"><label>项目类型</label><select id="nct">' +
        ['商业交付类项目（A类）','软件产品研发类项目（B类）','创新实验室项目（C类）','公司能力建设类项目（D类）'].map(function(t){return '<option>'+t+'</option>';}).join('') +
      '</select></div><div class="fg"><label>所属产品</label><select id="ncp">' + getProductOptions() + '</select></div></div>' +
      '<div class="fg"><label>项目描述</label><textarea id="ncd"></textarea></div>' +
    '</div>' +
    '<div class="mod-f"><button class="btn btn-gh" onclick="this.closest(\'.mod\').remove()">取消</button><button class="btn btn-p" onclick="doCreate(this)">创建</button></div></div>';
  document.body.appendChild(m);
}

async function doCreate(btn) {
  const nm = document.getElementById('ncn').value.trim();
  if (!nm) { toast('请输入项目名称', 'err'); return; }
  const newNo = document.getElementById('ncno').value || ('PRJ-' + new Date().getFullYear() + '-NEW');

  const mergeData = {
    '项目名称': nm,
    '项目编号': newNo,
    '项目类型': document.getElementById('nct').value,
    '所属产品大类': document.getElementById('ncp').value,
    '项目目标': document.getElementById('ncd').value || '',
    '流程类型': '立项',
    '合并情况': '初始化',
    '申请状态': '手动创建',
    '审批流程': '手动创建',
    '发起时间': new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  try {
    const result = await API.upsertMerge(null, mergeData);
    const recordId = (result && result.record_id) || ('m' + Date.now());
    MERGE.push({
      _id: recordId,
      flowType: '立项', mergeStatus: '初始化', applyStatus: '手动创建',
      no: newNo, comboNo: '', name: nm,
      type: 'setup', src: '手动创建',
      dt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      f: { name: nm, no: newNo, type: document.getElementById('nct').value,
           product: document.getElementById('ncp').value, desc: document.getElementById('ncd').value || '',
           leader: null, members: [], sponsor: null, category: '', scale: '', subProduct: '' },
      status: '初始化'
    });
  } catch (e) {
    console.warn('[merge] doCreate sync failed, using local only:', e);
    MERGE.push({
      _id: 'm' + Date.now(), flowType: '立项', mergeStatus: '初始化',
      no: newNo, comboNo: '', name: nm, type: 'setup', src: '手动创建（离线）',
      dt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      f: { name: nm, no: newNo, type: document.getElementById('nct').value,
           product: document.getElementById('ncp').value, desc: document.getElementById('ncd').value || '',
           leader: null, members: [], sponsor: null },
      status: '初始化'
    });
  }

  btn.closest('.mod').remove();
  addLogEntry('创建项目', nm, '手动创建至待合并清单');
  toast('项目已创建至待合并清单', 'ok');
  renderMerge(); updateBadges();
}

async function quickNew(mid) {
  const mi = MERGE.find(function (m) { return m._id === mid; });
  if (!mi) return;

  const newProj = createNewProject({
    name: mi.f.name, no: mi.f.no || mi.no || '', type: mi.f.type,
    scale: mi.f.scale || '', desc: mi.f.desc || '',
    product: mi.f.product || '', subProduct: mi.f.subProduct || '',
    leader: mi.f.leader, sponsor: mi.f.sponsor, members: mi.f.members || []
  });

  try {
    await API.createProject({
      '项目名称': newProj.name, '项目类型': newProj.type,
      '所属产品大类': newProj.product || '', '项目状态': '进行中',
      '项目目标': newProj.desc || '', '项目规模': newProj.scale || '',
      '项目计划开始时间': newProj.start
    });
  } catch (e) {
    console.warn('[merge] quickNew create project failed', e);
  }

  try {
    await API.updateMerge(mid, { '合并情况': '已合并' });
  } catch (e) {
    console.warn('[merge] quickNew update merge status failed', e);
    toast('合并状态写回失败，请手动刷新同步', 'err');
  }

  MERGED.push({
    _id: mi._id, no: mi.no, name: mi.name, flowType: mi.flowType,
    type: mi.type, src: mi.src, dt: mi.dt, f: structuredClone(mi.f),
    status: '已处理',
    mergedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    targetName: newProj.name
  });
  MERGE.splice(MERGE.indexOf(mi), 1);

  addLogEntry('快速新建', mi.f.name, '从待合并清单直接创建项目并标记已合并');
  toast('已新建项目，状态：进行中', 'ok');
  renderMerge(); updateBadges();
}

/* ═══ MERGE PROCESS ═══ */
function startMerge(mid) {
  selMerge = MERGE.find(function (m) { return m._id === mid; });
  if (!selMerge) return;
  mergeStep = selMerge.type === 'close' ? 0 : 1;
  page = 'merge';
  document.getElementById('bc').innerHTML = '待合并项目清单 &rsaquo; <span>合并项目信息</span>';
  renderMergeStep();
}

function renderMergeStep() {
  const mi = selMerge;
  const ct = document.getElementById('content');
  const isClose = mi.type === 'close';

  let stepHTML;
  if (isClose) {
    const sc = function (n) { return mergeStep === n ? 'on' : mergeStep > n ? 'ok' : ''; };
    stepHTML = '<div class="steps">' +
      '<div class="step ' + sc(0) + '"><span class="no">' + (mergeStep > 0 ? '✓' : '1') + '</span>编辑结项信息</div>' +
      '<div class="step-d ' + (mergeStep > 0 ? 'ok' : '') + '"></div>' +
      '<div class="step ' + sc(1) + '"><span class="no">' + (mergeStep > 1 ? '✓' : '2') + '</span>冲突检测</div>' +
      '<div class="step-d ' + (mergeStep > 1 ? 'ok' : '') + '"></div>' +
      '<div class="step ' + sc(2) + '"><span class="no">' + (mergeStep > 2 ? '✓' : '3') + '</span>字段比对</div>' +
      '<div class="step-d ' + (mergeStep > 2 ? 'ok' : '') + '"></div>' +
      '<div class="step ' + sc(3) + '"><span class="no">4</span>确认合并</div></div>';
  } else {
    const sc2 = function (n) { return mergeStep === n ? 'on' : mergeStep > n ? 'ok' : ''; };
    stepHTML = '<div class="steps">' +
      '<div class="step ' + sc2(1) + '"><span class="no">' + (mergeStep > 1 ? '✓' : '1') + '</span>冲突检测</div>' +
      '<div class="step-d ' + (mergeStep > 1 ? 'ok' : '') + '"></div>' +
      '<div class="step ' + sc2(2) + '"><span class="no">' + (mergeStep > 2 ? '✓' : '2') + '</span>字段比对</div>' +
      '<div class="step-d ' + (mergeStep > 2 ? 'ok' : '') + '"></div>' +
      '<div class="step ' + sc2(3) + '"><span class="no">3</span>确认合并</div></div>';
  }

  if (mergeStep === 0) {
    ct.innerHTML = stepHTML +
      '<div class="card" style="margin-bottom:20px;"><h3 style="margin-bottom:16px;">编辑结项信息（REQ-PM-007）</h3>' +
      '<p style="font-size:12px;color:var(--tx2);margin-bottom:16px;">请核对并修改结项信息，确认后进入冲突检测步骤。</p>' +
      '<div class="f-row"><div class="fg"><label>项目名称</label><input type="text" id="ce-name" value="' + (mi.f.name || '') + '"></div>' +
      '<div class="fg"><label>项目编号</label><input type="text" id="ce-no" value="' + (mi.f.no || '') + '"></div></div>' +
      '<div class="f-row"><div class="fg"><label>结项日期 *</label><input type="date" id="ce-closeDate" value="' + (mi.f.actualEnd || mi.f.closeDate || '') + '"></div>' +
      '<div class="fg"><label>结项原因 *</label><input type="text" id="ce-closeReason" value="' + (mi.f.closeReason || '') + '"></div></div>' +
      '<div class="fg"><label>项目描述</label><textarea id="ce-desc">' + (mi.f.desc || '') + '</textarea></div>' +
      '<div style="text-align:right;margin-top:16px;"><button class="btn btn-p btn-lg" onclick="saveCloseInfo()">下一步 &rarr;</button></div></div>';
    return;
  }

  if (mergeStep === 1) {
    const cf = PROJ.filter(function (p) {
      return (p.yonyouNo && mi.f.no && p.yonyouNo === mi.f.no) ||
             (p.name && mi.f.name && (p.name.includes(mi.f.name.substring(0, 4)) || mi.f.name.includes(p.name.substring(0, 4))));
    });
    const tagCls = mi.type === 'setup' ? 'b' : mi.type === 'close' ? 'r' : 'gr';
    const tagTx = mi.type === 'setup' ? '立项' : mi.type === 'close' ? '结项' : '手动创建';
    ct.innerHTML = stepHTML +
      '<div class="card" style="margin-bottom:20px;background:var(--pri-l);border-color:var(--pri);">' +
        '<div style="font-size:12px;color:var(--tx2);">待合并项目（' + (mi.src || '') + '）</div>' +
        '<div style="font-weight:700;font-size:16px;margin:4px 0;">' + mi.f.name + '</div>' +
        '<div>' + (mi.f.comboNo || mi.f.no || '') + ' · <span class="tag ' + tagCls + '">' + tagTx + '</span></div>' +
      '</div>' +
      '<h3 style="margin-bottom:12px;">' + (cf.length ? '疑似冲突项目（按编号、名称关键词匹配）' : '选择目标项目') + '</h3>' +
      '<div class="tbl-wrap"><table><thead><tr><th>编号</th><th>名称</th><th>产品</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
        (cf.length ? cf : PROJ).map(function (c) {
          return '<tr><td>' + (c.yonyouNo || '') + '</td><td><span class="ct">' + c.name + '</span></td><td>' + (c.product || '') + '</td>' +
            '<td><span class="tag gr">' + ({'进行中':'进行中','已完成':'已完成','挂起':'挂起','已作废':'已作废','已结项':'已结项'}[c.status] || c.status) + '</span></td>' +
            '<td><button class="btn btn-p btn-sm" onclick="selConflict(\'' + c._id + '\')">选择此项目</button></td></tr>';
        }).join('') +
      '</tbody></table></div>' +
      (mi.type !== 'close' ? '<div style="margin-top:16px;"><button class="btn btn-o" onclick="mergeAsNew()">+ 新建合并项目（跳过字段比对）</button></div>' : '');
    return;
  }

  if (mergeStep === 2) {
    const tgt = PROJ_BY_ID.get(mi._cid);
    const fields = [
      {k: 'name', l: '项目名称'}, {k: 'no', l: '项目编号'},
      {k: 'type', l: '项目类型'}, {k: 'product', l: '所属产品'},
      {k: 'scale', l: '项目规模'}, {k: 'desc', l: '项目描述'}
    ];
    if (mi.type === 'close') fields.push({k: 'actualEnd', l: '结项日期'}, {k: 'closeReason', l: '结项原因'});
    if (!mi._choices) { mi._choices = {}; fields.forEach(function (f) { mi._choices[f.k] = 'merge'; }); }

    ct.innerHTML = stepHTML +
      '<p style="margin-bottom:16px;color:var(--tx2);">逐字段比对，点击选择保留的数据来源。</p>' +
      '<div class="card" style="padding:0;">' +
      fields.map(function (f) {
        let mv = mi.f[f.k] === undefined || mi.f[f.k] === null ? '—' : String(mi.f[f.k]);
        let tv = (tgt && tgt[f.k] !== undefined ? String(tgt[f.k]) : '—');
        if (f.k === 'leader') {
          mv = (mi.f.leader && mi.f.leader.name) || mv;
          tv = (tgt && tgt.leader && tgt.leader.name) || tv;
        }
        return '<div class="cmp"><span class="fl">' + f.l + '</span><div class="fo">' +
          '<div class="opt sel" onclick="selOpt(this,\'' + f.k + '\',\'merge\')"><span class="rd"></span>' + mv + '</div>' +
          '<div class="opt" onclick="selOpt(this,\'' + f.k + '\',\'target\')"><span class="rd"></span>' + tv + '</div>' +
        '</div></div>';
      }).join('') + '</div>' +
      '<div style="margin-top:20px;text-align:right;"><button class="btn btn-p btn-lg" onclick="goStep(3)">下一步 &rarr;</button></div>';
    return;
  }

  if (mergeStep === 3) {
    const tgt2 = mi._cid ? PROJ_BY_ID.get(mi._cid) : null;
    ct.innerHTML = stepHTML +
      '<div class="card" style="text-align:center;padding:40px;">' +
        '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2" style="margin-bottom:16px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
        '<h2 style="margin-bottom:8px;">确认合并</h2>' +
        '<p style="color:var(--tx2);">合并至：<b>' + (tgt2 ? tgt2.name : '新建项目') + '</b></p>' +
        '<p style="color:var(--tx2);margin-bottom:20px;">合并后状态：<b>' + (mi.type === 'close' ? '已结项' : '进行中') + '</b></p>' +
        '<div style="display:flex;gap:10px;justify-content:center;">' +
          '<button class="btn btn-s btn-lg" onclick="doMerge()">确认合并（同步飞书）</button>' +
          '<button class="btn btn-gh" onclick="goStep(2)">返回修改</button>' +
        '</div>' +
      '</div>';
  }
}

function selConflict(cid) { selMerge._cid = cid; mergeStep = 2; renderMergeStep(); }
function mergeAsNew() { selMerge._cid = null; mergeStep = 3; renderMergeStep(); }
function goStep(s) { mergeStep = s; renderMergeStep(); }

function saveCloseInfo() {
  const mi = selMerge;
  const cd = document.getElementById('ce-closeDate').value;
  const cr = document.getElementById('ce-closeReason').value;
  if (!cd) { toast('请填写结项日期', 'err'); return; }
  if (!cr) { toast('请填写结项原因', 'err'); return; }
  mi.f.name = document.getElementById('ce-name').value;
  mi.f.no = document.getElementById('ce-no').value;
  mi.f.actualEnd = cd; mi.f.closeReason = cr;
  mi.f.desc = document.getElementById('ce-desc').value;
  mergeStep = 1; renderMergeStep();
}

function selOpt(el, k, src) {
  el.parentElement.querySelectorAll('.opt').forEach(function (o) { o.classList.remove('sel'); });
  el.classList.add('sel');
  selMerge._choices[k] = src;
}

/* doMerge — 执行合并并写回 bitable */
async function doMerge() {
  const mi = selMerge;
  const tgt = mi._cid ? PROJ_BY_ID.get(mi._cid) : null;

  if (tgt) {
    Object.keys(mi._choices || {}).forEach(function (k) {
      if (k === 'actualEnd' || k === 'closeReason') return;
      if (mi._choices[k] === 'merge' && mi.f[k] !== undefined) tgt[k] = mi.f[k];
    });
    tgt.status = mi.type === 'close' ? '已结项' : '进行中';

    try {
      await API.updateProject(tgt._id, {
        '项目名称': tgt.name,
        '项目类型': tgt.type,
        '所属产品大类': tgt.product || '',
        '项目状态': tgt.status,
        '项目目标': tgt.desc || ''
      });
    } catch (e) { console.warn('[merge] doMerge update project failed', e); }
  } else {
    const newProj = createNewProject({
      name: mi.f.name, no: mi.f.no || '', type: mi.f.type,
      scale: mi.f.scale || '', desc: mi.f.desc || '',
      product: mi.f.product || '', subProduct: mi.f.subProduct || '',
      leader: mi.f.leader, sponsor: mi.f.sponsor, members: mi.f.members || []
    });
    try {
      await API.createProject({
        '项目名称': mi.f.name,
        '项目类型': mi.f.type,
        '所属产品大类': mi.f.product || '',
        '项目状态': '进行中',
        '项目目标': mi.f.desc || '',
        '项目规模': mi.f.scale || '',
        '项目计划开始时间': new Date().toISOString().split('T')[0]
      });
    } catch (e) { console.warn('[merge] doMerge create project failed', e); }
  }

  try {
    await API.updateMerge(mi._id, { '合并情况': '已合并' });
  } catch (e) {
    console.warn('[merge] doMerge update merge status failed', e);
  }

  MERGED.push({
    _id: mi._id, no: mi.no, name: mi.name, flowType: mi.flowType,
    type: mi.type, src: mi.src, dt: mi.dt, f: structuredClone(mi.f),
    _cid: mi._cid || null, _choices: mi._choices ? structuredClone(mi._choices) : {},
    status: '已处理',
    mergedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    targetName: tgt ? tgt.name : '新建项目'
  });
  MERGE.splice(MERGE.indexOf(mi), 1);

  addLogEntry('合并项目', mi.f.name, (mi.type === 'close' ? '结项' : '立项') + '合并至项目清单');
  toast('项目合并完成！已同步至飞书', 'ok');
  updateBadges(); renderMerge();
}

/* ═══ MERGED PROJECT LIST ═══ */
function renderMerged(flt) {
  const f = flt || 'all';
  let list = [...MERGED];
  if (f !== 'all') list = list.filter(function (m) { return m.status === f; });

  const tagCls = { 'setup': 'b', 'close': 'r', 'both': 'y', 'manual': 'gr' };
  const tagTx = { 'setup': '立项', 'close': '结项', 'both': '立项+结项', 'manual': '手动创建' };
  const statusCls = { '已处理': 'g', '初始化': 'y' };

  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>已合并项目清单</h1><p class="subt">合并完成的项目记录。可重置状态移回待合并清单。</p></div></div>' +
    '<div class="tbl-wrap">' +
      '<div class="tbl-bar">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<span style="font-size:12px;font-weight:600;color:var(--tx2);">状态筛选：</span>' +
          '<div class="ft">' +
            '<button class="' + (f === 'all' ? 'sel' : '') + '" onclick="renderMerged(\'all\')">全部</button>' +
            '<button class="' + (f === '已处理' ? 'sel' : '') + '" onclick="renderMerged(\'已处理\')">已处理</button>' +
          '</div>' +
        '</div>' +
        '<span style="font-size:12px;color:var(--tx3);">共 ' + list.length + ' 条记录</span>' +
      '</div>' +
      (list.length === 0 ? '<div class="empty">暂无已合并项目记录</div>' :
      '<table><thead><tr><th>类型</th><th>编号</th><th>名称</th><th>来源</th><th>合并至</th><th>合并时间</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
      list.map(function (m) {
        return '<tr>' +
          '<td><span class="tag ' + (tagCls[m.type] || 'gr') + '">' + (tagTx[m.type] || m.type) + '</span></td>' +
          '<td>' + (m.no || '') + '</td>' +
          '<td><span class="ct">' + (m.f.name || m.name) + '</span></td>' +
          '<td>' + m.src + '</td>' +
          '<td>' + (m.targetName || '—') + '</td>' +
          '<td style="font-size:12px;color:var(--tx2);">' + (m.mergedAt || '') + '</td>' +
          '<td><span class="tag ' + (statusCls[m.status] || 'gr') + '">' + m.status + '</span></td>' +
          '<td class="ca">' +
            (m.status === '已处理' ? '<button class="btn btn-o btn-sm" onclick="resetMergeStatus(\'' + m._id + '\')">重置为初始化</button>' : '') +
          '</td></tr>';
      }).join('') + '</tbody></table>') +
    '</div>';
  page = 'merged';
}

async function resetMergeStatus(mid) {
  const mi = MERGED.find(function (m) { return m._id === mid; });
  if (!mi) return;
  if (!confirm('确定将项目「' + mi.f.name + '」状态重置为「初始化」并移回待合并项目清单？')) return;

  try {
    await API.updateMerge(mid, { '合并情况': '初始化' });
  } catch (e) {
    toast('重置失败：' + e.message, 'err');
    return;
  }

  MERGED.splice(MERGED.indexOf(mi), 1);
  MERGE.push({
    _id: mi.id, flowType: mi.flowType, mergeStatus: '初始化',
    no: mi.no, name: mi.name, type: mi.type, src: mi.src, dt: mi.dt,
    comboNo: (mi.f && mi.f.comboNo) || '',
    f: structuredClone(mi.f), status: '初始化'
  });
  addLogEntry('重置合并状态', mi.f.name, '状态由「已处理」重置为「初始化」');
  updateBadges(); renderMerged();
  toast('已重置为初始化', 'ok');
}
