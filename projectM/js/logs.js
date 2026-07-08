/* ═══════════════════════════════════════════════════════════════
   LOGS — 操作日志
   ═══════════════════════════════════════════════════════════════ */

function renderLogs(flt) {
  const list = flt || LOGS;
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
