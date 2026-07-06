/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════ */
const PPL = [
  { id:'p1', name:'张明远', dept:'技术部', av:'#2563EB' },{ id:'p2', name:'李晓华', dept:'产品部', av:'#059669' },
  { id:'p3', name:'王建国', dept:'设计部', av:'#7C3AED' },{ id:'p4', name:'赵丽娜', dept:'技术部', av:'#EA580C' },
  { id:'p5', name:'陈思远', dept:'市场部', av:'#DB2777' },{ id:'p6', name:'刘伟强', dept:'运营部', av:'#0D9488' },
  { id:'p7', name:'周美玲', dept:'产品部', av:'#4F46E5' },{ id:'p8', name:'吴志豪', dept:'技术部', av:'#E11D48' },
  { id:'p9', name:'郑雅文', dept:'设计部', av:'#2563EB' },{ id:'p10', name:'黄俊杰', dept:'市场部', av:'#059669' },
];

/* 后台可维护角色表（REQ-PM-003） */
let ROLES = [
  '项目负责人','项目经理','产品经理','架构师','前端开发','后端开发','移动端开发','测试','UI设计',
  '数据分析师','算法工程师','安全专家','业务分析师','合规专员','运维','技术顾问'
];

/* 人员属性枚举（REQ-PM-003） */
const ATTRS = ['国智','合作方','其他'];

const PROJ = [
  { id:'p1', no:'PRJ-2026-001', name:'智能客服平台建设', type:'external', product:'产品A', leader:'p1', status:'active', start:'2026-03-01', end:'2026-09-30', desc:'构建基于AI的智能客服平台，实现7×24小时自动应答，提升客户服务效率。', members:[
    {pid:'p1',roles:['项目负责人'],attr:'国智',hours:h('2026-03-01','2026-09-30',120),total:840},
    {pid:'p2',roles:['产品经理'],attr:'国智',hours:h('2026-03-01','2026-05-31',100),total:300},
    {pid:'p4',roles:['前端开发'],attr:'合作方',hours:h('2026-04-01','2026-07-31',100),total:400},
    {pid:'p8',roles:['后端开发'],attr:'国智',hours:h('2026-04-01','2026-08-31',100),total:500}
  ]},
  { id:'p2', no:'PRJ-2026-002', name:'数据中台升级改造', type:'internal', product:'产品B', leader:'p3', status:'active', start:'2026-02-15', end:'2026-08-31', desc:'对公司数据中台进行架构升级，提升数据处理能力与稳定性。', members:[
    {pid:'p3',roles:['项目负责人','架构师'],attr:'国智',hours:h('2026-02-01','2026-08-31',120),total:840},
    {pid:'p6',roles:['数据分析师'],attr:'国智',hours:h('2026-03-01','2026-06-30',100),total:400},
    {pid:'p7',roles:['产品经理'],attr:'合作方',hours:h('2026-02-01','2026-04-30',100),total:300}
  ]},
  { id:'p3', no:'PRJ-2026-003', name:'移动端App重构', type:'external', product:'产品A', leader:'p2', status:'completed', start:'2026-01-01', end:'2026-06-30', desc:'对现有移动端App全面重构，采用Flutter跨平台方案。已按时交付。', members:[
    {pid:'p2',roles:['项目负责人'],attr:'国智',hours:h('2026-01-01','2026-06-30',120),total:720},
    {pid:'p9',roles:['UI设计'],attr:'合作方',hours:h('2026-01-01','2026-02-29',100),total:200},
    {pid:'p4',roles:['移动端开发'],attr:'国智',hours:h('2026-02-01','2026-06-30',100),total:500}
  ]},
  { id:'p4', no:'PRJ-2025-018', name:'ERP系统对接项目', type:'internal', product:'产品C', leader:'p5', status:'active', start:'2025-11-01', end:'2026-07-31', desc:'完成公司ERP系统与各业务系统的接口对接与数据集成。', members:[
    {pid:'p5',roles:['项目负责人'],attr:'国智',hours:h('2025-11-01','2026-07-31',120),total:1080},
    {pid:'p10',roles:['业务分析师'],attr:'合作方',hours:h('2025-11-01','2026-01-31',100),total:300},
    {pid:'p1',roles:['技术顾问'],attr:'国智',hours:h('2026-01-01','2026-03-31',100),total:300}
  ]},
  { id:'p5', no:'PRJ-2026-004', name:'微服务架构迁移', type:'internal', product:'产品B', leader:'p8', status:'suspended', start:'2026-04-01', end:'2026-12-31', desc:'将现有单体应用逐步迁移至微服务架构，分三阶段实施。因资源冲突暂挂。', members:[
    {pid:'p8',roles:['项目负责人'],attr:'国智',hours:h('2026-04-01','2026-06-30',120),total:360},
    {pid:'p4',roles:['后端开发'],attr:'国智',hours:h('2026-04-01','2026-06-30',100),total:300}
  ]},
  { id:'p6', no:'PRJ-2025-012', name:'办公自动化系统', type:'external', product:'产品C', leader:'p6', status:'cancelled', start:'2025-08-01', end:'2026-03-31', desc:'建设公司内部办公自动化系统。因战略调整已终止。', members:[
    {pid:'p6',roles:['项目负责人'],attr:'国智',hours:h('2025-08-01','2026-03-31',120),total:960}
  ]},
  { id:'p7', no:'PRJ-2026-005', name:'AI推荐引擎开发', type:'external', product:'产品A', leader:'p1', status:'active', start:'2026-05-01', end:'2026-11-30', desc:'开发深度学习推荐引擎，应用于内容分发与商品推荐，目标提升转化率30%。', members:[
    {pid:'p1',roles:['项目负责人'],attr:'国智',hours:h('2026-05-01','2026-11-30',120),total:840},
    {pid:'p8',roles:['算法工程师'],attr:'国智',hours:h('2026-05-01','2026-09-30',100),total:500},
    {pid:'p2',roles:['产品经理'],attr:'合作方',hours:h('2026-05-01','2026-07-31',100),total:300}
  ]},
  { id:'p8', no:'PRJ-2026-006', name:'安全合规审计平台', type:'internal', product:'产品B', leader:'p7', status:'closed', start:'2026-01-15', end:'2026-06-15', desc:'建立安全合规审计平台，满足行业监管要求。已于2026年6月通过结项审批。', members:[
    {pid:'p7',roles:['项目负责人'],attr:'国智',hours:h('2026-01-01','2026-06-30',120),total:720},
    {pid:'p10',roles:['合规专员'],attr:'合作方',hours:h('2026-01-01','2026-06-30',100),total:600},
    {pid:'p3',roles:['安全专家'],attr:'国智',hours:h('2026-01-01','2026-03-31',100),total:300}
  ]},
];

const MERGE = [
  { id:'m1', no:'PRJ-2026-007', name:'智能客服平台二期建设', type:'setup', src:'飞书立项流程', dt:'2026-07-03 14:30', f:{name:'智能客服平台二期建设',no:'PRJ-2026-007',type:'external',product:'产品A',leader:'p1',desc:'增加语音识别与情感分析功能。',status:'draft'} },
  { id:'m2', no:'PRJ-2026-008', name:'数据分析可视化看板', type:'setup', src:'飞书立项流程', dt:'2026-07-04 09:15', f:{name:'数据分析可视化看板',no:'PRJ-2026-008',type:'external',product:'产品B',leader:'p6',desc:'搭建实时数据看板，支持多维度钻取。',status:'draft'} },
  { id:'m3', no:'PRJ-2025-012', name:'办公自动化系统（结项）', type:'close', src:'飞书结项流程', dt:'2026-07-04 16:00', f:{name:'办公自动化系统',no:'PRJ-2025-012',type:'external',product:'产品C',leader:'p6',desc:'项目终止结项。',status:'draft',closeDate:'2026-03-31',closeReason:'战略调整'} },
];

/* 已合并项目清单（合并后自动移入，状态：已处理；可手动重置为初始化回到待合并清单） */
const MERGED = [
  { id:'mg1', no:'PRJ-2026-007', name:'智能客服平台二期建设（示例）', type:'setup', src:'飞书立项流程', dt:'2026-07-05 10:00', f:{name:'智能客服平台二期建设',no:'PRJ-2026-007',type:'external',product:'产品A',leader:'p1',desc:'示例已合并记录。',status:'draft'}, _cid:'p1', _choices:{}, status:'已处理', mergedAt:'2026-07-05 10:30', targetName:'智能客服平台建设' },
];

/* 产品管理（REQ-PM-005：产品及子产品的枚举值与层级关系在系统后台维护） */
let PRODUCTS = [
  { id:'prod1', name:'产品A', parent:null },
  { id:'prod1a', name:'产品A-Web端', parent:'prod1' },
  { id:'prod1b', name:'产品A-移动端', parent:'prod1' },
  { id:'prod1a1', name:'产品A-Web管理后台', parent:'prod1a' },
  { id:'prod2', name:'产品B', parent:null },
  { id:'prod3', name:'产品C', parent:null },
];

const APPR = [
  { id:'a1', pid:'p1', pn:'智能客服平台建设', from:'进行中', to:'已完成', who:'张明远', dt:'2026-07-04', st:'pending', reason:'项目已完成全部开发与测试，申请结项。' },
  { id:'a2', pid:'p4', pn:'ERP系统对接项目', from:'进行中', to:'挂起', who:'陈思远', dt:'2026-07-03', st:'pending', reason:'等待第三方系统接口就绪，需暂时挂起。' },
  { id:'a3', pid:'p7', pn:'AI推荐引擎开发', from:'进行中', to:'已作废', who:'张明远', dt:'2026-07-02', st:'pending', reason:'技术方案重大调整，当前项目作废。' },
  { id:'a4', pid:'p3', pn:'移动端App重构', from:'进行中', to:'已完成', who:'李晓华', dt:'2026-06-28', st:'approved', result:'通过', rv:'PMO-王经理', rd:'2026-06-29' },
  { id:'a5', pid:'p8', pn:'安全合规审计平台', from:'进行中', to:'已结项', who:'周美玲', dt:'2026-06-15', st:'rejected', result:'拒绝', rv:'PMO-王经理', rd:'2026-06-16', rr:'状态变更不合规，应通过结项流程触发。' },
];

const LOGS = [
  { t:'2026-07-05 10:30', u:'张明远', a:'修改项目', g:'智能客服平台建设', d:'更新项目描述与成员信息' },
  { t:'2026-07-05 09:15', u:'PMO-王经理', a:'审批通过', g:'移动端App重构', d:'状态由"进行中"变更为"已完成"' },
  { t:'2026-07-04 16:00', u:'系统', a:'飞书同步', g:'办公自动化系统（结项）', d:'从飞书结项流程同步至待合并清单' },
  { t:'2026-07-04 14:30', u:'张明远', a:'合并项目', g:'智能客服平台建设', d:'从待合并清单合并至项目清单' },
  { t:'2026-07-04 11:00', u:'张明远', a:'调整角色', g:'李晓华', d:'角色由"用户"变更为"项目负责人"' },
  { t:'2026-07-03 15:22', u:'系统', a:'飞书同步', g:'数据分析可视化看板', d:'从飞书立项流程同步至待合并清单' },
  { t:'2026-07-03 08:45', u:'PMO-王经理', a:'审批拒绝', g:'安全合规审计平台', d:'状态变更不合规，应通过结项流程触发' },
  { t:'2026-07-02 17:00', u:'系统', a:'人员同步', g:'全公司', d:'从人事系统同步人员信息' },
];

const USER_DATA = [
  { id:'u1', pid:'p1', role:'admin', rl:'系统管理员' },{ id:'u2', pid:'p2', role:'lead', rl:'项目负责人' },
  { id:'u3', pid:'p3', role:'lead', rl:'项目负责人' },{ id:'u4', pid:'p4', role:'user', rl:'用户' },
  { id:'u5', pid:'p5', role:'lead', rl:'项目负责人' },{ id:'u6', pid:'p6', role:'lead', rl:'项目负责人' },
  { id:'u7', pid:'p7', role:'lead', rl:'项目负责人' },{ id:'u8', pid:'p8', role:'lead', rl:'项目负责人' },
  { id:'u9', pid:'p9', role:'pmo', rl:'PMO' },{ id:'u10', pid:'p10', role:'user', rl:'用户' },
];

/* ═══════════════════════════════════════
   STATE
   ═══════════════════════════════════════ */
let role = 'admin';
let page = '';
let selProj = null;
let editData = null;
let tmpMems = [];
let selMerge = null;
let mergeStep = 1;
let userSel = {};
let statusPid = null;
let filterStatus = 'all';
let filterProduct = 'all';
let expandedProducts = {}; // 产品树展开/收起状态
let filterType = 'all';
let filterLeader = 'all';
let viewMode = 'list';

/* ═══════════════════════════════════════
   INIT
   ═══════════════════════════════════════ */
(function init() { applyRole(); navTo('proj'); })();

/* ═══════════════════════════════════════
   ROLE MANAGEMENT
   ═══════════════════════════════════════ */
function switchRole(r) { role = r; applyRole(); closeRoleModal(); if (!pageOK(page)) navTo('proj'); updateBadges(); }
function applyRole() {
  const m = { admin:['管','系统管理员','全部权限'], pmo:['P','PMO','审批+操作'], lead:['负','项目负责人','查看+编辑'], user:['用','普通用户','仅查看'] };
  document.getElementById('roleAv').textContent = m[role][0];
  document.getElementById('roleNm').textContent = m[role][1];
  document.getElementById('topRoleTag').textContent = m[role][1];
  document.querySelector('#roleBtn .rtg').textContent = m[role][2];
  const adminOnly = role==='admin';
  const adminPmo = role==='admin'||role==='pmo';
  ['navMerge','navAppr'].forEach(function (id) { const e = document.getElementById(id); if(e) e.style.display = adminPmo ? '' : 'none'; });
  ['navUsers','navLogs','navSync','navSyncP','navPush','navRoles','navMerged','navProducts'].forEach(function (id) { const e = document.getElementById(id); if(e) e.style.display = adminOnly ? '' : 'none'; });
}
function pageOK(p) { if (role==='admin') return true; if (role==='pmo') return ['proj','merge','appr'].includes(p); return ['proj'].includes(p); }
function canEdit() { return role==='admin'||role==='lead'; }
function canAppr() { return role==='admin'||role==='pmo'; }
function showRoleModal() { document.getElementById('roleModal').style.display = 'flex'; }
function closeRoleModal() { document.getElementById('roleModal').style.display = 'none'; }

/* ═══════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════ */
function navTo(p) {
  page = p;
  document.querySelectorAll('#sideNav .nav-i').forEach(function (el) { el.classList.remove('on'); });
  const ni = document.querySelector('[data-pg="' + p + '"]');
  if (ni) ni.classList.add('on');
  const labels = { proj:'项目清单', merge:'待合并项目清单', appr:'项目审批', users:'用户与权限管理', logs:'操作日志', roles:'角色管理', merged:'已合并项目清单', products:'产品管理' };
  document.getElementById('bc').innerHTML = labels[p] || p;
  updateBadges();
  switch(p) {
    case 'proj': renderProj(); break; case 'merge': renderMerge(); break;
    case 'appr': renderAppr(); break; case 'users': renderUsers(); break;
    case 'logs': renderLogs(); break; case 'roles': renderRoles(); break;
    case 'merged': renderMerged(); break;
    case 'products': renderProducts(); break;
  }
}

/* ═══════════════════════════════════════
   PROJECT LIST — REQ-PM-005
   ═══════════════════════════════════════ */
function renderProj() {
  const st = { active:'进行中',completed:'已完成',suspended:'挂起',cancelled:'已作废',closed:'已结项' };
  let list = [...PROJ];
  const q = (document.getElementById('projQ')?.value||'').toLowerCase();
  if (q) list = list.filter(function (p) { return p.name.toLowerCase().includes(q) || p.no.toLowerCase().includes(q); });
  if (filterStatus!=='all') list = list.filter(function (p) { return p.status===filterStatus; });
  if (filterProduct!=='all') list = list.filter(function (p) { return p.product===filterProduct; });
  if (filterType!=='all') list = list.filter(function (p) { return p.type===filterType; });
  if (filterLeader!=='all') list = list.filter(function (p) { return p.leader===filterLeader; });
  const products=[...new Set(PROJ.map(function (p) { return p.product; }))];
  const leaders=[...new Set(PROJ.map(function (p) { return p.leader; }))];

  document.getElementById('content').innerHTML = '\
    <div class="ph"><div><h1>项目清单</h1><p class="subt">管理所有项目信息，支持搜索、筛选与分类查看（REQ-PM-005）</p></div></div>\
    <div class="tbl-wrap">\
      <div class="tbl-bar">\
        <div class="tbl-src"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" placeholder="搜索项目名称、编号..." id="projQ" oninput="renderProj()"></div>\
        <div style="display:flex;align-items:center;gap:12px;">\
          <div class="ft" id="ftBtns">\
            <button class="' + (filterStatus==='all'?'sel':'') + '" onclick="setF(\'all\',this)">全部</button><button class="' + (filterStatus==='active'?'sel':'') + '" onclick="setF(\'active\',this)">进行中</button><button class="' + (filterStatus==='completed'?'sel':'') + '" onclick="setF(\'completed\',this)">已完成</button><button class="' + (filterStatus==='suspended'?'sel':'') + '" onclick="setF(\'suspended\',this)">挂起</button><button class="' + (filterStatus==='cancelled'?'sel':'') + '" onclick="setF(\'cancelled\',this)">已作废</button><button class="' + (filterStatus==='closed'?'sel':'') + '" onclick="setF(\'closed\',this)">已结项</button>\
          </div>\
          <div class="ft"><button class="' + (viewMode==='list'?'sel':'') + '" onclick="setV(\'list\',this)">列表</button><button class="' + (viewMode==='tree'?'sel':'') + '" onclick="setV(\'tree\',this)">按产品分组</button></div>\
        </div>\
      </div>\
      <div style="display:flex;align-items:center;gap:12px;padding:10px 20px;border-bottom:1px solid var(--bd);background:var(--mu);flex-wrap:wrap;">\
        <span style="font-size:12px;font-weight:600;color:var(--tx2);">筛选：</span>\
        <select onchange="setFilter(\'product\',this.value,this)" style="padding:5px 10px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:12px;font-family:var(--font);background:var(--surf);">\
          <option value="all" ' + (filterProduct==='all'?'selected':'') + '>所属产品：全部</option>' + getProductOptions(filterProduct==='all'?'':filterProduct) + '\
        </select>\
        <select onchange="setFilter(\'type\',this.value,this)" style="padding:5px 10px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:12px;font-family:var(--font);background:var(--surf);">\
          <option value="all" ' + (filterType==='all'?'selected':'') + '>项目类型：全部</option><option value="external" ' + (filterType==='external'?'selected':'') + '>外部项目</option><option value="internal" ' + (filterType==='internal'?'selected':'') + '>内部项目</option>\
        </select>\
        <select onchange="setFilter(\'leader\',this.value,this)" style="padding:5px 10px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:12px;font-family:var(--font);background:var(--surf);">\
          <option value="all" ' + (filterLeader==='all'?'selected':'') + '>项目负责人：全部</option>' + leaders.map(function (l) { const pp=PPL.find(function (x) { return x.id===l; }); return '<option value="' + l + '" ' + (filterLeader===l?'selected':'') + '>' + (pp?.name||l) + '</option>'; }).join('') + '\
        </select>\
        ' + (filterProduct!=='all'||filterType!=='all'||filterLeader!=='all'?'<button class="btn btn-gh btn-sm" onclick="clearFilters()">清除筛选</button>':'') + '\
        <span style="font-size:12px;color:var(--tx3);margin-left:auto;">共 ' + list.length + ' 个项目</span>\
      </div>\
      ' + (viewMode==='tree' ? treeView(list) : tblView(list)) + '\
    </div>';
}

function tblView(list) {
  const st = { active:'进行中',completed:'已完成',suspended:'挂起',cancelled:'已作废',closed:'已结项' };
  const tc = { active:'g',completed:'b',suspended:'y',cancelled:'r',closed:'gr' };
  if (!list.length) return '<div class="empty">暂无匹配项目</div>';
  return '<table><thead><tr><th>编号</th><th>项目名称</th><th>类型</th><th>产品</th><th>负责人</th><th>周期</th><th>状态</th><th>操作</th></tr></thead><tbody>' + list.map(function (p) { const ldr = PPL.find(function (x) { return x.id===p.leader; });
    return '<tr onclick="openDet(\'' + p.id + '\')"><td style="font-size:12px;color:var(--tx3);">' + p.no + '</td><td><span class="ct">' + p.name + '</span></td><td><span class="tag ' + (p.type==='external'?'b':'gr') + '">' + (p.type==='external'?'外部项目':'内部项目') + '</span></td><td>' + p.product + '</td><td>' + (ldr?.name||'—') + '</td><td style="font-size:12px;">' + p.start + ' ~ ' + p.end + '</td><td><span class="tag ' + tc[p.status] + '"><span class="tag d" style="background:' + (p.status==='active'?'#059669':p.status==='completed'?'#2563EB':p.status==='suspended'?'#D97706':p.status==='cancelled'?'#DC2626':'#94A3B8') + '"></span>' + st[p.status] + '</span></td><td class="ca" onclick="event.stopPropagation();"><button class="btn btn-gh btn-sm" onclick="openDet(\'' + p.id + '\')">查看</button>' + (canEdit()?'<button class="btn btn-o btn-sm" onclick="editProj(\'' + p.id + '\')">编辑</button>':'') + '</td></tr>'; }).join('') + '</tbody></table>';
}

function treeView(list) {
  const st = { active:'进行中',completed:'已完成',suspended:'挂起',cancelled:'已作废',closed:'已结项' };
  const tc = { active:'g',completed:'b',suspended:'y',cancelled:'r',closed:'gr' };
  if (!list.length) return '<div class="empty">暂无匹配项目</div>';
  const products = [...new Set(list.map(function (p) { return p.product; }))];
  return products.map(function (prod) { const items = list.filter(function (p) { return p.product===prod; });
    return '<div style="padding:0 20px 16px;"><div style="display:flex;align-items:center;gap:8px;padding:10px 0;font-weight:700;font-size:14px;color:var(--tx2);border-bottom:1px solid var(--bd);margin-bottom:6px;">' + prod + ' <span style="font-weight:400;font-size:12px;color:var(--tx3);">(' + items.length + '个项目)</span></div>\
    <table><thead><tr><th>编号</th><th>名称</th><th>类型</th><th>负责人</th><th>周期</th><th>状态</th><th>操作</th></tr></thead><tbody>' + items.map(function (p) { const ldr = PPL.find(function (x) { return x.id===p.leader; });
    return '<tr onclick="openDet(\'' + p.id + '\')"><td style="font-size:12px;color:var(--tx3);">' + p.no + '</td><td><span class="ct">' + p.name + '</span></td><td><span class="tag ' + (p.type==='external'?'b':'gr') + '">' + (p.type==='external'?'外部':'内部') + '</span></td><td>' + (ldr?.name||'—') + '</td><td style="font-size:12px;">' + p.start + ' ~ ' + p.end + '</td><td><span class="tag ' + tc[p.status] + '"><span class="tag d" style="background:' + (p.status==='active'?'#059669':p.status==='completed'?'#2563EB':p.status==='suspended'?'#D97706':p.status==='cancelled'?'#DC2626':'#94A3B8') + '"></span>' + st[p.status] + '</span></td><td class="ca" onclick="event.stopPropagation();"><button class="btn btn-gh btn-sm" onclick="openDet(\'' + p.id + '\')">查看</button>' + (canEdit()?'<button class="btn btn-o btn-sm" onclick="editProj(\'' + p.id + '\')">编辑</button>':'') + '</td></tr>'; }).join('') + '</tbody></table></div>'; }).join('');
}

function setF(s, btn) { filterStatus=s; btn.parentElement.querySelectorAll('button').forEach(function (b) { b.classList.remove('sel'); }); btn.classList.add('sel'); renderProj(); }
function setV(v, btn) { viewMode=v; btn.parentElement.querySelectorAll('button').forEach(function (b) { b.classList.remove('sel'); }); btn.classList.add('sel'); renderProj(); }
function setFilter(dim,val,el) {
  if(dim==='product') filterProduct=val;
  if(dim==='type') filterType=val;
  if(dim==='leader') filterLeader=val;
  renderProj();
}
function clearFilters() { filterProduct='all'; filterType='all'; filterLeader='all'; renderProj(); }

/* 成员表格渲染（详情/编辑共用） */
function renderMemberTable(p, editable) {
  const months = getMonths(p.start, p.end || p.start);
  if (!p.members || !p.members.length) return '<div class="empty">暂无成员</div>';
  const attrCls = { '国智':'b', '合作方':'y', '其他':'gr' };
  return '<div style="overflow-x:auto;"><table class="mem-tbl" style="min-width:' + (500 + months.length * 70) + 'px;"><thead><tr><th style="width:40px;">序号</th><th>姓名</th><th>角色</th><th style="width:80px;">人员属性</th>' + months.map(function (mon) { return '<th style="min-width:70px;text-align:center;">' + mon + '</th>'; }).join('') + '<th style="width:80px;text-align:center;">工时总计</th>' + (editable?'<th style="width:60px;">操作</th>':'') + '</tr></thead><tbody>' + p.members.map(function (m,i) { const pp=PPL.find(function (x) { return x.id===m.pid; }); return '<tr><td>' + (i+1) + '</td><td><span class="mav" style="background:' + (pp?.av||'#2563EB') + '">' + ((pp?.name||'?')[0]) + '</span>' + (pp?.name||'—') + ((m.roles||[]).includes('项目负责人')?' <span class="tag b" style="margin-left:4px;">负责人</span>':'') + '</td><td>' + (m.roles||[]).map(function (r) { return '<span class="tag gr" style="margin-right:3px;">' + r + '</span>'; }).join('') + '</td><td><span class="tag ' + (attrCls[m.attr]||'gr') + '">' + (m.attr||'—') + '</span></td>' + months.map(function (mon) { return '<td style="text-align:center;font-size:12px;color:var(--tx3);">' + (m.hours?.[mon] || '—') + '</td>'; }).join('') + '<td style="text-align:center;font-weight:600;">' + (m.total || 0) + '</td>' + (editable?'<td><button class="btn btn-gh btn-sm" style="color:var(--red);" onclick="removeTmpMem(' + i + ')">移除</button></td>':'') + '</tr>'; }).join('') + '</tbody></table></div>';
}

/* ═══════════════════════════════════════
   PROJECT DETAIL — REQ-PM-002
   ═══════════════════════════════════════ */
function openDet(pid) {
  const p = PROJ.find(function (x) { return x.id===pid; }); if(!p) return; selProj=p;
  const st = { active:'进行中',completed:'已完成',suspended:'挂起',cancelled:'已作废',closed:'已结项' };
  const tc = { active:'g',completed:'b',suspended:'y',cancelled:'r',closed:'gr' };
  const ldr = PPL.find(function (x) { return x.id===p.leader; });
  document.getElementById('bc').innerHTML = '项目清单 &rsaquo; <span>' + p.name + '</span>';
  document.getElementById('content').innerHTML = '\
    <div class="ph"><div><h1>' + p.name + '</h1><p class="subt">编号：' + p.no + '</p></div>\
      <div class="phr">' + (canEdit()?'<button class="btn btn-p" onclick="startEdit()">编辑项目</button>':'') + '<button class="btn btn-gh" onclick="navTo(\'proj\')">&larr; 返回清单</button></div></div>\
    <div id="dv"><div class="d-row"><div class="card"><div class="card-hd">基本信息（REQ-PM-002）</div>\
      <div class="dl"><span class="lb">项目编号</span><span class="vl">' + p.no + '</span></div>\
      <div class="dl"><span class="lb">项目类型</span><span class="vl"><span class="tag ' + (p.type==='external'?'b':'gr') + '">' + (p.type==='external'?'外部项目':'内部项目') + '</span></span></div>\
      <div class="dl"><span class="lb">所属产品</span><span class="vl">' + p.product + '</span></div>\
      <div class="dl"><span class="lb">负责人</span><span class="vl">' + (ldr?.name||'—') + '</span></div>\
      <div class="dl"><span class="lb">项目周期</span><span class="vl">' + p.start + ' ~ ' + p.end + '</span></div>\
      <div class="dl"><span class="lb">状态</span><span class="vl"><span class="tag ' + tc[p.status] + '"><span class="tag d" style="background:' + (p.status==='active'?'#059669':p.status==='completed'?'#2563EB':p.status==='suspended'?'#D97706':p.status==='cancelled'?'#DC2626':'#94A3B8') + '"></span>' + st[p.status] + '</span></span></div>\
      <div class="dl"><span class="lb">描述</span><span class="vl">' + p.desc + '</span></div></div>\
      <div class="card"><div class="card-hd">项目成员（' + p.members.length + '人）</div>\
        ' + renderMemberTable(p) + '\
      </div></div></div>\
    <div id="de" style="display:none;"></div>';
  page='proj';
}

/* ═══════════════════════════════════════
   PROJECT EDIT — REQ-PM-002, PM-003
   ═══════════════════════════════════════ */
function editProj(pid) { const p = PROJ.find(function (x) { return x.id===pid; }); if(!p||!canEdit()) return; selProj=p; startEdit(); }
function startEdit() {
  if(!selProj) return; editData=JSON.parse(JSON.stringify(selProj)); tmpMems=JSON.parse(JSON.stringify(selProj.members));
  const p=selProj;
  document.getElementById('dv').style.display='none';
  document.getElementById('de').style.display='';
  document.getElementById('de').innerHTML='\
    <div class="d-row"><div class="card"><div class="card-hd">编辑基本信息（REQ-PM-002）</div>\
      <div class="f-row"><div class="fg"><label>项目名称</label><input type="text" id="en" value="' + p.name + '"></div><div class="fg"><label>项目编号</label><input type="text" id="eno" value="' + p.no + '"></div></div>\
      <div class="f-row"><div class="fg"><label>项目类型</label><select id="et"><option value="external" ' + (p.type==='external'?'selected':'') + '>外部项目</option><option value="internal" ' + (p.type==='internal'?'selected':'') + '>内部项目</option></select></div><div class="fg"><label>所属产品</label><select id="ep">' + getProductOptions(p.product) + '</select></div></div>\
      <div class="f-row"><div class="fg"><label>负责人</label><select id="eld">' + PPL.map(function (x) { return '<option value="' + x.id + '" ' + (p.leader===x.id?'selected':'') + '>' + x.name + '</option>'; }).join('') + '</select></div><div class="fg"><label>开始日期</label><input type="date" id="es" value="' + p.start + '" onchange="editData.start=this.value; syncMemHours(); document.getElementById(\'tmpTbl\').innerHTML=renderTmpMems();"></div></div>\
      <div class="f-row"><div class="fg"><label>结束日期</label><input type="date" id="ee" value="' + p.end + '" onchange="editData.end=this.value; syncMemHours(); document.getElementById(\'tmpTbl\').innerHTML=renderTmpMems();"></div></div>\
      <div class="fg"><label>项目描述</label><textarea id="ed">' + p.desc + '</textarea></div>\
      </div>\
      <div class="card"><div class="card-hd">编辑项目成员（REQ-PM-003）<button class="btn btn-o btn-sm" onclick="showMemModal()">+ 编辑成员</button></div>\
        <p style="font-size:12px;color:var(--tx2);margin-bottom:12px;">项目周期：' + (p.start||'—') + ' ~ ' + (p.end||'—') + '，下方月份列随起止时间自动调整。</p>\
        <div id="tmpTbl">' + renderTmpMems() + '</div></div></div>\
    ' + (p.status==='active'?'<div class="card" style="margin-top:20px;"><div class="card-hd">项目状态变更（REQ-PM-004）</div>\
      <p style="font-size:12px;color:var(--tx2);margin-bottom:12px;">当前状态：<span class="tag g">进行中</span>。调整状态将触发 PMO 审批流程。</p>\
      <p style="font-size:11px;color:var(--yel);margin-bottom:12px;padding:8px 12px;background:var(--yel-l);border-radius:var(--r);">⚠ 状态变更与字段编辑解耦：审批失败不影响其他字段修改结果，仅状态退回原值。</p>\
      <div class="fg"><label>变更为目标状态</label><select id="e-status" onchange="const w=document.getElementById(\'e-status-reason-wrap\');if(w)w.style.display=this.value?\'\':\'none\';"><option value="" selected>不变更</option><option value="completed">已完成 — 项目正常完成</option><option value="suspended">挂起 — 暂时中止</option><option value="cancelled">已作废 — 项目作废</option></select></div>\
      <div class="fg" id="e-status-reason-wrap" style="display:none;"><label>变更原因</label><textarea id="e-status-reason" placeholder="请说明状态变更原因..."></textarea></div>\
    </div>':'') + '\
    <div style="margin-top:20px;display:flex;gap:10px;">\
      <button class="btn btn-p btn-lg" onclick="saveEdit()">保存全部修改</button>\
      <button class="btn btn-gh btn-lg" onclick="openDet(selProj.id)">取消编辑</button>\
    </div>';
}
function renderTmpMems() {
  const p = editData || selProj;
  return renderMemberTable({ ...p, members: tmpMems }, true);
}
function removeTmpMem(i) { tmpMems.splice(i,1); document.getElementById('tmpTbl').innerHTML=renderTmpMems(); }
function syncMemHours() {
  // 项目周期变化后，对齐成员工时对象的月份键并重新计算总计
  const months = getMonths(editData.start, editData.end || editData.start);
  tmpMems.forEach(function (m) {
    const nh = {};
    months.forEach(function (mon) { nh[mon] = m.hours?.[mon] || 0; });
    m.hours = nh;
    m.total = Object.values(nh).reduce(function (a, b) { return a + b; }, 0);
  });
}

function saveEdit() {
  if(!editData) return;
  editData.name=document.getElementById('en').value; editData.no=document.getElementById('eno').value;
  editData.type=document.getElementById('et').value; editData.product=document.getElementById('ep').value;
  editData.leader=document.getElementById('eld').value; editData.start=document.getElementById('es').value;
  editData.end=document.getElementById('ee').value; editData.desc=document.getElementById('ed').value;
  syncMemHours();
  editData.members=tmpMems;
  const idx=PROJ.findIndex(function (p) { return p.id===editData.id; }); if(idx>=0) PROJ[idx]=editData;
  selProj=editData;
  LOGS.unshift({t:new Date().toISOString().replace('T',' ').substring(0,16),u:'当前用户',a:'修改项目',g:editData.name,d:'更新基本信息和成员'});
  // 检查是否有状态变更（REQ-PM-004：状态编辑与字段编辑解耦）
  const ns=document.getElementById('e-status');
  if(ns&&ns.value){
    const lb={completed:'已完成',suspended:'挂起',cancelled:'已作废'};
    const reason=document.getElementById('e-status-reason')?.value||'用户发起状态变更申请。';
    APPR.unshift({id:'a'+Date.now(),pid:editData.id,pn:editData.name,from:'进行中',to:lb[ns.value],who:'当前用户',dt:new Date().toISOString().split('T')[0],st:'pending',reason:reason});
    LOGS.unshift({t:new Date().toISOString().replace('T',' ').substring(0,16),u:'当前用户',a:'发起审批',g:editData.name,d:'状态变更申请：进行中 → ' + lb[ns.value]});
    updateBadges();
    toast('项目信息已保存；状态变更申请已提交，等待PMO审核','inf');
  } else {
    toast('项目信息已保存','ok');
  }
  openDet(editData.id);
}

/* ═══════════════════════════════════════
   MEMBER MODAL — REQ-PM-003
   表格列：序号 / 姓名 / 角色 / 人员属性 / 月份（按项目周期） / 工时总计
   ═══════════════════════════════════════ */
function showMemModal() {
  syncMemHours();
  const p = editData || selProj;
  const months = getMonths(p?.start, p?.end || p?.start);
  const m = document.createElement('div'); m.className='mod'; m.style.display='flex';
  m.onclick = function (e) { if(e.target===this) this.remove(); };

  const rows = tmpMems.map(function (mem, i) {
    const pp = PPL.find(function (x) { return x.id === mem.pid; });
    const total = months.reduce(function (s, mon) { return s + (parseFloat(mem.hours?.[mon]) || 0); }, 0);
    return '<tr data-idx="' + i + '">\
      <td style="text-align:center;">' + (i + 1) + '</td>\
      <td><span class="mav" style="background:' + (pp?.av||'#2563EB') + '">' + ((pp?.name||'?')[0]) + '</span>' + (pp?.name||'—') + '</td>\
      <td><div class="chip-grp" data-name="roles" data-multi="1" style="min-width:140px;">' + ROLES.map(function (r) { const isSel=(mem.roles||[]).includes(r); return '<span class="chip' + (isSel?' sel':'') + '" data-value="' + r + '" onclick="toggleChip(this,1)">' + r + (isSel?'<span class="ch-x">×</span>':'') + '</span>'; }).join('') + '</div></td>\
      <td><div class="chip-grp" data-name="attr" data-multi="0">' + ATTRS.map(function (a) { return '<span class="chip' + (mem.attr===a?' sel attr-sel':'') + '" data-value="' + a + '" onclick="toggleChip(this,0)">' + a + '</span>'; }).join('') + '</div></td>\
      ' + months.map(function (mon) { return '<td style="text-align:center;"><input type="number" class="m-hour" data-mon="' + mon + '" value="' + (mem.hours?.[mon] || '') + '" min="0" step="1" style="width:58px;text-align:center;padding:6px 4px;font-size:12px;" oninput="calcMemTotal(this)"></td>'; }).join('') + '\
      <td class="m-total" style="text-align:center;font-weight:600;">' + total + '</td>\
      <td><button class="btn btn-gh btn-sm" style="color:var(--red);" onclick="removeTmpMem(' + i + '); this.closest(\'.mod\').remove(); showMemModal();">移除</button></td>\
    </tr>';
  }).join('');

  const emptyRow = !tmpMems.length ? '<tr><td colspan="' + (4 + months.length + 2) + '" style="text-align:center;color:var(--tx3);padding:40px;">暂无成员，请点击右上角添加</td></tr>' : '';

  m.innerHTML = '<div class="mod-p" style="max-width:95vw;width:1000px;">\
    <div class="mod-h"><h3>编辑项目成员（REQ-PM-003）</h3><button class="btn btn-gh btn-sm" onclick="this.closest(\'.mod\').remove()">&times;</button></div>\
    <div class="mod-b">\
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">\
        <p style="font-size:12px;color:var(--tx2);">项目周期：<b>' + (p?.start||'—') + ' ~ ' + (p?.end||'—') + '</b>，月份列随起止时间自动调整；工时总计实时汇总。</p>\
        <button class="btn btn-o btn-sm" onclick="showAddMemPicker()">+ 添加成员</button>\
      </div>\
      <div style="overflow-x:auto;">\
        <table class="mem-tbl" style="min-width:' + (500 + months.length * 72) + 'px;">\
          <thead><tr><th style="width:40px;text-align:center;">序号</th><th>姓名</th><th style="min-width:120px;">角色</th><th style="width:90px;">人员属性</th>' + months.map(function (mon) { return '<th style="min-width:72px;text-align:center;">' + mon + '</th>'; }).join('') + '<th style="width:80px;text-align:center;">工时总计</th><th style="width:60px;">操作</th></tr></thead>\
          <tbody>' + rows + emptyRow + '</tbody>\
        </table>\
      </div>\
    </div>\
    <div class="mod-f"><button class="btn btn-gh" onclick="this.closest(\'.mod\').remove()">取消</button><button class="btn btn-p" onclick="saveMems(this)">确认</button></div>\
  </div>';
  document.body.appendChild(m);
}

function showAddMemPicker() {
  const avail = PPL.filter(function (x) { return !tmpMems.some(function (m) { return m.pid === x.id; }); });
  if (!avail.length) { toast('暂无可添加人员','err'); return; }
  const m = document.createElement('div'); m.className='mod'; m.style.display='flex';
  m.onclick = function (e) { if(e.target===this) this.remove(); };
  m.innerHTML = '<div class="mod-p sm"><div class="mod-h"><h3>添加成员</h3><button class="btn btn-gh btn-sm" onclick="this.closest(\'.mod\').remove()">&times;</button></div><div class="mod-b">' + avail.map(function (x) { return '<label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bd);cursor:pointer;"><input type="checkbox" data-pid="' + x.id + '"><span class="mav" style="background:' + x.av + '">' + x.name[0] + '</span><span style="flex:1;font-weight:500;">' + x.name + '</span><span style="font-size:12px;color:var(--tx3);">' + x.dept + '</span></label>'; }).join('') + '</div><div class="mod-f"><button class="btn btn-gh" onclick="this.closest(\'.mod\').remove()">取消</button><button class="btn btn-p" onclick="confirmAddMems(this)">确认添加</button></div></div>';
  document.body.appendChild(m);
}

function confirmAddMems(btn) {
  const checked = btn.closest('.mod').querySelectorAll('input[type="checkbox"]:checked');
  checked.forEach(function (cb) {
    tmpMems.push({ pid: cb.dataset.pid, roles: ['成员'], attr: '国智', hours: {}, total: 0 });
  });
  btn.closest('.mod').remove();
  // 刷新成员编辑弹窗
  document.querySelectorAll('.mod').forEach(function (x) { x.remove(); });
  showMemModal();
}

function saveMems(btn) {
  const rows = btn.closest('.mod').querySelectorAll('tbody tr[data-idx]');
  rows.forEach(function (row) {
    const idx = parseInt(row.dataset.idx);
    const roleGrp = row.querySelector('.chip-grp[data-name="roles"]');
    const roles = readChips(roleGrp, true);
    const attrGrp = row.querySelector('.chip-grp[data-name="attr"]');
    const attr = readChips(attrGrp, false) || '国智';
    const hours = {}; let total = 0;
    row.querySelectorAll('.m-hour').forEach(function (inp) {
      const v = parseFloat(inp.value) || 0;
      hours[inp.dataset.mon] = v;
      total += v;
    });
    tmpMems[idx] = { ...tmpMems[idx], roles: roles.length ? roles : ['成员'], attr, hours, total };
  });
  btn.closest('.mod').remove();
  document.getElementById('tmpTbl').innerHTML = renderTmpMems();
  toast('已更新成员（' + tmpMems.length + '人）','ok');
}

/* ═══════════════════════════════════════
   MERGE LIST — REQ-DS-002, REQ-PM-001
   ═══════════════════════════════════════ */
function renderMerge() {
  document.getElementById('content').innerHTML = '\
    <div class="ph"><div><h1>待合并项目清单</h1><p class="subt">飞书同步项目的暂存区，仅管理员/PMO可操作（REQ-DS-002）</p></div><button class="btn btn-p" onclick="showCreateModal()">+ 手动创建项目</button></div>\
    <div class="ban w"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>此清单仅系统管理员可操作，不对外展示。需清洗合并后进入正式项目清单。</div>\
    <div class="tbl-wrap">' + (MERGE.length===0?'<div class="empty">暂无待合并项目</div>':'<table><thead><tr><th>类型</th><th>编号</th><th>名称</th><th>来源</th><th>同步时间</th><th>操作</th></tr></thead><tbody>' + MERGE.map(function (m) { const tagClass=m.type==='setup'?'b':m.type==='close'?'r':'gr'; const tagText=m.type==='setup'?'立项':m.type==='close'?'结项':'手动创建'; return '<tr><td><span class="tag ' + tagClass + '">' + tagText + '</span></td><td>' + m.no + '</td><td><span class="ct">' + m.f.name + '</span></td><td>' + m.src + '</td><td style="font-size:12px;color:var(--tx2);">' + m.dt + '</td><td class="ca"><button class="btn btn-p btn-sm" onclick="startMerge(\'' + m.id + '\')">合并项目信息</button>' + (m.type!=='close'?'<button class="btn btn-o btn-sm" onclick="quickNew(\'' + m.id + '\')">新建合并项目</button>':'') + '</td></tr>'; }).join('') + '</tbody></table>') + '</div>';
  page='merge';
}

function showCreateModal() {
  const m=document.createElement('div'); m.className='mod'; m.style.display='flex';
  m.onclick=function (e) { if(e.target===this)this.remove(); };
  m.innerHTML='<div class="mod-p"><div class="mod-h"><h3>手动创建项目（REQ-PM-001）</h3><button class="btn btn-gh btn-sm" onclick="this.closest(\'.mod\').remove()">&times;</button></div><div class="mod-b"><div class="f-row"><div class="fg"><label>项目名称 *</label><input type="text" id="ncn"></div><div class="fg"><label>项目编号</label><input type="text" id="ncno" placeholder="PRJ-2026-"></div></div><div class="f-row"><div class="fg"><label>项目类型</label><select id="nct"><option value="external">外部项目</option><option value="internal">内部项目</option></select></div><div class="fg"><label>所属产品</label><select id="ncp">' + getProductOptions() + '</select></div></div><div class="fg"><label>项目描述</label><textarea id="ncd"></textarea></div></div><div class="mod-f"><button class="btn btn-gh" onclick="this.closest(\'.mod\').remove()">取消</button><button class="btn btn-p" onclick="doCreate(this)">创建（状态：初始化）</button></div></div>';
  document.body.appendChild(m);
}
function doCreate(btn) {
  const nm=document.getElementById('ncn').value.trim(); if(!nm){toast('请输入项目名称','err');return;}
  const newNo=document.getElementById('ncno').value||('PRJ-'+new Date().getFullYear()+'-NEW');
  MERGE.push({id:'m'+Date.now(),no:newNo,name:nm,type:'manual',src:'手动创建',dt:new Date().toISOString().replace('T',' ').substring(0,16),f:{name:nm,no:newNo,type:document.getElementById('nct').value,product:document.getElementById('ncp').value,leader:'p1',desc:document.getElementById('ncd').value,status:'draft'}});
  btn.closest('.mod').remove(); toast('项目已创建至待合并清单，状态：初始化','ok'); renderMerge(); updateBadges();
}
function quickNew(mid) {
  const mi=MERGE.find(function (m) { return m.id===mid; }); if(!mi) return;
  PROJ.push({id:'p'+Date.now(),no:mi.f.no,name:mi.f.name,type:mi.f.type,product:mi.f.product,leader:mi.f.leader,status:'active',start:new Date().toISOString().split('T')[0],end:'',desc:mi.f.desc||'',members:[]});
  MERGE.splice(MERGE.indexOf(mi),1); toast('已新建合并项目，状态：进行中','ok'); renderMerge(); updateBadges();
}

/* ═══════════════════════════════════════
   MERGE PROCESS — REQ-PM-006, PM-007
   ═══════════════════════════════════════ */
function startMerge(mid) {
  selMerge=MERGE.find(function (m) { return m.id===mid; }); if(!selMerge) return;
  mergeStep=selMerge.type==='close'?0:1;
  page='merge';
  document.getElementById('bc').innerHTML='待合并项目清单 &rsaquo; <span>合并项目信息</span>';
  renderMergeStep();
}
function renderMergeStep() {
  const mi=selMerge; const ct=document.getElementById('content');
  const isClose=mi.type==='close';
  const stepHTML=(function () {
    if(isClose){
      const c=function (n) { return mergeStep===n?'on':mergeStep>n?'ok':''; };
      return '<div class="steps"><div class="step ' + c(0) + '"><span class="no">' + (mergeStep>0?'✓':'1') + '</span>编辑结项信息</div><div class="step-d ' + (mergeStep>0?'ok':'') + '"></div><div class="step ' + c(1) + '"><span class="no">' + (mergeStep>1?'✓':'2') + '</span>冲突检测</div><div class="step-d ' + (mergeStep>1?'ok':'') + '"></div><div class="step ' + c(2) + '"><span class="no">' + (mergeStep>2?'✓':'3') + '</span>字段比对</div><div class="step-d ' + (mergeStep>2?'ok':'') + '"></div><div class="step ' + c(3) + '"><span class="no">4</span>确认合并</div></div>';
    }
    const c=function (n) { return mergeStep===n?'on':mergeStep>n?'ok':''; };
    return '<div class="steps"><div class="step ' + c(1) + '"><span class="no">' + (mergeStep>1?'✓':'1') + '</span>冲突检测</div><div class="step-d ' + (mergeStep>1?'ok':'') + '"></div><div class="step ' + c(2) + '"><span class="no">' + (mergeStep>2?'✓':'2') + '</span>字段比对</div><div class="step-d ' + (mergeStep>2?'ok':'') + '"></div><div class="step ' + c(3) + '"><span class="no">3</span>确认合并</div></div>';
  })();
  if(mergeStep===0) {
    ct.innerHTML=stepHTML+'<div class="card" style="margin-bottom:20px;"><h3 style="margin-bottom:16px;">编辑结项信息（REQ-PM-007）</h3><p style="font-size:12px;color:var(--tx2);margin-bottom:16px;">请核对并修改结项信息，确认后进入冲突检测步骤。结项合并不支持跳过项目选择。</p>\
    <div class="f-row"><div class="fg"><label>项目名称</label><input type="text" id="ce-name" value="' + (mi.f.name||'') + '"></div><div class="fg"><label>项目编号</label><input type="text" id="ce-no" value="' + (mi.f.no||'') + '"></div></div>\
    <div class="f-row"><div class="fg"><label>结项日期 *</label><input type="date" id="ce-closeDate" value="' + (mi.f.closeDate||'') + '"></div><div class="fg"><label>结项原因 *</label><input type="text" id="ce-closeReason" value="' + (mi.f.closeReason||'') + '"></div></div>\
    <div class="fg"><label>项目描述</label><textarea id="ce-desc">' + (mi.f.desc||'') + '</textarea></div>\
    <div style="text-align:right;margin-top:16px;"><button class="btn btn-p btn-lg" onclick="saveCloseInfo()">下一步 &rarr;</button></div></div>';
    return;
  }
  if(mergeStep===1) {
    const cf=PROJ.filter(function (p) { return p.no===mi.f.no||p.name.includes(mi.f.name.substring(0,4))||mi.f.name.includes(p.name.substring(0,4)); });
    const srcTxt=mi.type==='setup'?'飞书立项流程':mi.type==='close'?'飞书结项流程':'手动创建';
    const tagCls=mi.type==='setup'?'b':mi.type==='close'?'r':'gr';
    const tagTx=mi.type==='setup'?'立项':mi.type==='close'?'结项':'手动创建';
    ct.innerHTML=stepHTML+'<div class="card" style="margin-bottom:20px;background:var(--pri-l);border-color:var(--pri);"><div style="font-size:12px;color:var(--tx2);">待合并项目（' + srcTxt + '）</div><div style="font-weight:700;font-size:16px;margin:4px 0;">' + mi.f.name + '</div><div>' + mi.f.no + ' · <span class="tag ' + tagCls + '">' + tagTx + '</span></div></div><h3 style="margin-bottom:12px;">' + (cf.length?'疑似冲突项目（REQ-PM-006/007 — 按编号、名称关键词匹配）':'选择目标项目') + '</h3><div class="tbl-wrap"><table><thead><tr><th>编号</th><th>名称</th><th>产品</th><th>状态</th><th>操作</th></tr></thead><tbody>' + (cf.length?cf:PROJ).map(function (c) { return '<tr><td>' + c.no + '</td><td><span class="ct">' + c.name + '</span></td><td>' + c.product + '</td><td><span class="tag gr">' + ({active:'进行中',completed:'已完成',suspended:'挂起',cancelled:'已作废',closed:'已结项'}[c.status]) + '</span></td><td><button class="btn btn-p btn-sm" onclick="selConflict(\'' + c.id + '\')">选择此项目</button></td></tr>'; }).join('') + '</tbody></table></div>' + (mi.type!=='close'?'<div style="margin-top:16px;"><button class="btn btn-o" onclick="mergeAsNew()">+ 新建合并项目（跳过字段比对）</button></div>':'');
  }
  if(mergeStep===2) {
    const tgt=PROJ.find(function (p) { return p.id===mi._cid; });
    const fields=[{k:'name',l:'项目名称'},{k:'no',l:'项目编号'},{k:'type',l:'项目类型'},{k:'product',l:'所属产品'},{k:'leader',l:'项目负责人'},{k:'desc',l:'项目描述'}];
    if(mi.type==='close') fields.push({k:'closeDate',l:'结项日期'},{k:'closeReason',l:'结项原因'});
    if(!mi._choices){mi._choices={};fields.forEach(function (f) { mi._choices[f.k]='merge'; });}
    ct.innerHTML=stepHTML+'<p style="margin-bottom:16px;color:var(--tx2);">逐字段比对，点击选择保留的数据来源。（REQ-PM-' + (mi.type==='close'?'007':'006') + '：结项比对立项多「结项日期」「结项原因」字段）</p><div class="card" style="padding:0;">' + fields.map(function (f) { const mv=mi.f[f.k]===undefined?'—':String(mi.f[f.k]); const tv=(tgt&&tgt[f.k]!==undefined?String(tgt[f.k]):'—'); let md=mv,td=tv; if(f.k==='type'){md=mv==='external'?'外部项目':'内部项目';td=tv==='external'?'外部项目':'内部项目';} if(f.k==='leader'){md=PPL.find(function (x) { return x.id===mv; })?.name||mv;td=PPL.find(function (x) { return x.id===tv; })?.name||tv;} return '<div class="cmp"><span class="fl">' + f.l + '</span><div class="fo"><div class="opt sel" onclick="selOpt(this,\'' + f.k + '\',\'merge\')"><span class="rd"></span>' + md + '</div><div class="opt" onclick="selOpt(this,\'' + f.k + '\',\'target\')"><span class="rd"></span>' + td + '</div></div></div>'; }).join('') + '</div><div style="margin-top:20px;text-align:right;"><button class="btn btn-p btn-lg" onclick="goStep(3)">下一步 &rarr;</button></div>';
  }
  if(mergeStep===3) {
    const tgt=PROJ.find(function (p) { return p.id===mi._cid; });
    ct.innerHTML=stepHTML+'<div class="card" style="text-align:center;padding:40px;"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2" style="margin-bottom:16px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><h2 style="margin-bottom:8px;">确认合并</h2><p style="color:var(--tx2);">合并至：<b>' + (tgt?.name||'新建项目') + '</b></p><p style="color:var(--tx2);margin-bottom:20px;">合并后状态：<b>' + (mi.type==='close'?'已结项':'进行中') + '</b></p><div style="display:flex;gap:10px;justify-content:center;"><button class="btn btn-s btn-lg" onclick="doMerge()">确认合并</button><button class="btn btn-gh" onclick="goStep(2)">返回修改</button></div></div>';
  }
}
function selConflict(cid){selMerge._cid=cid;mergeStep=2;renderMergeStep();}
function mergeAsNew(){selMerge._cid=null;mergeStep=3;renderMergeStep();}
function goStep(s){mergeStep=s;renderMergeStep();}
function saveCloseInfo(){
  const mi=selMerge;
  const cd=document.getElementById('ce-closeDate').value;
  const cr=document.getElementById('ce-closeReason').value;
  if(!cd){toast('请填写结项日期','err');return;}
  if(!cr){toast('请填写结项原因','err');return;}
  mi.f.name=document.getElementById('ce-name').value;
  mi.f.no=document.getElementById('ce-no').value;
  mi.f.closeDate=cd; mi.f.closeReason=cr;
  mi.f.desc=document.getElementById('ce-desc').value;
  mergeStep=1; renderMergeStep();
}
function selOpt(el,k,src){el.parentElement.querySelectorAll('.opt').forEach(function (o) { o.classList.remove('sel'); });el.classList.add('sel');selMerge._choices[k]=src;}
function doMerge(){
  const mi=selMerge; const tgt=mi._cid?PROJ.find(function (p) { return p.id===mi._cid; }):null;
  if(tgt){Object.keys(mi._choices||{}).forEach(function (k) { if(k==='closeDate'||k==='closeReason')return;if(mi._choices[k]==='merge'&&mi.f[k]!==undefined)tgt[k]=mi.f[k]; });tgt.status=mi.type==='close'?'closed':'active';}
  else{PROJ.push({id:'p'+Date.now(),no:mi.f.no,name:mi.f.name,type:mi.f.type,product:mi.f.product,leader:mi.f.leader,status:'active',start:new Date().toISOString().split('T')[0],end:'',desc:mi.f.desc||'',members:[]});}
  LOGS.unshift({t:new Date().toISOString().replace('T',' ').substring(0,16),u:'系统管理员',a:'合并项目',g:mi.f.name,d:(mi.type==='close'?'结项':mi.type==='manual'?'手动创建':'立项') + '合并至项目清单'});
  // 移入已合并项目清单，状态：已处理
  MERGED.push({
    id: mi.id, no: mi.no, name: mi.name, type: mi.type, src: mi.src, dt: mi.dt, f: JSON.parse(JSON.stringify(mi.f)),
    _cid: mi._cid || null, _choices: mi._choices ? JSON.parse(JSON.stringify(mi._choices)) : {},
    status: '已处理',
    mergedAt: new Date().toISOString().replace('T',' ').substring(0,16),
    targetName: tgt ? tgt.name : '新建项目'
  });
  MERGE.splice(MERGE.indexOf(mi),1); toast('项目合并完成！已移入已合并项目清单','ok'); updateBadges(); renderMerge();
}

/* ═══════════════════════════════════════
   MERGED PROJECT LIST — 已合并项目清单
   ═══════════════════════════════════════ */
function renderMerged(flt) {
  const f = flt || 'all';
  let list = [...MERGED];
  if (f !== 'all') list = list.filter(function (m) { return m.status === f; });

  const tagCls = { 'setup': 'b', 'close': 'r', 'manual': 'gr' };
  const tagTx = { 'setup': '立项', 'close': '结项', 'manual': '手动创建' };
  const statusCls = { '已处理': 'g', '初始化': 'y' };

  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>已合并项目清单</h1><p class="subt">合并完成的项目记录。状态为「已处理」，可手动重置为「初始化」回到待合并清单。</p></div></div>' +
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
          '<td>' + m.no + '</td>' +
          '<td><span class="ct">' + m.f.name + '</span></td>' +
          '<td>' + m.src + '</td>' +
          '<td>' + (m.targetName || '—') + '</td>' +
          '<td style="font-size:12px;color:var(--tx2);">' + m.mergedAt + '</td>' +
          '<td><span class="tag ' + (statusCls[m.status] || 'gr') + '">' + m.status + '</span></td>' +
          '<td class="ca">' +
            (m.status === '已处理' ? '<button class="btn btn-o btn-sm" onclick="resetMergeStatus(\'' + m.id + '\')">重置为初始化</button>' : '') +
          '</td>' +
        '</tr>';
      }).join('') + '</tbody></table>') +
    '</div>';
  page = 'merged';
}

function resetMergeStatus(mid) {
  const mi = MERGED.find(function (m) { return m.id === mid; });
  if (!mi) return;
  if (!confirm('确定将项目「' + mi.f.name + '」状态重置为「初始化」并移回待合并项目清单？')) return;
  // 从已合并清单移除，移回待合并清单
  MERGED.splice(MERGED.indexOf(mi), 1);
  MERGE.push({
    id: mi.id, no: mi.no, name: mi.name, type: mi.type, src: mi.src, dt: mi.dt,
    f: JSON.parse(JSON.stringify(mi.f))
  });
  LOGS.unshift({
    t: new Date().toISOString().replace('T', ' ').substring(0, 16),
    u: '系统管理员', a: '重置合并状态',
    g: mi.f.name,
    d: '状态由「已处理」重置为「初始化」，已移回待合并项目清单'
  });
  updateBadges();
  renderMerged();
  toast('已重置为初始化，项目已移回待合并清单', 'ok');
}

/* ═══════════════════════════════════════
   APPROVAL — REQ-PA-001
   ═══════════════════════════════════════ */
function renderAppr() {
  const pending=APPR.filter(function (a) { return a.st==='pending'; }); const done=APPR.filter(function (a) { return a.st!=='pending'; });
  document.getElementById('content').innerHTML='\
    <div class="ph"><div><h1>项目审批</h1><p class="subt">审核项目状态变更请求，仅PMO/管理员可操作（REQ-PA-001）</p></div></div>\
    <h3 style="margin-bottom:12px;">待审批（' + pending.length + '）</h3>\
    <div class="tbl-wrap" style="margin-bottom:28px;">' + (pending.length===0?'<div class="empty">暂无待审批</div>':'<table><thead><tr><th>项目</th><th>变更</th><th>发起人</th><th>日期</th><th>原因</th><th>操作</th></tr></thead><tbody>' + pending.map(function (a) { return '<tr><td><span class="ct">' + a.pn + '</span></td><td>' + a.from + ' &rarr; <span style="color:var(--pri);font-weight:600;">' + a.to + '</span></td><td>' + a.who + '</td><td style="font-size:12px;">' + a.dt + '</td><td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;">' + a.reason + '</td><td class="ca"><button class="btn btn-s btn-sm" onclick="doAppr(\'' + a.id + '\',\'approved\')">通过</button><button class="btn btn-d btn-sm" onclick="doAppr(\'' + a.id + '\',\'rejected\')">拒绝</button></td></tr>'; }).join('') + '</tbody></table>') + '</div>\
    <h3 style="margin-bottom:12px;">已处理</h3>\
    <div class="tbl-wrap">' + (done.length===0?'<div class="empty">暂无已处理</div>':'<table><thead><tr><th>项目</th><th>变更</th><th>发起人</th><th>结果</th><th>审批人</th><th>日期</th><th>备注</th></tr></thead><tbody>' + done.map(function (a) { return '<tr><td><span class="ct">' + a.pn + '</span></td><td>' + a.from + ' &rarr; ' + a.to + '</td><td>' + a.who + '</td><td><span class="tag ' + (a.st==='approved'?'g':'r') + '">' + a.result + '</span></td><td>' + (a.rv||'—') + '</td><td style="font-size:12px;">' + (a.rd||'') + '</td><td style="font-size:11px;color:var(--tx3);max-width:180px;">' + (a.st==='rejected'?(a.rr||'—'):'—') + '</td></tr>'; }).join('') + '</tbody></table>') + '</div>';
  page='appr';
}
function doAppr(aid,result){
  if(!canAppr())return;
  if(result==='rejected'){showRejectModal(aid);return;}
  const a=APPR.find(function (x) { return x.id===aid; });if(!a)return;
  a.st='approved';a.result='通过';a.rv='当前用户（PMO）';a.rd=new Date().toISOString().split('T')[0];
  const p=PROJ.find(function (x) { return x.id===a.pid; });if(p){const m={'已完成':'completed','挂起':'suspended','已作废':'cancelled'};p.status=m[a.to]||p.status;}
  LOGS.unshift({t:new Date().toISOString().replace('T',' ').substring(0,16),u:'PMO',a:'审批通过',g:a.pn,d:'状态变更生效：' + a.from + ' → ' + a.to});
  updateBadges();renderAppr();toast('审批通过 ✓，项目状态已调整','ok');
}
function showRejectModal(aid){
  const a=APPR.find(function (x) { return x.id===aid; });if(!a)return;
  const m=document.createElement('div');m.className='mod';m.style.display='flex';
  m.onclick=function (e) { if(e.target===this)this.remove(); };
  m.innerHTML='<div class="mod-p sm"><div class="mod-h"><h3>审批拒绝（REQ-PA-001）</h3><button class="btn btn-gh btn-sm" onclick="this.closest(\'.mod\').remove()">&times;</button></div><div class="mod-b"><p style="margin-bottom:14px;">项目：<b>' + a.pn + '</b><br>变更申请：' + a.from + ' &rarr; ' + a.to + '</p><div class="ban w" style="margin-bottom:14px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>拒绝后：项目状态退回原值（' + a.from + '），其他字段修改不受影响。</div><div class="fg"><label>拒绝原因 *</label><textarea id="reject-reason" placeholder="请说明拒绝原因..." style="min-height:60px;"></textarea></div></div><div class="mod-f"><button class="btn btn-gh" onclick="this.closest(\'.mod\').remove()">取消</button><button class="btn btn-d" onclick="confirmReject(\'' + aid + '\')">确认拒绝</button></div></div>';
  document.body.appendChild(m);
}
function confirmReject(aid){
  const reason=document.getElementById('reject-reason').value.trim();
  if(!reason){toast('请填写拒绝原因','err');return;}
  const a=APPR.find(function (x) { return x.id===aid; });if(!a)return;
  a.st='rejected';a.result='拒绝';a.rv='当前用户（PMO）';a.rd=new Date().toISOString().split('T')[0];a.rr=reason;
  LOGS.unshift({t:new Date().toISOString().replace('T',' ').substring(0,16),u:'PMO',a:'审批拒绝',g:a.pn,d:'状态变更被拒绝（' + a.from + '→' + a.to + '），项目状态保持' + a.from + '。原因：' + reason});
  document.querySelectorAll('.mod').forEach(function (m) { m.remove(); });updateBadges();renderAppr();
  toast('状态变更已拒绝，项目状态退回原值，其他信息修改不受影响','err');
}

/* ═══════════════════════════════════════
   ROLE MANAGEMENT — 系统管理员维护角色表
   ═══════════════════════════════════════ */
function renderRoles() {
  document.getElementById('content').innerHTML = '\
    <div class="ph"><div><h1>角色管理</h1><p class="subt">维护成员角色表，修改将实时生效至项目成员编辑。</p></div></div>\
    <div class="tbl-wrap">\
      <div class="tbl-bar">\
        <div style="display:flex;align-items:center;gap:8px;flex:1;">\
          <input type="text" id="newRoleInput" placeholder="输入新角色名称..." style="padding:7px 12px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:13px;font-family:var(--font);width:200px;" onkeydown="if(event.key===\'Enter\')addRole()">\
          <button class="btn btn-p btn-sm" onclick="addRole()">+ 添加</button>\
        </div>\
        <span style="font-size:12px;color:var(--tx3);">共 ' + ROLES.length + ' 个角色</span>\
      </div>\
      <div id="roleTbBody">' + renderRoleTable() + '</div>\
    </div>';
  page='roles';
}
function renderRoleTable() {
  if (!ROLES.length) return '<div class="empty">暂无角色，请添加</div>';
  return '<table><thead><tr><th style="width:50px;">序号</th><th>角色名称</th><th style="width:150px;">操作</th></tr></thead><tbody>' + ROLES.map(function (r,i) { return '<tr id="role-row-' + i + '"><td>' + (i+1) + '</td><td id="role-cell-' + i + '"><span class="ct" id="role-name-' + i + '">' + r + '</span><input type="text" class="role-edit-inline" id="role-edit-' + i + '" value="' + r + '" style="display:none;" onkeydown="if(event.key===\'Enter\')saveRoleEdit(' + i + ')"></td><td class="ca"><button class="btn btn-o btn-sm" id="role-btn-edit-' + i + '" onclick="startRoleEdit(' + i + ')">✎ 编辑</button><button class="btn btn-p btn-sm" id="role-btn-save-' + i + '" style="display:none;" onclick="saveRoleEdit(' + i + ')">保存</button><button class="btn btn-gh btn-sm" style="color:var(--red);" onclick="delRole(' + i + ')">删除</button></td></tr>'; }).join('') + '</tbody></table>';
}
function addRole() {
  const inp = document.getElementById('newRoleInput'); const v = inp.value.trim();
  if (!v) { toast('请输入角色名称','err'); return; }
  if (ROLES.includes(v)) { toast('角色已存在','err'); return; }
  ROLES.push(v); inp.value = '';
  document.getElementById('roleTbBody').innerHTML = renderRoleTable();
  LOGS.unshift({t:new Date().toISOString().replace('T',' ').substring(0,16),u:'管理员',a:'角色管理',g:'角色表',d:'添加角色「' + v + '」'});
  toast('已添加角色「' + v + '」','ok');
}
function startRoleEdit(i) {
  document.getElementById('role-name-'+i).style.display='none';
  document.getElementById('role-edit-'+i).style.display='';
  document.getElementById('role-edit-'+i).focus();
  document.getElementById('role-btn-edit-'+i).style.display='none';
  document.getElementById('role-btn-save-'+i).style.display='';
}
function saveRoleEdit(i) {
  const v = document.getElementById('role-edit-'+i).value.trim();
  if (!v) { toast('角色名称不能为空','err'); return; }
  const old = ROLES[i];
  if (v !== old && ROLES.includes(v)) { toast('角色已存在','err'); return; }
  ROLES[i] = v;
  document.getElementById('roleTbBody').innerHTML = renderRoleTable();
  LOGS.unshift({t:new Date().toISOString().replace('T',' ').substring(0,16),u:'管理员',a:'角色管理',g:'角色表',d:v!==old?'重命名「' + old + '」→「' + v + '」':'保存「' + v + '」'});
  toast(v!==old?'已重命名为「' + v + '」':'保存成功','ok');
}
function delRole(i) {
  const r = ROLES[i];
  if (!confirm('确定删除角色「' + r + '」？删除后所有项目中该角色信息将失效。')) return;
  ROLES.splice(i, 1);
  document.getElementById('roleTbBody').innerHTML = renderRoleTable();
  LOGS.unshift({t:new Date().toISOString().replace('T',' ').substring(0,16),u:'管理员',a:'角色管理',g:'角色表',d:'删除角色「' + r + '」'});
  toast('已删除角色「' + r + '」','ok');
}

/* ═══════════════════════════════════════
   PRODUCT MANAGEMENT — 产品管理（支持层级）
   ═══════════════════════════════════════ */

/* 生成产品下拉选项 HTML（value 为产品名称），供各处复用 */
function getProductOptions(selected) {
  const s = selected || '';
  function renderOpts(parentId, depth) {
    const d = depth || 0;
    const children = PRODUCTS.filter(function (p) { return p.parent === parentId; });
    let html = '';
    children.forEach(function (prod) {
      const prefix = d > 0 ? '└' + '—'.repeat(d) + ' ' : '';
      html += '<option value="' + prod.name + '" ' + (s === prod.name ? 'selected' : '') + '>' + prefix + prod.name + '</option>';
      html += renderOpts(prod.id, d + 1);
    });
    return html;
  }
  return renderOpts(null, 0);
}

/* 获取产品名称（兼容旧数据） */
function getProductName(prodName) {
  return prodName || '—';
}

function renderProducts() {
  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>产品管理</h1><p class="subt">维护产品及子产品层级关系（支持多级嵌套），修改将实时生效至项目筛选与编辑。</p></div></div>' +
    '<div class="tbl-wrap">' +
      '<div class="tbl-bar">' +
        '<div style="display:flex;align-items:center;gap:8px;flex:1;flex-wrap:wrap;">' +
          '<select id="newProdParent" style="padding:7px 12px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:13px;font-family:var(--font);background:var(--surf);"><option value="">作为主产品</option>' + getProductOptions() + '</select>' +
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

/* 切换产品树节点展开/收起 */
function toggleProduct(prodId) {
  expandedProducts[prodId] = !expandedProducts[prodId];
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
}

function renderProductTable() {
  if (!PRODUCTS.length) return '<div class="empty">暂无产品，请添加</div>';

  // 递归统计含子产品的关联项目总数
  function countTreeRefs(prod) {
    let cnt = PROJ.filter(function (p) { return p.product === prod.name; }).length +
              MERGE.filter(function (m) { return m.f.product === prod.name; }).length +
              MERGED.filter(function (m) { return m.f.product === prod.name; }).length;
    var children = PRODUCTS.filter(function (p) { return p.parent === prod.id; });
    children.forEach(function (c) { cnt += countTreeRefs(c); });
    return cnt;
  }

  // 递归渲染产品行（含展开/收起）
  function renderRow(prod, depth, ancestors) {
    var d = depth || 0;
    var anc = ancestors || []; // [{id, isLast}] 从根到当前节点的祖先链
    var children = PRODUCTS.filter(function (p) { return p.parent === prod.id; });
    var hasChildren = children.length > 0;
    var expanded = expandedProducts[prod.id] !== false; // 默认展开
    var projCount = PROJ.filter(function (p) { return p.product === prod.name; }).length;
    var mergeCount = MERGE.filter(function (m) { return m.f.product === prod.name; }).length;
    var directRef = projCount + mergeCount;
    var allRef = countTreeRefs(prod);

    // ── 构建树形连线前缀 ──
    var prefix = '';
    for (var i = 0; i < anc.length; i++) {
      prefix += '<span style="color:var(--tx3);">' + (anc[i].isLast ? '&emsp;&ensp;' : '│&emsp;&ensp;') + '</span>';
    }
    // 当前行连接符
    var isLast = anc.length > 0 ? anc[anc.length - 1].isLast : true;
    var connector = d > 0 ? '<span style="color:var(--tx3);">' + (isLast ? '└── ' : '├── ') + '</span>' : '';

    // ── 层级标签 ──
    var levelTag = d === 0
      ? '<span class="tag b">主产品</span>'
      : '<span class="tag gr">' + d + ' 级子产品</span>';

    // ── 展开/收起按钮 ──
    var toggleBtn = '';
    if (hasChildren) {
      toggleBtn = '<span class="tree-toggle" onclick="toggleProduct(\'' + prod.id + '\')" style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:4px;margin-right:4px;font-size:10px;color:var(--tx2);background:var(--mu);user-select:none;flex-shrink:0;">' + (expanded ? '▼' : '▶') + '</span>';
    } else {
      toggleBtn = '<span style="display:inline-block;width:20px;margin-right:4px;flex-shrink:0;"></span>';
    }

    // ── 直接关联统计 ──
    var refHtml = directRef > 0
      ? '<span style="font-weight:600;color:var(--tx);">' + directRef + '</span><span style="color:var(--tx3);"> 个直接关联</span>'
      : '<span style="color:var(--tx3);">—</span>';
    if (hasChildren && allRef > directRef) {
      refHtml += ' <span style="font-size:11px;color:var(--tx3);">（含子产品共 ' + allRef + '）</span>';
    }

    // ── 行 HTML ──
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
      '</td>' +
    '</tr>';

    // ── 子节点（仅在展开时渲染） ──
    if (hasChildren && expanded) {
      children.forEach(function (child, i) {
        var childAnc = anc.concat([{ id: prod.id, isLast: i === children.length - 1 }]);
        html += renderRow(child, d + 1, childAnc);
      });
    }

    return html;
  }

  // ── 渲染顶级产品 ──
  var topLevel = PRODUCTS.filter(function (p) { return p.parent === null; });
  if (!topLevel.length) return '<div class="empty">暂无主产品</div>';

  return '<table><thead><tr><th>产品名称</th><th>层级</th><th>关联项目</th><th style="width:180px;">操作</th></tr></thead><tbody>' +
    topLevel.map(function (prod, i) {
      return renderRow(prod, 0, []);
    }).join('') +
    '</tbody></table>';
}

function addProduct() {
  const inp = document.getElementById('newProdInput');
  const parentSel = document.getElementById('newProdParent');
  const v = inp.value.trim();
  if (!v) { toast('请输入产品名称', 'err'); return; }
  if (PRODUCTS.some(function (p) { return p.name === v && p.parent === (parentSel.value || null); })) {
    toast('同层级下已存在同名产品', 'err'); return;
  }
  const parentName = parentSel.value || null;
  // 支持多级：父级可为任意产品（按名称匹配，同层已做重名校验）
  const parentProd = parentName ? PRODUCTS.find(function (p) { return p.name === parentName; }) : null;
  const parentId = parentProd ? parentProd.id : null;
  PRODUCTS.push({ id: 'prod' + Date.now(), name: v, parent: parentId });
  inp.value = '';
  parentSel.value = '';
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
  LOGS.unshift({ t: new Date().toISOString().replace('T', ' ').substring(0, 16), u: '管理员', a: '产品管理', g: '产品表', d: '添加产品「' + v + '」' });
  toast('已添加产品「' + v + '」', 'ok');
}

function startProdEdit(prodId) {
  document.getElementById('prod-name-' + prodId).style.display = 'none';
  document.getElementById('prod-edit-' + prodId).style.display = '';
  document.getElementById('prod-edit-' + prodId).focus();
  document.getElementById('prod-btn-edit-' + prodId).style.display = 'none';
  document.getElementById('prod-btn-save-' + prodId).style.display = '';
}

function saveProductEdit(prodId) {
  const v = document.getElementById('prod-edit-' + prodId).value.trim();
  if (!v) { toast('产品名称不能为空', 'err'); return; }
  const prod = PRODUCTS.find(function (p) { return p.id === prodId; });
  if (!prod) return;
  const old = prod.name;
  if (v !== old && PRODUCTS.some(function (p) { return p.name === v && p.parent === prod.parent && p.id !== prodId; })) {
    toast('同层级下已存在同名产品', 'err'); return;
  }
  // 重命名：同步更新所有引用该产品名称的项目数据
  if (v !== old) {
    PROJ.forEach(function (p) { if (p.product === old) p.product = v; });
    MERGE.forEach(function (m) { if (m.f.product === old) m.f.product = v; });
    MERGED.forEach(function (m) { if (m.f.product === old) m.f.product = v; });
  }
  prod.name = v;
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
  LOGS.unshift({ t: new Date().toISOString().replace('T', ' ').substring(0, 16), u: '管理员', a: '产品管理', g: '产品表', d: v !== old ? '重命名「' + old + '」→「' + v + '」（已同步更新所有关联项目）' : '保存「' + v + '」' });
  toast(v !== old ? '已重命名为「' + v + '」，关联项目已同步更新' : '保存成功', 'ok');
}

function delProduct(prodId) {
  const prod = PRODUCTS.find(function (p) { return p.id === prodId; });
  if (!prod) return;
  const children = PRODUCTS.filter(function (p) { return p.parent === prodId; });
  if (children.length) {
    toast('请先删除子产品：' + children.map(function (c) { return c.name; }).join('、'), 'err');
    return;
  }
  const projCount = PROJ.filter(function (p) { return p.product === prod.name; }).length;
  const mergeCount = MERGE.filter(function (m) { return m.f.product === prod.name; }).length;
  const warnMsg = projCount > 0 || mergeCount > 0
    ? '产品「' + prod.name + '」关联了 ' + projCount + ' 个项目、' + mergeCount + ' 条待合并记录。\n删除后这些项目/记录的所属产品将变为空，确定继续？'
    : '确定删除产品「' + prod.name + '」？';
  if (!confirm(warnMsg)) return;
  PRODUCTS.splice(PRODUCTS.indexOf(prod), 1);
  // 清理引用
  PROJ.forEach(function (p) { if (p.product === prod.name) p.product = ''; });
  MERGE.forEach(function (m) { if (m.f.product === prod.name) m.f.product = ''; });
  MERGED.forEach(function (m) { if (m.f.product === prod.name) m.f.product = ''; });
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
  LOGS.unshift({ t: new Date().toISOString().replace('T', ' ').substring(0, 16), u: '管理员', a: '产品管理', g: '产品表', d: '删除产品「' + prod.name + '」' });
  toast('已删除产品「' + prod.name + '」', 'ok');
}

/* ═══════════════════════════════════════
   USER MANAGEMENT — REQ-SM-001, SM-002
   ═══════════════════════════════════════ */
function renderUsers() {
  userSel={};
  document.getElementById('content').innerHTML='<div class="ph"><div><h1>用户与权限管理</h1><p class="subt">管理用户信息与角色权限（REQ-SM-001 / REQ-SM-002）</p></div><button class="btn btn-p" onclick="showBatchPerm()">批量调整角色</button></div><div class="tbl-wrap"><div class="tbl-bar"><div class="tbl-src"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" placeholder="按姓名、角色搜索..." oninput="filterUsers(this.value)"></div><span style="font-size:12px;color:var(--tx3);">勾选用户后可批量调整角色</span></div><table><thead><tr><th style="width:40px;"><input type="checkbox" onchange="toggleAll(this)"></th><th>姓名</th><th>部门</th><th>当前角色</th><th>权限说明</th></tr></thead><tbody id="userTb"></tbody></table></div>';
  renderUserTb(); page='users';
}
function renderUserTb(f) {
  var f = f || '';
  let list=[...USER_DATA];if(f){const q=f.toLowerCase();list=list.filter(function (u) { const p=PPL.find(function (x) { return x.id===u.pid; }); return (p?.name||'').toLowerCase().includes(q)||u.rl.toLowerCase().includes(q); });}
  const tc={admin:'b',pmo:'g',lead:'y',user:'gr'};const perm={admin:'全部权限',pmo:'审批+待合并操作',lead:'查看+编辑项目',user:'仅查看项目'};
  document.getElementById('userTb').innerHTML=list.map(function (u) { const p=PPL.find(function (x) { return x.id===u.pid; }); return '<tr><td><input type="checkbox" data-uid="' + u.id + '" onchange="toggleUSel(\'' + u.id + '\',this)"></td><td><span class="mav" style="background:' + (p?.av||'#2563EB') + '">' + ((p?.name||'?')[0]) + '</span>' + (p?.name||'—') + '</td><td style="font-size:12px;color:var(--tx2);">' + (p?.dept||'—') + '</td><td><span class="tag ' + (tc[u.role]||'gr') + '">' + u.rl + '</span></td><td style="font-size:12px;color:var(--tx3);">' + perm[u.role] + '</td></tr>'; }).join('');
}
function toggleAll(c){document.querySelectorAll('#userTb input[type="checkbox"]').forEach(function (ch) { ch.checked=c.checked;userSel[ch.dataset.uid]=c.checked; });}
function toggleUSel(uid,cb){userSel[uid]=cb.checked;}
function filterUsers(v){renderUserTb(v);}
function showBatchPerm(){
  const sel=Object.entries(userSel).filter(function (entry) { return entry[1]; }).map(function (entry) { return entry[0]; }); if(!sel.length){toast('请先勾选用户','err');return;}
  const m=document.createElement('div');m.className='mod';m.style.display='flex';m.onclick=function (e) { if(e.target===this)this.remove(); };
  m.innerHTML='<div class="mod-p sm"><div class="mod-h"><h3>批量调整角色（REQ-SM-002）</h3><button class="btn btn-gh btn-sm" onclick="this.closest(\'.mod\').remove()">&times;</button></div><div class="mod-b"><p style="margin-bottom:14px;">已选择 <b>' + sel.length + '</b> 名用户：</p><div style="display:flex;flex-direction:column;gap:8px;">' + [{r:'user',t:'用户 — 仅查看'},{r:'lead',t:'项目负责人 — 查看+编辑'},{r:'pmo',t:'PMO — 审批+操作'},{r:'admin',t:'系统管理员 — 全部权限'}].map(function (x) { return '<button class="btn btn-o" style="justify-content:flex-start;padding:12px;" onclick="batchRole(\'' + sel.join(',') + '\',\'' + x.r + '\')">' + x.t + '</button>'; }).join('') + '</div></div></div>';
  document.body.appendChild(m);
}
function batchRole(uids,r){
  const lb={user:'用户',lead:'项目负责人',pmo:'PMO',admin:'系统管理员'};
  uids.split(',').forEach(function (uid) { const u=USER_DATA.find(function (x) { return x.id===uid; }); if(u){u.role=r;u.rl=lb[r];} });
  document.querySelectorAll('.mod').forEach(function (m) { m.remove(); });
  LOGS.unshift({t:new Date().toISOString().replace('T',' ').substring(0,16),u:'管理员',a:'调整角色',g:uids.split(',').length + '名用户',d:'角色设为"' + lb[r] + '"'});
  renderUsers(); toast('角色已调整为"' + lb[r] + '"','ok');
}

/* ═══════════════════════════════════════
   OPERATION LOGS — REQ-SM-003
   ═══════════════════════════════════════ */
function renderLogs(flt){
  const list=flt||LOGS;
  document.getElementById('content').innerHTML='<div class="ph"><div><h1>操作日志</h1><p class="subt">追溯系统操作记录（REQ-SM-003）</p></div></div><div class="tbl-wrap"><div class="tbl-bar"><div style="display:flex;align-items:center;gap:8px;font-size:13px;">日期筛选：<input type="date" style="padding:6px 10px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:13px;font-family:var(--font);" onchange="filterLogs(this.value)" id="logD"><button class="btn btn-gh btn-sm" onclick="document.getElementById(\'logD\').value=\'\';renderLogs();">清除</button></div></div>' + (list.length===0?'<div class="empty">暂无操作记录</div>':'<table><thead><tr><th style="width:170px;">时间</th><th style="width:110px;">操作人</th><th style="width:100px;">操作类型</th><th style="width:160px;">目标对象</th><th>详情</th></tr></thead><tbody>' + list.map(function (l) { return '<tr><td style="font-size:11px;color:var(--tx3);">' + l.t + '</td><td>' + l.u + '</td><td><span class="tag gr">' + l.a + '</span></td><td>' + l.g + '</td><td style="font-size:12px;color:var(--tx2);">' + l.d + '</td></tr>'; }).join('') + '</tbody></table>') + '</div>';
  page='logs';
}
function filterLogs(d){renderLogs(d?LOGS.filter(function (l) { return l.t.startsWith(d); }):LOGS);}

/* ═══════════════════════════════════════
   DATA SYNC — REQ-DS-001, DS-002, DS-003
   ═══════════════════════════════════════ */
function doSyncProjects(){
  MERGE.push({id:'m'+Date.now(),no:'PRJ-2026-'+String(MERGE.length+9).padStart(3,'0'),name:'新同步项目_'+(MERGE.length+1),type:'setup',src:'飞书立项流程（手动触发）',dt:new Date().toISOString().replace('T',' ').substring(0,16),f:{name:'新同步项目_'+(MERGE.length+1),no:'PRJ-2026-'+String(MERGE.length+9).padStart(3,'0'),type:'external',product:'产品A',leader:'p1',desc:'模拟触发式同步。',status:'draft'}});
  LOGS.unshift({t:new Date().toISOString().replace('T',' ').substring(0,16),u:'系统管理员',a:'手动同步',g:'飞书项目',d:'触发飞书项目同步（REQ-DS-002）'});updateBadges();toast('已从飞书同步项目到待合并清单','ok');if(page==='merge')renderMerge();
}
function doSyncPeople(){LOGS.unshift({t:new Date().toISOString().replace('T',' ').substring(0,16),u:'系统管理员',a:'人员同步',g:'全公司',d:'从人事系统同步人员信息（REQ-DS-001）'});toast('人员信息已同步（模拟）','ok');}
function doPushOutput(){LOGS.unshift({t:new Date().toISOString().replace('T',' ').substring(0,16),u:'系统管理员',a:'推送输出',g:'费控/禅道',d:'推送至费控系统、禅道（REQ-DS-003）'});toast('已推送至费控系统、禅道（模拟）','ok');}
