/* ═══════════════════════════════════════════════════════════════
   PROJECT MANAGEMENT SYSTEM — main.js v2
   基于飞书多维表格实际 schema，所有操作实时同步至 bitable
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

/* ── 数据转换：飞书记录 → App 对象 ── */

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
  // 从成员工时表拿工时数据
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

  // 从项目成员字段构建基础成员列表
  var result = [];
  var seenPids = {};

  (memberIds || []).forEach(function (m) {
    if (seenPids[m.id]) return;
    seenPids[m.id] = true;
    var hInfo = hoursByPid[m.id] || {};
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

  // 补充成员工时表中有但项目成员字段中没有的人员
  Object.keys(hoursByPid).forEach(function (pid) {
    if (!seenPids[pid]) {
      seenPids[pid] = true;
      var pp = PPL.find(function (x) { return x.id === pid; });
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
    const attr = _first(r[fi('人员属性')]) || '国智';
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

/* transformMerge — 基于数据清洗表37字段实际schema
   流程类型: 立项/结项/立项+结项
   合并情况: 已合并 → MERGED, 待合并/初始化/null → MERGE
*/
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

    // 确定项目类型标识
    let typeTag = 'setup';
    if (flowType === '结项') typeTag = 'close';
    else if (flowType === '立项+结项') typeTag = 'both';

    // 确定来源
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
      // 完整字段数据（合并时比对用）
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

/* transformProducts — 产品表实际schema：
   所属产品大类（text）、子产品名称（text）、ID（auto_number）
   返回扁平数组，parent = null 表示顶级（大类），parent = 大类名称 表示子产品
*/
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
      // 有子产品名称 → 这是子产品
      all.push({
        id: rid,
        name: subName,
        parent: parentName || null,
        fullName: parentName ? parentName + ' - ' + subName : subName,
        isSub: true
      });
    } else if (parentName) {
      // 只有大类没有子产品 → 这是大类本身
      all.push({
        id: rid,
        name: parentName,
        parent: null,
        fullName: parentName,
        isSub: false
      });
    }
  });

  // 确保所有被引用的 parent 作为顶级产品存在
  all.forEach(function (p) {
    if (p.parent && !all.some(function (x) { return x.name === p.parent && !x.parent; })) {
      all.push({
        id: 'parent_' + p.parent,
        name: p.parent,
        parent: null,
        fullName: p.parent,
        isSub: false
      });
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

/* ── Async Init ── */
async function initApp() {
  try {
    console.log('initApp: loading data from bitable...');
    const timeout = setTimeout(function () {
      hideLoader();
      toast('部分数据加载超时，已显示已加载数据', 'err');
    }, 15000);

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

    // 先构建成员工时映射（项目转换依赖此数据）
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

function buildMemberMap(memRaw) {
  MEMBER_MAP = {};
  const records = memRaw.data || [];
  const fields = memRaw.fields || [];
  const mfi = function (n) { return fields.indexOf(n); };
  const ids = memRaw.record_id_list || [];

  records.forEach(function (r, i) {
    try {
      // 项目是 link 字段，格式为 [record_id] 或 [{record_id: "xxx"}]
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
      console.warn('buildMemberMap: skip row', i, e);
    }
  });
}

// 启动时自动初始化
(function () { initApp(); })();

/* ═══════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════ */
let role = 'admin';
let page = '';
let selProj = null;
let editData = null;
let tmpMems = [];
let selMerge = null;
let mergeStep = 1;
let userSel = {};
// 多维筛选状态
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
let filterExpanded = true; // 筛选栏展开/收起
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
   PROJECT LIST — 全维度筛选 + 多维表格字段完整展示
   ═══════════════════════════════════════════════════════════════ */

// 项目清单所有可用筛选项（基于多维表格实际字段动态提取）
function getFilterOptions() {
  return {
    statuses: ['进行中', '已完成', '挂起', '已作废', '已结项'],
    scales:   [...new Set(PROJ.map(function (p) { return p.scale; }).filter(Boolean))].sort(),
    costTypes:[...new Set(PROJ.map(function (p) { return p.costType; }).filter(Boolean))].sort(),
    types:    ['商业交付类项目（A类）', '软件产品研发类项目（B类）', '创新实验室项目（C类）', '公司能力建设类项目（D类）'],
    products: [...new Set(PROJ.map(function (p) { return p.product; }).filter(Boolean))].sort(),
    leaders:  PROJ.map(function (p) { return p.leader; }).filter(Boolean).filter(function (v, i, a) { return a.findIndex(function (x) { return x.id === v.id; }) === i; }),
    sponsors: PROJ.map(function (p) { return p.sponsor; }).filter(Boolean).filter(function (v, i, a) { return a.findIndex(function (x) { return x.id === v.id; }) === i; })
  };
}

// 应用筛选条件，返回过滤后的列表
function getFilteredList() {
  var list = [...PROJ];
  var q = searchQuery;
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
  var list = getFilteredList();
  var hasActive = filterStatus !== 'all' || filterProduct !== 'all' || filterType !== 'all' ||
    filterScale !== 'all' || filterCostType !== 'all' || filterLeader !== 'all' || filterSponsor !== 'all' ||
    filterDateFrom || filterDateTo || searchQuery;
  var cntEl = document.getElementById('projCount');
  if (cntEl) cntEl.innerHTML = '共 <b style="color:var(--tx);">' + list.length + '</b> 个项目';
  var clrEl = document.getElementById('projClearBtn');
  if (clrEl) clrEl.style.display = hasActive ? '' : 'none';
  var resultsEl = document.getElementById('projResults');
  if (resultsEl) resultsEl.innerHTML = (viewMode === 'tree' ? treeView(list) : tblView(list));
}

function renderProj() {
  var opts = getFilterOptions();
  var list = getFilteredList();
  var hasActive = filterStatus !== 'all' || filterProduct !== 'all' || filterType !== 'all' ||
    filterScale !== 'all' || filterCostType !== 'all' || filterLeader !== 'all' || filterSponsor !== 'all' ||
    filterDateFrom || filterDateTo || searchQuery;
  var sel = function (v, cur) { return v === cur ? ' selected' : ''; };
  var stBtn = function (v, l) { return '<button class="' + (filterStatus === v ? 'sel' : '') + '" onclick="setF(\'' + v + '\',this)">' + l + '</button>'; };

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
            '<select onchange="setFilterVal(\'type\',this.value)" style="padding:5px 8px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:11px;font-family:var(--font);background:var(--surf);">' +
              '<option value="all"' + sel(filterType, 'all') + '>项目类型：全部</option>' + opts.types.map(function (t) { return '<option value="' + t + '"' + sel(filterType, t) + '>' + t + '</option>'; }).join('') +
            '</select>' +
            '<select onchange="setFilterVal(\'product\',this.value)" style="padding:5px 8px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:11px;font-family:var(--font);background:var(--surf);">' +
              '<option value="all"' + sel(filterProduct, 'all') + '>所属产品：全部</option>' + getProductOptions(filterProduct === 'all' ? '' : filterProduct) +
            '</select>' +
            '<select onchange="setFilterVal(\'scale\',this.value)" style="padding:5px 8px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:11px;font-family:var(--font);background:var(--surf);">' +
              '<option value="all"' + sel(filterScale, 'all') + '>项目规模：全部</option>' + opts.scales.map(function (s) { return '<option value="' + s + '"' + sel(filterScale, s) + '>' + s + '</option>'; }).join('') +
            '</select>' +
            '<select onchange="setFilterVal(\'costType\',this.value)" style="padding:5px 8px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:11px;font-family:var(--font);background:var(--surf);">' +
              '<option value="all"' + sel(filterCostType, 'all') + '>费用类型：全部</option>' + opts.costTypes.map(function (c) { return '<option value="' + c + '"' + sel(filterCostType, c) + '>' + c + '</option>'; }).join('') +
            '</select>' +
            '<select onchange="setFilterVal(\'leader\',this.value)" style="padding:5px 8px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:11px;font-family:var(--font);background:var(--surf);">' +
              '<option value="all"' + sel(filterLeader, 'all') + '>负责人：全部</option>' + opts.leaders.map(function (l) { return '<option value="' + l.id + '"' + sel(filterLeader, l.id) + '>' + (l.name || l.id) + '</option>'; }).join('') +
            '</select>' +
            '<select onchange="setFilterVal(\'sponsor\',this.value)" style="padding:5px 8px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:11px;font-family:var(--font);background:var(--surf);">' +
              '<option value="all"' + sel(filterSponsor, 'all') + '>发起人：全部</option>' + opts.sponsors.map(function (s) { return '<option value="' + s.id + '"' + sel(filterSponsor, s.id) + '>' + (s.name || s.id) + '</option>'; }).join('') +
            '</select>' +
            '<div style="display:flex;align-items:center;gap:4px;">' +
              '<input type="date" value="' + filterDateFrom + '" onchange="setFilterVal(\'dateFrom\',this.value)" style="padding:4px 6px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:11px;font-family:var(--font);background:var(--surf);flex:1;min-width:100px;">' +
              '<span style="color:var(--tx3);font-size:10px;">~</span>' +
              '<input type="date" value="' + filterDateTo + '" onchange="setFilterVal(\'dateTo\',this.value)" style="padding:4px 6px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:11px;font-family:var(--font);background:var(--surf);flex:1;min-width:100px;">' +
            '</div>' +
          '</div>' : '') +
      '</div>' +
      '<div id="projResults">' + (viewMode === 'tree' ? treeView(list) : tblView(list)) + '</div>' +
    '</div>';
}

// ── 列表视图：完整字段列 ──
function tblView(list) {
  var st = { '进行中': '进行中', '已完成': '已完成', '挂起': '挂起', '已作废': '已作废', '已结项': '已结项' };
  var tc = { '进行中': 'g', '已完成': 'b', '挂起': 'y', '已作废': 'r', '已结项': 'gr' };
  if (!list.length) return '<div class="empty">暂无匹配项目<span style="display:block;font-size:11px;color:var(--tx3);margin-top:4px;">尝试调整筛选条件或清除筛选</span></div>';

  return '<div style="overflow-x:auto;"><table style="min-width:1100px;">' +
    '<thead><tr>' +
      '<th>项目名称</th><th>用友编号</th><th>类型</th><th>产品</th><th>子产品</th>' +
      '<th>规模</th><th>负责人</th><th>发起人</th><th>开始</th><th>结束</th><th>状态</th><th>操作</th>' +
    '</tr></thead><tbody>' +
    list.map(function (p) {
      var ldr = p.leader || {};
      var spn = p.sponsor || {};
      var sd = p.status === '进行中' ? '#059669' : p.status === '已完成' ? '#2563EB' : p.status === '挂起' ? '#D97706' : p.status === '已作废' ? '#DC2626' : '#94A3B8';
      return '<tr onclick="openDet(\'' + p._id + '\')">' +
        '<td><span class="ct">' + escHtml(p.name) + '</span></td>' +
        '<td style="font-size:11px;color:var(--tx3);white-space:nowrap;">' + (p.yonyouNo || '—') + '</td>' +
        '<td><span class="tag gr" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;">' + escHtml(p.type) + '</span></td>' +
        '<td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;">' + escHtml(p.product || '—') + '</td>' +
        '<td style="font-size:11px;color:var(--tx3);max-width:100px;overflow:hidden;text-overflow:ellipsis;">' + escHtml(p.subProduct || '—') + '</td>' +
        '<td><span class="tag bo">' + escHtml(p.scale || '—') + '</span></td>' +
        '<td style="white-space:nowrap;">' + (ldr.name ? '<span class="mav" style="background:#2563EB;width:22px;height:22px;font-size:10px;">' + ldr.name[0] + '</span>' + escHtml(ldr.name) : '—') + '</td>' +
        '<td style="white-space:nowrap;font-size:11px;color:var(--tx2);">' + (spn.name ? escHtml(spn.name) : '—') + '</td>' +
        '<td style="font-size:11px;white-space:nowrap;">' + (p.start || '—') + '</td>' +
        '<td style="font-size:11px;white-space:nowrap;">' + (p.end || '—') + '</td>' +
        '<td><span class="tag ' + (tc[p.status] || '') + '"><span class="tag d" style="background:' + sd + '"></span>' + (st[p.status] || p.status) + '</span></td>' +
        '<td class="ca" onclick="event.stopPropagation();">' +
          '<button class="btn btn-gh btn-sm" onclick="openDet(\'' + p._id + '\')">查看</button>' +
          (canEdit() ? '<button class="btn btn-o btn-sm" onclick="editProj(\'' + p._id + '\')">编辑</button>' : '') +
        '</td></tr>';
    }).join('') + '</tbody></table></div>';
}

// ── 按产品分组视图 ──
function treeView(list) {
  var st = { '进行中': '进行中', '已完成': '已完成', '挂起': '挂起', '已作废': '已作废', '已结项': '已结项' };
  var tc = { '进行中': 'g', '已完成': 'b', '挂起': 'y', '已作废': 'r', '已结项': 'gr' };
  if (!list.length) return '<div class="empty">暂无匹配项目</div>';

  var products = [...new Set(list.map(function (p) { return p.product; }))];
  return products.map(function (prod) {
    var items = list.filter(function (p) { return p.product === prod; });
    return '<div style="padding:0 20px 16px;">' +
      '<div style="display:flex;align-items:center;gap:8px;padding:10px 0;font-weight:700;font-size:14px;color:var(--tx2);border-bottom:1px solid var(--bd);margin-bottom:6px;">' +
        escHtml(prod || '未分类') + ' <span style="font-weight:400;font-size:12px;color:var(--tx3);">(' + items.length + '个项目)</span>' +
      '</div>' +
      '<div style="overflow-x:auto;"><table style="min-width:900px;"><thead><tr>' +
        '<th>名称</th><th>编号</th><th>类型</th><th>规模</th><th>负责人</th><th>开始</th><th>结束</th><th>状态</th><th>操作</th>' +
      '</tr></thead><tbody>' +
      items.map(function (p) {
        var ldr = p.leader || {};
        var sd = p.status === '进行中' ? '#059669' : p.status === '已完成' ? '#2563EB' : p.status === '挂起' ? '#D97706' : p.status === '已作废' ? '#DC2626' : '#94A3B8';
        return '<tr onclick="openDet(\'' + p._id + '\')">' +
          '<td><span class="ct">' + escHtml(p.name) + '</span></td>' +
          '<td style="font-size:11px;color:var(--tx3);">' + (p.yonyouNo || '—') + '</td>' +
          '<td><span class="tag gr">' + escHtml(p.type) + '</span></td>' +
          '<td>' + escHtml(p.scale || '—') + '</td>' +
          '<td>' + (ldr.name || '—') + '</td>' +
          '<td style="font-size:11px;">' + (p.start || '—') + '</td>' +
          '<td style="font-size:11px;">' + (p.end || '—') + '</td>' +
          '<td><span class="tag ' + (tc[p.status] || '') + '"><span class="tag d" style="background:' + sd + '"></span>' + (st[p.status] || p.status) + '</span></td>' +
          '<td class="ca" onclick="event.stopPropagation();">' +
            '<button class="btn btn-gh btn-sm" onclick="openDet(\'' + p._id + '\')">查看</button>' +
            (canEdit() ? '<button class="btn btn-o btn-sm" onclick="editProj(\'' + p._id + '\')">编辑</button>' : '') +
          '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }).join('');
}

// ── HTML 转义 ──
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── 筛选操作函数（调用 applyFilters 只更新结果区，不重绘输入框） ──
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
  var inp = document.getElementById('projQ'); if (inp) inp.value = '';
  applyFilters();
}

/* 成员表格渲染（详情/编辑共用） */
function renderMemberTable(p, editable) {
  var months = getMonths(p.start, p.end || p.start);
  if (!p.members || !p.members.length) return '<div class="empty">暂无成员</div>';
  var attrCls = { '国智': 'b', '合作方': 'y', '其他': 'gr' };
  return '<div style="overflow-x:auto;"><table class="mem-tbl" style="min-width:' + (500 + months.length * 70) + 'px;">' +
    '<thead><tr><th style="width:40px;">序号</th><th>姓名</th><th>角色</th><th style="width:80px;">人员属性</th>' +
    months.map(function (mon) { return '<th style="min-width:70px;text-align:center;">' + mon + '</th>'; }).join('') +
    '<th style="width:80px;text-align:center;">工时总计</th>' +
    (editable ? '<th style="width:60px;">操作</th>' : '') +
    '</tr></thead><tbody>' +
    p.members.map(function (m, i) {
      var displayName = m.pname || '';
      // 尝试从人员表匹配（可能匹配不上，因为 ID 类型不同）
      var pp = PPL.find(function (x) { return x.id === m.pid; });
      if (!pp) pp = PPL.find(function (x) { return x.name === displayName; });
      if (pp && !displayName) displayName = pp.name;
      if (!displayName) displayName = m.pid || '未知';

      var avColor = pp ? pp.av : stringToColor(displayName);
      return '<tr>' +
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
    }).join('') + '</tbody></table></div>';
}

// 从字符串生成颜色
function stringToColor(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
  var c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

/* ═══════════════════════════════════════════════════════════════
   PROJECT DETAIL — 完整展示多维表格全部 18 个字段
   ═══════════════════════════════════════════════════════════════ */
function openDet(pid) {
  var p = PROJ.find(function (x) { return x._id === pid; });
  if (!p) return;
  selProj = p;
  var st = { '进行中': '进行中', '已完成': '已完成', '挂起': '挂起', '已作废': '已作废', '已结项': '已结项' };
  var tc = { '进行中': 'g', '已完成': 'b', '挂起': 'y', '已作废': 'r', '已结项': 'gr' };
  var statusColors = { '进行中': '#059669', '已完成': '#2563EB', '挂起': '#D97706', '已作废': '#DC2626', '已结项': '#94A3B8' };
  var ldr = p.leader || {};
  var spn = p.sponsor || {};

  // 成员列表 HTML（显示 project member field 中的真实姓名）
  var memberTags = '';
  if (p.members && p.members.length) {
    memberTags = p.members.map(function (m) {
      var name = m.pname || '';
      // 尝试匹配人员表
      var pp = PPL.find(function (x) { return x.id === m.pid; });
      if (!pp) pp = PPL.find(function (x) { return x.name === name; });
      if (pp && !name) name = pp.name;
      if (!name) name = m.pid || '未知';
      var av = pp ? pp.av : stringToColor(name);
      return '<span style="display:inline-flex;align-items:center;gap:4px;margin:2px 6px 2px 0;padding:4px 10px;background:var(--mu);border-radius:20px;font-size:12px;">' +
        '<span class="mav" style="background:' + av + ';width:22px;height:22px;font-size:10px;margin:0;">' + name[0] + '</span>' +
        escHtml(name) +
        '</span>';
    }).join('');
  } else {
    memberTags = '<span style="color:var(--tx3);font-size:12px;">—</span>';
  }

  // 项目成员完整表格
  var memberTable = renderMemberTable(p);

  document.getElementById('bc').innerHTML = '项目清单 &rsaquo; <span>' + escHtml(p.name) + '</span>';
  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>' + escHtml(p.name) + '</h1><p class="subt">用友编号：' + escHtml(p.yonyouNo || '—') + '　|　飞书编号：' + escHtml(p.feishuNo || '—') + '</p></div>' +
      '<div class="phr">' +
        (canEdit() ? '<button class="btn btn-p" onclick="startEdit()">编辑项目</button>' : '') +
        '<button class="btn btn-gh" onclick="navTo(\'proj\')">&larr; 返回清单</button>' +
      '</div></div>' +
    '<div id="dv">' +
      // ── 第一行：基本信息 + 时间信息 ──
      '<div class="d-row">' +
        '<div class="card"><div class="card-hd">📋 基本信息</div>' +
          dlRow('项目名称', escHtml(p.name)) +
          dlRow('用友项目编号', escHtml(p.yonyouNo || '—')) +
          dlRow('飞书项目编号', escHtml(p.feishuNo || '—')) +
          dlRow('项目状态', '<span class="tag ' + tc[p.status] + '"><span class="tag d" style="background:' + (statusColors[p.status] || '#94A3B8') + '"></span>' + (st[p.status] || p.status) + '</span>') +
          dlRow('项目类型', '<span class="tag gr">' + escHtml(p.type || '—') + '</span>') +
          dlRow('费用类型', escHtml(p.costType || '—')) +
          dlRow('项目规模', '<span class="tag bo">' + escHtml(p.scale || '—') + '</span>') +
          dlRow('所属产品大类', escHtml(p.product || '—')) +
          dlRow('子产品名称', escHtml(p.subProduct || '—')) +
        '</div>' +
        '<div class="card"><div class="card-hd">📅 时间与人员</div>' +
          dlRow('项目立项时间', escHtml(p.createdAt || '—')) +
          dlRow('计划开始时间', escHtml(p.start || '—')) +
          dlRow('计划结束时间', escHtml(p.end || '—')) +
          dlRow('项目完成时间', escHtml(p.completedAt || '—')) +
          dlRow('项目负责人', ldr.name ? '<span class="mav" style="background:#2563EB;width:22px;height:22px;font-size:10px;">' + ldr.name[0] + '</span> ' + escHtml(ldr.name) : '—') +
          dlRow('项目发起人', spn.name ? escHtml(spn.name) : '—') +
          dlRow('项目目标', '<span style="font-size:12px;line-height:1.6;">' + escHtml(p.desc || '—') + '</span>') +
          dlRow('备注', '<span style="font-size:12px;color:var(--tx3);">' + escHtml(p.note || '—') + '</span>') +
          dlRow('项目成员', memberTags) +
        '</div>' +
      '</div>' +
      // ── 第二行：成员工时详情 ──
      '<div class="card" style="margin-bottom:20px;"><div class="card-hd">👥 项目成员工时明细（' + (p.members || []).length + '人）</div>' +
        memberTable +
      '</div>' +
    '</div>' +
    '<div id="de" style="display:none;"></div>';
  page = 'proj';
}

// 详情行渲染辅助
function dlRow(label, value) {
  return '<div class="dl"><span class="lb">' + label + '</span><span class="vl">' + value + '</span></div>';
}

/* ═══════════════════════════════════════════════════════════════
   PROJECT EDIT — 完整字段编辑 + 写回多维表格全部字段
   ═══════════════════════════════════════════════════════════════ */
function editProj(pid) {
  var p = PROJ.find(function (x) { return x._id === pid; });
  if (!p || !canEdit()) return;
  selProj = p;
  openDet(pid);
  setTimeout(function () { startEdit(); }, 100);
}

function startEdit() {
  if (!selProj) return;
  editData = JSON.parse(JSON.stringify(selProj));
  tmpMems = JSON.parse(JSON.stringify(selProj.members || []));
  var p = selProj;
  var ldr = p.leader || {};
  var spn = p.sponsor || {};

  document.getElementById('dv').style.display = 'none';
  document.getElementById('de').style.display = '';

  // 项目类型选项（含全部6类）
  var typeOpts = ['商业交付类项目（A类）', '软件产品研发类项目（B类）', '创新实验室项目（C类）', '公司能力建设类项目（D类）'];
  var selOpt = function (val, cur) { return val === cur ? ' selected' : ''; };

  document.getElementById('de').innerHTML =
    '<div class="d-row">' +
      // ── 左列：核心信息 ──
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
      // ── 右列：人员 + 时间 ──
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
    // ── 成员工时编辑 ──
    '<div class="card"><div class="card-hd">编辑项目成员<button class="btn btn-o btn-sm" onclick="showMemModal()">+ 编辑成员</button></div>' +
      '<p style="font-size:12px;color:var(--tx2);margin-bottom:12px;">项目周期：<b>' + (p.start || '—') + ' ~ ' + (p.end || '—') + '</b>，月份列随起止时间自动调整。</p>' +
      '<div id="tmpTbl">' + renderTmpMems() + '</div>' +
    '</div>' +
    // ── 状态变更 ──
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

  // 状态选择框事件
  setTimeout(function () {
    var ns = document.getElementById('e-status');
    if (ns) ns.onchange = function () {
      var w = document.getElementById('e-status-reason-wrap');
      if (w) w.style.display = this.value ? '' : 'none';
    };
  }, 50);
}

// HTML 属性值转义
function escAttr(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderTmpMems() {
  var p = editData || selProj;
  return renderMemberTable({ members: tmpMems, start: p.start, end: p.end }, true);
}
function removeTmpMem(i) { tmpMems.splice(i, 1); document.getElementById('tmpTbl').innerHTML = renderTmpMems(); }
function syncMemHours() {
  var months = getMonths(editData.start, editData.end || editData.start);
  tmpMems.forEach(function (m) {
    var nh = {};
    months.forEach(function (mon) { nh[mon] = (m.hours && m.hours[mon]) || 0; });
    m.hours = nh;
    m.total = Object.values(nh).reduce(function (a, b) { return a + b; }, 0);
  });
}

/* saveEdit — 写回多维表格全部字段 + 成员工时表 */
async function saveEdit() {
  if (!editData) return;

  // ── 读取表单全部字段 ──
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

  var leaderId = document.getElementById('eld').value;
  var sponsorId = (document.getElementById('espn') || {}).value || '';

  editData.leader  = leaderId ? { id: leaderId, name: (PPL.find(function (x) { return x.id === leaderId; }) || {}).name || '' } : null;
  editData.sponsor = sponsorId ? { id: sponsorId, name: (PPL.find(function (x) { return x.id === sponsorId; }) || {}).name || '' } : null;

  syncMemHours();
  editData.members = tmpMems;

  // ── 写回 bitable：项目清单（全部字段） ──
  var projectFields = {
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

  // ── 同步成员工时到 bitable ──
  try {
    await syncMembersToBitable(editData._id, tmpMems, editData.start, editData.end);
  } catch (e) {
    console.error('saveEdit: member sync failed', e);
  }

  // ── 更新本地状态 ──
  var idx = PROJ.findIndex(function (p) { return p._id === editData._id; });
  if (idx >= 0) PROJ[idx] = editData;
  selProj = editData;
  addLogEntry('修改项目', editData.name, '更新全部字段信息和成员');

  // ── 状态变更 ──
  var ns = document.getElementById('e-status');
  if (ns && ns.value) {
    var toStatus = ns.value;
    var reasonEl = document.getElementById('e-status-reason');
    var reason = (reasonEl ? reasonEl.value : '') || '用户发起状态变更申请。';
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

/* syncMembersToBitable */
async function syncMembersToBitable(projectId, members, start, end) {
  var months = getMonths(start, end || start);
  // 删除旧记录
  var oldMembers = MEMBER_MAP[projectId] || [];
  for (var i = 0; i < oldMembers.length; i++) {
    if (oldMembers[i]._id) {
      try { await API.deleteMember(oldMembers[i]._id); } catch (e) { /* ignore */ }
    }
  }
  // 创建新记录
  for (var mi = 0; mi < members.length; mi++) {
    var mem = members[mi];
    for (var j = 0; j < months.length; j++) {
      var mon = months[j];
      var hoursVal = (mem.hours && mem.hours[mon]) || 0;
      if (hoursVal === 0 && j > 0) continue;
      try {
        await API.upsertMember(null, {
          '项目': [projectId],
          '成员': [{ id: mem.pid }],
          '角色': (mem.roles || ['成员']).join(','),
          '人员属性': mem.attr || '国智',
          '年份月份': mon,
          '工时': hoursVal
        });
      } catch (e) { console.error('sync member failed', e); }
    }
  }
  // 重新加载映射
  try {
    var memRaw = await API.getMembers();
    if (memRaw && memRaw.data) {
      buildMemberMap(memRaw);
      var proj = PROJ.find(function (p) { return p._id === projectId; });
      if (proj) proj.members = buildMembers(projectId);
    }
  } catch (e) { /* ignore */ }
}

/* 日志写入 */
async function addLogEntry(action, target, detail) {
  var now = new Date();
  var dt = now.getFullYear() + '-' +
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
  } catch (e) { console.error('addLogEntry failed', e); }
}

/* ═══════════════════════════════════════════════════════════════
   MEMBER MODAL
   ═══════════════════════════════════════════════════════════════ */
function showMemModal() {
  syncMemHours();
  var p = editData || selProj;
  var months = getMonths(p && p.start, (p && p.end) || (p && p.start));
  var m = document.createElement('div'); m.className = 'mod'; m.style.display = 'flex';
  m.onclick = function (e) { if (e.target === this) this.remove(); };

  var rows = tmpMems.map(function (mem, i) {
    // 姓名解析：优先用 pname（来自项目成员字段），其次按名字匹配人员表
    var name = mem.pname || '';
    var pp = PPL.find(function (x) { return x.id === mem.pid; });
    if (!pp) pp = PPL.find(function (x) { return x.name === name; });
    if (pp && !name) name = pp.name;
    if (!name) name = mem.pid || '未知';
    var av = pp ? pp.av : stringToColor(name);
    var total = months.reduce(function (s, mon) { return s + (parseFloat((mem.hours && mem.hours[mon]) || 0) || 0); }, 0);

    // 角色下拉（多选）
    var roleSel = '<select multiple data-name="roles" style="width:100%;min-width:140px;padding:4px 6px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:11px;font-family:var(--font);background:var(--surf);" size="' + Math.min(ROLES.length, 4) + '">' +
      ROLES.map(function (r) {
        var sel = (mem.roles || []).indexOf(r) >= 0 ? ' selected' : '';
        return '<option value="' + r + '"' + sel + '>' + r + '</option>';
      }).join('') + '</select>';
    // 人员属性下拉
    var attrSel = '<select data-name="attr" style="width:100%;padding:4px 6px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:11px;font-family:var(--font);background:var(--surf);">' +
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

  var emptyRow = !tmpMems.length
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
  // 人员来源：项目成员字段（有真实 open_id）+ 人员表（可能 ID 体系不同，按姓名去重）
  var candidates = [];
  var seenNames = {};
  // 先从项目当前成员来
  if (selProj && selProj.memberIds) {
    selProj.memberIds.forEach(function (m) {
      var nm = (m.name || '').trim();
      if (nm && !seenNames[nm]) {
        seenNames[nm] = true;
        candidates.push({ id: m.id, name: nm, dept: '', av: stringToColor(nm) });
      }
    });
  }
  // 再合并人员表，仅补充不重名的
  PPL.forEach(function (x) {
    var nm = (x.name || '').trim();
    if (nm && !seenNames[nm]) {
      seenNames[nm] = true;
      candidates.push({ id: x.id, name: nm, dept: x.dept || '', av: x.av });
    }
  });

  var avail = candidates.filter(function (x) { return !tmpMems.some(function (m) { return m.pid === x.id; }); });
  if (!avail.length) { toast('暂无可添加人员', 'err'); return; }
  var m = document.createElement('div'); m.className = 'mod'; m.style.display = 'flex';
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
  var checked = btn.closest('.mod').querySelectorAll('input[type="checkbox"]:checked');
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
  var rows = btn.closest('.mod').querySelectorAll('tbody tr[data-idx]');
  rows.forEach(function (row) {
    var idx = parseInt(row.dataset.idx);
    // 从下拉读取角色（多选）
    var roleSel = row.querySelector('select[data-name="roles"]');
    var roles = [];
    if (roleSel) {
      for (var ri = 0; ri < roleSel.options.length; ri++) {
        if (roleSel.options[ri].selected) roles.push(roleSel.options[ri].value);
      }
    }
    // 从下拉读取人员属性
    var attrSel = row.querySelector('select[data-name="attr"]');
    var attr = attrSel ? attrSel.value : '国智';
    // 读取工时
    var hours = {}, total = 0;
    row.querySelectorAll('.m-hour').forEach(function (inp) {
      var v = parseFloat(inp.value) || 0;
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
  document.getElementById('tmpTbl').innerHTML = renderTmpMems();
  toast('已更新成员（' + tmpMems.length + '人），保存项目时同步至飞书', 'ok');
}

/* ═══════════════════════════════════════════════════════════════
   MERGE LIST — REQ-DS-002, REQ-PM-001（含写回数据清洗表）
   ═══════════════════════════════════════════════════════════════ */
function renderMerge() {
  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>待合并项目清单</h1><p class="subt">飞书同步项目的暂存区，仅管理员/PMO可操作（REQ-DS-002）</p></div><button class="btn btn-p" onclick="showCreateModal()">+ 手动创建项目</button></div>' +
    '<div class="ban w"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>此清单仅系统管理员/PMO可操作，需清洗合并后进入正式项目清单。</div>' +
    '<div class="tbl-wrap">' +
      (MERGE.length === 0 ? '<div class="empty">暂无待合并项目</div>' :
      '<table><thead><tr><th>类型</th><th>编号</th><th>名称</th><th>来源</th><th>同步时间</th><th>合并情况</th><th>操作</th></tr></thead><tbody>' +
      MERGE.map(function (m) {
        var tagClass = m.type === 'setup' ? 'b' : m.type === 'close' ? 'r' : 'gr';
        var tagText = m.type === 'setup' ? '立项' : m.type === 'close' ? '结项' : '手动创建';
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

/* 手动创建项目 → 写回数据清洗表 */
function showCreateModal() {
  var m = document.createElement('div'); m.className = 'mod'; m.style.display = 'flex';
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
  var nm = document.getElementById('ncn').value.trim();
  if (!nm) { toast('请输入项目名称', 'err'); return; }
  var newNo = document.getElementById('ncno').value || ('PRJ-' + new Date().getFullYear() + '-NEW');

  var mergeData = {
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
    var result = await API.upsertMerge(null, mergeData);
    // result 包含 record_id
    var recordId = (result && result.record_id) || ('m' + Date.now());
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
    toast('创建失败：' + e.message, 'err');
    // 降级：仅本地创建
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

function quickNew(mid) {
  var mi = MERGE.find(function (m) { return m._id === mid; });
  if (!mi) return;
  PROJ.push({
    _id: 'p' + Date.now(), name: mi.f.name, yonyouNo: mi.f.no || mi.no || '',
    feishuNo: '', status: '进行中', type: mi.f.type, costType: '',
    scale: mi.f.scale || '', desc: mi.f.desc || '', note: '',
    product: mi.f.product || '', subProduct: mi.f.subProduct || '',
    leader: mi.f.leader, sponsor: mi.f.sponsor, memberIds: mi.f.members || [],
    start: new Date().toISOString().split('T')[0], end: '', createdAt: new Date().toISOString().split('T')[0],
    completedAt: '', members: []
  });
  // 标记数据清洗表为已合并
  try {
    API.updateMerge(mid, { '合并情况': '已合并' }).catch(function () {});
  } catch (e) {}
  MERGE.splice(MERGE.indexOf(mi), 1);
  addLogEntry('快速新建', mi.f.name, '从待合并清单直接创建项目');
  toast('已新建项目，状态：进行中', 'ok');
  renderMerge(); updateBadges();
}

/* ═══════════════════════════════════════════════════════════════
   MERGE PROCESS — REQ-PM-006, PM-007（含写回 bitable）
   ═══════════════════════════════════════════════════════════════ */
function startMerge(mid) {
  selMerge = MERGE.find(function (m) { return m._id === mid; });
  if (!selMerge) return;
  mergeStep = selMerge.type === 'close' ? 0 : 1;
  page = 'merge';
  document.getElementById('bc').innerHTML = '待合并项目清单 &rsaquo; <span>合并项目信息</span>';
  renderMergeStep();
}

function renderMergeStep() {
  var mi = selMerge;
  var ct = document.getElementById('content');
  var isClose = mi.type === 'close';

  var stepHTML;
  if (isClose) {
    var sc = function (n) { return mergeStep === n ? 'on' : mergeStep > n ? 'ok' : ''; };
    stepHTML = '<div class="steps">' +
      '<div class="step ' + sc(0) + '"><span class="no">' + (mergeStep > 0 ? '✓' : '1') + '</span>编辑结项信息</div>' +
      '<div class="step-d ' + (mergeStep > 0 ? 'ok' : '') + '"></div>' +
      '<div class="step ' + sc(1) + '"><span class="no">' + (mergeStep > 1 ? '✓' : '2') + '</span>冲突检测</div>' +
      '<div class="step-d ' + (mergeStep > 1 ? 'ok' : '') + '"></div>' +
      '<div class="step ' + sc(2) + '"><span class="no">' + (mergeStep > 2 ? '✓' : '3') + '</span>字段比对</div>' +
      '<div class="step-d ' + (mergeStep > 2 ? 'ok' : '') + '"></div>' +
      '<div class="step ' + sc(3) + '"><span class="no">4</span>确认合并</div></div>';
  } else {
    var sc2 = function (n) { return mergeStep === n ? 'on' : mergeStep > n ? 'ok' : ''; };
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
    var cf = PROJ.filter(function (p) {
      return (p.yonyouNo && mi.f.no && p.yonyouNo === mi.f.no) ||
             (p.name && mi.f.name && (p.name.includes(mi.f.name.substring(0, 4)) || mi.f.name.includes(p.name.substring(0, 4))));
    });
    var tagCls = mi.type === 'setup' ? 'b' : mi.type === 'close' ? 'r' : 'gr';
    var tagTx = mi.type === 'setup' ? '立项' : mi.type === 'close' ? '结项' : '手动创建';
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
  }
  if (mergeStep === 2) {
    var tgt = PROJ.find(function (p) { return p._id === mi._cid; });
    var fields = [
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
        var mv = mi.f[f.k] === undefined || mi.f[f.k] === null ? '—' : String(mi.f[f.k]);
        var tv = (tgt && tgt[f.k] !== undefined ? String(tgt[f.k]) : '—');
        var md = mv, td = tv;
        if (f.k === 'leader') {
          md = (mi.f.leader && mi.f.leader.name) || mv;
          td = (tgt && tgt.leader && tgt.leader.name) || tv;
        }
        return '<div class="cmp"><span class="fl">' + f.l + '</span><div class="fo">' +
          '<div class="opt sel" onclick="selOpt(this,\'' + f.k + '\',\'merge\')"><span class="rd"></span>' + md + '</div>' +
          '<div class="opt" onclick="selOpt(this,\'' + f.k + '\',\'target\')"><span class="rd"></span>' + td + '</div>' +
        '</div></div>';
      }).join('') + '</div>' +
      '<div style="margin-top:20px;text-align:right;"><button class="btn btn-p btn-lg" onclick="goStep(3)">下一步 &rarr;</button></div>';
  }
  if (mergeStep === 3) {
    var tgt2 = PROJ.find(function (p) { return p._id === mi._cid; });
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
  var mi = selMerge;
  var cd = document.getElementById('ce-closeDate').value;
  var cr = document.getElementById('ce-closeReason').value;
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
  var mi = selMerge;
  var tgt = mi._cid ? PROJ.find(function (p) { return p._id === mi._cid; }) : null;

  if (tgt) {
    // 合并到现有项目
    Object.keys(mi._choices || {}).forEach(function (k) {
      if (k === 'actualEnd' || k === 'closeReason') return;
      if (mi._choices[k] === 'merge' && mi.f[k] !== undefined) tgt[k] = mi.f[k];
    });
    tgt.status = mi.type === 'close' ? '已结项' : '进行中';

    // 写回 bitable
    try {
      await API.updateProject(tgt._id, {
        '项目名称': tgt.name,
        '项目类型': tgt.type,
        '所属产品大类': tgt.product || '',
        '项目状态': tgt.status,
        '项目目标': tgt.desc || ''
      });
    } catch (e) { console.error('doMerge: update project failed', e); }
  } else {
    // 创建新项目
    var newProj = {
      _id: 'p' + Date.now(), name: mi.f.name, yonyouNo: mi.f.no || '',
      feishuNo: '', status: '进行中', type: mi.f.type,
      costType: '', scale: mi.f.scale || '', desc: mi.f.desc || '', note: '',
      product: mi.f.product || '', subProduct: mi.f.subProduct || '',
      leader: mi.f.leader, sponsor: mi.f.sponsor, memberIds: mi.f.members || [],
      start: new Date().toISOString().split('T')[0], end: '',
      createdAt: new Date().toISOString().split('T')[0], completedAt: '', members: []
    };
    PROJ.push(newProj);

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
    } catch (e) { console.error('doMerge: create project failed', e); }
  }

  // ── 标记数据清洗表为已合并 ──
  try {
    await API.updateMerge(mi._id, { '合并情况': '已合并' });
  } catch (e) {
    console.error('doMerge: update merge status failed', e);
  }

  // ── 移入已合并清单 ──
  MERGED.push({
    id: mi._id, no: mi.no, name: mi.name, flowType: mi.flowType,
    type: mi.type, src: mi.src, dt: mi.dt, f: JSON.parse(JSON.stringify(mi.f)),
    _cid: mi._cid || null, _choices: mi._choices ? JSON.parse(JSON.stringify(mi._choices)) : {},
    status: '已处理',
    mergedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    targetName: tgt ? tgt.name : '新建项目'
  });
  MERGE.splice(MERGE.indexOf(mi), 1);

  addLogEntry('合并项目', mi.f.name, (mi.type === 'close' ? '结项' : '立项') + '合并至项目清单');
  toast('项目合并完成！已同步至飞书', 'ok');
  updateBadges(); renderMerge();
}

/* ═══════════════════════════════════════════════════════════════
   MERGED PROJECT LIST
   ═══════════════════════════════════════════════════════════════ */
function renderMerged(flt) {
  var f = flt || 'all';
  var list = [...MERGED];
  if (f !== 'all') list = list.filter(function (m) { return m.status === f; });

  var tagCls = { 'setup': 'b', 'close': 'r', 'both': 'y', 'manual': 'gr' };
  var tagTx = { 'setup': '立项', 'close': '结项', 'both': '立项+结项', 'manual': '手动创建' };
  var statusCls = { '已处理': 'g', '初始化': 'y' };

  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>已合并项目清单</h1><p class="subt">合并完成的项目记录。可重置状态移回待合并清单。</p></div></div>' +
    '<div class="tbl-wrap">' +
      '<div class="tbl-bar">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<span style="font-size:12px;font-weight:600;color:var(--tx2);">状态筛选：</span>' +
          '<div class="ft">' +
            '<button class="' + (f === 'all' ? 'sel' : '') + '" onclick="renderMerged(\'all\')">全部</button>' +
            '<button class="' + (f === '已处理' ? 'sel' : '') + '" onclick="renderMerged(\'已处理\')">已处理</button>' +
            '<button class="' + (f === '初始化' ? 'sel' : '') + '" onclick="renderMerged(\'初始化\')">初始化</button>' +
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
            (m.status === '已处理' ? '<button class="btn btn-o btn-sm" onclick="resetMergeStatus(\'' + m.id + '\')">重置为初始化</button>' : '') +
          '</td></tr>';
      }).join('') + '</tbody></table>') +
    '</div>';
  page = 'merged';
}

/* resetMergeStatus — 写回数据清洗表 */
async function resetMergeStatus(mid) {
  var mi = MERGED.find(function (m) { return m.id === mid; });
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
    f: JSON.parse(JSON.stringify(mi.f)), status: '初始化'
  });
  addLogEntry('重置合并状态', mi.f.name, '状态由「已处理」重置为「初始化」');
  updateBadges(); renderMerged();
  toast('已重置为初始化', 'ok');
}

/* ═══════════════════════════════════════════════════════════════
   APPROVAL — REQ-PA-001（含写回审批表）
   ═══════════════════════════════════════════════════════════════ */
function renderAppr() {
  var pending = APPR.filter(function (a) { return a.st === 'pending'; });
  var done = APPR.filter(function (a) { return a.st !== 'pending'; });
  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>项目审批</h1><p class="subt">审核项目状态变更请求，仅PMO/管理员可操作（REQ-PA-001）</p></div></div>' +
    '<h3 style="margin-bottom:12px;">待审批（' + pending.length + '）</h3>' +
    '<div class="tbl-wrap" style="margin-bottom:28px;">' +
      (pending.length === 0 ? '<div class="empty">暂无待审批</div>' :
      '<table><thead><tr><th>项目</th><th>变更</th><th>发起人</th><th>日期</th><th>原因</th><th>操作</th></tr></thead><tbody>' +
      pending.map(function (a) {
        return '<tr><td><span class="ct">' + a.pn + '</span></td>' +
          '<td>' + a.from + ' &rarr; <span style="color:var(--pri);font-weight:600;">' + a.to + '</span></td>' +
          '<td>' + a.who + '</td><td style="font-size:12px;">' + a.dt + '</td>' +
          '<td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;">' + (a.reason || '') + '</td>' +
          '<td class="ca"><button class="btn btn-s btn-sm" onclick="doAppr(\'' + a.id + '\',\'approved\')">通过</button><button class="btn btn-d btn-sm" onclick="doAppr(\'' + a.id + '\',\'rejected\')">拒绝</button></td></tr>';
      }).join('') + '</tbody></table>') +
    '</div>' +
    '<h3 style="margin-bottom:12px;">已处理</h3>' +
    '<div class="tbl-wrap">' +
      (done.length === 0 ? '<div class="empty">暂无已处理</div>' :
      '<table><thead><tr><th>项目</th><th>变更</th><th>发起人</th><th>结果</th><th>审批人</th><th>日期</th><th>备注</th></tr></thead><tbody>' +
      done.map(function (a) {
        return '<tr><td><span class="ct">' + a.pn + '</span></td>' +
          '<td>' + a.from + ' &rarr; ' + a.to + '</td><td>' + a.who + '</td>' +
          '<td><span class="tag ' + (a.st === 'approved' ? 'g' : 'r') + '">' + (a.result || '') + '</span></td>' +
          '<td>' + (a.rv || '—') + '</td><td style="font-size:12px;">' + (a.rd || '') + '</td>' +
          '<td style="font-size:11px;color:var(--tx3);max-width:180px;">' + (a.st === 'rejected' ? (a.rr || '—') : '—') + '</td></tr>';
      }).join('') + '</tbody></table>') +
    '</div>';
  page = 'appr';
}

async function doAppr(aid, result) {
  if (!canAppr()) return;
  if (result === 'rejected') { showRejectModal(aid); return; }
  var a = APPR.find(function (x) { return x.id === aid; });
  if (!a) return;
  a.st = 'approved'; a.result = '通过'; a.rv = '当前用户（PMO）'; a.rd = new Date().toISOString().split('T')[0];
  var p = PROJ.find(function (x) { return x._id === a.pid; });
  if (p) {
    var m = { '已完成': '已完成', '挂起': '挂起', '已作废': '已作废' };
    p.status = m[a.to] || p.status;
    // 写回项目状态
    try { await API.updateProject(p._id, { '项目状态': p.status }); } catch (e) {}
  }
  // 写回审批表
  try {
    await API.createApproval({
      '详情': '审批通过：' + a.pn + ' ' + a.from + '→' + a.to,
      '发起人': a.who ? [{ id: 'ou_current' }] : [],
      '审批人': [{ id: 'ou_current' }]
    });
  } catch (e) {}
  addLogEntry('审批通过', a.pn, '状态变更生效：' + a.from + ' → ' + a.to);
  updateBadges(); renderAppr();
  toast('审批通过 ✓', 'ok');
}

function showRejectModal(aid) {
  var a = APPR.find(function (x) { return x.id === aid; });
  if (!a) return;
  var m = document.createElement('div'); m.className = 'mod'; m.style.display = 'flex';
  m.onclick = function (e) { if (e.target === this) this.remove(); };
  m.innerHTML = '<div class="mod-p sm"><div class="mod-h"><h3>审批拒绝（REQ-PA-001）</h3><button class="btn btn-gh btn-sm" onclick="this.closest(\'.mod\').remove()">&times;</button></div>' +
    '<div class="mod-b"><p style="margin-bottom:14px;">项目：<b>' + a.pn + '</b><br>变更申请：' + a.from + ' &rarr; ' + a.to + '</p>' +
    '<div class="fg"><label>拒绝原因 *</label><textarea id="reject-reason" style="min-height:60px;"></textarea></div></div>' +
    '<div class="mod-f"><button class="btn btn-gh" onclick="this.closest(\'.mod\').remove()">取消</button><button class="btn btn-d" onclick="confirmReject(\'' + aid + '\')">确认拒绝</button></div></div>';
  document.body.appendChild(m);
}

async function confirmReject(aid) {
  var reasonEl = document.getElementById('reject-reason');
  var reason = reasonEl ? reasonEl.value.trim() : '';
  if (!reason) { toast('请填写拒绝原因', 'err'); return; }
  var a = APPR.find(function (x) { return x.id === aid; });
  if (!a) return;
  a.st = 'rejected'; a.result = '拒绝'; a.rv = '当前用户（PMO）'; a.rd = new Date().toISOString().split('T')[0]; a.rr = reason;
  try {
    await API.createApproval({ '详情': '审批拒绝：' + a.pn + ' ' + a.from + '→' + a.to + ' 原因：' + reason });
  } catch (e) {}
  document.querySelectorAll('.mod').forEach(function (mod) { mod.remove(); });
  addLogEntry('审批拒绝', a.pn, '状态变更被拒绝，项目状态保持' + a.from + '。原因：' + reason);
  updateBadges(); renderAppr();
  toast('状态变更已拒绝', 'err');
}

/* ═══════════════════════════════════════════════════════════════
   ROLE MANAGEMENT — 系统管理员维护角色表（同步飞书）
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
  var inp = document.getElementById('newRoleInput');
  var v = inp.value.trim();
  if (!v) { toast('请输入角色名称', 'err'); return; }
  if (ROLES.includes(v)) { toast('角色已存在', 'err'); return; }
  ROLES.push(v); inp.value = '';
  document.getElementById('roleTbBody').innerHTML = renderRoleTable();
  addLogEntry('角色管理', '角色表', '添加角色「' + v + '」');
  try { await API.createRole(v); } catch (e) { console.error('addRole sync failed', e); }
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
  var v = document.getElementById('role-edit-' + i).value.trim();
  if (!v) { toast('角色名称不能为空', 'err'); return; }
  var old = ROLES[i];
  if (v !== old && ROLES.includes(v)) { toast('角色已存在', 'err'); return; }
  ROLES[i] = v;
  document.getElementById('roleTbBody').innerHTML = renderRoleTable();
  addLogEntry('角色管理', '角色表', v !== old ? '重命名「' + old + '」→「' + v + '」' : '保存「' + v + '」');
  // 角色表没有直接的 record_id，通过重新加载来同步
  // 实际上需要先 delete 再 create
  try {
    var allRoles = await API.getRoles();
    if (allRoles && allRoles.data) {
      var ids = allRoles.record_id_list || [];
      var fields = allRoles.fields || [];
      var fi = fields.indexOf('角色名称');
      // 找到旧角色并删除
      if (old !== v && fi >= 0) {
        for (var j = 0; j < (allRoles.data || []).length; j++) {
          if (allRoles.data[j][fi] === old && ids[j]) {
            await API.deleteRole(ids[j]);
            break;
          }
        }
      }
      await API.createRole(v);
    }
  } catch (e) { console.error('saveRoleEdit sync failed', e); }
  toast(v !== old ? '已重命名' : '保存成功', 'ok');
}

async function delRole(i) {
  var r = ROLES[i];
  if (!confirm('确定删除角色「' + r + '」？')) return;
  ROLES.splice(i, 1);
  document.getElementById('roleTbBody').innerHTML = renderRoleTable();
  addLogEntry('角色管理', '角色表', '删除角色「' + r + '」');
  try {
    var allRoles = await API.getRoles();
    if (allRoles && allRoles.data) {
      var ids = allRoles.record_id_list || [];
      var fields = allRoles.fields || [];
      var fi = fields.indexOf('角色名称');
      if (fi >= 0) {
        for (var j = 0; j < (allRoles.data || []).length; j++) {
          if (allRoles.data[j][fi] === r && ids[j]) {
            await API.deleteRole(ids[j]);
            break;
          }
        }
      }
    }
  } catch (e) { console.error('delRole sync failed', e); }
  toast('已删除角色「' + r + '」', 'ok');
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCT MANAGEMENT — 产品管理（同步飞书）
   产品表实际 schema：所属产品大类、子产品名称、ID
   ═══════════════════════════════════════════════════════════════ */

function getProductOptions(selected) {
  var s = selected || '';
  // 先列出所有顶级产品
  var topLevel = PRODUCTS.filter(function (p) { return !p.parent; });
  var subs = PRODUCTS.filter(function (p) { return p.parent; });

  function renderOpts(parentName, depth) {
    var d = depth || 0;
    var children = subs.filter(function (p) { return p.parent === parentName; });
    var html = '';
    children.forEach(function (prod) {
      var prefix = d > 0 ? '└' + '—'.repeat(d) + ' ' : '';
      html += '<option value="' + prod.name + '" ' + (s === prod.name ? 'selected' : '') + '>' + prefix + prod.name + '</option>';
      html += renderOpts(prod.name, d + 1);
    });
    return html;
  }

  var html = '';
  topLevel.forEach(function (p) {
    html += '<option value="' + p.name + '" ' + (s === p.name ? 'selected' : '') + '>' + p.name + '</option>';
    html += renderOpts(p.name, 1);
  });
  // 也包含仅作为大类出现的名称
  var allParentNames = [...new Set(subs.map(function (p) { return p.parent; }).filter(Boolean))];
  allParentNames.forEach(function (n) {
    if (!topLevel.some(function (p) { return p.name === n; })) {
      html += '<option value="' + n + '" ' + (s === n ? 'selected' : '') + '>' + n + '</option>';
    }
  });
  // 补充项目中引用但不在产品表中的产品名
  var seenNames = new Set();
  PRODUCTS.forEach(function (p) { seenNames.add(p.name); });
  allParentNames.forEach(function (n) { seenNames.add(n); });
  PROJ.forEach(function (p) {
    if (p.product && !seenNames.has(p.product)) {
      seenNames.add(p.product);
      html += '<option value="' + p.product + '" ' + (s === p.product ? 'selected' : '') + '>' + p.product + '</option>';
    }
  });
  return html;
}

function renderProducts() {
  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>产品管理</h1><p class="subt">维护产品及子产品层级关系，修改将同步至飞书多维表格。</p></div></div>' +
    '<div class="tbl-wrap">' +
      '<div class="tbl-bar">' +
        '<div style="display:flex;align-items:center;gap:8px;flex:1;flex-wrap:wrap;">' +
          '<select id="newProdParent" style="padding:7px 12px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:13px;font-family:var(--font);background:var(--surf);">' +
            '<option value="">作为主产品</option>' + getProductOptions() +
          '</select>' +
          '<input type="text" id="newProdInput" placeholder="输入产品名称..." style="padding:7px 12px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:13px;font-family:var(--font);width:180px;" onkeydown="if(event.key===\'Enter\')addProduct()">' +
          '<button class="btn btn-p btn-sm" onclick="addProduct()">+ 添加</button>' +
          '<span style="color:var(--bd);margin:0 4px;">|</span>' +
          '<button class="btn btn-gh btn-sm" onclick="expandAll()">全部展开</button>' +
          '<button class="btn btn-gh btn-sm" onclick="collapseAll()">全部收起</button>' +
        '</div>' +
        '<span style="font-size:12px;color:var(--tx3);">共 ' + PRODUCTS.length + ' 个产品</span>' +
      '</div>' +
      '<div id="prodTbBody">' + renderProductTable() + '</div>' +
    '</div>';
  page = 'products';
}

function expandAll() {
  PRODUCTS.forEach(function (p) { expandedProducts[p.id] = true; });
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
}

function collapseAll() {
  PRODUCTS.forEach(function (p) { expandedProducts[p.id] = false; });
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
}

function toggleProduct(prodId) {
  expandedProducts[prodId] = !expandedProducts[prodId];
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
}

function renderProductTable() {
  if (!PRODUCTS.length) return '<div class="empty">暂无产品，请添加</div>';

  function countTreeRefs(prod) {
    var cnt = PROJ.filter(function (p) { return p.product === prod.name; }).length +
              MERGE.filter(function (m) { return (m.f && m.f.product) === prod.name; }).length +
              MERGED.filter(function (m) { return (m.f && m.f.product) === prod.name; }).length;
    var children = PRODUCTS.filter(function (p) { return p.parent === prod.name; });
    children.forEach(function (c) { cnt += countTreeRefs(c); });
    return cnt;
  }

  function renderRow(prod, depth, ancestors) {
    var d = depth || 0;
    var anc = ancestors || [];
    var children = PRODUCTS.filter(function (p) { return p.parent === prod.name; });
    var hasChildren = children.length > 0;
    var expanded = expandedProducts[prod.id] !== false;
    var projCount = PROJ.filter(function (p) { return p.product === prod.name; }).length;
    var mergeCount = MERGE.filter(function (m) { return (m.f && m.f.product) === prod.name; }).length;
    var directRef = projCount + mergeCount;
    var allRef = countTreeRefs(prod);

    var prefix = '';
    for (var i = 0; i < anc.length; i++) {
      prefix += '<span style="color:var(--tx3);">' + (anc[i].isLast ? '&emsp;&ensp;' : '│&emsp;&ensp;') + '</span>';
    }
    var isLast = anc.length > 0 ? anc[anc.length - 1].isLast : true;
    var connector = d > 0 ? '<span style="color:var(--tx3);">' + (isLast ? '└── ' : '├── ') + '</span>' : '';

    var levelTag = d === 0 ? '<span class="tag b">主产品</span>' : '<span class="tag gr">' + d + ' 级子产品</span>';

    var toggleBtn = '';
    if (hasChildren) {
      toggleBtn = '<span class="tree-toggle" onclick="toggleProduct(\'' + prod.id + '\')" style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:4px;margin-right:4px;font-size:10px;color:var(--tx2);background:var(--mu);user-select:none;flex-shrink:0;">' + (expanded ? '▼' : '▶') + '</span>';
    } else {
      toggleBtn = '<span style="display:inline-block;width:20px;margin-right:4px;flex-shrink:0;"></span>';
    }

    var refHtml = directRef > 0
      ? '<span style="font-weight:600;color:var(--tx);">' + directRef + '</span><span style="color:var(--tx3);"> 个直接关联</span>'
      : '<span style="color:var(--tx3);">—</span>';
    if (hasChildren && allRef > directRef) {
      refHtml += ' <span style="font-size:11px;color:var(--tx3);">（含子产品共 ' + allRef + '）</span>';
    }

    var rowStyle = d === 0 ? 'background:var(--mu);' : '';
    var html = '<tr id="prod-row-' + prod.id + '" style="' + rowStyle + '">' +
      '<td>' + prefix + connector + toggleBtn + '<span class="ct" id="prod-name-' + prod.id + '">' + prod.name + '</span>' +
        '<input type="text" class="role-edit-inline" id="prod-edit-' + prod.id + '" value="' + prod.name + '" style="display:none;" onkeydown="if(event.key===\'Enter\')saveProductEdit(\'' + prod.id + '\')">' +
      '</td>' +
      '<td>' + levelTag + '</td>' +
      '<td style="font-size:12px;">' + refHtml + '</td>' +
      '<td class="ca">' +
        '<button class="btn btn-o btn-sm" id="prod-btn-edit-' + prod.id + '" onclick="startProdEdit(\'' + prod.id + '\')">✎ 编辑</button>' +
        '<button class="btn btn-p btn-sm" id="prod-btn-save-' + prod.id + '" style="display:none;" onclick="saveProductEdit(\'' + prod.id + '\')">保存</button>' +
        '<button class="btn btn-gh btn-sm" style="color:var(--red);" onclick="delProduct(\'' + prod.id + '\')">删除</button>' +
      '</td></tr>';

    if (hasChildren && expanded) {
      children.forEach(function (child, ci) {
        var childAnc = anc.concat([{ id: prod.id, isLast: ci === children.length - 1 }]);
        html += renderRow(child, d + 1, childAnc);
      });
    }
    return html;
  }

  var topLevel = PRODUCTS.filter(function (p) { return !p.parent; });
  if (!topLevel.length) return '<div class="empty">暂无主产品，请添加</div>';

  return '<table><thead><tr><th>产品名称</th><th>层级</th><th>关联项目</th><th style="width:180px;">操作</th></tr></thead><tbody>' +
    topLevel.map(function (prod) { return renderRow(prod, 0, []); }).join('') +
    '</tbody></table>';
}

/* addProduct — 写回产品表 */
async function addProduct() {
  var inp = document.getElementById('newProdInput');
  var parentSel = document.getElementById('newProdParent');
  var v = inp.value.trim();
  if (!v) { toast('请输入产品名称', 'err'); return; }
  var parentName = parentSel.value || '';

  // 检查重名（同父级下）
  if (PRODUCTS.some(function (p) { return p.name === v && p.parent === (parentName || null); })) {
    toast('同层级下已存在同名产品', 'err'); return;
  }

  var newId = 'prod' + Date.now();
  var isSub = !!parentName;
  PRODUCTS.push({
    id: newId, name: v,
    parent: parentName || null,
    fullName: parentName ? parentName + ' - ' + v : v,
    isSub: isSub
  });

  inp.value = '';
  parentSel.value = '';
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
  addLogEntry('产品管理', '产品表', '添加产品「' + v + '」');

  // 写回 bitable
  try {
    await API.createProduct({
      '所属产品大类': parentName,
      '子产品名称': isSub ? v : ''
    });
  } catch (e) { console.error('addProduct sync failed', e); }

  toast('已添加产品「' + v + '」', 'ok');
}

function startProdEdit(prodId) {
  document.getElementById('prod-name-' + prodId).style.display = 'none';
  document.getElementById('prod-edit-' + prodId).style.display = '';
  document.getElementById('prod-edit-' + prodId).focus();
  document.getElementById('prod-btn-edit-' + prodId).style.display = 'none';
  document.getElementById('prod-btn-save-' + prodId).style.display = '';
}

async function saveProductEdit(prodId) {
  var v = document.getElementById('prod-edit-' + prodId).value.trim();
  if (!v) { toast('产品名称不能为空', 'err'); return; }
  var prod = PRODUCTS.find(function (p) { return p.id === prodId; });
  if (!prod) return;
  var old = prod.name;
  if (v !== old && PRODUCTS.some(function (p) { return p.name === v && p.parent === prod.parent && p.id !== prodId; })) {
    toast('同层级下已存在同名产品', 'err'); return;
  }
  // 重命名引用
  if (v !== old) {
    PROJ.forEach(function (p) { if (p.product === old) p.product = v; });
    MERGE.forEach(function (m) { if (m.f && m.f.product === old) m.f.product = v; });
    MERGED.forEach(function (m) { if (m.f && m.f.product === old) m.f.product = v; });
    // 子产品的 parent 引用
    PRODUCTS.forEach(function (p) { if (p.parent === old) p.parent = v; });
  }
  prod.name = v;
  if (prod.parent && prod.isSub) {
    prod.fullName = prod.parent + ' - ' + v;
  }
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
  addLogEntry('产品管理', '产品表', v !== old ? '重命名「' + old + '」→「' + v + '」（已同步更新所有关联项目）' : '保存「' + v + '」');

  // 写回 bitable：先删旧记录再建新记录
  try {
    // 对于产品表，rename 需要找到旧记录并更新
    var allProds = await API.getProducts();
    if (allProds && allProds.data) {
      var fields = allProds.fields || [];
      var fiSub = fields.indexOf('子产品名称');
      var fiParent = fields.indexOf('所属产品大类');
      var ids = allProds.record_id_list || [];
      if (fiSub >= 0 && fiParent >= 0) {
        for (var j = 0; j < (allProds.data || []).length; j++) {
          var row = allProds.data[j];
          if (prod.isSub && row[fiSub] === old && row[fiParent] === (prod.parent || '')) {
            if (ids[j]) await API.updateProduct(ids[j], { '子产品名称': v });
            break;
          } else if (!prod.isSub && row[fiParent] === old && !row[fiSub]) {
            if (ids[j]) await API.updateProduct(ids[j], { '所属产品大类': v });
            break;
          }
        }
      }
    }
  } catch (e) { console.error('saveProductEdit sync failed', e); }

  toast(v !== old ? '已重命名，关联项目已同步更新' : '保存成功', 'ok');
}

async function delProduct(prodId) {
  var prod = PRODUCTS.find(function (p) { return p.id === prodId; });
  if (!prod) return;
  var children = PRODUCTS.filter(function (p) { return p.parent === prod.name; });
  if (children.length) {
    toast('请先删除子产品：' + children.map(function (c) { return c.name; }).join('、'), 'err');
    return;
  }
  var projCount = PROJ.filter(function (p) { return p.product === prod.name; }).length;
  var mergeCount = MERGE.filter(function (m) { return (m.f && m.f.product) === prod.name; }).length;
  if (!confirm((projCount > 0 || mergeCount > 0
    ? '产品「' + prod.name + '」关联了 ' + projCount + ' 个项目、' + mergeCount + ' 条待合并记录。删除后这些关联将变为空，确定继续？'
    : '确定删除产品「' + prod.name + '」？'))) return;

  PRODUCTS.splice(PRODUCTS.indexOf(prod), 1);
  PROJ.forEach(function (p) { if (p.product === prod.name) p.product = ''; });
  MERGE.forEach(function (m) { if (m.f && m.f.product === prod.name) m.f.product = ''; });
  MERGED.forEach(function (m) { if (m.f && m.f.product === prod.name) m.f.product = ''; });
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
  addLogEntry('产品管理', '产品表', '删除产品「' + prod.name + '」');

  // 写回 bitable
  try {
    var allProds = await API.getProducts();
    if (allProds && allProds.data) {
      var fields = allProds.fields || [];
      var fiSub = fields.indexOf('子产品名称');
      var fiParent = fields.indexOf('所属产品大类');
      var ids = allProds.record_id_list || [];
      if (fiSub >= 0 && fiParent >= 0) {
        for (var j = 0; j < (allProds.data || []).length; j++) {
          var row = allProds.data[j];
          if (prod.isSub && row[fiSub] === prod.name && row[fiParent] === (prod.parent || '')) {
            if (ids[j]) await API.deleteProduct(ids[j]);
            break;
          } else if (!prod.isSub && row[fiParent] === prod.name && !row[fiSub]) {
            if (ids[j]) await API.deleteProduct(ids[j]);
            break;
          }
        }
      }
    }
  } catch (e) { console.error('delProduct sync failed', e); }

  toast('已删除产品「' + prod.name + '」', 'ok');
}

/* ═══════════════════════════════════════════════════════════════
   USER MANAGEMENT — REQ-SM-001, SM-002（同步人员表）
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
  var list = [...USER_DATA];
  if (f) {
    var q = f.toLowerCase();
    list = list.filter(function (u) {
      var pp = PPL.find(function (x) { return x.id === u.pid; });
      return ((pp && pp.name) || '').toLowerCase().includes(q) || u.rl.toLowerCase().includes(q);
    });
  }
  var tc = { admin: 'b', pmo: 'g', lead: 'y', user: 'gr' };
  var perm = { admin: '全部权限', pmo: '审批+待合并操作', lead: '查看+编辑项目', user: '仅查看项目' };
  document.getElementById('userTb').innerHTML = list.map(function (u) {
    var pp = PPL.find(function (x) { return x.id === u.pid; });
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
  var sel = Object.entries(userSel).filter(function (e) { return e[1]; }).map(function (e) { return e[0]; });
  if (!sel.length) { toast('请先勾选用户', 'err'); return; }
  var m = document.createElement('div'); m.className = 'mod'; m.style.display = 'flex';
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

/* batchRole — 写回人员表 */
async function batchRole(uids, r) {
  var lb = { user: '用户', lead: '项目负责人', pmo: 'PMO', admin: '系统管理员' };
  uids.split(',').forEach(function (uid) {
    var u = USER_DATA.find(function (x) { return x.id === uid; });
    if (u) { u.role = r; u.rl = lb[r]; }
  });
  document.querySelectorAll('.mod').forEach(function (m) { m.remove(); });
  addLogEntry('调整角色', uids.split(',').length + '名用户', '角色设为"' + lb[r] + '"');

  // 写回人员表
  var uidList = uids.split(',');
  for (var i = 0; i < uidList.length; i++) {
    var uid = uidList[i];
    var u = USER_DATA.find(function (x) { return x.id === uid; });
    if (u && u.pid) {
      try {
        await API.updateUser(u.pid, { '权限': lb[r] });
      } catch (e) { console.error('batchRole sync failed for', uid, e); }
    }
  }
  renderUsers();
  toast('角色已调整为"' + lb[r] + '"', 'ok');
}

/* ═══════════════════════════════════════════════════════════════
   OPERATION LOGS
   ═══════════════════════════════════════════════════════════════ */
function renderLogs(flt) {
  var list = flt || LOGS;
  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>操作日志</h1><p class="subt">追溯系统操作记录（REQ-SM-003）</p></div></div>' +
    '<div class="tbl-wrap">' +
      '<div class="tbl-bar">' +
        '<div style="display:flex;align-items:center;gap:8px;font-size:13px;">日期筛选：' +
        '<input type="date" style="padding:6px 10px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:13px;font-family:var(--font);" onchange="filterLogs(this.value)" id="logD">' +
        '<button class="btn btn-gh btn-sm" onclick="document.getElementById(\'logD\').value=\'\';renderLogs();">清除</button></div>' +
      '</div>' +
      (list.length === 0 ? '<div class="empty">暂无操作记录</div>' :
      '<table><thead><tr><th style="width:170px;">时间</th><th style="width:110px;">操作人</th><th style="width:100px;">操作类型</th><th style="width:160px;">目标对象</th><th>详情</th></tr></thead><tbody>' +
      list.map(function (l) {
        return '<tr><td style="font-size:11px;color:var(--tx3);">' + l.t + '</td>' +
          '<td>' + l.u + '</td>' +
          '<td><span class="tag gr">' + l.a + '</span></td>' +
          '<td>' + l.g + '</td>' +
          '<td style="font-size:12px;color:var(--tx2);">' + l.d + '</td></tr>';
      }).join('') + '</tbody></table>') +
    '</div>';
  page = 'logs';
}

function filterLogs(d) {
  renderLogs(d ? LOGS.filter(function (l) { return l.t.startsWith(d); }) : LOGS);
}

/* ═══════════════════════════════════════════════════════════════
   DATA SYNC — REQ-DS-001, DS-002, DS-003
   ═══════════════════════════════════════════════════════════════ */
async function doSyncProjects() {
  toast('正在同步...', 'inf');
  try {
    var data = await API.getMergeList();
    var m = transformMerge(data);
    MERGE = m.merge;
    MERGED = m.merged;
    addLogEntry('飞书同步', '数据清洗表', '同步' + m.merge.length + '条待合并+' + m.merged.length + '条已合并');
    toast('已同步 ' + m.merge.length + ' 条待合并 + ' + m.merged.length + ' 条已合并', 'ok');
    updateBadges();
    renderMerge();
  } catch (e) { toast('同步失败: ' + e.message, 'err'); }
}

async function doSyncPeople() {
  toast('正在同步人员...', 'inf');
  try {
    var data = await API.getUsers();
    var u = transformUsers(data);
    PPL = u.people;
    USER_DATA = u.userData;
    addLogEntry('人员同步', '全公司', '从人员表同步' + u.people.length + '人');
    toast('已同步 ' + u.people.length + ' 人', 'ok');
  } catch (e) { toast('同步失败: ' + e.message, 'err'); }
}

function doPushOutput() {
  addLogEntry('推送输出', '费控/禅道', '推送至费控系统、禅道（REQ-DS-003）');
  toast('已推送至费控系统、禅道（模拟）', 'ok');
}
