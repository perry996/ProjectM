#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════
   项目管理系统 - 本地 API 服务 v2
   静态文件 + lark-cli 代理，纯 Node.js 无依赖
   启动: node server.js [port]

   数据表映射基于飞书多维表格实际 schema（2026-07-06）
   ═══════════════════════════════════════════════════════ */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = parseInt(process.argv[2]) || 3456;
const ROOT = __dirname;

// ── 表路由配置 ──
// 基于实际飞书多维表格结构：
//   Base 1: PSL1bgzF4aPe3WsoMrGczRlxnGv（项目管理系统）
//   Base 2: QeItbOOG2aBu6ssIOuJcf6ywnUh（项目流程数据 - 数据清洗）
const TABLES = {
  // === Base 1: 项目管理系统 ===
  projects:  { base: 'PSL1bgzF4aPe3WsoMrGczRlxnGv', table: 'tblwNT1cZhZ40RyM', label: '项目清单' },
  roles:     { base: 'PSL1bgzF4aPe3WsoMrGczRlxnGv', table: 'tblODkPcObYImJH5', label: '角色表' },
  products:  { base: 'PSL1bgzF4aPe3WsoMrGczRlxnGv', table: 'tbllgEJQXyw6LQjo', label: '产品表' },
  approvals: { base: 'PSL1bgzF4aPe3WsoMrGczRlxnGv', table: 'tblLFsWj1yfJIV6u', label: '审批表' },
  logs:      { base: 'PSL1bgzF4aPe3WsoMrGczRlxnGv', table: 'tblIkm1MXdmQWQcY', label: '操作日志表' },
  users:     { base: 'PSL1bgzF4aPe3WsoMrGczRlxnGv', table: 'tbl4tg0SUHxC0bay', label: '人员表' },
  members:   { base: 'PSL1bgzF4aPe3WsoMrGczRlxnGv', table: 'tblXtxB1SzURM8ba', label: '成员工时表' },

  // === Base 2: 项目流程数据 ===
  merge:     { base: 'QeItbOOG2aBu6ssIOuJcf6ywnUh', table: 'tblfXRXMLLsXGzJl', label: '数据清洗' },
};

// ── MIME 类型 ──
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// ── lark-cli 调用（带重试） ──
function lark(args, retries) {
  const maxRetries = retries || 2;
  const cmd = 'LARKSUITE_CLI_NO_UPDATE_NOTIFIER=1 LARKSUITE_CLI_NO_SKILLS_NOTIFIER=1 lark-cli ' + args.join(' ') + ' --as user';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const out = execSync(cmd, { encoding: 'utf-8', timeout: 120000, maxBuffer: 50 * 1024 * 1024 });
      // 跳过 [lark-cli] WARN/INFO 行，找到第一个 {
      const lines = out.split('\n');
      const start = lines.findIndex(l => l.trim().startsWith('{'));
      if (start === -1) {
        if (attempt < maxRetries) { continue; }
        return { ok: false, error: { message: 'lark-cli returned non-JSON output: ' + out.substring(0, 200) } };
      }
      return JSON.parse(lines.slice(start).join('\n'));
    } catch (e) {
      if (attempt < maxRetries) {
        // 1254291 = 并发写冲突，短暂等待后重试
        if (e.message && e.message.includes('1254291')) {
          console.error('[lark] retry after 1254291, attempt ' + (attempt + 1));
          execSync('sleep ' + (0.5 * (attempt + 1)), { timeout: 5000 });
          continue;
        }
      }
      return { ok: false, error: { message: e.message } };
    }
  }
  return { ok: false, error: { message: 'Max retries exceeded' } };
}

// ── 处理 API 请求 ──
async function handleAPI(method, tableKey, recordId, body) {
  const cfg = TABLES[tableKey];
  if (!cfg) {
    return { status: 404, body: { ok: false, error: { message: 'Unknown table: ' + tableKey } } };
  }

  try {
    if (method === 'GET') {
      // 列表查询 / 单条查询
      let args = ['base', '+record-list', '--base-token', cfg.base, '--table-id', cfg.table, '--limit', '1000', '--format', 'json'];
      if (recordId) {
        args = ['base', '+record-get', '--base-token', cfg.base, '--table-id', cfg.table, '--record-id', recordId, '--format', 'json'];
      }
      const result = lark(args);
      if (!result.ok) return { status: 500, body: result };
      return { status: 200, body: result };

    } else if (method === 'POST') {
      if (body.rows && body.fields) {
        // 批量创建
        const tmpFile = path.join(ROOT, `.tmp_batch_${Date.now()}.json`);
        try {
          fs.writeFileSync(tmpFile, JSON.stringify(body));
          const result = lark(['base', '+record-batch-create', '--base-token', cfg.base, '--table-id', cfg.table, '--json', `@${path.basename(tmpFile)}`]);
          if (!result.ok) return { status: 500, body: result };
          return { status: 200, body: result };
        } finally {
          try { fs.unlinkSync(tmpFile); } catch (e) { /* ignore */ }
        }

      } else if (body._upsert) {
        // upsert（创建或更新）—— 用临时文件避免 shell JSON 拆分问题
        const rid = body._record_id || '';
        delete body._upsert;
        delete body._record_id;
        const tmpFile = path.join(ROOT, `.tmp_upsert_${Date.now()}.json`);
        try {
          fs.writeFileSync(tmpFile, JSON.stringify(body));
          const args = ['base', '+record-upsert', '--base-token', cfg.base, '--table-id', cfg.table, '--json', '@' + path.basename(tmpFile)];
          if (rid) args.push('--record-id', rid);
          const result = lark(args);
          if (!result.ok) return { status: 500, body: result };
          return { status: 200, body: result };
        } finally {
          try { fs.unlinkSync(tmpFile); } catch (e) { /* ignore */ }
        }

      } else {
        return { status: 400, body: { ok: false, error: { message: 'POST needs {fields,rows} for batch-create or {_upsert:true,...} for upsert' } } };
      }

    } else if (method === 'PATCH' && recordId) {
      // 单条更新 = upsert，用临时文件
      const tmpFile = path.join(ROOT, `.tmp_patch_${Date.now()}.json`);
      try {
        fs.writeFileSync(tmpFile, JSON.stringify(body));
        const result = lark(['base', '+record-upsert', '--base-token', cfg.base, '--table-id', cfg.table, '--record-id', recordId, '--json', '@' + path.basename(tmpFile)]);
        if (!result.ok) return { status: 500, body: result };
        return { status: 200, body: result };
      } finally {
        try { fs.unlinkSync(tmpFile); } catch (e) { /* ignore */ }
      }

    } else if (method === 'DELETE' && recordId) {
      const result = lark(['base', '+record-delete', '--base-token', cfg.base, '--table-id', cfg.table, '--record-id', recordId, '--yes']);
      if (!result.ok) return { status: 500, body: result };
      return { status: 200, body: result };

    } else {
      return { status: 405, body: { ok: false, error: { message: `Unsupported: ${method} ${tableKey}/${recordId || ''}` } } };
    }
  } catch (e) {
    return { status: 500, body: { ok: false, error: { message: e.message } } };
  }
}

// ── HTTP 服务 ──
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method;
  const pathname = url.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // ── API 路由 ──
  const apiMatch = pathname.match(/^\/api\/(\w+)(?:\/(.+))?$/);
  if (apiMatch) {
    const [, tableKey, recordId] = apiMatch;

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      let data = {};
      try { if (body) data = JSON.parse(body); } catch (e) { /* ignore */ }

      const result = await handleAPI(method, tableKey, recordId || null, data);
      res.writeHead(result.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.body));
    });
    return;
  }

  // ── 静态文件 ──
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(ROOT, filePath);

  // 安全检查：禁止访问上级目录
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`项目管理工具 API 服务已启动: http://localhost:${PORT}`);
  console.log(`API 端点: /api/<table>`);
  console.log(`可用表: ${Object.keys(TABLES).join(', ')}`);
  console.log('');
  console.log('表映射:');
  Object.entries(TABLES).forEach(([key, cfg]) => {
    console.log(`  /api/${key.padEnd(10)} → ${cfg.label} (base: ${cfg.base.substring(0,8)}..., table: ${cfg.table.substring(0,8)}...)`);
  });
});
