/* ═══════════════════════════════════════════════════════════════
   APPROVALS — 项目审批管理
   ═══════════════════════════════════════════════════════════════ */

function renderAppr() {
  const pending = APPR.filter(function (a) { return a.st === 'pending'; });
  const done = APPR.filter(function (a) { return a.st !== 'pending'; });
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
  const a = APPR.find(function (x) { return x.id === aid; });
  if (!a) return;
  a.st = 'approved'; a.result = '通过'; a.rv = '当前用户（PMO）'; a.rd = new Date().toISOString().split('T')[0];
  const p = PROJ_BY_ID.get(a.pid);
  if (p) {
    const m = { '已完成': '已完成', '挂起': '挂起', '已作废': '已作废' };
    p.status = m[a.to] || p.status;
    try { await API.updateProject(p._id, { '项目状态': p.status }); } catch (e) { console.warn('[appr] update project status failed', e); }
  }
  try {
    await API.createApproval({
      '详情': '审批通过：' + a.pn + ' ' + a.from + '→' + a.to,
      '发起人': a.who ? [{ id: 'ou_current' }] : [],
      '审批人': [{ id: 'ou_current' }]
    });
  } catch (e) { console.warn('[appr] create approval record failed', e); }
  addLogEntry('审批通过', a.pn, '状态变更生效：' + a.from + ' → ' + a.to);
  updateBadges(); renderAppr();
  toast('审批通过 ✓', 'ok');
}

function showRejectModal(aid) {
  const a = APPR.find(function (x) { return x.id === aid; });
  if (!a) return;
  const m = document.createElement('div'); m.className = 'mod'; m.style.display = 'flex';
  m.onclick = function (e) { if (e.target === this) this.remove(); };
  m.innerHTML = '<div class="mod-p sm"><div class="mod-h"><h3>审批拒绝（REQ-PA-001）</h3><button class="btn btn-gh btn-sm" onclick="this.closest(\'.mod\').remove()">&times;</button></div>' +
    '<div class="mod-b"><p style="margin-bottom:14px;">项目：<b>' + a.pn + '</b><br>变更申请：' + a.from + ' &rarr; ' + a.to + '</p>' +
    '<div class="fg"><label>拒绝原因 *</label><textarea id="reject-reason" style="min-height:60px;"></textarea></div></div>' +
    '<div class="mod-f"><button class="btn btn-gh" onclick="this.closest(\'.mod\').remove()">取消</button><button class="btn btn-d" onclick="confirmReject(\'' + aid + '\')">确认拒绝</button></div></div>';
  document.body.appendChild(m);
}

async function confirmReject(aid) {
  const reasonEl = document.getElementById('reject-reason');
  const reason = reasonEl ? reasonEl.value.trim() : '';
  if (!reason) { toast('请填写拒绝原因', 'err'); return; }
  const a = APPR.find(function (x) { return x.id === aid; });
  if (!a) return;
  a.st = 'rejected'; a.result = '拒绝'; a.rv = '当前用户（PMO）'; a.rd = new Date().toISOString().split('T')[0]; a.rr = reason;
  try {
    await API.createApproval({ '详情': '审批拒绝：' + a.pn + ' ' + a.from + '→' + a.to + ' 原因：' + reason });
  } catch (e) { console.warn('[appr] create rejection record failed', e); }
  document.querySelectorAll('.mod').forEach(function (mod) { mod.remove(); });
  addLogEntry('审批拒绝', a.pn, '状态变更被拒绝，项目状态保持' + a.from + '。原因：' + reason);
  updateBadges(); renderAppr();
  toast('状态变更已拒绝', 'err');
}
