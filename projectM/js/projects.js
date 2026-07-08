/* ═══════════════════════════════════════════════════════════════
   PROJECTS — 项目清单/详情/编辑
   依赖: core.js (全局状态, Maps, 公共函数)
   ═══════════════════════════════════════════════════════════════ */

// 项目清单所有可用筛选项（基于多维表格实际字段动态提取）
function getFilterOptions() {
  const leaderMap = new Map();
  PROJ.forEach(function (p) { if (p.leader && p.leader.id) leaderMap.set(p.leader.id, p.leader); });
  const sponsorMap = new Map();
  PROJ.forEach(function (p) { if (p.sponsor && p.sponsor.id) sponsorMap.set(p.sponsor.id, p.sponsor); });

  return {
    statuses: ['进行中', '已完成', '挂起', '已作废', '已结项'],
    scales:   [...new Set(PROJ.map(function (p) { return p.scale; }).filter(Boolean))].sort(),
    costTypes:[...new Set(PROJ.map(function (p) { return p.costType; }).filter(Boolean))].sort(),
    types:    ['商业交付类项目（A类）', '软件产品研发类项目（B类）', '创新实验室项目（C类）', '公司能力建设类项目（D类）'],
    products: [...new Set(PROJ.map(function (p) { return p.product; }).filter(Boolean))].sort(),
    leaders:  [...leaderMap.values()],
    sponsors: [...sponsorMap.values()]
  };
}

// 应用筛选条件，返回过滤后的列表
function getFilteredList() {
  let list = [...PROJ];
  const q = searchQuery;
  if (q) { list = list.filter(function (p) { return (p.name||'').toLowerCase().includes(q) || (p.yonyouNo||'').toLowerCase().includes(q) || (p.feishuNo||'').toLowerCase().includes(q); }); }
  if (filterStatus !== 'all')    list = list.filter(function (p) { return p.status === filterStatus; });
  if (filterProduct !== 'all')   list = list.filter(function (p) { return p.product === filterProduct; });
  if (filterType !== 'all')      list = list.filter(function (p) { return (p.type || '').indexOf(filterType) >= 0; });
  if (filterScale !== 'all')     list = list.filter(function (p) { return p.scale === filterScale; });
  if (filterCostType !== 'all')  list = list.filter(function (p) { return p.costType === filterCostType; });
  if (filterLeader !== 'all')    list = list.filter(function (p) { return (p.leader && p.leader.id) === filterLeader; });
  if (filterSponsor !== 'all')   list = list.filter(function (p) { return (p.sponsor && p.sponsor.id) === filterSponsor; });
  if (filterDateFrom)            list = list.filter(function (p) { return p.start >= filterDateFrom; });
  if (filterDateTo)              list = list.filter(function (p) { return p.end <= filterDateTo; });
  return list;
}

// 仅更新结果区和计数（搜索/筛选变化时调用，不碰输入框）
function applyFilters() {
  const list = getFilteredList();
  const hasActive = filterStatus !== 'all' || filterProduct !== 'all' || filterType !== 'all' ||
    filterScale !== 'all' || filterCostType !== 'all' || filterLeader !== 'all' || filterSponsor !== 'all' ||
    filterDateFrom || filterDateTo || searchQuery;
  const cntEl = document.getElementById('projCount');
  if (cntEl) cntEl.innerHTML = '共 <b style="color:var(--tx);">' + list.length + '</b> 个项目';
  const clrEl = document.getElementById('projClearBtn');
  if (clrEl) clrEl.style.display = hasActive ? '' : 'none';
  const resultsEl = document.getElementById('projResults');
  if (resultsEl) resultsEl.innerHTML = (viewMode === 'tree' ? treeView(list) : tblView(list));
}

function renderProj() {
  const opts = getFilterOptions();
  const list = getFilteredList();
  const hasActive = filterStatus !== 'all' || filterProduct !== 'all' || filterType !== 'all' ||
    filterScale !== 'all' || filterCostType !== 'all' || filterLeader !== 'all' || filterSponsor !== 'all' ||
    filterDateFrom || filterDateTo || searchQuery;
  const sel = function (v, cur) { return v === cur ? ' selected' : ''; };
  const stBtn = function (v, l) { return '<button class="' + (filterStatus === v ? 'sel' : '') + '" onclick="setF(\'' + v + '\',this)">' + l + '</button>'; };

  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>项目清单</h1><p class="subt">管理所有项目信息 — 支持8维度筛选，数据实时对应飞书多维表格</p></div></div>' +
    '<div class="tbl-wrap">' +
      '<div class="tbl-bar" style="flex-wrap:wrap;gap:8px;">' +
        '<div class="tbl-src" style="width:320px;">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--tx3);flex-shrink:0;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
          '<input type="text" placeholder="搜索名称、编号..." id="projQ" oninput="searchQuery=this.value.trim().toLowerCase();applyFilters();">' +
        '</div>' +
        '<div class="ft">' + stBtn('all', '全部') + opts.statuses.map(function (s) { return stBtn(s, s); }).join('') + '</div>' +
        '<div class="ft"><button class="' + (viewMode === 'list' ? 'sel' : '') + '" onclick="setV(\'list\')">列表</button><button class="' + (viewMode === 'tree' ? 'sel' : '') + '" onclick="setV(\'tree\')">按产品分组</button></div>' +
      '</div>' +
      '<div style="padding:8px 20px;border-bottom:1px solid var(--bd);background:var(--mu);">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:' + (filterExpanded ? '8px' : '0') + ';">' +
          '<button class="btn btn-gh btn-sm" onclick="filterExpanded=!filterExpanded;renderProj()" style="font-size:11px;gap:3px;">' + (filterExpanded ? '▼' : '▶') + ' 高级筛选' +
            '<span class="tag b" style="margin-left:4px;font-size:10px;' + (hasActive ? '' : 'display:none;') + '">已激活</span></button>' +
          '<button id="projClearBtn" class="btn btn-gh btn-sm" style="color:var(--red);font-size:11px;' + (hasActive ? '' : 'display:none;') + '" onclick="clearAllFilters()">✕ 清除全部筛选</button>' +
          '<span style="font-size:12px;color:var(--tx3);margin-left:auto;" id="projCount">共 <b style="color:var(--tx);">' + list.length + '</b> 个项目</span>' +
        '</div>' +
        (filterExpanded ?
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;">' +
            '<select class="filter-select" onchange="setFilterVal(\'type\',this.value)">' +
              '<option value="all"' + sel(filterType, 'all') + '>项目类型：全部</option>' + opts.types.map(function (t) { return '<option value="' + t + '"' + sel(filterType, t) + '>' + t + '</option>'; }).join('') +
            '</select>' +
            '<select class="filter-select" onchange="setFilterVal(\'product\',this.value)">' +
              '<option value="all"' + sel(filterProduct, 'all') + '>所属产品：全部</option>' + getProductOptions(filterProduct === 'all' ? '' : filterProduct) +
            '</select>' +
            '<select class="filter-select" onchange="setFilterVal(\'scale\',this.value)">' +
              '<option value="all"' + sel(filterScale, 'all') + '>项目规模：全部</option>' + opts.scales.map(function (s) { return '<option value="' + s + '"' + sel(filterScale, s) + '>' + s + '</option>'; }).join('') +
            '</select>' +
            '<select class="filter-select" onchange="setFilterVal(\'costType\',this.value)">' +
              '<option value="all"' + sel(filterCostType, 'all') + '>费用类型：全部</option>' + opts.costTypes.map(function (c) { return '<option value="' + c + '"' + sel(filterCostType, c) + '>' + c + '</option>'; }).join('') +
            '</select>' +
            '<select class="filter-select" onchange="setFilterVal(\'leader\',this.value)">' +
              '<option value="all"' + sel(filterLeader, 'all') + '>负责人：全部</option>' + opts.leaders.map(function (l) { return '<option value="' + l.id + '"' + sel(filterLeader, l.id) + '>' + (l.name || l.id) + '</option>'; }).join('') +
            '</select>' +
            '<select class="filter-select" onchange="setFilterVal(\'sponsor\',this.value)">' +
              '<option value="all"' + sel(filterSponsor, 'all') + '>发起人：全部</option>' + opts.sponsors.map(function (s) { return '<option value="' + s.id + '"' + sel(filterSponsor, s.id) + '>' + (s.name || s.id) + '</option>'; }).join('') +
            '</select>' +
            '<div style="display:flex;align-items:center;gap:4px;">' +
              '<input type="date" class="filter-date" value="' + filterDateFrom + '" onchange="setFilterVal(\'dateFrom\',this.value)">' +
              '<span style="color:var(--tx3);font-size:10px;">~</span>' +
              '<input type="date" class="filter-date" value="' + filterDateTo + '" onchange="setFilterVal(\'dateTo\',this.value)">' +
            '</div>' +
          '</div>' : '') +
      '</div>' +
      '<div id="projResults">' + (viewMode === 'tree' ? treeView(list) : tblView(list)) + '</div>' +
    '</div>';
}

// ── 列表视图：完整字段列 ──
function tblView(list) {
  const tc = { '进行中': 'g', '已完成': 'b', '挂起': 'y', '已作废': 'r', '已结项': 'gr' };
  if (!list.length) return '<div class="empty">暂无匹配项目<span style="display:block;font-size:11px;color:var(--tx3);margin-top:4px;">尝试调整筛选条件或清除筛选</span></div>';

  return '<div style="overflow-x:auto;"><table style="width:100%;">' +
    '<thead><tr>' +
      '<th style="min-width:160px;">项目名称</th><th>飞书项目编号</th><th>类型</th><th>产品</th><th>子产品</th>' +
      '<th>负责人</th><th>开始</th><th>结束</th><th>状态</th><th style="min-width:120px;">操作</th>' +
    '</tr></thead><tbody>' +
    list.map(function (p) { return renderProjectRow(p, tc); }).join('') + '</tbody></table></div>';
}

// ── 按产品分组视图（一次遍历分组，O(n)） ──
function treeView(list) {
  const tc = { '进行中': 'g', '已完成': 'b', '挂起': 'y', '已作废': 'r', '已结项': 'gr' };
  if (!list.length) return '<div class="empty">暂无匹配项目</div>';

  // 单次遍历分组
  const groups = {};
  list.forEach(function (p) {
    const k = p.product || '未分类';
    if (!groups[k]) groups[k] = [];
    groups[k].push(p);
  });

  return Object.keys(groups).map(function (prod) {
    const items = groups[prod];
    return '<div style="padding:0 20px 16px;">' +
      '<div style="display:flex;align-items:center;gap:8px;padding:10px 0;font-weight:700;font-size:14px;color:var(--tx2);border-bottom:1px solid var(--bd);margin-bottom:6px;">' +
        escHtml(prod) + ' <span style="font-weight:400;font-size:12px;color:var(--tx3);">(' + items.length + '个项目)</span>' +
      '</div>' +
      '<div style="overflow-x:auto;"><table style="width:100%;"><thead><tr>' +
        '<th>名称</th><th>飞书项目编号</th><th>类型</th><th>负责人</th><th>开始</th><th>结束</th><th>状态</th><th>操作</th>' +
      '</tr></thead><tbody>' +
      items.map(function (p) { return renderProjectRow(p, tc); }).join('') +
      '</tbody></table></div></div>';
  }).join('');
}

// ── 共享项目行渲染（tblView / treeView 共用） ──
function renderProjectRow(p, tc) {
  const ldr = p.leader || {};
  const spn = p.sponsor || {};
  const sd = p.status === '进行中' ? '#059669' : p.status === '已完成' ? '#2563EB' : p.status === '挂起' ? '#D97706' : p.status === '已作废' ? '#DC2626' : '#94A3B8';
  const st = { '进行中': '进行中', '已完成': '已完成', '挂起': '挂起', '已作废': '已作废', '已结项': '已结项' };

  return '<tr onclick="openDet(\'' + p._id + '\')">' +
    '<td><span class="ct" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;display:inline-block;">' + escHtml(p.name) + '</span></td>' +
    '<td style="font-size:11px;color:var(--tx3);white-space:nowrap;">' + (p.feishuNo || '—') + '</td>' +
    '<td><span class="tag gr" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;">' + escHtml(p.type) + '</span></td>' +
    '<td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;">' + escHtml(p.product || '—') + '</td>' +
    '<td style="font-size:11px;color:var(--tx3);max-width:100px;overflow:hidden;text-overflow:ellipsis;">' + escHtml(p.subProduct || '—') + '</td>' +
    '<td style="white-space:nowrap;">' + (ldr.name ? '<span class="mav" style="background:#2563EB;width:22px;height:22px;font-size:10px;">' + ldr.name[0] + '</span>' + escHtml(ldr.name) : '—') + '</td>' +
    '<td style="font-size:11px;white-space:nowrap;">' + (p.start || '—') + '</td>' +
    '<td style="font-size:11px;white-space:nowrap;">' + (p.end || '—') + '</td>' +
    '<td><span class="tag ' + (tc[p.status] || '') + '"><span class="tag d" style="background:' + sd + '"></span>' + (st[p.status] || p.status) + '</span></td>' +
    '<td class="ca" onclick="event.stopPropagation();">' +
      '<button class="btn btn-gh btn-sm" onclick="openDet(\'' + p._id + '\')">查看</button>' +
      (canEdit() ? '<button class="btn btn-o btn-sm" onclick="editProj(\'' + p._id + '\')">编辑</button>' : '') +
    '</td></tr>';
}

// ── 筛选操作函数 ──
function setF(s, btn) {
  filterStatus = s;
  btn.parentElement.querySelectorAll('button').forEach(function (b) { b.classList.remove('sel'); });
  btn.classList.add('sel');
  applyFilters();
}

function setV(v) {
  viewMode = v;
  applyFilters();
}

function setFilterVal(dim, val) {
  switch (dim) {
    case 'product':  filterProduct  = val; break;
    case 'type':     filterType     = val; break;
    case 'scale':    filterScale    = val; break;
    case 'costType': filterCostType = val; break;
    case 'leader':   filterLeader   = val; break;
    case 'sponsor':  filterSponsor  = val; break;
    case 'dateFrom': filterDateFrom = val; break;
    case 'dateTo':   filterDateTo   = val; break;
  }
  applyFilters();
}

function clearAllFilters() {
  filterProduct = 'all'; filterType = 'all'; filterScale = 'all';
  filterCostType = 'all'; filterLeader = 'all'; filterSponsor = 'all';
  filterStatus = 'all'; filterDateFrom = ''; filterDateTo = ''; searchQuery = '';
  const inp = document.getElementById('projQ'); if (inp) inp.value = '';
  applyFilters();
}

/* ═══════════════════════════════════════════════════════════════
   PROJECT DETAIL
   ═══════════════════════════════════════════════════════════════ */
function openDet(pid) {
  const p = PROJ_BY_ID.get(pid);
  if (!p) return;
  selProj = p;
  const st = { '进行中': '进行中', '已完成': '已完成', '挂起': '挂起', '已作废': '已作废', '已结项': '已结项' };
  const tc = { '进行中': 'g', '已完成': 'b', '挂起': 'y', '已作废': 'r', '已结项': 'gr' };
  const statusColors = { '进行中': '#059669', '已完成': '#2563EB', '挂起': '#D97706', '已作废': '#DC2626', '已结项': '#94A3B8' };
  const ldr = p.leader || {};
  const spn = p.sponsor || {};

  let memberTags = '';
  if (p.members && p.members.length) {
    memberTags = p.members.map(function (m) {
      let name = m.pname || '';
      const pp = PPL_BY_ID.get(m.pid) || PPL_BY_ID.get(name);
      if (pp && !name) name = pp.name;
      if (!name) name = m.pid || '未知';
      const av = pp ? pp.av : stringToColor(name);
      return '<span style="display:inline-flex;align-items:center;gap:4px;margin:2px 6px 2px 0;padding:4px 10px;background:var(--mu);border-radius:20px;font-size:12px;">' +
        '<span class="mav" style="background:' + av + ';width:22px;height:22px;font-size:10px;margin:0;">' + name[0] + '</span>' +
        escHtml(name) +
        '</span>';
    }).join('');
  } else {
    memberTags = '<span style="color:var(--tx3);font-size:12px;">—</span>';
  }

  const memberTable = renderMemberTable(p);

  document.getElementById('bc').innerHTML = '项目清单 &rsaquo; <span>' + escHtml(p.name) + '</span>';
  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>' + escHtml(p.name) + '</h1><p class="subt">飞书项目编号：' + escHtml(p.feishuNo || '—') + '</p></div>' +
      '<div class="phr">' +
        (canEdit() ? '<button class="btn btn-p" onclick="startEdit()">编辑项目</button>' : '') +
        '<button class="btn btn-gh" onclick="navTo(\'proj\')">&larr; 返回清单</button>' +
      '</div></div>' +
    '<div id="dv">' +
      '<div class="d-row">' +
        '<div class="card"><div class="card-hd">📋 基本信息</div>' +
          dlRow('项目名称', escHtml(p.name)) +
          
          dlRow('飞书项目编号', escHtml(p.feishuNo || '—')) +
          dlRow('项目状态', '<span class="tag ' + tc[p.status] + '"><span class="tag d" style="background:' + (statusColors[p.status] || '#94A3B8') + '"></span>' + (st[p.status] || p.status) + '</span>') +
          dlRow('项目类型', '<span class="tag gr">' + escHtml(p.type || '—') + '</span>') +
          dlRow('费用类型', escHtml(p.costType || '—')) +
          
          dlRow('所属产品大类', escHtml(p.product || '—')) +
          dlRow('子产品名称', escHtml(p.subProduct || '—')) +
        '</div>' +
        '<div class="card"><div class="card-hd">📅 时间与人员</div>' +
          dlRow('项目立项时间', escHtml(p.createdAt || '—')) +
          dlRow('计划开始时间', escHtml(p.start || '—')) +
          dlRow('计划结束时间', escHtml(p.end || '—')) +
          dlRow('项目完成时间', escHtml(p.completedAt || '—')) +
          dlRow('项目负责人', ldr.name ? '<span class="mav" style="background:#2563EB;width:22px;height:22px;font-size:10px;">' + ldr.name[0] + '</span> ' + escHtml(ldr.name) : '—') +
          
          dlRow('项目目标', '<span style="font-size:12px;line-height:1.6;">' + escHtml(p.desc || '—') + '</span>') +
          dlRow('备注', '<span style="font-size:12px;color:var(--tx3);">' + escHtml(p.note || '—') + '</span>') +
          dlRow('项目成员', memberTags) +
        '</div>' +
      '</div>' +
      '<div class="card" style="margin-bottom:20px;"><div class="card-hd">👥 项目成员工时明细（' + (p.members || []).length + '人）</div>' +
        memberTable +
      '</div>' +
    '</div>' +
    '<div id="de" style="display:none;"></div>';
  page = 'proj';
}

/* ═══════════════════════════════════════════════════════════════
   PROJECT EDIT
   ═══════════════════════════════════════════════════════════════ */
function editProj(pid) {
  const p = PROJ_BY_ID.get(pid);
  if (!p || !canEdit()) return;
  selProj = p;
  openDet(pid);
  setTimeout(function () { startEdit(); }, 100);
}

function startEdit() {
  if (!selProj) return;
  editData = structuredClone(selProj);
  tmpMems = structuredClone(selProj.members || []);
  const p = selProj;
  const ldr = p.leader || {};
  const spn = p.sponsor || {};

  document.getElementById('dv').style.display = 'none';
  document.getElementById('de').style.display = '';

  const typeOpts = ['商业交付类项目（A类）', '软件产品研发类项目（B类）', '创新实验室项目（C类）', '公司能力建设类项目（D类）'];
  const selOpt = function (val, cur) { return val === cur ? ' selected' : ''; };

  document.getElementById('de').innerHTML =
    '<div class="d-row">' +
      '<div class="card"><div class="card-hd">核心信息</div>' +
        '<div class="fg"><label>项目名称 *</label><input type="text" id="en" value="' + escAttr(p.name) + '"></div>' +
        '<div class="f-row"><div class="fg"><label>用友项目编号</label><input type="text" id="eno" value="' + escAttr(p.yonyouNo || '') + '"></div>' +
        '<div class="fg"><label>飞书项目编号</label><input type="text" id="efn" value="' + escAttr(p.feishuNo || '') + '"></div></div>' +
        '<div class="f-row"><div class="fg"><label>项目类型</label><select id="et">' +
          typeOpts.map(function (t) { return '<option value="' + t + '"' + selOpt(t, p.type) + '>' + t + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="fg"><label>所属产品大类</label><select id="ep">' + getProductOptions(p.product) + '</select></div></div>' +
        '<div class="f-row"><div class="fg"><label>子产品名称</label><input type="text" id="esp" value="' + escAttr(p.subProduct || '') + '"></div>' +
        '<div class="fg"><label>项目规模</label><input type="text" id="esc" value="' + escAttr(p.scale || '') + '" placeholder="如：I类 / II类 / III类"></div></div>' +
        '<div class="fg"><label>费用类型</label><input type="text" id="ect" value="' + escAttr(p.costType || '') + '" placeholder="如：合同履约成本"></div>' +
      '</div>' +
      '<div class="card"><div class="card-hd">人员与时间</div>' +
        '<div class="f-row"><div class="fg"><label>项目负责人</label><select id="eld">' +
          PPL.map(function (x) { return '<option value="' + x.id + '"' + selOpt(x.id, ldr.id || '') + '>' + x.name + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="fg"><label>项目发起人</label><select id="espn">' +
          '<option value="">— 未指定 —</option>' +
          PPL.map(function (x) { return '<option value="' + x.id + '"' + selOpt(x.id, spn.id || '') + '>' + x.name + '</option>'; }).join('') +
        '</select></div></div>' +
        '<div class="f-row"><div class="fg"><label>计划开始日期</label><input type="date" id="es" value="' + p.start + '" onchange="editData.start=this.value; syncMemHours(); document.getElementById(\'tmpTbl\').innerHTML=renderTmpMems();"></div>' +
        '<div class="fg"><label>计划结束日期</label><input type="date" id="ee" value="' + p.end + '" onchange="editData.end=this.value; syncMemHours(); document.getElementById(\'tmpTbl\').innerHTML=renderTmpMems();"></div></div>' +
        '<div class="f-row"><div class="fg"><label>项目立项时间</label><input type="date" id="ecr" value="' + (p.createdAt || '') + '"></div>' +
        '<div class="fg"><label>项目完成时间</label><input type="date" id="ecm" value="' + (p.completedAt || '') + '"></div></div>' +
        '<div class="fg"><label>项目目标</label><textarea id="ed" style="min-height:80px;">' + escHtml(p.desc || '') + '</textarea></div>' +
        '<div class="fg"><label>备注（文本）</label><textarea id="ent" style="min-height:50px;">' + escHtml(p.note || '') + '</textarea></div>' +
      '</div>' +
    '</div>' +
    '<div class="card"><div class="card-hd">编辑项目成员<button class="btn btn-o btn-sm" onclick="showMemModal()">+ 编辑成员</button></div>' +
      '<p style="font-size:12px;color:var(--tx2);margin-bottom:12px;">项目周期：<b>' + (p.start || '—') + ' ~ ' + (p.end || '—') + '</b>，月份列随起止时间自动调整。</p>' +
      '<div id="tmpTbl">' + renderTmpMems() + '</div>' +
    '</div>' +
    (p.status === '进行中' || p.status === '挂起' ?
      '<div class="card" style="margin-top:20px;"><div class="card-hd">项目状态变更</div>' +
        '<p style="font-size:12px;color:var(--tx2);margin-bottom:12px;">当前状态：<span class="tag g">' + p.status + '</span></p>' +
        '<p style="font-size:11px;color:var(--yel);margin-bottom:12px;padding:8px 12px;background:var(--yel-l);border-radius:var(--r);">⚠ 状态变更与字段编辑解耦：审批失败不影响其他字段修改结果，仅状态退回原值。</p>' +
        '<div class="f-row"><div class="fg"><label>变更为目标状态</label><select id="e-status"><option value="" selected>不变更</option><option value="已完成">已完成</option><option value="挂起">挂起</option><option value="已作废">已作废</option></select></div>' +
        '<div class="fg" id="e-status-reason-wrap" style="display:none;"><label>变更原因</label><textarea id="e-status-reason" placeholder="请说明状态变更原因..."></textarea></div></div>' +
      '</div>' : '') +
    '<div style="margin-top:20px;display:flex;gap:10px;">' +
      '<button class="btn btn-p btn-lg" onclick="saveEdit()">保存全部修改（同步至飞书多维表格）</button>' +
      '<button class="btn btn-gh btn-lg" onclick="openDet(selProj._id)">取消编辑</button>' +
    '</div>';

  setTimeout(function () {
    const ns = document.getElementById('e-status');
    if (ns) ns.onchange = function () {
      const w = document.getElementById('e-status-reason-wrap');
      if (w) w.style.display = this.value ? '' : 'none';
    };
  }, 50);
}

/* saveEdit — 写回多维表格全部字段 + 成员工时表 */
async function saveEdit() {
  if (!editData) return;

  editData.name       = document.getElementById('en').value;
  editData.yonyouNo   = document.getElementById('eno').value;
  editData.feishuNo   = (document.getElementById('efn') || {}).value || editData.feishuNo || '';
  editData.type       = document.getElementById('et').value;
  editData.product    = document.getElementById('ep').value;
  editData.subProduct = (document.getElementById('esp') || {}).value || '';
  editData.scale      = (document.getElementById('esc') || {}).value || '';
  editData.costType   = (document.getElementById('ect') || {}).value || '';
  editData.start      = document.getElementById('es').value;
  editData.end        = document.getElementById('ee').value;
  editData.createdAt  = (document.getElementById('ecr') || {}).value || editData.createdAt || '';
  editData.completedAt= (document.getElementById('ecm') || {}).value || editData.completedAt || '';
  editData.desc       = document.getElementById('ed').value;
  editData.note       = (document.getElementById('ent') || {}).value || '';

  const leaderId = document.getElementById('eld').value;
  const sponsorId = (document.getElementById('espn') || {}).value || '';

  const leaderPpl = leaderId ? PPL_BY_ID.get(leaderId) : null;
  editData.leader  = leaderId ? { id: leaderId, name: (leaderPpl || {}).name || '' } : null;
  const sponsorPpl = sponsorId ? PPL_BY_ID.get(sponsorId) : null;
  editData.sponsor = sponsorId ? { id: sponsorId, name: (sponsorPpl || {}).name || '' } : null;

  syncMemHours();
  editData.members = tmpMems;

  const projectFields = {
    '项目名称': editData.name,
    '用友项目编号': editData.yonyouNo || '',
    '飞书项目编号': editData.feishuNo || '',
    '项目类型': editData.type,
    '所属产品大类': editData.product || '',
    '子产品名称': editData.subProduct || '',
    '项目规模': editData.scale || '',
    '费用类型': editData.costType || '',
    '项目目标': editData.desc || '',
    '文本': editData.note || ''
  };
  if (editData.start)       projectFields['项目计划开始时间'] = editData.start;
  if (editData.end)         projectFields['项目计划结束时间'] = editData.end;
  if (editData.createdAt)   projectFields['项目立项时间'] = editData.createdAt;
  if (editData.completedAt) projectFields['项目完成时间'] = editData.completedAt;
  if (leaderId)             projectFields['项目负责人'] = [{ id: leaderId }];
  if (sponsorId)            projectFields['项目发起人'] = [{ id: sponsorId }];

  try {
    await API.updateProject(editData._id, projectFields);
    console.log('saveEdit: project fully updated in bitable');
  } catch (e) {
    toast('项目保存失败：' + e.message, 'err');
    return;
  }

  try {
    await syncMembersToBitable(editData._id, tmpMems, editData.start, editData.end);
  } catch (e) {
    console.warn('[projects] saveEdit: member sync failed', e);
  }

  const idx = PROJ.findIndex(function (p) { return p._id === editData._id; });
  if (idx >= 0) {
    PROJ[idx] = editData;
    PROJ_BY_ID.set(editData._id, editData);
  }
  selProj = editData;
  addLogEntry('修改项目', editData.name, '更新全部字段信息和成员');

  const ns = document.getElementById('e-status');
  if (ns && ns.value) {
    const toStatus = ns.value;
    const reasonEl = document.getElementById('e-status-reason');
    const reason = (reasonEl ? reasonEl.value : '') || '用户发起状态变更申请。';
    APPR.unshift({
      id: 'a' + Date.now(), pid: editData._id, pn: editData.name,
      from: selProj.status || '进行中', to: toStatus,
      who: '当前用户', dt: new Date().toISOString().split('T')[0],
      st: 'pending', reason: reason
    });
    addLogEntry('发起审批', editData.name, '状态变更申请：' + (selProj.status || '进行中') + ' → ' + toStatus);
    updateBadges();
    toast('项目已保存；状态变更申请已提交', 'inf');
  } else {
    toast('项目已保存至飞书多维表格（全部' + Object.keys(projectFields).length + '个字段）', 'ok');
  }
  openDet(editData._id);
}

/* syncMembersToBitable — 并行 API 调用 */
async function syncMembersToBitable(projectId, members, start, end) {
  const months = getMonths(start, end || start);

  // 删除旧记录
  const oldMembers = MEMBER_MAP[projectId] || [];
  const deletePromises = [];
  for (let i = 0; i < oldMembers.length; i++) {
    if (oldMembers[i]._id) {
      deletePromises.push(
        API.deleteMember(oldMembers[i]._id).catch(function (e) { console.warn('[sync] delete member failed', e); })
      );
    }
  }
  await Promise.all(deletePromises);

  // 创建新记录（并行）
  const createPromises = [];
  for (let mi = 0; mi < members.length; mi++) {
    const mem = members[mi];
    for (let j = 0; j < months.length; j++) {
      const mon = months[j];
      const hoursVal = (mem.hours && mem.hours[mon]) || 0;
      if (hoursVal === 0 && j > 0) continue;
      createPromises.push(
        API.upsertMember(null, {
          '项目': [projectId],
          '成员': [{ id: mem.pid }],
          '角色': (mem.roles || ['成员']).join(','),
          '人员属性': mem.attr || '国智',
          '年份月份': mon,
          '工时': hoursVal
        }).catch(function (e) { console.warn('[sync] create member failed', e); })
      );
    }
  }
  await Promise.all(createPromises);

  // 重新加载映射
  try {
    const memRaw = await API.getMembers();
    if (memRaw && memRaw.data) {
      buildMemberMap(memRaw);
      const proj = PROJ_BY_ID.get(projectId);
      if (proj) proj.members = buildMembers(projectId);
    }
  } catch (e) {
    console.warn('[sync] reload member map failed', e);
  }
}
