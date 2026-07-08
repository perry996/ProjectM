/* ═══════════════════════════════════════════════════════════════
   CORE — 全局状态 + 查找 Maps + 数据转换 + 共用工/工具 + 导航
   从 main.js 提取，作为各页面模块的共享依赖
   ═══════════════════════════════════════════════════════════════ */

/* ── 人员属性枚举 ── */
const ATTRS = ['国智', '合作方', '其他'];

/* ── Loader ── */
function showLoader() {
  const el = document.getElementById('loader');
  if (el) el.style.display = 'flex';
}
function hideLoader() {
  const el = document.getElementById('loader');
  if (el) el.style.display = 'none';
}

/* ═══════════════════════════════════════════════════════════════
   DATA LAYER — 从飞书多维表格加载，内存缓存
   ═══════════════════════════════════════════════════════════════ */

// 运行时数据缓存
let PPL = [];         // 人员表（去重后）
let ROLES = [];       // 角色表 → 字符串数组
let PROJ = [];        // 项目清单
let MERGE = [];       // 待合并清单（合并情况 ≠ 已合并）
let MERGED = [];      // 已合并清单（合并情况 = 已合并）
let PRODUCTS = [];    // 产品表
let APPR = [];        // 审批表（本地状态）
let LOGS = [];        // 操作日志表
let USER_DATA = [];   // 权限映射 { id, pid, role, rl }
let MEMBER_MAP = {};  // { project_record_id: [member_hours_rows] }

// 查找 Maps（initApp 时填充，O(1) 查找）
let PPL_BY_ID = new Map();
let PROJ_BY_ID = new Map();
let USER_BY_ID = new Map();

/* ── 数据转换辅助函数 ── */

function _first(v) {
  if (Array.isArray(v)) return v[0] || null;
  return v || null;
}

function _userObj(v) {
  const u = _first(v);
  if (!u) return null;
  return { id: u.id || '', name: u.name || '' };
}

function _userList(v) {
  if (!v) return [];
  if (!Array.isArray(v)) return [];
  return v.map(function (u) { return { id: u.id || '', name: u.name || '' }; });
}

function _dateStr(v) {
  const d = _first(v);
  if (!d) return '';
  if (typeof d === 'string') return d.substring(0, 10);
  return String(d).substring(0, 10);
}

function _dateTimeStr(v) {
  const d = _first(v);
  if (!d) return '';
  if (typeof d === 'string') return d.substring(0, 16);
  return String(d).substring(0, 16);
}

function _numVal(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  return parseFloat(v) || 0;
}

/* ═══════════════════════════════════════════════════════════════
   数据转换：飞书记录 → App 对象
   ═══════════════════════════════════════════════════════════════ */

function transformProjects(raw) {
  const records = raw.data || raw;
  const fields = raw.fields || [];
  const ids = raw.record_id_list || [];
  const fi = function (name) { return fields.indexOf(name); };

  return records.map(function (r, i) {
    const pid = ids[i] || '';
    const memberIds = _userList(r[fi('项目成员')]);
    return {
      _id: pid,
      name: r[fi('项目名称')] || '',
      yonyouNo: r[fi('用友项目编号')] || '',
      feishuNo: r[fi('飞书项目编号')] || '',
      status: _first(r[fi('项目状态')]) || '进行中',
      type: _first(r[fi('项目类型')]) || '',
      costType: r[fi('费用类型')] || '',
      scale: r[fi('项目规模')] || '',
      desc: r[fi('项目目标')] || '',
      note: r[fi('文本')] || '',
      product: r[fi('所属产品大类')] || '',
      subProduct: r[fi('子产品名称')] || '',
      leader: _userObj(r[fi('项目负责人')]),
      sponsor: _userObj(r[fi('项目发起人')]),
      memberIds: memberIds,
      start: _dateStr(r[fi('项目计划开始时间')]),
      end: _dateStr(r[fi('项目计划结束时间')]),
      createdAt: _dateStr(r[fi('项目立项时间')]),
      completedAt: _dateStr(r[fi('项目完成时间')]),
      members: buildMembers(pid, memberIds)
    };
  });
}

/* buildMembers — 从项目成员字段 + 成员工时表合并 */
function buildMembers(projectRecordId, memberIds) {
  const rawHours = MEMBER_MAP[projectRecordId] || [];
  const hoursByPid = {};
  rawHours.forEach(function (m) {
    if (!hoursByPid[m.pid]) hoursByPid[m.pid] = { roles: [], attr: m.attr, hours: {}, total: 0, memberRecordIds: [] };
    m.roles.forEach(function (rr) {
      if (hoursByPid[m.pid].roles.indexOf(rr) < 0) hoursByPid[m.pid].roles.push(rr);
    });
    hoursByPid[m.pid].hours[m.month] = m.hoursVal;
    hoursByPid[m.pid].total += (m.hoursVal || 0);
    if (m._id) hoursByPid[m.pid].memberRecordIds.push(m._id);
  });

  const result = [];
  const seenPids = {};

  (memberIds || []).forEach(function (m) {
    if (seenPids[m.id]) return;
    seenPids[m.id] = true;
    const hInfo = hoursByPid[m.id] || {};
    result.push({
      pid: m.id,
      pname: m.name || '',
      roles: hInfo.roles && hInfo.roles.length ? hInfo.roles : ['成员'],
      attr: hInfo.attr || '国智',
      hours: hInfo.hours || {},
      total: hInfo.total || 0,
      memberRecordIds: hInfo.memberRecordIds || []
    });
  });

  Object.keys(hoursByPid).forEach(function (pid) {
    if (!seenPids[pid]) {
      seenPids[pid] = true;
      const pp = PPL_BY_ID.get(pid);
      result.push({
        pid: pid,
        pname: pp ? pp.name : '',
        roles: hoursByPid[pid].roles,
        attr: hoursByPid[pid].attr,
        hours: hoursByPid[pid].hours,
        total: hoursByPid[pid].total,
        memberRecordIds: hoursByPid[pid].memberRecordIds || []
      });
    }
  });

  return result;
}

function transformUsers(raw) {
  const records = raw.data || raw;
  const fields = raw.fields || [];
  const ids = raw.record_id_list || [];
  const fi = function (name) { return fields.indexOf(name); };
  const seen = {};

  const people = [];
  const userData = [];
  records.forEach(function (r, i) {
    const name = r[fi('员工姓名')] || '';
    const dept = r[fi('部门')] || '';
    const key = name + '|' + dept;
    if (seen[key]) return;
    seen[key] = true;

    const pid = ids[i] || '';
    const perm = _first(r[fi('权限')]) || '用户';
    const permLabels = { '系统管理员': 'admin', 'PMO': 'pmo', '项目负责人': 'lead', '用户': 'user' };

    people.push({
      id: pid, name: name, dept: dept,
      av: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    });
    userData.push({ id: 'u' + i, pid: pid, role: permLabels[perm] || 'user', rl: perm });
  });

  return { people: people, userData: userData };
}

function transformMerge(raw) {
  const records = raw.data || raw;
  const fields = raw.fields || [];
  const ids = raw.record_id_list || [];
  const fi = function (name) { return fields.indexOf(name); };

  const merge = [], merged = [];
  records.forEach(function (r, i) {
    const flowType = _first(r[fi('流程类型')]) || '';
    const mergeStatus = _first(r[fi('合并情况')]) || '初始化';
    const applyStatus = r[fi('申请状态')] || '';
    const projectType = _first(r[fi('项目类型')]) || '';

    let typeTag = 'setup';
    if (flowType === '结项') typeTag = 'close';
    else if (flowType === '立项+结项') typeTag = 'both';

    const approvalFlow = r[fi('审批流程')] || '';
    let src = '飞书立项流程';
    if (flowType === '结项') src = '飞书结项流程';
    else if (approvalFlow === '紧急项目立项') src = '飞书紧急立项流程';
    else if (approvalFlow === '普通项目立项') src = '飞书立项流程';

    const obj = {
      _id: ids[i] || '',
      flowType: flowType,
      mergeStatus: mergeStatus,
      applyStatus: applyStatus,
      no: r[fi('项目编号')] || '',
      comboNo: r[fi('项目编号（组合）')] || '',
      name: r[fi('项目名称')] || '',
      type: typeTag,
      src: src,
      dt: _dateTimeStr(r[fi('发起时间')]) || _dateTimeStr(r[fi('完成时间')]) || '',
      applyNo: r[fi('申请编号')] || '',
      f: {
        name: r[fi('项目名称')] || '',
        no: r[fi('项目编号')] || '',
        comboNo: r[fi('项目编号（组合）')] || '',
        type: projectType,
        category: r[fi('项目大类')] || '',
        product: r[fi('所属产品大类')] || '',
        subProduct: r[fi('项目-产品子类')] || '',
        scale: r[fi('项目规模')] || '',
        leader: _userObj(r[fi('项目经理')]),
        members: _userList(r[fi('项目成员')]),
        sponsor: _userObj(r[fi('发起人')]),
        sponsorDept: r[fi('发起人部门')] || '',
        dept: r[fi('承接部门')] || r[fi('需求部门')] || '',
        desc: r[fi('项目目标')] || '',
        closeReason: r[fi('结项原因')] || '',
        actualEnd: _dateStr(r[fi('项目实际完成时间')]),
        planEnd: _dateStr(r[fi('项目计划完成时间')]),
        contractAmount: _numVal(r[fi('合同额')]),
        budget: _numVal(r[fi('客户预算')]),
        purchaseBudget: _numVal(r[fi('采购总预算金额')]),
        selfDevHours: _numVal(r[fi('自研工作量')]),
        finishTime: _dateTimeStr(r[fi('完成时间')]),
        startType: r[fi('立项类型')] || '',
        relatedApply: r[fi('关联项目立项申请')] || '',
        acceptance: r[fi('项目结项及验收材料')] || '',
        lessons: r[fi('项目总结经验教训')] || '',
        archived: r[fi('项目交付物是否归档')] || '',
        contractPaid: r[fi('是否完成合同付款')] || '',
        contractReceived: r[fi('是否完成合同收款')] || '',
        meetingApproved: r[fi('是否已上会')] || ''
      },
      status: mergeStatus === '已合并' ? '已处理' : mergeStatus
    };

    if (mergeStatus === '已合并') {
      merged.push(obj);
    } else {
      merge.push(obj);
    }
  });
  return { merge: merge, merged: merged };
}

function transformRoles(raw) {
  const records = raw.data || raw;
  const fields = raw.fields || [];
  const idx = fields.indexOf('角色名称');
  if (idx < 0) return ['项目负责人', '项目经理', '产品经理', '成员'];
  return records.map(function (r) { return r[idx] || ''; }).filter(Boolean);
}

function transformProducts(raw) {
  const records = raw.data || raw;
  const fields = raw.fields || [];
  const ids = raw.record_id_list || [];
  const fi = function (name) { return fields.indexOf(name); };

  const all = [];
  const parentNames = new Set();

  records.forEach(function (r, i) {
    const parentName = (r[fi('所属产品大类')] || '').trim();
    const subName = (r[fi('子产品名称')] || '').trim();
    const rid = ids[i] || '';
    if (parentName) parentNames.add(parentName);

    if (subName) {
      all.push({ id: rid, name: subName, parent: parentName || null, fullName: parentName ? parentName + ' - ' + subName : subName, isSub: true });
    } else if (parentName) {
      all.push({ id: rid, name: parentName, parent: null, fullName: parentName, isSub: false });
    }
  });

  all.forEach(function (p) {
    if (p.parent && !all.some(function (x) { return x.name === p.parent && !x.parent; })) {
      all.push({ id: 'parent_' + p.parent, name: p.parent, parent: null, fullName: p.parent, isSub: false });
    }
  });

  return all;
}

function transformApprovals(raw) {
  const records = raw.data || raw;
  const fields = raw.fields || [];
  const ids = raw.record_id_list || [];
  const fi = function (name) { return fields.indexOf(name); };

  return records.map(function (r, i) {
    const det = r[fi('详情')] || '';
    return {
      id: ids[i] || 'a' + i,
      detail: det,
      initiator: _userObj(r[fi('发起人')]),
      approver: _userObj(r[fi('审批人')]),
      st: 'pending',
      dt: '',
      pn: '',
      from: '', to: '', who: '', reason: det
    };
  });
}

function transformLogs(raw) {
  const records = raw.data || raw;
  const fields = raw.fields || [];
  const fi = function (name) { return fields.indexOf(name); };

  return records.map(function (r) {
    const dt = r[fi('日期时间')] || '';
    return {
      t: typeof dt === 'string' ? dt.substring(0, 16) : '',
      u: r[fi('操作人')] || '',
      a: r[fi('操作类型')] || '',
      g: r[fi('目标对象')] || '',
      d: r[fi('详情')] || ''
    };
  });
}

function buildMemberMap(memRaw) {
  MEMBER_MAP = {};
  const records = memRaw.data || [];
  const fields = memRaw.fields || [];
  const mfi = function (n) { return fields.indexOf(n); };
  const ids = memRaw.record_id_list || [];

  records.forEach(function (r, i) {
    try {
      const projLink = r[mfi('项目')];
      let projIds = [];
      if (Array.isArray(projLink)) {
        projIds = projLink.map(function (x) {
          return typeof x === 'string' ? x : (x.record_id || x.id || '');
        }).filter(Boolean);
      } else if (projLink) {
        projIds = [String(projLink)];
      }

      const uid = r[mfi('成员')] || [];
      const uidStr = Array.isArray(uid) && uid.length ? (uid[0].id || '') : '';
      const uName = Array.isArray(uid) && uid.length ? (uid[0].name || '') : '';
      const recordId = ids[i] || '';

      projIds.forEach(function (pid) {
        if (!MEMBER_MAP[pid]) MEMBER_MAP[pid] = [];
        MEMBER_MAP[pid].push({
          _id: recordId,
          pid: uidStr,
          pname: uName,
          roles: (r[mfi('角色')] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
          attr: _first(r[mfi('人员属性')]) || '国智',
          month: r[mfi('年份月份')] || '',
          hoursVal: parseInt(r[mfi('工时')]) || 0
        });
      });
    } catch (e) {
      console.warn('[core] buildMemberMap: skip row', i, e);
    }
  });
}

/**
 * 创建新项目共享函数
 * 由 quickNew（merge.js）和 doMerge（merge.js）共用
 */
function createNewProject(data) {
  const proj = {
    _id: 'p' + Date.now(),
    name: data.name,
    yonyouNo: data.no || '',
    feishuNo: '',
    status: '进行中',
    type: data.type || '',
    costType: '',
    scale: data.scale || '',
    desc: data.desc || '',
    note: '',
    product: data.product || '',
    subProduct: data.subProduct || '',
    leader: data.leader || null,
    sponsor: data.sponsor || null,
    memberIds: data.members || [],
    start: new Date().toISOString().split('T')[0],
    end: '',
    createdAt: new Date().toISOString().split('T')[0],
    completedAt: '',
    members: []
  };
  PROJ.push(proj);
  PROJ_BY_ID.set(proj._id, proj);
  return proj;
}

/* ═══════════════════════════════════════════════════════════════
   Async Init
   ═══════════════════════════════════════════════════════════════ */
async function initApp() {
  try {
    console.log('initApp: loading data from bitable...');
    const timeout = setTimeout(function () {
      hideLoader();
      toast('部分数据加载超时，已显示已加载数据', 'err');
    }, 8000);

    const [projRaw, rolesRaw, prodRaw, apprRaw, usersRaw, mergeRaw, logRaw, memRaw] =
      await Promise.all([
        API.getProjects(), API.getRoles(), API.getProducts(),
        API.getApprovals(), API.getUsers(), API.getMergeList(),
        API.getLogs(), API.getMembers()
      ]).catch(function (e) {
        console.error('API load error:', e);
        return [[], [], [], [], [], [], [], []];
      });

    clearTimeout(timeout);
    console.log('initApp: data loaded, transforming...');

    if (memRaw && memRaw.data) {
      buildMemberMap(memRaw);
    }

    PROJ = transformProjects(projRaw);
    const r = transformRoles(rolesRaw);
    ROLES = r.length ? r : ['项目负责人', '项目经理', '产品经理', '成员'];
    PRODUCTS = transformProducts(prodRaw);
    APPR = transformApprovals(apprRaw);
    const u = transformUsers(usersRaw);
    PPL = u.people;
    USER_DATA = u.userData;
    const m = transformMerge(mergeRaw);
    MERGE = m.merge;
    MERGED = m.merged;
    LOGS = transformLogs(logRaw);

    // 初始化查找 Maps
    PPL_BY_ID = new Map(PPL.map(function (p) { return [p.id, p]; }));
    PROJ_BY_ID = new Map(PROJ.map(function (p) { return [p._id, p]; }));
    USER_BY_ID = new Map(USER_DATA.map(function (u) { return [u.id, u]; }));

    console.log('initApp: ' + PROJ.length + ' projects, ' + PPL.length + ' people, ' +
      MERGE.length + ' pending merges, ' + MERGED.length + ' merged, ' +
      PRODUCTS.length + ' products, ' + ROLES.length + ' roles');

  } catch (e) {
    console.error('Data load failed:', e);
    document.getElementById('content').innerHTML =
      '<div style="text-align:center;padding:60px;">' +
      '<h2 style="color:var(--red);">数据加载失败</h2>' +
      '<p>' + e.message + '</p>' +
      '<p style="color:var(--tx3);font-size:12px;margin-top:8px;">请确保 server.js 已启动，端口3456</p>' +
      '</div>';
    toast('数据加载失败: ' + e.message, 'err');
  }
  hideLoader();
  applyRole();
  updateBadges();
  navTo('proj');
}

// 启动时自动初始化
(function () { initApp(); })();

/* ═══════════════════════════════════════════════════════════════
   状态变量
   ═══════════════════════════════════════════════════════════════ */
let role = 'admin';
let page = '';
let selProj = null;
let editData = null;
let tmpMems = [];
let selMerge = null;
let mergeStep = 1;
let userSel = {};
let filterStatus = 'all';
let filterProduct = 'all';
let filterType = 'all';
let filterScale = 'all';
let filterCostType = 'all';
let filterLeader = 'all';
let filterSponsor = 'all';
let filterDateFrom = '';
let filterDateTo = '';
let searchQuery = '';
let viewMode = 'list';
let filterExpanded = true;
let expandedProducts = {};

/* ═══════════════════════════════════════════════════════════════
   ROLE MANAGEMENT
   ═══════════════════════════════════════════════════════════════ */
function switchRole(r) { role = r; applyRole(); closeRoleModal(); if (!pageOK(page)) navTo('proj'); updateBadges(); }

function applyRole() {
  const m = {
    admin: ['管', '系统管理员', '全部权限'],
    pmo: ['P', 'PMO', '审批+操作'],
    lead: ['负', '项目负责人', '查看+编辑'],
    user: ['用', '普通用户', '仅查看']
  };
  document.getElementById('roleAv').textContent = m[role][0];
  document.getElementById('roleNm').textContent = m[role][1];
  document.getElementById('topRoleTag').textContent = m[role][1];
  document.querySelector('#roleBtn .rtg').textContent = m[role][2];
  const adminOnly = role === 'admin';
  const adminPmo = role === 'admin' || role === 'pmo';
  ['navMerge', 'navAppr'].forEach(function (id) {
    const e = document.getElementById(id); if (e) e.style.display = adminPmo ? '' : 'none';
  });
  ['navUsers', 'navLogs', 'navSync', 'navSyncP', 'navPush', 'navRoles', 'navMerged', 'navProducts'].forEach(function (id) {
    const e = document.getElementById(id); if (e) e.style.display = adminOnly ? '' : 'none';
  });
}

function pageOK(p) {
  if (role === 'admin') return true;
  if (role === 'pmo') return ['proj', 'merge', 'appr'].includes(p);
  return ['proj'].includes(p);
}
function canEdit() { return role === 'admin' || role === 'lead'; }
function canAppr() { return role === 'admin' || role === 'pmo'; }
function showRoleModal() { document.getElementById('roleModal').style.display = 'flex'; }
function closeRoleModal() { document.getElementById('roleModal').style.display = 'none'; }

/* ═══════════════════════════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════════════════════════ */
function navTo(p) {
  page = p;
  document.querySelectorAll('#sideNav .nav-i').forEach(function (el) { el.classList.remove('on'); });
  const ni = document.querySelector('[data-pg="' + p + '"]');
  if (ni) ni.classList.add('on');
  const labels = {
    proj: '项目清单', merge: '待合并项目清单', appr: '项目审批',
    users: '用户与权限管理', logs: '操作日志', roles: '角色管理',
    merged: '已合并项目清单', products: '产品管理'
  };
  document.getElementById('bc').innerHTML = labels[p] || p;
  updateBadges();
  switch (p) {
    case 'proj': renderProj(); break;
    case 'merge': renderMerge(); break;
    case 'appr': renderAppr(); break;
    case 'users': renderUsers(); break;
    case 'logs': renderLogs(); break;
    case 'roles': renderRoles(); break;
    case 'merged': renderMerged(); break;
    case 'products': renderProducts(); break;
  }
}

/* ═══════════════════════════════════════════════════════════════
   共用工/工具
   ═══════════════════════════════════════════════════════════════ */

// HTML 转义
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// HTML 属性值转义
function escAttr(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 从字符串生成颜色
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

// 详情行渲染
function dlRow(label, value) {
  return '<div class="dl"><span class="lb">' + label + '</span><span class="vl">' + value + '</span></div>';
}

/* ── 成员表格渲染（详情/编辑共用） ── */
function renderMemberTable(p, editable) {
  const months = getMonths(p.start, p.end || p.start);
  if (!p.members || !p.members.length) return '<div class="empty">暂无成员</div>';
  const attrCls = { '国智': 'b', '合作方': 'y', '其他': 'gr' };

  let html = '<div style="overflow-x:auto;"><table class="mem-tbl" style="min-width:' + (500 + months.length * 70) + 'px;">' +
    '<thead><tr><th style="width:40px;">序号</th><th>姓名</th><th>角色</th><th style="width:80px;">人员属性</th>' +
    months.map(function (mon) { return '<th style="min-width:70px;text-align:center;">' + mon + '</th>'; }).join('') +
    '<th style="width:80px;text-align:center;">工时总计</th>' +
    (editable ? '<th style="width:60px;">操作</th>' : '') +
    '</tr></thead><tbody>';

  p.members.forEach(function (m, i) {
    let displayName = m.pname || '';
    const pp = PPL_BY_ID.get(m.pid) || PPL_BY_ID.get(displayName);
    if (pp && !displayName) displayName = pp.name;
    if (!displayName) displayName = m.pid || '未知';
    const avColor = pp ? pp.av : stringToColor(displayName);

    html += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td><span class="mav" style="background:' + avColor + '">' + displayName[0] + '</span>' + escHtml(displayName) +
        ((m.roles || []).includes('项目负责人') ? ' <span class="tag b" style="margin-left:4px;">负责人</span>' : '') +
      '</td>' +
      '<td>' + (m.roles || []).map(function (r) { return '<span class="tag gr" style="margin-right:3px;">' + escHtml(r) + '</span>'; }).join('') + '</td>' +
      '<td><span class="tag ' + (attrCls[m.attr] || 'gr') + '">' + (m.attr || '—') + '</span></td>' +
      months.map(function (mon) {
        return '<td style="text-align:center;font-size:12px;color:var(--tx3);">' + ((m.hours && m.hours[mon]) || '—') + '</td>';
      }).join('') +
      '<td style="text-align:center;font-weight:600;">' + (m.total || 0) + '</td>' +
      (editable ? '<td><button class="btn btn-gh btn-sm" style="color:var(--red);" onclick="removeTmpMem(' + i + ')">移除</button></td>' : '') +
      '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
}

function renderTmpMems() {
  const p = editData || selProj;
  return renderMemberTable({ members: tmpMems, start: p.start, end: p.end }, true);
}

function removeTmpMem(i) { tmpMems.splice(i, 1); const el = document.getElementById('tmpTbl'); if (el) el.innerHTML = renderTmpMems(); }

function syncMemHours() {
  const months = getMonths(editData.start, editData.end || editData.start);
  tmpMems.forEach(function (m) {
    const nh = {};
    months.forEach(function (mon) { nh[mon] = (m.hours && m.hours[mon]) || 0; });
    m.hours = nh;
    m.total = Object.values(nh).reduce(function (a, b) { return a + b; }, 0);
  });
}

/* ── 日志写入 ── */
async function addLogEntry(action, target, detail) {
  const now = new Date();
  const dt = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');
  LOGS.unshift({ t: dt, u: '当前用户', a: action, g: target, d: detail });
  try {
    await API.addLog({
      '日期时间': dt, '操作人': '当前用户',
      '操作类型': action, '目标对象': target, '详情': detail
    });
  } catch (e) {
    console.warn('[core] addLogEntry failed', e);
  }
}
