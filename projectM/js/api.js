/* ═══════════════════════════════════════════════════════
   数据访问层 v2 — 通过本地 API 服务调用飞书多维表格
   所有写操作均实时同步至飞书多维表格
   ═══════════════════════════════════════════════════════ */
window.API = (function () {
  const BASE = '/api';

  async function _req(method, table, id, body) {
    let url = BASE + '/' + table;
    if (id) url += '/' + id;
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(url, opts);
    } catch (e) {
      throw new Error('网络请求失败：请确认 server.js 已在端口 3456 启动');
    }

    const json = await res.json();
    if (!json.ok) {
      const msg = json.error?.message || 'API error';
      console.error('[API] ' + method + ' /' + table + (id ? '/' + id : '') + ' 失败:', msg);
      throw new Error(msg);
    }
    return json.data;
  }

  // ── 通用 CRUD ──
  async function list(table)    { return _req('GET', table); }
  async function get(table, id) { return _req('GET', table, id); }
  async function create(table, fields, rows) { return _req('POST', table, null, { fields, rows }); }
  async function upsert(table, id, data) { return _req('POST', table, null, { ...data, _upsert: true, _record_id: id || '' }); }
  async function update(table, id, data) { return _req('PATCH', table, id, data); }
  async function del(table, id)  { return _req('DELETE', table, id); }

  // ── 领域方法 ──
  return {
    // ═══ 项目清单 ═══
    getProjects:      function () { return list('projects'); },
    createProject:    function (data) { return upsert('projects', null, data); },
    updateProject:    function (id, data) { return update('projects', id, data); },
    upsertProject:    function (id, data) { return upsert('projects', id, data); },
    deleteProject:    function (id) { return del('projects', id); },

    // ═══ 角色表 ═══
    getRoles:         function () { return list('roles'); },
    createRole:       function (name) { return upsert('roles', null, { '角色名称': name }); },
    updateRole:       function (id, name) { return update('roles', id, { '角色名称': name }); },
    deleteRole:       function (id) { return del('roles', id); },

    // ═══ 产品表 ═══
    getProducts:      function () { return list('products'); },
    createProduct:    function (data) { return upsert('products', null, data); },
    updateProduct:    function (id, data) { return update('products', id, data); },
    upsertProduct:    function (id, data) { return upsert('products', id, data); },
    deleteProduct:    function (id) { return del('products', id); },

    // ═══ 审批表 ═══
    getApprovals:     function () { return list('approvals'); },
    createApproval:   function (data) { return upsert('approvals', null, data); },
    upsertApproval:   function (id, data) { return upsert('approvals', id, data); },

    // ═══ 操作日志表 ═══
    getLogs:          function () { return list('logs'); },
    addLog:           function (data) { return upsert('logs', null, data); },

    // ═══ 人员表 ═══
    getUsers:         function () { return list('users'); },
    updateUser:       function (id, data) { return update('users', id, data); },
    upsertUser:       function (id, data) { return upsert('users', id, data); },

    // ═══ 数据清洗表（待合并项目） ═══
    getMergeList:     function () { return list('merge'); },
    upsertMerge:      function (id, data) { return upsert('merge', id, data); },
    updateMerge:      function (id, data) { return update('merge', id, data); },

    // ═══ 成员工时表 ═══
    getMembers:       function () { return list('members'); },
    upsertMember:     function (id, data) { return upsert('members', id, data); },
    deleteMember:     function (id) { return del('members', id); },
  };
})();
