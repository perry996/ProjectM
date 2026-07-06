/* ═══════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

/* 根据起止日期生成月份列表，供成员工时表格使用。
   兼容 YYYY-MM-DD 和 YYYY-MM 两种格式。 */
function getMonths(start, end) {
  if (!start || !end) return [];
  // 统一截取 YYYY-MM，避免 '2026-03-01-01' 变成 Invalid Date
  const s = new Date(start.substring(0, 7) + '-01');
  const e = new Date(end.substring(0, 7) + '-01');
  const months = [];
  const cur = new Date(s);
  while (cur <= e) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    months.push(y + '-' + m);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

/* 快速生成 demo 工时对象 */
function h(start, end, val) {
  const o = {};
  getMonths(start, end).forEach(function (m) { o[m] = val; });
  return o;
}

/* Toast 通知 */
function toast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + (type || 'inf');
  t.style.display = 'block';
  clearTimeout(t._tid);
  t._tid = setTimeout(function () { t.style.display = 'none'; }, 3000);
}

/* 更新侧边栏徽标数量 */
function updateBadges() {
  var mb = document.getElementById('badgeMerge');
  if (mb) {
    mb.textContent = MERGE.length;
    mb.style.display = MERGE.length > 0 ? '' : 'none';
  }
  var ab = document.getElementById('badgeAppr');
  if (ab) {
    var n = APPR.filter(function (a) { return a.st === 'pending'; }).length;
    ab.textContent = n;
    ab.style.display = n > 0 ? '' : 'none';
  }
}

/* ── CHIP SELECTOR HELPERS ── */
function toggleChip(el, multi) {
  if (multi) {
    el.classList.toggle('sel');
  } else {
    var group = el.closest('.chip-grp');
    group.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('sel'); });
    el.classList.add('sel');
  }
}

function readChips(group, multi) {
  if (!group) return multi ? [] : '';
  if (multi) return Array.from(group.querySelectorAll('.chip.sel')).map(function (c) { return c.dataset.value; });
  var sel = group.querySelector('.chip.sel');
  return sel ? sel.dataset.value : (multi ? [] : '');
}

/* 成员弹窗中计算工时合计 */
function calcMemTotal(inp) {
  var tr = inp.closest('tr');
  var total = 0;
  tr.querySelectorAll('.m-hour').forEach(function (i) { total += parseFloat(i.value) || 0; });
  tr.querySelector('.m-total').textContent = total;
}
